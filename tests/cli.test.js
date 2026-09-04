import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const cli = join(root, 'src', 'cli.js');
const SYSTEM = '11111111111111111111111111111111';
const EXPECTED = '46GZzzetjCURsdFPb7rcnspbEMnCBXe9kpjrsZAkKb6X';

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
}

test('derive command emits canonical fixture', () => {
  const result = run(['derive', '-p', SYSTEM, '-s', 'string:helloWorld']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, new RegExp(EXPECTED));
  assert.match(result.stdout, /254/);
});

test('verify command returns zero for a match', () => {
  const result = run(['verify', '-p', SYSTEM, '-s', 'string:helloWorld', '--expect', EXPECTED]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Match\s+yes/);
});

test('verify command returns two for a mismatch', () => {
  const result = run(['verify', '-p', SYSTEM, '-s', 'string:helloWorld', '--expect', SYSTEM]);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /Match\s+no/);
});

test('trace exposes rejected bump attempts before canonical bump', () => {
  const result = run(['trace', '-p', SYSTEM, '-s', 'string:helloWorld', '--json']);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.canonical.bump, 254);
  assert.equal(parsed.attempts.length, 2);
  assert.equal(parsed.attempts[0].bump, 255);
  assert.equal(parsed.attempts[0].status, 'on-curve');
});

test('compare identifies equivalent segmentation fixtures', () => {
  const result = run(['compare', '--left', 'examples/segmentation-a.json', '--right', 'examples/segmentation-b.json', '--json']);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.segmentationEquivalent, true);
});
