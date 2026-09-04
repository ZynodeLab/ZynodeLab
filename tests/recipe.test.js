import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintPayload, fingerprintRecipe, normalizeRecipe, recipeToPortableJson } from '../src/lib/recipe.js';

const SYSTEM = '11111111111111111111111111111111';

test('normalizes a portable recipe into typed seeds', () => {
  const recipe = normalizeRecipe({ program: SYSTEM, seeds: ['string:profile', 'u64le:42'] });
  assert.equal(recipe.seeds.length, 2);
  assert.equal(recipe.seeds[1].type, 'u64');
  assert.equal(recipe.seeds[1].endian, 'le');
});

test('typed recipe fingerprint is stable', async () => {
  const recipe = normalizeRecipe({ program: SYSTEM, seeds: ['string:profile', 'u64le:42'] });
  const first = await fingerprintRecipe(recipe);
  const second = await fingerprintRecipe(recipe);
  assert.equal(first.hex, second.hex);
  assert.equal(first.hex.length, 64);
});

test('payload fingerprint ignores seed segmentation while typed fingerprint preserves it', async () => {
  const a = normalizeRecipe({ program: SYSTEM, seeds: ['string:alpha', 'string:beta'] });
  const b = normalizeRecipe({ program: SYSTEM, seeds: ['string:alph', 'string:abeta'] });
  const [aPayload, bPayload, aRecipe, bRecipe] = await Promise.all([
    fingerprintPayload(a), fingerprintPayload(b), fingerprintRecipe(a), fingerprintRecipe(b),
  ]);
  assert.equal(aPayload.hex, bPayload.hex);
  assert.notEqual(aRecipe.hex, bRecipe.hex);
});

test('portable JSON keeps program and original seed syntax', () => {
  const recipe = normalizeRecipe({ program: SYSTEM, seeds: ['string:profile', 'u32be:9'] });
  assert.deepEqual(recipeToPortableJson(recipe), {
    schema: 'zynode-recipe-v1',
    program: SYSTEM,
    seeds: ['string:profile', 'u32be:9'],
  });
});
