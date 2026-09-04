const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = 58n;
const LOOKUP = new Map([...ALPHABET].map((char, index) => [char, BigInt(index)]));

export function encodeBase58(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('encodeBase58 expects a Uint8Array');
  }

  if (bytes.length === 0) return '';

  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);

  let output = '';
  while (value > 0n) {
    const remainder = Number(value % BASE);
    output = ALPHABET[remainder] + output;
    value /= BASE;
  }

  let leadingZeroes = 0;
  while (leadingZeroes < bytes.length && bytes[leadingZeroes] === 0) leadingZeroes += 1;
  return '1'.repeat(leadingZeroes) + output;
}

export function decodeBase58(value) {
  if (typeof value !== 'string') {
    throw new TypeError('decodeBase58 expects a string');
  }
  if (value.length === 0) return new Uint8Array();

  let number = 0n;
  for (const char of value) {
    const digit = LOOKUP.get(char);
    if (digit === undefined) throw new Error(`Invalid base58 character: ${char}`);
    number = number * BASE + digit;
  }

  const decoded = [];
  while (number > 0n) {
    decoded.push(Number(number & 0xffn));
    number >>= 8n;
  }
  decoded.reverse();

  let leadingOnes = 0;
  while (leadingOnes < value.length && value[leadingOnes] === '1') leadingOnes += 1;

  const bytes = new Uint8Array(leadingOnes + decoded.length);
  bytes.set(decoded, leadingOnes);
  return bytes;
}

export function isBase58(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    decodeBase58(value);
    return true;
  } catch {
    return false;
  }
}
