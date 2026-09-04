import { boundariesFor, concatBytes, equalBytes, firstByteDifference, bytesToHex } from './bytes.js';
import { findProgramAddress } from './pda.js';
import { fingerprintPayload, fingerprintRecipe, normalizeRecipe } from './recipe.js';

const encoder = new TextEncoder();

function asPreparedRecipe(input) {
  if (input && typeof input === 'object' && Array.isArray(input.seeds) && input.seeds.every((seed) => seed?.bytes instanceof Uint8Array)) {
    return input;
  }
  return normalizeRecipe(input);
}

function normalizationFinding(seed, index) {
  if (seed.type !== 'string' || /^[\x00-\x7f]*$/.test(seed.value)) return null;
  const nfc = encoder.encode(seed.value.normalize('NFC'));
  const nfd = encoder.encode(seed.value.normalize('NFD'));
  if (equalBytes(nfc, nfd)) return null;
  return {
    level: 'warning',
    code: 'UNICODE_NORMALIZATION',
    seedIndex: index,
    message: 'This non-ASCII string has different NFC and NFD byte encodings. Clients must agree on normalization before deriving the PDA.',
    details: {
      currentHex: seed.hex,
      nfcHex: bytesToHex(nfc),
      nfdHex: bytesToHex(nfd),
    },
  };
}

function boundaryFinding(left, right, index) {
  if (!left.variableWidth || !right.variableWidth) return null;
  if (left.bytes.length === 0 && right.bytes.length === 0) return null;

  let alternative = null;
  if (left.bytes.length < 32 && right.bytes.length > 0) {
    alternative = [left.bytes.length + 1, right.bytes.length - 1];
  } else if (left.bytes.length > 0 && right.bytes.length < 32) {
    alternative = [left.bytes.length - 1, right.bytes.length + 1];
  }
  if (!alternative) return null;

  return {
    level: 'warning',
    code: 'VARIABLE_SEED_BOUNDARY',
    seedIndex: index,
    message: 'Adjacent variable-width seeds share an unframed byte boundary. A different segmentation can produce the same PDA payload bytes.',
    details: {
      pair: [index + 1, index + 2],
      currentLengths: [left.bytes.length, right.bytes.length],
      exampleAlternativeLengths: alternative,
    },
  };
}

export async function diagnoseRecipe(recipeInput) {
  const recipe = asPreparedRecipe(recipeInput);
  const findings = [];

  for (let index = 0; index < recipe.seeds.length; index += 1) {
    const seed = recipe.seeds[index];
    if (seed.bytes.length === 0) {
      findings.push({
        level: 'warning',
        code: 'EMPTY_SEED',
        seedIndex: index,
        message: 'Zero-length seeds do not add bytes to the PDA preimage and can make a recipe harder to reason about.',
      });
    }
    const unicode = normalizationFinding(seed, index);
    if (unicode) findings.push(unicode);

    if (index < recipe.seeds.length - 1) {
      const boundary = boundaryFinding(seed, recipe.seeds[index + 1], index);
      if (boundary) findings.push(boundary);
    }
  }

  if (recipe.seeds.length >= 14) {
    findings.push({
      level: 'info',
      code: 'SEED_SLOT_PRESSURE',
      seedIndex: null,
      message: `This recipe uses ${recipe.seeds.length} of 15 user seed slots available to canonical bump derivation.`,
    });
  }

  const first = recipe.seeds[0];
  if (first && !(first.type === 'string' && first.bytes.length > 0)) {
    findings.push({
      level: 'info',
      code: 'NO_TEXT_NAMESPACE',
      seedIndex: 0,
      message: 'The recipe does not start with a non-empty textual namespace seed. This is valid, but a stable namespace can make account-purpose separation easier to audit.',
    });
  }

  const [recipeFingerprint, payloadFingerprint, pda] = await Promise.all([
    fingerprintRecipe(recipe),
    fingerprintPayload(recipe),
    findProgramAddress(recipe.seeds.map((seed) => seed.bytes), recipe.program),
  ]);

  return {
    program: recipe.program,
    seedCount: recipe.seeds.length,
    canonicalPda: pda.address,
    canonicalBump: pda.bump,
    recipeFingerprint,
    payloadFingerprint,
    findings,
    summary: {
      warnings: findings.filter((item) => item.level === 'warning').length,
      info: findings.filter((item) => item.level === 'info').length,
    },
  };
}

export async function compareRecipes(leftInput, rightInput) {
  const left = asPreparedRecipe(leftInput);
  const right = asPreparedRecipe(rightInput);
  const leftPayload = concatBytes(left.seeds.map((seed) => seed.bytes));
  const rightPayload = concatBytes(right.seeds.map((seed) => seed.bytes));
  const leftBoundaries = boundariesFor(left.seeds.map((seed) => seed.bytes));
  const rightBoundaries = boundariesFor(right.seeds.map((seed) => seed.bytes));

  const [leftPda, rightPda, leftRecipeFingerprint, rightRecipeFingerprint, leftPayloadFingerprint, rightPayloadFingerprint] = await Promise.all([
    findProgramAddress(left.seeds.map((seed) => seed.bytes), left.program),
    findProgramAddress(right.seeds.map((seed) => seed.bytes), right.program),
    fingerprintRecipe(left),
    fingerprintRecipe(right),
    fingerprintPayload(left),
    fingerprintPayload(right),
  ]);

  const sameProgram = left.program === right.program;
  const samePayloadBytes = equalBytes(leftPayload, rightPayload);
  const sameBoundaries = JSON.stringify(leftBoundaries) === JSON.stringify(rightBoundaries);
  const sameTypedRecipe = leftRecipeFingerprint.hex === rightRecipeFingerprint.hex;
  const samePda = leftPda.address === rightPda.address && leftPda.bump === rightPda.bump;

  return {
    sameProgram,
    samePayloadBytes,
    sameSeedBoundaries: sameBoundaries,
    sameTypedRecipe,
    sameCanonicalPda: samePda,
    segmentationEquivalent: sameProgram && samePayloadBytes && !sameTypedRecipe,
    firstPayloadDifference: firstByteDifference(leftPayload, rightPayload),
    left: {
      program: left.program,
      seedCount: left.seeds.length,
      seedBoundaries: leftBoundaries,
      payloadHex: bytesToHex(leftPayload),
      pda: leftPda.address,
      bump: leftPda.bump,
      recipeFingerprint: leftRecipeFingerprint,
      payloadFingerprint: leftPayloadFingerprint,
    },
    right: {
      program: right.program,
      seedCount: right.seeds.length,
      seedBoundaries: rightBoundaries,
      payloadHex: bytesToHex(rightPayload),
      pda: rightPda.address,
      bump: rightPda.bump,
      recipeFingerprint: rightRecipeFingerprint,
      payloadFingerprint: rightPayloadFingerprint,
    },
  };
}
