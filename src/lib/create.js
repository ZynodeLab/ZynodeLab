import { addressToBytes, toChecksumAddress } from './address.js';
import { bytesToHex } from './bytes.js';
import { keccak256 } from './keccak.js';
import { rlpEncodeList } from './rlp.js';

export function parseNonce(value) {
  if (typeof value === 'bigint') {
    if (value < 0n) throw new Error('Nonce must be non-negative.');
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Nonce must be a non-negative safe integer.');
    return BigInt(value);
  }
  if (typeof value !== 'string' || !value.trim()) throw new Error('Nonce is required.');
  const trimmed = value.trim();
  const parsed = /^0x[0-9a-f]+$/i.test(trimmed) ? BigInt(trimmed) : /^[0-9]+$/.test(trimmed) ? BigInt(trimmed) : null;
  if (parsed === null || parsed < 0n) throw new Error('Nonce must be a non-negative decimal integer or 0x-prefixed hexadecimal integer.');
  return parsed;
}

export function predictCreateAddress(deployer, nonceValue) {
  const nonce = parseNonce(nonceValue);
  const deployerBytes = addressToBytes(deployer);
  const rlp = rlpEncodeList([deployerBytes, nonce]);
  const digest = keccak256(rlp);
  const rawAddress = bytesToHex(digest.slice(12));
  return {
    method: 'CREATE',
    deployer: toChecksumAddress(deployer),
    nonce,
    rlp: bytesToHex(rlp),
    digest: bytesToHex(digest),
    address: toChecksumAddress(rawAddress),
  };
}
