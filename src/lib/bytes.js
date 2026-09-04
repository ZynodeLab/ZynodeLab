const HEX_RE = /^[0-9a-f]*$/i;

export function strip0x(value) {
  if (typeof value !== 'string') throw new TypeError('Expected a string.');
  return value.trim().replace(/^0x/i, '');
}

export function assertHex(value, label = 'hex value') {
  const clean = strip0x(value);
  if (!HEX_RE.test(clean)) throw new Error(`${label} contains non-hexadecimal characters.`);
  return clean;
}

export function hexToBytes(value, { allowOdd = false } = {}) {
  let clean = assertHex(value);
  if (clean.length % 2 !== 0) {
    if (!allowOdd) throw new Error('Hex input must contain an even number of characters.');
    clean = `0${clean}`;
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes, prefix = true) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('Expected Uint8Array.');
  const value = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return prefix ? `0x${value}` : value;
}

export function concatBytes(...chunks) {
  const flattened = chunks.length === 1 && Array.isArray(chunks[0]) ? chunks[0] : chunks;
  let total = 0;
  for (const chunk of flattened) {
    if (!(chunk instanceof Uint8Array)) throw new TypeError('concatBytes accepts Uint8Array values only.');
    total += chunk.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of flattened) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export function utf8ToBytes(value) {
  return new TextEncoder().encode(String(value));
}

export function bigintToMinimalBytes(value) {
  const number = typeof value === 'bigint' ? value : BigInt(value);
  if (number < 0n) throw new Error('Negative integers are not supported.');
  if (number === 0n) return new Uint8Array();
  let hex = number.toString(16);
  if (hex.length % 2 !== 0) hex = `0${hex}`;
  return hexToBytes(hex);
}

export function leftPadBytes(bytes, length) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('Expected Uint8Array.');
  if (bytes.length > length) throw new Error(`Value is ${bytes.length} bytes; maximum is ${length}.`);
  const out = new Uint8Array(length);
  out.set(bytes, length - bytes.length);
  return out;
}

export function equalBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}
