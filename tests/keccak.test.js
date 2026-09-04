import test from 'node:test';
import assert from 'node:assert/strict';
import { bytesToHex, utf8ToBytes } from '../src/lib/bytes.js';
import { keccak256 } from '../src/lib/keccak.js';

test('keccak256 matches empty-string vector', () => {
  assert.equal(bytesToHex(keccak256(new Uint8Array())), '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
});

test('keccak256 matches abc vector', () => {
  assert.equal(bytesToHex(keccak256(utf8ToBytes('abc'))), '0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45');
});
