import { normalizeAddress } from './address.js';
import { bytesToHex, utf8ToBytes } from './bytes.js';
import { predictCreateAddress } from './create.js';
import { normalizeSalt, predictCreate2Address, resolveInitCodeHash } from './create2.js';
import { keccak256 } from './keccak.js';

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function normalizeCreate2Recipe(recipe) {
  const deployer = normalizeAddress(recipe.deployer);
  const salt = bytesToHex(normalizeSalt(recipe.salt));
  const resolved = resolveInitCodeHash({ initCode: recipe.initCode, initCodeHash: recipe.initCodeHash });
  return {
    version: 1,
    method: 'CREATE2',
    deployer,
    salt,
    initCode: resolved.initCodeBytes ? bytesToHex(resolved.initCodeBytes) : null,
    initCodeHash: bytesToHex(resolved.initCodeHashBytes),
  };
}

export function fingerprintRecipe(recipe) {
  const normalized = normalizeCreate2Recipe(recipe);
  const canonical = stableJson(normalized);
  return { canonical, keccak256: bytesToHex(keccak256(utf8ToBytes(canonical))) };
}

export function compareCreate2Recipes(left, right) {
  const a = normalizeCreate2Recipe(left);
  const b = normalizeCreate2Recipe(right);
  const pa = predictCreate2Address(a);
  const pb = predictCreate2Address(b);
  return {
    sameDeployer: a.deployer === b.deployer,
    sameSalt: a.salt === b.salt,
    sameInitCodeHash: a.initCodeHash === b.initCodeHash,
    sameAddress: pa.address === pb.address,
    left: { recipe: a, address: pa.address, fingerprint: fingerprintRecipe(a).keccak256 },
    right: { recipe: b, address: pb.address, fingerprint: fingerprintRecipe(b).keccak256 },
  };
}

export function predictRecipe(recipe) {
  const method = String(recipe.method || 'CREATE2').toUpperCase();
  if (method === 'CREATE') return predictCreateAddress(recipe.deployer, recipe.nonce);
  if (method === 'CREATE2') return predictCreate2Address(recipe);
  throw new Error(`Unsupported recipe method: ${recipe.method}.`);
}
