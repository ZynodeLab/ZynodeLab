import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'src', 'cli.js');
function run(args) { return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' }); }

test('network command identifies Robinhood Chain mainnet', () => {
  const result = run(['network']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Robinhood Chain/);
  assert.match(result.stdout, /4663/);
});

test('create2 command emits EIP-1014 fixture', () => {
  const result = run(['create2', '--deployer', '0x0000000000000000000000000000000000000000', '--salt', '0x00', '--init-code', '0x00']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /0x4D1A2e2bB4F88F0250f26Ffff098B0b30B26BF38/);
});

test('verify returns 2 for mismatch', () => {
  const result = run(['verify', '--deployer', '0x0000000000000000000000000000000000000000', '--salt', '0x00', '--init-code', '0x00', '--expect', '0x0000000000000000000000000000000000000000']);
  assert.equal(result.status, 2);
});

test('checksum command emits EIP-55 form', () => {
  const result = run(['checksum', '--address', '0x52908400098527886e0f7030069857d2e4169ee7']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /0x52908400098527886E0F7030069857D2E4169EE7/);
});
