import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectAddress, normalizeAddress, toChecksumAddress } from '../src/lib/address.js';

test('normalizes EVM addresses', () => {
  assert.equal(normalizeAddress('0x52908400098527886E0F7030069857D2E4169EE7'), '0x52908400098527886e0f7030069857d2e4169ee7');
});

test('matches EIP-55 checksum vectors', () => {
  assert.equal(toChecksumAddress('0x52908400098527886e0f7030069857d2e4169ee7'), '0x52908400098527886E0F7030069857D2E4169EE7');
  assert.equal(toChecksumAddress('0xde709f2102306220921060314715629080e2fb77'), '0xde709f2102306220921060314715629080e2fb77');
});

test('inspects zero address', () => {
  assert.equal(inspectAddress('0x0000000000000000000000000000000000000000').zeroAddress, true);
});
