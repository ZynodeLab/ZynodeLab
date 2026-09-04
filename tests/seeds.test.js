import test from 'node:test';
import assert from 'node:assert/strict';
import { seedToBytes, inspectSeed } from '../src/lib/seeds.js';

test('string seeds use UTF-8', () => {
  assert.deepEqual([...seedToBytes({ type: 'string', value: 'user' })], [117, 115, 101, 114]);
});

test('u64 little endian encoding is deterministic', () => {
  assert.deepEqual(
    [...seedToBytes({ type: 'u64', value: '12345', endian: 'le' })],
    [0x39, 0x30, 0, 0, 0, 0, 0, 0],
  );
});

test('u32 big endian encoding is deterministic', () => {
  assert.deepEqual(
    [...seedToBytes({ type: 'u32', value: '16909060', endian: 'be' })],
    [1, 2, 3, 4],
  );
});

test('hex parser accepts 0x prefix and spaces', () => {
  assert.deepEqual([...seedToBytes({ type: 'hex', value: '0x01 02 ff' })], [1, 2, 255]);
});

test('seed inspector catches values over 32 bytes', () => {
  const result = inspectSeed({ type: 'string', value: 'a'.repeat(33) });
  assert.equal(result.valid, false);
  assert.match(result.error, /maximum is 32 bytes/i);
});
