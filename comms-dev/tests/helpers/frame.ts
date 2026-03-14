// (*CD:Kerckhoffs*)
// Wire-format helpers: encode/decode 4-byte length-prefixed frames.
// Used by transport tests and integration tests.

/**
 * Encode a JSON payload into a 4-byte big-endian length-prefixed buffer.
 */
export function encodeFrame(payload: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const header = Buffer.allocUnsafe(4);
  header.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([header, body]);
}

/**
 * Decode a single frame from a buffer.
 * Returns { payload, consumed } where consumed is bytes read.
 * Throws if buffer is too short or declares a size exceeding MAX_MESSAGE_SIZE.
 */
export const MAX_FRAME_BODY = 1024 * 1024; // 1 MB

export function decodeFrame(buf: Buffer): { payload: unknown; consumed: number } {
  if (buf.byteLength < 4) {
    throw new Error('Buffer too short: missing length header');
  }
  const length = buf.readUInt32BE(0);
  if (length > MAX_FRAME_BODY) {
    throw new Error(`Frame too large: ${length} bytes exceeds ${MAX_FRAME_BODY}`);
  }
  if (buf.byteLength < 4 + length) {
    throw new Error(`Incomplete frame: expected ${length} bytes, got ${buf.byteLength - 4}`);
  }
  const body = buf.subarray(4, 4 + length);
  const payload = JSON.parse(body.toString('utf8'));
  return { payload, consumed: 4 + length };
}
