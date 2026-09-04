import { bytesToHex } from './bytes.js';

export async function sha256(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('sha256 expects a Uint8Array.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(digest);
}

export async function sha256Hex(bytes) {
  return bytesToHex(await sha256(bytes));
}
