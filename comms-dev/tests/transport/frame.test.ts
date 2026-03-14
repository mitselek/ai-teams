// (*CD:Kerckhoffs*)
// Transport framing tests — tests against src/transport/framing.ts directly.
// Covers encodeFrame, FrameDecoder (stateful stream decoder), size limits,
// fragmented delivery, malformed JSON, and oversized message rejection.

import { describe, it, expect, vi } from 'vitest';
import { encodeFrame, FrameDecoder, MAX_MESSAGE_SIZE } from '../../src/transport/framing.js';

// ---------------------------------------------------------------------------
// encodeFrame
// ---------------------------------------------------------------------------

describe('encodeFrame', () => {
  it('produces a buffer with 4-byte big-endian length prefix', () => {
    const msg = { hello: 'world' };
    const buf = encodeFrame(msg);
    const jsonBytes = Buffer.from(JSON.stringify(msg), 'utf8');
    expect(buf.byteLength).toBe(4 + jsonBytes.byteLength);
    expect(buf.readUInt32BE(0)).toBe(jsonBytes.byteLength);
  });

  it('roundtrip: encoded frame decodes back to original via FrameDecoder', () => {
    const msg = { id: 'msg-123', body: 'hello' };
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    decoder.push(encodeFrame(msg));
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(msg);
  });

  it('serialises nested objects correctly', () => {
    const msg = { nested: { a: 1, b: [2, 3] }, flag: true };
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    decoder.push(encodeFrame(msg));
    expect(received[0]).toEqual(msg);
  });

  it('encodes empty object without throwing', () => {
    expect(() => encodeFrame({})).not.toThrow();
  });

  it('throws when serialised payload exceeds maxSize', () => {
    const big = { body: 'x'.repeat(MAX_MESSAGE_SIZE) };
    expect(() => encodeFrame(big)).toThrow(/too large|exceeds/i);
  });

  it('accepts payload of exactly maxSize bytes (boundary)', () => {
    // Build a JSON string that is exactly MAX_MESSAGE_SIZE bytes
    // Smallest JSON wrapper: {"b":"..."} — 6 overhead bytes
    const overhead = Buffer.from('{"b":""}', 'utf8').byteLength; // 8 bytes
    const fillLen = MAX_MESSAGE_SIZE - overhead;
    const msg = { b: 'x'.repeat(fillLen) };
    const buf = Buffer.from(JSON.stringify(msg), 'utf8');
    expect(buf.byteLength).toBe(MAX_MESSAGE_SIZE);
    expect(() => encodeFrame(msg)).not.toThrow();
  });

  it('uses custom maxSize limit when provided', () => {
    const msg = { body: 'x'.repeat(200) };
    expect(() => encodeFrame(msg, 100)).toThrow(/too large|exceeds/i);
    expect(() => encodeFrame(msg, 10_000)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// FrameDecoder — basic delivery
// ---------------------------------------------------------------------------

describe('FrameDecoder — single frame delivery', () => {
  it('calls onMessage exactly once with the parsed payload', () => {
    const onMessage = vi.fn();
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, onMessage);
    decoder.push(encodeFrame({ id: 'a', type: 'query' }));
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage.mock.calls[0][0]).toEqual({ id: 'a', type: 'query' });
  });

  it('handles an empty object payload', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    decoder.push(encodeFrame({}));
    expect(received).toEqual([{}]);
  });

  it('handles unicode / non-ASCII body content', () => {
    const msg = { body: 'Tere, maailm! 🛡️' };
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    decoder.push(encodeFrame(msg));
    expect(received[0]).toEqual(msg);
  });
});

// ---------------------------------------------------------------------------
// FrameDecoder — multi-frame and fragmented delivery
// ---------------------------------------------------------------------------

describe('FrameDecoder — multi-frame delivery', () => {
  it('decodes two frames delivered in one push', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    const buf = Buffer.concat([encodeFrame({ id: 'a' }), encodeFrame({ id: 'b' })]);
    decoder.push(buf);
    expect(received).toHaveLength(2);
    expect(received[0]).toEqual({ id: 'a' });
    expect(received[1]).toEqual({ id: 'b' });
  });

  it('decodes ten frames delivered together', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    const frames = Array.from({ length: 10 }, (_, i) => encodeFrame({ seq: i }));
    decoder.push(Buffer.concat(frames));
    expect(received).toHaveLength(10);
    (received as Array<{ seq: number }>).forEach((m, i) => expect(m.seq).toBe(i));
  });

  it('reassembles a frame split across two pushes (TCP fragmentation)', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    const frame = encodeFrame({ id: 'fragmented' });
    const mid = Math.floor(frame.byteLength / 2);
    decoder.push(frame.subarray(0, mid));
    expect(received).toHaveLength(0); // incomplete
    decoder.push(frame.subarray(mid));
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ id: 'fragmented' });
  });

  it('reassembles a frame split byte-by-byte', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    const frame = encodeFrame({ id: 'byte-by-byte' });
    for (let i = 0; i < frame.byteLength; i++) {
      decoder.push(frame.subarray(i, i + 1));
    }
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ id: 'byte-by-byte' });
  });

  it('correctly decodes when header arrives alone then body arrives', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    const frame = encodeFrame({ id: 'split-header' });
    decoder.push(frame.subarray(0, 4)); // header only
    expect(received).toHaveLength(0);
    decoder.push(frame.subarray(4)); // body only
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ id: 'split-header' });
  });

  it('handles frame-1-complete + partial-frame-2, then rest of frame-2', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    const f1 = encodeFrame({ id: 'first' });
    const f2 = encodeFrame({ id: 'second' });
    // First full frame + half of second
    decoder.push(Buffer.concat([f1, f2.subarray(0, 3)]));
    expect(received).toHaveLength(1);
    // Rest of second frame
    decoder.push(f2.subarray(3));
    expect(received).toHaveLength(2);
    expect(received[1]).toEqual({ id: 'second' });
  });
});

