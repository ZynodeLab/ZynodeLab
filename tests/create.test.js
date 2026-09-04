import test from 'node:test';
import assert from 'node:assert/strict';
import { predictCreateAddress } from '../src/lib/create.js';

test('matches known CREATE fixture for nonce 0', () => {
  const result = predictCreateAddress('0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0', 0);
  assert.equal(result.address.toLowerCase(), '0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d');
});

test('matches known CREATE fixture for nonce 1', () => {
  const result = predictCreateAddress('0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0', 1);
  assert.equal(result.address.toLowerCase(), '0x343c43a37d37dff08ae8c4a11544c718abb4fcf8');
});
