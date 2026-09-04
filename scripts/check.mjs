import { access, readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const src = join(root, 'src');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const failures = [];
const files = await walk(src);
const jsFiles = files.filter((file) => file.endsWith('.js'));

for (const file of jsFiles) {
  const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (syntax.status !== 0) failures.push(`${relative(root, file)}: ${syntax.stderr.trim()}`);

  const content = await readFile(file, 'utf8');
  if (/\b(TODO|FIXME|HACK)\b/.test(content)) failures.push(`${relative(root, file)} contains unfinished-work markers.`);
  if (/\beval\s*\(/.test(content)) failures.push(`${relative(root, file)} uses eval().`);
  if (/\bfetch\s*\(|node:(?:http|https|net|tls)|from ['"](?:http|https|ws)['"]/.test(content)) {
    failures.push(`${relative(root, file)} introduces network access. The core tool is intentionally offline.`);
  }
}

for (const required of [
  'src/cli.js',
  'src/cli/run.js',
  'src/lib/pda.js',
  'src/lib/diagnostics.js',
  'src/lib/recipe.js',
  'src/lib/seeds.js',
  'src/lib/generators.js',
  'examples/profile.json',
  'examples/segmentation-a.json',
  'examples/segmentation-b.json',
  'README.md',
  'LICENSE',
  'SECURITY.md',
]) {
  if (!await exists(join(root, required))) failures.push(`Missing required repository file: ${required}`);
}

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
if (packageJson.bin?.zynode !== './src/cli.js') failures.push('package.json must expose the zynode CLI.');
if (!String(packageJson.description).toLowerCase().includes('solana')) failures.push('package description should identify the Solana purpose.');
if (Object.keys(packageJson.dependencies ?? {}).length > 0) failures.push('Runtime dependencies are not allowed in the zero-dependency core.');
if (Object.keys(packageJson.optionalDependencies ?? {}).length > 0) failures.push('Optional runtime dependencies are not allowed.');

const versionSource = await readFile(join(root, 'src/version.js'), 'utf8');
const versionMatch = versionSource.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
if (!versionMatch || versionMatch[1] !== packageJson.version) failures.push('src/version.js must match package.json version.');

const cliSource = await readFile(join(root, 'src/cli.js'), 'utf8');
if (!cliSource.startsWith('#!/usr/bin/env node')) failures.push('src/cli.js must keep the Node executable shebang.');

for (const removed of [
  'index.html',
  'sw.js',
  'vercel.json',
  '_headers',
  'public',
  'dist',
  '.github/workflows/pages.yml',
]) {
  if (await exists(join(root, removed))) failures.push(`${removed} should not exist in the CLI-only repository.`);
}

const staleDocs = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'docs/architecture.md', 'docs/release-checklist.md'];
for (const file of staleDocs) {
  const path = join(root, file);
  if (!await exists(path)) continue;
  const content = await readFile(path, 'utf8');
  if (/\b(PWA|GitHub Pages|browser-first|service worker|responsive UI)\b/i.test(content)) {
    failures.push(`${file} contains stale website-era documentation.`);
  }
}

if (failures.length) {
  console.error('Repository checks failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Repository checks passed (${jsFiles.length} JavaScript modules checked, offline surface verified).`);
