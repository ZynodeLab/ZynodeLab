import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeBase58, encodeBase58 } from '../src/lib/base58.js';

test('system program decodes to 32 zero bytes', () => {
  const bytes = decodeBase58('11111111111111111111111111111111');
  assert.equal(bytes.length, 32);
  assert.deepEqual([...bytes], new Array(32).fill(0));
});

test('base58 preserves leading zero bytes', () => {
  const bytes = Uint8Array.from([0, 0, 1, 2, 3, 250]);
  assert.deepEqual([...decodeBase58(encodeBase58(bytes))], [...bytes]);
});

test('base58 rejects invalid characters', () => {
  assert.throws(() => decodeBase58('0OIl'), /Invalid base58 character/);
});
