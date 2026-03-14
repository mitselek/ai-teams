// (*CD:Babbage*)
// Wire format: 4-byte big-endian uint32 length prefix + UTF-8 JSON payload.
// Max message size enforced at both encode (sender) and decode (receiver).

export const MAX_MESSAGE_SIZE = 1_048_576; // 1MB per spec
const FRAME_HEADER_SIZE = 4;

/**
 * Encode a JSON-serialisable value into a length-prefixed frame.
 * Throws if the serialised payload exceeds MAX_MESSAGE_SIZE.
 */
export function encodeFrame(message: unknown, maxSize = MAX_MESSAGE_SIZE): Buffer {
  const payload = Buffer.from(JSON.stringify(message), 'utf8');
  if (payload.byteLength > maxSize) {
    throw new Error(
      `Message too large: ${payload.byteLength} bytes exceeds limit of ${maxSize}`
    );
  }
  const frame = Buffer.allocUnsafe(FRAME_HEADER_SIZE + payload.byteLength);
  frame.writeUInt32BE(payload.byteLength, 0);
  payload.copy(frame, FRAME_HEADER_SIZE);
  return frame;
}

/**
 * Stateful frame decoder — handles TCP-style stream fragmentation.
 *
 * Feed chunks of incoming data via `push()`. Each time a complete frame
 * is decoded, the `onMessage` callback is called with the parsed object.
 *
 * Usage:
 *   const decoder = new FrameDecoder(maxSize, msg => handleMessage(msg));
 *   socket.on('data', chunk => decoder.push(chunk));
 */
export class FrameDecoder {
  private buffer: Buffer = Buffer.alloc(0);

  constructor(
    private readonly maxSize: number,
    private readonly onMessage: (message: unknown) => void
  ) {}

  push(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.drain();
  }

  private drain(): void {
    // Keep draining as long as we have enough data for a complete frame
    while (true) {
      if (this.buffer.byteLength < FRAME_HEADER_SIZE) break;

      const payloadLength = this.buffer.readUInt32BE(0);

      if (payloadLength > this.maxSize) {
        // Spec: reject oversized messages. We can't recover the stream position
        // reliably so we clear the buffer — connection will likely close.
        this.buffer = Buffer.alloc(0);
        throw new Error(
          `Incoming message too large: ${payloadLength} bytes exceeds limit of ${this.maxSize}`
        );
      }

      const totalLength = FRAME_HEADER_SIZE + payloadLength;
      if (this.buffer.byteLength < totalLength) break; // incomplete frame — wait for more data

      const payload = this.buffer.slice(FRAME_HEADER_SIZE, totalLength);
      this.buffer = this.buffer.slice(totalLength);

      let parsed: unknown;
      try {
        parsed = JSON.parse(payload.toString('utf8'));
      } catch (err) {
        // Malformed JSON — log and skip this frame; stream is still recoverable
        console.error('[framing] Failed to parse JSON frame:', err);
        continue;
      }

      this.onMessage(parsed);
    }
  }
}
