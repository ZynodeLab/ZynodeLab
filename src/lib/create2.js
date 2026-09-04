import { addressToBytes, toChecksumAddress } from './address.js';
import { bytesToHex, concatBytes, hexToBytes, leftPadBytes, utf8ToBytes } from './bytes.js';
import { keccak256 } from './keccak.js';

export function normalizeSalt(value) {
  if (value instanceof Uint8Array) return leftPadBytes(value, 32);
  if (typeof value !== 'string' || !value.trim()) throw new Error('Salt is required.');
  const trimmed = value.trim();
  const bytes = trimmed.startsWith('utf8:') ? utf8ToBytes(trimmed.slice(5)) : hexToBytes(trimmed, { allowOdd: true });
  return leftPadBytes(bytes, 32);
}

export function normalizeInitCodeHash(value) {
  const bytes = hexToBytes(value);
  if (bytes.length !== 32) throw new Error('Init code hash must be exactly 32 bytes.');
  return bytes;
}

export function resolveInitCodeHash({ initCode, initCodeHash }) {
  if (!initCode && !initCodeHash) throw new Error('Provide --init-code or --init-code-hash.');
  const codeBytes = initCode ? hexToBytes(initCode) : null;
  const derived = codeBytes ? keccak256(codeBytes) : null;
  const supplied = initCodeHash ? normalizeInitCodeHash(initCodeHash) : null;
  if (derived && supplied && bytesToHex(derived).toLowerCase() !== bytesToHex(supplied).toLowerCase()) {
    throw new Error('Provided init code hash does not match keccak256(init code).');
  }
  return { initCodeBytes: codeBytes, initCodeHashBytes: supplied ?? derived };
}

export function predictCreate2Address({ deployer, salt, initCode, initCodeHash }) {
  const deployerBytes = addressToBytes(deployer);
  const saltBytes = normalizeSalt(salt);
  const resolved = resolveInitCodeHash({ initCode, initCodeHash });
  const preimage = concatBytes(Uint8Array.of(0xff), deployerBytes, saltBytes, resolved.initCodeHashBytes);
  const digest = keccak256(preimage);
  const rawAddress = bytesToHex(digest.slice(12));
  return {
    method: 'CREATE2',
    deployer: toChecksumAddress(deployer),
    salt: bytesToHex(saltBytes),
    initCode: resolved.initCodeBytes ? bytesToHex(resolved.initCodeBytes) : null,
    initCodeHash: bytesToHex(resolved.initCodeHashBytes),
    preimage: bytesToHex(preimage),
    digest: bytesToHex(digest),
    address: toChecksumAddress(rawAddress),
  };
}
