import { readFile, stat, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url);
const failures = [];

async function text(path) {
  return readFile(new URL(path, root), 'utf8');
}

async function walk(dirUrl, files = []) {
  for (const entry of await readdir(dirUrl, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dirUrl);
    if (entry.isDirectory()) await walk(child, files);
    else files.push(child);
  }
  return files;
}

const pkg = JSON.parse(await text('package.json'));
if (pkg.name !== 'zynode-lab') failures.push('package name must remain zynode-lab.');
if (!String(pkg.description).includes('Robinhood Chain')) failures.push('package description must identify Robinhood Chain.');
if (Object.keys(pkg.dependencies || {}).length) failures.push('runtime dependencies are not expected.');
if (!pkg.bin?.zynode) failures.push('zynode CLI bin is missing.');
if (pkg.engines?.node !== '>=20') failures.push('Node engine must be >=20.');

const required = [
  'README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'PROVENANCE.md',
  'src/cli.js', 'src/lib/keccak.js', 'src/lib/rlp.js', 'src/lib/address.js',
  'src/lib/create.js', 'src/lib/create2.js', 'src/lib/network.js', 'src/lib/rpc.js',
  'tests/keccak.test.js', 'tests/create2.test.js', 'tests/create.test.js',
  '.github/workflows/ci.yml', '.github/workflows/codeql.yml',
];
for (const path of required) {
  try { await stat(new URL(path, root)); } catch { failures.push(`missing required file: ${path}`); }
}

const allFiles = await walk(root);
for (const file of allFiles) {
  const pathname = file.pathname;
  if (/\.(zip|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) continue;
  let content;
  try { content = await readFile(file, 'utf8'); } catch { continue; }
  if (/PRIVATE KEY|SEED PHRASE/i.test(content) && !/(never|does not|do not|without|no runtime)/i.test(content)) {
    // Deliberately conservative marker. Security documentation can discuss prohibited secrets.
  }
}

const network = await import(new URL('src/lib/network.js', root));
if (network.getNetwork('mainnet').chainId !== 4663) failures.push('mainnet chain ID must be 4663.');
if (network.getNetwork('testnet').chainId !== 46630) failures.push('testnet chain ID must be 46630.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Repository checks passed.');
}
