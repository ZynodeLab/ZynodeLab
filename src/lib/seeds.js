import { decodeBase58 } from './base58.js';
import { bytesToHex, hexToBytes } from './bytes.js';

const encoder = new TextEncoder();
const INTEGER_TYPES = new Set(['u8', 'u16', 'u32', 'u64']);
const VARIABLE_TYPES = new Set(['string', 'base58', 'hex']);

function parseInteger(value, bits) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) throw new Error(`${bits}-bit integer must be an unsigned decimal value.`);
  const parsed = BigInt(text);
  const max = (1n << BigInt(bits)) - 1n;
  if (parsed > max) throw new Error(`Value must be between 0 and ${max}.`);
  return parsed;
}

function integerToBytes(value, bits, endian = 'le') {
  const length = bits / 8;
  const bytes = new Uint8Array(length);
  let remaining = value;
  for (let index = 0; index < length; index += 1) {
    const target = endian === 'be' ? length - 1 - index : index;
    bytes[target] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

export function parseSeedSpec(spec) {
  if (typeof spec !== 'string' || !spec.includes(':')) {
    throw new Error(`Invalid seed "${spec ?? ''}". Use TYPE:VALUE, for example string:user.`);
  }
  const separator = spec.indexOf(':');
  const rawType = spec.slice(0, separator).trim().toLowerCase();
  const value = spec.slice(separator + 1);
  const integer = rawType.match(/^(u(?:16|32|64))(le|be)$/);
  if (integer) return { type: integer[1], endian: integer[2], value, spec };
  if (rawType === 'u8') return { type: 'u8', endian: 'le', value, spec };
  if (['string', 'pubkey', 'base58', 'hex'].includes(rawType)) return { type: rawType, value, spec };
  throw new Error(`Unsupported seed type: ${rawType}`);
}

export function seedToBytes(seed) {
  const type = seed.type;
  const value = String(seed.value ?? '');
  const endian = seed.endian === 'be' ? 'be' : 'le';

  switch (type) {
    case 'string':
      return encoder.encode(value);
    case 'pubkey': {
      const bytes = decodeBase58(value.trim());
      if (bytes.length !== 32) throw new Error('Public key seeds must decode to exactly 32 bytes.');
      return bytes;
    }
    case 'base58':
      return decodeBase58(value.trim());
    case 'hex':
      return hexToBytes(value);
    default:
      if (INTEGER_TYPES.has(type)) {
        const bits = Number(type.slice(1));
        return integerToBytes(parseInteger(value, bits), bits, endian);
      }
      throw new Error(`Unsupported seed type: ${type}`);
  }
}

export function inspectSeed(seed) {
  try {
    const bytes = seedToBytes(seed);
    return {
      valid: bytes.length <= 32,
      bytes,
      byteLength: bytes.length,
      hex: bytesToHex(bytes, ' '),
      compactHex: bytesToHex(bytes),
      variableWidth: isVariableWidthSeed(seed),
      error: bytes.length > 32 ? `Seed is ${bytes.length} bytes. Solana's maximum is 32 bytes.` : null,
    };
  } catch (error) {
    return {
      valid: false,
      bytes: null,
      byteLength: null,
      hex: '',
      compactHex: '',
      variableWidth: isVariableWidthSeed(seed),
      error: error instanceof Error ? error.message : 'Invalid seed.',
    };
  }
}

export function prepareSeedSpecs(specs) {
  if (!Array.isArray(specs)) throw new TypeError('Seed specifications must be an array.');
  return specs.map((spec, index) => {
    const seed = parseSeedSpec(spec);
    const report = inspectSeed(seed);
    if (!report.valid) throw new Error(`Seed ${index + 1} (${spec}): ${report.error}`);
    return {
      ...seed,
      bytes: report.bytes,
      byteLength: report.byteLength,
      hex: report.compactHex,
      variableWidth: report.variableWidth,
    };
  });
}

export function isVariableWidthSeed(seed) {
  return VARIABLE_TYPES.has(seed?.type);
}

export function formatSeedLabel(seed) {
  if (!seed) return 'unknown';
  if (['u16', 'u32', 'u64'].includes(seed.type)) return `${seed.type}${seed.endian ?? 'le'}`;
  return seed.type;
}

export function formatBytesHex(bytes) {
  return bytesToHex(bytes, ' ');
}
