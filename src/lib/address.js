import { bytesToHex, hexToBytes, strip0x } from './bytes.js';
import { keccak256Utf8 } from './keccak.js';

const ADDRESS_RE = /^[0-9a-fA-F]{40}$/;

export function normalizeAddress(value) {
  const clean = strip0x(value);
  if (!ADDRESS_RE.test(clean)) throw new Error('EVM address must contain exactly 20 bytes (40 hex characters).');
  return `0x${clean.toLowerCase()}`;
}

export function addressToBytes(value) {
  return hexToBytes(normalizeAddress(value));
}

export function toChecksumAddress(value) {
  const normalized = normalizeAddress(value);
  const lower = normalized.slice(2);
  const hash = bytesToHex(keccak256Utf8(lower), false);
  let out = '0x';
  for (let i = 0; i < lower.length; i += 1) {
    const char = lower[i];
    out += /[a-f]/.test(char) && Number.parseInt(hash[i], 16) >= 8 ? char.toUpperCase() : char;
  }
  return out;
}

export function isChecksumAddress(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) return false;
  const body = value.slice(2);
  if (body === body.toLowerCase() || body === body.toUpperCase()) return false;
  return toChecksumAddress(value) === value;
}

export function inspectAddress(value) {
  const normalized = normalizeAddress(value);
  const checksummed = toChecksumAddress(normalized);
  const body = normalized.slice(2);
  return {
    input: value,
    normalized,
    checksummed,
    checksumValid: value === checksummed,
    zeroAddress: /^0x0{40}$/.test(normalized),
    bytes: [...addressToBytes(normalized)],
    byteLength: 20,
    lowerHex: body,
  };
}
