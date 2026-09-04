import { formatSeedLabel } from '../lib/seeds.js';

export function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function renderPreparedSeeds(seeds) {
  return seeds.map((seed, index) => ({
    index: index + 1,
    type: formatSeedLabel(seed),
    value: seed.value,
    byteLength: seed.bytes.length,
    hex: seed.hex,
  }));
}

export function printKeyValues(entries) {
  const width = Math.max(...entries.map(([key]) => key.length));
  for (const [key, value] of entries) {
    process.stdout.write(`${key.padEnd(width)}  ${value}\n`);
  }
}

export function printFindings(findings) {
  if (findings.length === 0) {
    process.stdout.write('Findings  none\n');
    return;
  }
  for (const finding of findings) {
    const location = Number.isInteger(finding.seedIndex) ? ` seed ${finding.seedIndex + 1}` : '';
    process.stdout.write(`${finding.level.toUpperCase().padEnd(7)} ${finding.code}${location}\n`);
    process.stdout.write(`        ${finding.message}\n`);
    if (finding.details) process.stdout.write(`        ${JSON.stringify(finding.details)}\n`);
  }
}
