import { decodeBase58, encodeBase58 } from './base58.js';
import { concatBytes, bytesToHex } from './bytes.js';
import { isEd25519CurvePoint } from './ed25519.js';
import { ZynodeError } from './errors.js';
import { sha256 } from './hash.js';

export const MAX_SEEDS = 16;
export const MAX_SEED_LENGTH = 32;
export const MAX_FIND_SEEDS = MAX_SEEDS - 1;
export const PDA_MARKER_TEXT = 'ProgramDerivedAddress';
export const PDA_MARKER = new TextEncoder().encode(PDA_MARKER_TEXT);

export function validateProgramId(programId) {
  if (typeof programId !== 'string') {
    return { valid: false, error: 'Program ID must be a base58 string.' };
  }
  try {
    const bytes = decodeBase58(programId.trim());
    if (bytes.length !== 32) return { valid: false, error: 'Program ID must decode to exactly 32 bytes.' };
    return { valid: true, bytes };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid program ID.' };
  }
}

export function validateSeeds(seeds, { finding = false } = {}) {
  const max = finding ? MAX_FIND_SEEDS : MAX_SEEDS;
  if (!Array.isArray(seeds)) return { valid: false, error: 'Seeds must be an array.' };
  if (seeds.length > max) {
    return {
      valid: false,
      error: finding
        ? `Canonical derivation supports at most ${MAX_FIND_SEEDS} user seeds because the bump occupies the final seed slot.`
        : `Solana allows at most ${MAX_SEEDS} seeds.`,
    };
  }
  for (let index = 0; index < seeds.length; index += 1) {
    const seed = seeds[index];
    if (!(seed instanceof Uint8Array)) return { valid: false, error: `Seed ${index + 1} is not a Uint8Array.` };
    if (seed.length > MAX_SEED_LENGTH) {
      return { valid: false, error: `Seed ${index + 1} is ${seed.length} bytes. Maximum seed length is ${MAX_SEED_LENGTH} bytes.` };
    }
  }
  return { valid: true };
}

/**
 * Calculates the raw SHA-256 candidate used by Solana for create_program_address.
 * The candidate is returned even when it lies on the Ed25519 curve so callers can
 * inspect exactly why a bump was rejected.
 */
export async function inspectProgramAddressCandidate(seeds, programId) {
  const seedValidation = validateSeeds(seeds);
  if (!seedValidation.valid) throw new ZynodeError('INVALID_SEEDS', seedValidation.error);

  const program = validateProgramId(programId);
  if (!program.valid) throw new ZynodeError('INVALID_PROGRAM', program.error);

  const preimage = concatBytes([...seeds, program.bytes, PDA_MARKER]);
  const digest = await sha256(preimage);
  const onCurve = isEd25519CurvePoint(digest);

  return {
    digest,
    digestHex: bytesToHex(digest),
    candidateAddress: encodeBase58(digest),
    onCurve,
    preimageLength: preimage.length,
    segmentLengths: [...seeds.map((seed) => seed.length), 32, PDA_MARKER.length],
  };
}

export async function createProgramAddress(seeds, programId) {
  const candidate = await inspectProgramAddressCandidate(seeds, programId);
  if (candidate.onCurve) {
    throw new ZynodeError(
      'ON_CURVE',
      'Derived address is on the Ed25519 curve and is not a valid PDA.',
      { candidateAddress: candidate.candidateAddress, digestHex: candidate.digestHex },
    );
  }
  return candidate.candidateAddress;
}

export async function findProgramAddress(seeds, programId) {
  const validation = validateSeeds(seeds, { finding: true });
  if (!validation.valid) throw new ZynodeError('INVALID_SEEDS', validation.error);

  for (let bump = 255; bump >= 0; bump -= 1) {
    const candidate = await inspectProgramAddressCandidate([...seeds, Uint8Array.of(bump)], programId);
    if (!candidate.onCurve) {
      return {
        address: candidate.candidateAddress,
        bump,
        digestHex: candidate.digestHex,
      };
    }
  }
  throw new ZynodeError('NO_BUMP', 'Unable to find a viable PDA bump seed.');
}

export async function traceProgramAddress(seeds, programId) {
  const validation = validateSeeds(seeds, { finding: true });
  if (!validation.valid) throw new ZynodeError('INVALID_SEEDS', validation.error);

  const attempts = [];
  for (let bump = 255; bump >= 0; bump -= 1) {
    const candidate = await inspectProgramAddressCandidate([...seeds, Uint8Array.of(bump)], programId);
    const row = {
      bump,
      status: candidate.onCurve ? 'on-curve' : 'valid',
      candidateAddress: candidate.candidateAddress,
      digestHex: candidate.digestHex,
      preimageLength: candidate.preimageLength,
    };
    attempts.push(row);
    if (!candidate.onCurve) {
      return {
        canonical: { address: candidate.candidateAddress, bump },
        attempts,
        marker: PDA_MARKER_TEXT,
      };
    }
  }
  throw new ZynodeError('NO_BUMP', 'Unable to find a viable PDA bump seed.');
}

export async function exploreBumps(seeds, programId) {
  const validation = validateSeeds(seeds, { finding: true });
  if (!validation.valid) throw new ZynodeError('INVALID_SEEDS', validation.error);

  const results = [];
  for (let bump = 255; bump >= 0; bump -= 1) {
    const candidate = await inspectProgramAddressCandidate([...seeds, Uint8Array.of(bump)], programId);
    results.push({
      bump,
      valid: !candidate.onCurve,
      address: candidate.onCurve ? null : candidate.candidateAddress,
      candidateAddress: candidate.candidateAddress,
      digestHex: candidate.digestHex,
    });
  }
  const canonical = results.find((item) => item.valid) ?? null;
  return { canonical, results };
}
