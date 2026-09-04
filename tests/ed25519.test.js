import test from 'node:test';
import assert from 'node:assert/strict';
import { isEd25519CurvePoint } from '../src/lib/ed25519.js';

test('compressed identity point is recognized as on-curve', () => {
  const identity = new Uint8Array(32);
  identity[0] = 1;
  assert.equal(isEd25519CurvePoint(identity), true);
});

test('wrong-length values are not curve points', () => {
  assert.equal(isEd25519CurvePoint(new Uint8Array(31)), false);
});
