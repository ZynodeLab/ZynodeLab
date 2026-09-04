import test from 'node:test';
import assert from 'node:assert/strict';
import { compareCreate2Recipes, fingerprintRecipe } from '../src/lib/recipe.js';

const base = {
  method: 'CREATE2',
  deployer: '0x0000000000000000000000000000000000000000',
  salt: '0x00',
  initCode: '0x00',
};

test('recipe fingerprint is deterministic', () => {
  assert.equal(fingerprintRecipe(base).keccak256, fingerprintRecipe({ ...base }).keccak256);
});

test('recipe comparison detects address changes', () => {
  const report = compareCreate2Recipes(base, { ...base, salt: '0x01' });
  assert.equal(report.sameAddress, false);
});
