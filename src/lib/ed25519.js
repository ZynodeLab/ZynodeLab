const P = (1n << 255n) - 19n;
const D = mod(-121665n * invert(121666n));
const SQRT_M1 = powMod(2n, (P - 1n) / 4n);

function mod(value) {
  const result = value % P;
  return result >= 0n ? result : result + P;
}

function powMod(base, exponent) {
  let x = mod(base);
  let n = exponent;
  let result = 1n;
  while (n > 0n) {
    if (n & 1n) result = mod(result * x);
    x = mod(x * x);
    n >>= 1n;
  }
  return result;
}

function invert(value) {
  if (value === 0n) throw new Error('Cannot invert zero');
  return powMod(value, P - 2n);
}

function littleEndianToBigInt(bytes) {
  let value = 0n;
  for (let index = bytes.length - 1; index >= 0; index -= 1) {
    value = (value << 8n) | BigInt(bytes[index]);
  }
  return value;
}

/**
 * Returns true when a 32-byte compressed Edwards-Y value can be decompressed
 * as an Ed25519 curve point. This mirrors the check Solana performs before
 * accepting a program-derived address.
 */
export function isEd25519CurvePoint(input) {
  if (!(input instanceof Uint8Array) || input.length !== 32) return false;

  const bytes = input.slice();
  const sign = bytes[31] >> 7;
  bytes[31] &= 0x7f;
  const y = littleEndianToBigInt(bytes);
  if (y >= P) return false;

  const y2 = mod(y * y);
  const u = mod(y2 - 1n);
  const v = mod(D * y2 + 1n);
  const x2 = mod(u * invert(v));

  let x = powMod(x2, (P + 3n) / 8n);
  if (mod(x * x - x2) !== 0n) x = mod(x * SQRT_M1);
  if (mod(x * x - x2) !== 0n) return false;

  if (x === 0n && sign === 1) return false;
  return true;
}
