import { bytesToHex, utf8ToBytes } from './bytes.js';

const MASK_64 = (1n << 64n) - 1n;
const RATE_BYTES = 136;
const ROTATION = [
  0, 1, 62, 28, 27,
  36, 44, 6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21, 8,
  18, 2, 61, 56, 14,
];
const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n,
  0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n,
  0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn,
  0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n,
  0x0000000080000001n, 0x8000000080008008n,
];

function rotl64(value, shift) {
  const n = BigInt(shift);
  if (n === 0n) return value & MASK_64;
  return ((value << n) | (value >> (64n - n))) & MASK_64;
}

function readLaneLE(block, offset) {
  let lane = 0n;
  for (let i = 0; i < 8; i += 1) lane |= BigInt(block[offset + i]) << BigInt(i * 8);
  return lane;
}

function writeLaneLE(lane, out, offset, limit) {
  for (let i = 0; i < 8 && offset + i < limit; i += 1) {
    out[offset + i] = Number((lane >> BigInt(i * 8)) & 0xffn);
  }
}

function keccakF(state) {
  const b = new Array(25).fill(0n);
  const c = new Array(5).fill(0n);
  const d = new Array(5).fill(0n);

  for (const rc of ROUND_CONSTANTS) {
    for (let x = 0; x < 5; x += 1) c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    for (let x = 0; x < 5; x += 1) d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) state[x + 5 * y] = (state[x + 5 * y] ^ d[x]) & MASK_64;
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const index = x + 5 * y;
        const targetX = y;
        const targetY = (2 * x + 3 * y) % 5;
        b[targetX + 5 * targetY] = rotl64(state[index], ROTATION[index]);
      }
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        state[x + 5 * y] = (b[x + 5 * y] ^ ((~b[((x + 1) % 5) + 5 * y]) & b[((x + 2) % 5) + 5 * y])) & MASK_64;
      }
    }
    state[0] = (state[0] ^ rc) & MASK_64;
  }
}

export function keccak256(input) {
  if (!(input instanceof Uint8Array)) throw new TypeError('keccak256 expects a Uint8Array.');
  const state = new Array(25).fill(0n);
  const paddedLength = Math.ceil((input.length + 1) / RATE_BYTES) * RATE_BYTES;
  const padded = new Uint8Array(paddedLength || RATE_BYTES);
  padded.set(input);
  padded[input.length] ^= 0x01;
  padded[padded.length - 1] ^= 0x80;

  for (let blockOffset = 0; blockOffset < padded.length; blockOffset += RATE_BYTES) {
    for (let lane = 0; lane < RATE_BYTES / 8; lane += 1) {
      state[lane] = (state[lane] ^ readLaneLE(padded, blockOffset + lane * 8)) & MASK_64;
    }
    keccakF(state);
  }

  const out = new Uint8Array(32);
  for (let lane = 0; lane < 4; lane += 1) writeLaneLE(state[lane], out, lane * 8, out.length);
  return out;
}

export function keccak256Hex(input) {
  return bytesToHex(keccak256(input));
}

export function keccak256Utf8(value) {
  return keccak256(utf8ToBytes(value));
}
