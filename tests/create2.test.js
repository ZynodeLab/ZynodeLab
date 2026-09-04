import test from 'node:test';
import assert from 'node:assert/strict';
import { predictCreate2Address } from '../src/lib/create2.js';

const ZERO = '0x0000000000000000000000000000000000000000';
const SALT = '0x0000000000000000000000000000000000000000000000000000000000000000';

test('matches EIP-1014 example 0', () => {
  const result = predictCreate2Address({ deployer: ZERO, salt: SALT, initCode: '0x00' });
  assert.equal(result.address, '0x4D1A2e2bB4F88F0250f26Ffff098B0b30B26BF38');
});

test('matches EIP-1014 example 1', () => {
  const result = predictCreate2Address({
    deployer: '0xdeadbeef00000000000000000000000000000000',
    salt: SALT,
    initCode: '0x00',
  });
  assert.equal(result.address, '0xB928f69Bb1D91Cd65274e3c79d8986362984fDA3');
});

test('matches EIP-1014 example 3', () => {
  const result = predictCreate2Address({ deployer: ZERO, salt: SALT, initCode: '0xdeadbeef' });
  assert.equal(result.address, '0x70f2b2914A2a4b783FaEFb75f459A580616Fcb5e');
});

test('short salt is left padded to 32 bytes', () => {
  const a = predictCreate2Address({ deployer: ZERO, salt: '0x00', initCode: '0x00' });
  const b = predictCreate2Address({ deployer: ZERO, salt: SALT, initCode: '0x00' });
  assert.equal(a.address, b.address);
});
