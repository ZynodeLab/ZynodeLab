import { decodeBase58, encodeBase58 } from './base58.js';
import { concatBytes, bytesToHex } from './bytes.js';
import { sha256 } from './hash.js';
import { validateProgramId } from './pda.js';
import { prepareSeedSpecs } from './seeds.js';

const encoder = new TextEncoder();
const RECIPE_DOMAIN = encoder.encode('ZynodeRecipeFingerprintV1');
const PAYLOAD_DOMAIN = encoder.encode('ZynodePayloadFingerprintV1');

function u16be(value) {
  if (!Number.isInteger(value) || value < 0 || value > 65535) throw new RangeError('u16 frame value out of range.');
  return Uint8Array.of((value >>> 8) & 0xff, value & 0xff);
}

function frameText(value) {
  const bytes = encoder.encode(String(value));
  return concatBytes([u16be(bytes.length), bytes]);
}

export function normalizeRecipe(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Recipe must be a JSON object.');
  }
  if (typeof input.program !== 'string' || input.program.trim() === '') {
    throw new Error('Recipe must contain a non-empty "program" string.');
  }
  const program = input.program.trim();
  const programValidation = validateProgramId(program);
  if (!programValidation.valid) throw new Error(`Recipe program: ${programValidation.error}`);

  if (!Array.isArray(input.seeds)) throw new Error('Recipe must contain a "seeds" array.');
  if (!input.seeds.every((seed) => typeof seed === 'string')) {
    throw new Error('Every recipe seed must use the TYPE:VALUE string syntax.');
  }
  const prepared = prepareSeedSpecs(input.seeds);
  if (prepared.length > 15) {
    throw new Error('A canonical PDA recipe can contain at most 15 user seeds because the bump uses the final seed slot.');
  }
  return { program, specs: [...input.seeds], seeds: prepared };
}

export function recipeFromCli(program, specs) {
  return normalizeRecipe({ program, seeds: specs });
}

export async function fingerprintRecipe(recipeInput) {
  const recipe = recipeInput.seeds?.[0]?.bytes instanceof Uint8Array
    ? recipeInput
    : normalizeRecipe(recipeInput);
  const programBytes = decodeBase58(recipe.program);
  const seedFrames = recipe.seeds.map((seed) => concatBytes([
    frameText(seed.type),
    frameText(seed.endian ?? ''),
    frameText(seed.value),
    Uint8Array.of(seed.bytes.length),
    seed.bytes,
  ]));
  const digest = await sha256(concatBytes([
    RECIPE_DOMAIN,
    programBytes,
    Uint8Array.of(recipe.seeds.length),
    ...seedFrames,
  ]));
  return {
    algorithm: 'zynode-recipe-v1',
    hex: bytesToHex(digest),
    base58: encodeBase58(digest),
  };
}

export async function fingerprintPayload(recipeInput) {
  const recipe = recipeInput.seeds?.[0]?.bytes instanceof Uint8Array
    ? recipeInput
    : normalizeRecipe(recipeInput);
  const programBytes = decodeBase58(recipe.program);
  const payload = concatBytes(recipe.seeds.map((seed) => seed.bytes));
  const digest = await sha256(concatBytes([PAYLOAD_DOMAIN, programBytes, payload]));
  return {
    algorithm: 'zynode-payload-v1',
    byteLength: payload.length,
    hex: bytesToHex(digest),
    base58: encodeBase58(digest),
  };
}

export function recipeToPortableJson(recipeInput) {
  const recipe = recipeInput.seeds?.[0]?.bytes instanceof Uint8Array
    ? recipeInput
    : normalizeRecipe(recipeInput);
  return {
    schema: 'zynode-recipe-v1',
    program: recipe.program,
    seeds: recipe.specs ?? recipe.seeds.map((seed) => seed.spec),
  };
}
