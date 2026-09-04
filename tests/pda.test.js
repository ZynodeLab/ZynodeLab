import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgramAddress, exploreBumps, findProgramAddress, validateProgramId, validateSeeds } from '../src/lib/pda.js';

const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const encoder = new TextEncoder();

test('validates a 32-byte Solana program ID', () => {
  assert.equal(validateProgramId(SYSTEM_PROGRAM).valid, true);
  assert.equal(validateProgramId('abc').valid, false);
});

test('derives the official no-seed fixture', async () => {
  const result = await findProgramAddress([], SYSTEM_PROGRAM);
  assert.equal(result.address, 'Cu7NwqCXSmsR5vgGA3Vw9uYVViPi3kQvkbKByVQ8nPY9');
  assert.equal(result.bump, 255);
});

test('derives the official helloWorld fixture', async () => {
  const result = await findProgramAddress([encoder.encode('helloWorld')], SYSTEM_PROGRAM);
  assert.equal(result.address, '46GZzzetjCURsdFPb7rcnspbEMnCBXe9kpjrsZAkKb6X');
  assert.equal(result.bump, 254);
});

test('explicit canonical bump reproduces the PDA', async () => {
  const address = await createProgramAddress(
    [encoder.encode('helloWorld'), Uint8Array.of(254)],
    SYSTEM_PROGRAM,
  );
  assert.equal(address, '46GZzzetjCURsdFPb7rcnspbEMnCBXe9kpjrsZAkKb6X');
});

test('canonical derivation reserves one of the sixteen seed slots for the bump', () => {
  const seeds = Array.from({ length: 16 }, () => Uint8Array.of(1));
  const result = validateSeeds(seeds, { finding: true });
  assert.equal(result.valid, false);
  assert.match(result.error, /final seed slot/i);
});

test('a seed longer than 32 bytes is rejected', () => {
  const result = validateSeeds([new Uint8Array(33)]);
  assert.equal(result.valid, false);
});


test('matches Solana documentation bump vectors around the canonical result', async () => {
  const result = await exploreBumps([encoder.encode('helloWorld')], SYSTEM_PROGRAM);
  const byBump = new Map(result.results.map((row) => [row.bump, row]));
  assert.equal(byBump.get(255).valid, false);
  assert.equal(byBump.get(254).address, '46GZzzetjCURsdFPb7rcnspbEMnCBXe9kpjrsZAkKb6X');
  assert.equal(byBump.get(253).address, 'GBNWBGxKmdcd7JrMnBdZke9Fumj9sir4rpbruwEGmR4y');
  assert.equal(byBump.get(252).address, 'THfBMgduMonjaNsCisKa7Qz2cBoG1VCUYHyso7UXYHH');
  assert.equal(byBump.get(251).address, 'EuRrNqJAofo7y3Jy6MGvF7eZAYegqYTwH2dnLCwDDGdP');
  assert.equal(byBump.get(250).valid, false);
});
