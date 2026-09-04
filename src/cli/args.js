const VALUE_OPTIONS = new Map([
  ['-p', 'program'], ['--program', 'program'],
  ['-s', 'seed'], ['--seed', 'seed'],
  ['-t', 'target'], ['--target', 'target'],
  ['--expect', 'expect'],
  ['--left', 'left'],
  ['--right', 'right'],
]);

const BOOLEAN_OPTIONS = new Map([
  ['--json', 'json'],
  ['--help', 'help'], ['-h', 'help'],
  ['--version', 'version'], ['-v', 'version'],
]);

export function parseArgs(argv) {
  const args = { seeds: [], json: false, target: 'kit' };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (BOOLEAN_OPTIONS.has(token)) {
      args[BOOLEAN_OPTIONS.get(token)] = true;
      continue;
    }
    if (VALUE_OPTIONS.has(token)) {
      const key = VALUE_OPTIONS.get(token);
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('-')) throw new Error(`Option ${token} requires a value.`);
      index += 1;
      if (key === 'seed') args.seeds.push(value);
      else args[key] = value;
      continue;
    }
    if (token.startsWith('-')) throw new Error(`Unknown option: ${token}`);
    positionals.push(token);
  }

  return { command: positionals[0] ?? null, args, extraPositionals: positionals.slice(1) };
}
