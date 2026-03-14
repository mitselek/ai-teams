// (*CD:Kerckhoffs*)
// Network test helpers: ephemeral Unix Domain Socket pairs for transport tests.

import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Create a temporary socket path in the OS temp dir.
 */
export function tempSocketPath(name: string): string {
  return path.join(os.tmpdir(), `comms-test-${name}-${process.pid}.sock`);
}

/**
 * Remove a socket file if it exists (cleanup helper).
 */
export function cleanupSocket(sockPath: string): void {
  try { fs.unlinkSync(sockPath); } catch { /* ignore */ }
}

/**
 * Create a connected socket pair: a listening server and a client connected to it.
 * Returns { server, client, cleanup }.
 */
export async function createSocketPair(sockPath: string): Promise<{
  server: net.Server;
  serverSocket: net.Socket;
  client: net.Socket;
  cleanup: () => Promise<void>;
}> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    let serverSocket: net.Socket;

    server.once('connection', (sock) => {
      serverSocket = sock;
      resolve({
        server,
        serverSocket,
        client,
        cleanup: async () => {
          client.destroy();
          serverSocket.destroy();
          await new Promise<void>((r) => server.close(() => r()));
          cleanupSocket(sockPath);
        },
      });
    });

    server.listen(sockPath, () => {
      const client = net.createConnection(sockPath);
      client.once('error', reject);
    });

    server.once('error', reject);

    // Need client reference before connection event fires — hoist with var-like trick
    var client = net.createConnection(sockPath);
    client.once('error', reject);
  });
}

/**
 * Read exactly `n` bytes from a socket, with timeout.
 */
export function readBytes(sock: net.Socket, n: number, timeoutMs = 2000): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;

    const timer = setTimeout(() => {
      sock.off('data', onData);
      reject(new Error(`readBytes: timeout after ${timeoutMs}ms waiting for ${n} bytes`));
    }, timeoutMs);

    function onData(chunk: Buffer) {
      chunks.push(chunk);
      received += chunk.byteLength;
      if (received >= n) {
        clearTimeout(timer);
        sock.off('data', onData);
        resolve(Buffer.concat(chunks).subarray(0, n));
      }
    }

    sock.on('data', onData);
    sock.once('error', (err) => { clearTimeout(timer); reject(err); });
    sock.once('close', () => { clearTimeout(timer); reject(new Error('Socket closed prematurely')); });
  });
}
