const VALUE_OPTIONS = new Map([
  ['-d', 'deployer'], ['--deployer', 'deployer'],
  ['-n', 'nonce'], ['--nonce', 'nonce'],
  ['-s', 'salt'], ['--salt', 'salt'],
  ['--init-code', 'initCode'], ['--init-code-hash', 'initCodeHash'],
  ['--expect', 'expect'], ['--method', 'method'],
  ['-a', 'address'], ['--address', 'address'],
  ['--tx', 'tx'], ['--network', 'network'], ['--rpc-url', 'rpcUrl'],
  ['--timeout', 'timeout'], ['-t', 'target'], ['--target', 'target'],
  ['--left', 'left'], ['--right', 'right'], ['--recipe', 'recipe'],
]);
const BOOLEAN_OPTIONS = new Map([
  ['--json', 'json'], ['--help', 'help'], ['-h', 'help'], ['--version', 'version'], ['-v', 'version'],
]);

export function parseArgs(argv) {
  const args = { json: false, network: 'mainnet', target: 'solidity' };
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
      if (value === undefined || value.startsWith('--')) throw new Error(`Option ${token} requires a value.`);
      index += 1;
      args[key] = value;
      continue;
    }
    if (token.startsWith('-')) throw new Error(`Unknown option: ${token}`);
    positionals.push(token);
  }
  return { command: positionals[0] ?? null, args, extraPositionals: positionals.slice(1) };
}
