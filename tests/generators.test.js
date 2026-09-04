import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCreate2Code } from '../src/lib/generators.js';

const recipe = {
  deployer: '0x0000000000000000000000000000000000000000',
  salt: '0x00',
  initCode: '0x00',
};

test('Solidity generator contains CREATE2 preimage domain byte', () => {
  const code = generateCreate2Code('solidity', recipe);
  assert.match(code, /bytes1\(0xff\)/);
  assert.match(code, /initCodeHash/);
});

test('ethers generator emits getCreate2Address', () => {
  const code = generateCreate2Code('ethers', recipe);
  assert.match(code, /getCreate2Address/);
});