// ---------------------------------------------------------------------------
// FrameDecoder — error cases
// ---------------------------------------------------------------------------

describe('FrameDecoder — oversized message rejection', () => {
  it('throws when declared payload length exceeds maxSize', () => {
    const decoder = new FrameDecoder(100, () => {});
    const header = Buffer.allocUnsafe(4);
    header.writeUInt32BE(101, 0); // 101 bytes > 100 limit
    expect(() => decoder.push(header)).toThrow(/too large|exceeds/i);
  });

  it('throws at MAX_MESSAGE_SIZE + 1', () => {
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, () => {});
    const header = Buffer.allocUnsafe(4);
    header.writeUInt32BE(MAX_MESSAGE_SIZE + 1, 0);
    expect(() => decoder.push(header)).toThrow(/too large|exceeds/i);
  });

  it('does NOT throw at exactly MAX_MESSAGE_SIZE (boundary)', () => {
    const received: unknown[] = [];
    // Build a valid frame of exactly MAX_MESSAGE_SIZE payload bytes
    const overhead = Buffer.from('{"b":""}', 'utf8').byteLength;
    const fill = 'x'.repeat(MAX_MESSAGE_SIZE - overhead);
    const frame = encodeFrame({ b: fill });
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));
    expect(() => decoder.push(frame)).not.toThrow();
    expect(received).toHaveLength(1);
  }, 10000);
});

describe('FrameDecoder — malformed JSON handling', () => {
  it('skips a frame with malformed JSON and continues processing next frame', () => {
    const received: unknown[] = [];
    const decoder = new FrameDecoder(MAX_MESSAGE_SIZE, (m) => received.push(m));

    // Build a bad frame manually: valid header, invalid JSON body
    const badBody = Buffer.from('not valid json!!!', 'utf8');
    const badHeader = Buffer.allocUnsafe(4);
    badHeader.writeUInt32BE(badBody.byteLength, 0);
    const badFrame = Buffer.concat([badHeader, badBody]);

    // Good frame after the bad one
    const goodFrame = encodeFrame({ id: 'after-bad' });

    // Should not throw — malformed JSON is skipped per spec comment in framing.ts
    expect(() => decoder.push(Buffer.concat([badFrame, goodFrame]))).not.toThrow();
    // The good frame after the bad one should still be delivered
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ id: 'after-bad' });
  });
});
