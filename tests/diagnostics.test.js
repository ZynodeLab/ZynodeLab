import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRecipes, diagnoseRecipe } from '../src/lib/diagnostics.js';
import { normalizeRecipe } from '../src/lib/recipe.js';

const SYSTEM = '11111111111111111111111111111111';

test('doctor flags adjacent variable-width seed boundaries', async () => {
  const recipe = normalizeRecipe({ program: SYSTEM, seeds: ['string:profile', 'string:user'] });
  const report = await diagnoseRecipe(recipe);
  assert.equal(report.findings.some((finding) => finding.code === 'VARIABLE_SEED_BOUNDARY'), true);
});

test('doctor flags Unicode normalization variance', async () => {
  const recipe = normalizeRecipe({ program: SYSTEM, seeds: ['string:café'] });
  const report = await diagnoseRecipe(recipe);
  assert.equal(report.findings.some((finding) => finding.code === 'UNICODE_NORMALIZATION'), true);
});

test('comparison detects algorithm-equivalent segmentation', async () => {
  const left = normalizeRecipe({ program: SYSTEM, seeds: ['string:alpha', 'string:beta'] });
  const right = normalizeRecipe({ program: SYSTEM, seeds: ['string:alph', 'string:abeta'] });
  const result = await compareRecipes(left, right);
  assert.equal(result.samePayloadBytes, true);
  assert.equal(result.sameCanonicalPda, true);
  assert.equal(result.sameTypedRecipe, false);
  assert.equal(result.segmentationEquivalent, true);
  assert.notDeepEqual(result.left.seedBoundaries, result.right.seedBoundaries);
});

test('comparison locates the first differing payload byte', async () => {
  const left = normalizeRecipe({ program: SYSTEM, seeds: ['string:abc'] });
  const right = normalizeRecipe({ program: SYSTEM, seeds: ['string:axc'] });
  const result = await compareRecipes(left, right);
  assert.deepEqual(result.firstPayloadDifference, { index: 1, left: 98, right: 120 });
  assert.equal(result.sameCanonicalPda, false);
});
