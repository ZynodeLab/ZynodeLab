function printable(value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, (_, item) => printable(item), 2)}\n`);
}

export function printKeyValues(rows) {
  const width = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) process.stdout.write(`${label.padEnd(width)}  ${printable(value)}\n`);
}

export function printFindings(findings) {
  if (!findings.length) {
    process.stdout.write('No findings.\n');
    return;
  }
  for (const finding of findings) process.stdout.write(`${finding.severity.toUpperCase().padEnd(7)} ${finding.code.padEnd(16)} ${finding.message}\n`);
}
