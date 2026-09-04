import test from 'node:test';
import assert from 'node:assert/strict';
import { boundariesFor, bytesToHex, concatBytes, equalBytes, firstByteDifference, hexToBytes } from '../src/lib/bytes.js';

test('hex codec accepts spaces and 0x prefix', () => {
  const bytes = hexToBytes('0x01 02 ff');
  assert.deepEqual([...bytes], [1, 2, 255]);
  assert.equal(bytesToHex(bytes), '0102ff');
});

test('hex codec rejects odd length', () => {
  assert.throws(() => hexToBytes('abc'), /even number/i);
});

test('concatBytes preserves order and boundaries', () => {
  const chunks = [Uint8Array.of(1, 2), Uint8Array.of(3), Uint8Array.of(4, 5, 6)];
  assert.deepEqual([...concatBytes(chunks)], [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(boundariesFor(chunks), [2, 3, 6]);
});

test('byte equality and first difference are deterministic', () => {
  const left = Uint8Array.of(1, 2, 3);
  const right = Uint8Array.of(1, 9, 3);
  assert.equal(equalBytes(left, right), false);
  assert.deepEqual(firstByteDifference(left, right), { index: 1, left: 2, right: 9 });
  assert.equal(firstByteDifference(left, left), null);
});
