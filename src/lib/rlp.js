import { bigintToMinimalBytes, concatBytes } from './bytes.js';

function lengthPrefix(length, offset) {
  if (length <= 55) return Uint8Array.of(offset + length);
  const lengthBytes = bigintToMinimalBytes(BigInt(length));
  return concatBytes(Uint8Array.of(offset + 55 + lengthBytes.length), lengthBytes);
}

export function rlpEncodeBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('rlpEncodeBytes expects Uint8Array.');
  if (bytes.length === 1 && bytes[0] < 0x80) return bytes;
  return concatBytes(lengthPrefix(bytes.length, 0x80), bytes);
}

export function rlpEncodeInteger(value) {
  const number = typeof value === 'bigint' ? value : BigInt(value);
  if (number < 0n) throw new Error('RLP integers must be non-negative.');
  return rlpEncodeBytes(bigintToMinimalBytes(number));
}

export function rlpEncodeList(items) {
  const encoded = items.map((item) => {
    if (item instanceof Uint8Array) return rlpEncodeBytes(item);
    if (typeof item === 'bigint' || typeof item === 'number') return rlpEncodeInteger(item);
    throw new TypeError('RLP list items must be Uint8Array, number, or bigint.');
  });
  const payload = concatBytes(encoded);
  return concatBytes(lengthPrefix(payload.length, 0xc0), payload);
}
