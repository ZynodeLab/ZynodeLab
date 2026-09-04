import { inspectAddress, toChecksumAddress } from '../lib/address.js';
import { predictCreateAddress } from '../lib/create.js';
import { predictCreate2Address } from '../lib/create2.js';
import { diagnoseCreate2 } from '../lib/diagnostics.js';
import { GENERATOR_TARGETS, generateCreate2Code } from '../lib/generators.js';
import { explorerAddressUrl, explorerTransactionUrl, getNetwork } from '../lib/network.js';
import { compareCreate2Recipes, fingerprintRecipe, predictRecipe } from '../lib/recipe.js';
import { inspectContract, probeNetwork } from '../lib/rpc.js';
import { VERSION } from '../version.js';
import { parseArgs } from './args.js';
import { loadRecipe } from './recipes.js';
import { printFindings, printJson, printKeyValues } from './render.js';

function helpText() {
  return `Zynode Lab ${VERSION}\n\nRobinhood Chain deterministic deployment and RPC toolkit.\n\nUSAGE\n  zynode <command> [options]\n\nCOMMANDS\n  network      Show Robinhood Chain network configuration\n  create2      Predict a CREATE2 contract address\n  create       Predict a CREATE contract address from deployer + nonce\n  checksum     Convert an EVM address to EIP-55 checksum form\n  inspect      Inspect and normalize an EVM address\n  verify       Verify an expected CREATE or CREATE2 address\n  doctor       Diagnose a CREATE2 deployment recipe\n  fingerprint  Create a deterministic recipe fingerprint\n  compare      Compare two CREATE2 JSON recipes\n  code         Generate CREATE2 code for Solidity, ethers, Foundry, or Zynode\n  rpc          Probe Robinhood Chain RPC health and chain identity\n  contract     Inspect deployed code, balance, and nonce over RPC\n  explorer     Build Robinhood Chain explorer links\n  help         Show this help\n\nNETWORKS\n  mainnet  Robinhood Chain (chain ID 4663)\n  testnet  Robinhood Chain Testnet (chain ID 46630)\n\nCREATE2 OPTIONS\n  -d, --deployer <ADDRESS>\n  -s, --salt <HEX|utf8:TEXT>\n      --init-code <HEX>\n      --init-code-hash <BYTES32>\n\nCREATE OPTIONS\n  -d, --deployer <ADDRESS>\n  -n, --nonce <DECIMAL|0xHEX>\n\nOTHER OPTIONS\n  -a, --address <ADDRESS>\n      --expect <ADDRESS>\n      --method <create|create2>\n      --network <mainnet|testnet>\n      --rpc-url <URL>\n      --timeout <MILLISECONDS>\n  -t, --target <${GENERATOR_TARGETS.join('|')}>\n      --left <FILE> --right <FILE>\n      --json\n\nEXAMPLES\n  zynode network --network mainnet\n  zynode create2 -d 0x0000000000000000000000000000000000000000 -s 0x00 --init-code 0x00\n  zynode create -d 0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0 -n 1\n  zynode checksum -a 0x52908400098527886e0f7030069857d2e4169ee7\n  zynode rpc --network mainnet\n  zynode contract -a 0x0000000000000000000000000000000000000000 --network testnet\n`;
}

function errorMessage(error) {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
}

function timeoutFromArgs(args) {
  if (!args.timeout) return 8000;
  const value = Number(args.timeout);
  if (!Number.isInteger(value) || value < 100 || value > 60000) throw new Error('--timeout must be an integer between 100 and 60000 milliseconds.');
  return value;
}

function requireValue(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function create2Input(args) {
  return {
    deployer: requireValue(args.deployer, 'CREATE2 requires --deployer.'),
    salt: requireValue(args.salt, 'CREATE2 requires --salt.'),
    initCode: args.initCode,
    initCodeHash: args.initCodeHash,
  };
}

async function networkCommand(args) {
  const n = getNetwork(args.network);
  if (args.json) return printJson(n);
  printKeyValues([
    ['Network', n.name], ['Chain ID', n.chainId], ['Chain ID hex', n.chainIdHex], ['Gas token', n.nativeCurrency.symbol],
    ['Public RPC', n.rpcUrl], ['Explorer', n.explorerUrl], ['Docs', n.docsUrl],
  ]);
  if (n.faucetUrl) printKeyValues([['Faucet', n.faucetUrl]]);
}

async function create2Command(args) {
  const result = predictCreate2Address(create2Input(args));
  if (args.json) return printJson(result);
  printKeyValues([['Address', result.address], ['Deployer', result.deployer], ['Salt', result.salt], ['Init code hash', result.initCodeHash]]);
}

async function createCommand(args) {
  const result = predictCreateAddress(requireValue(args.deployer, 'CREATE requires --deployer.'), requireValue(args.nonce, 'CREATE requires --nonce.'));
  if (args.json) return printJson(result);
  printKeyValues([['Address', result.address], ['Deployer', result.deployer], ['Nonce', result.nonce]]);
}

async function checksumCommand(args) {
  const address = requireValue(args.address, 'checksum requires --address.');
  const result = toChecksumAddress(address);
  if (args.json) printJson({ input: address, address: result });
  else process.stdout.write(`${result}\n`);
}

async function inspectCommand(args) {
  const report = inspectAddress(requireValue(args.address, 'inspect requires --address.'));
  if (args.json) return printJson(report);
  printKeyValues([['Normalized', report.normalized], ['Checksum', report.checksummed], ['Input checksum valid', report.checksumValid ? 'yes' : 'no'], ['Zero address', report.zeroAddress ? 'yes' : 'no'], ['Bytes', report.byteLength]]);
}

async function verifyCommand(args) {
  const expected = toChecksumAddress(requireValue(args.expect, 'verify requires --expect.'));
  const method = String(args.method || (args.nonce !== undefined ? 'create' : 'create2')).toLowerCase();
  const result = method === 'create' ? predictCreateAddress(requireValue(args.deployer, 'verify CREATE requires --deployer.'), requireValue(args.nonce, 'verify CREATE requires --nonce.')) : predictCreate2Address(create2Input(args));
  const match = result.address === expected;
  if (args.json) printJson({ method: result.method, expected, actual: result.address, match });
  else printKeyValues([['Method', result.method], ['Expected', expected], ['Actual', result.address], ['Match', match ? 'yes' : 'no']]);
  return match ? 0 : 2;
}

async function doctorCommand(args) {
  const report = diagnoseCreate2(create2Input(args));
  if (args.json) return printJson(report);
  printKeyValues([['Deployer', report.deployer], ['Salt', report.salt], ['Init code hash', report.initCodeHash], ['Warnings', report.summary.warnings], ['Info', report.summary.info]]);
  process.stdout.write('\n');
  printFindings(report.findings);
}

async function fingerprintCommand(args) {
  const report = fingerprintRecipe(create2Input(args));
  if (args.json) return printJson(report);
  printKeyValues([['Keccak-256', report.keccak256], ['Canonical recipe', report.canonical]]);
}

async function compareCommand(args) {
  if (!args.left || !args.right) throw new Error('compare requires --left <FILE> and --right <FILE>.');
  const [left, right] = await Promise.all([loadRecipe(args.left), loadRecipe(args.right)]);
  const report = compareCreate2Recipes(left, right);
  if (args.json) return printJson(report);
  printKeyValues([['Same deployer', report.sameDeployer ? 'yes' : 'no'], ['Same salt', report.sameSalt ? 'yes' : 'no'], ['Same init code hash', report.sameInitCodeHash ? 'yes' : 'no'], ['Same address', report.sameAddress ? 'yes' : 'no']]);
  process.stdout.write(`\nLEFT   ${report.left.address}\nRIGHT  ${report.right.address}\n`);
}

async function codeCommand(args) {
  process.stdout.write(`${generateCreate2Code(args.target, create2Input(args))}\n`);
}

async function rpcCommand(args) {
  const result = await probeNetwork({ network: args.network, rpcUrl: args.rpcUrl, timeoutMs: timeoutFromArgs(args) });
  if (args.json) return printJson(result);
  printKeyValues([['Network', result.network], ['RPC', result.rpcUrl], ['Chain ID', result.chainId], ['Expected', result.expectedChainId], ['Chain matches', result.chainIdMatches ? 'yes' : 'no'], ['Latest block', result.latestBlock], ['Gas price (wei)', result.gasPriceWei], ['Latency', `${result.latencyMs} ms`]]);
}

async function contractCommand(args) {
  const address = toChecksumAddress(requireValue(args.address, 'contract requires --address.'));
  const result = await inspectContract(address, { network: args.network, rpcUrl: args.rpcUrl, timeoutMs: timeoutFromArgs(args) });
  if (args.json) return printJson(result);
  printKeyValues([['Network', result.network], ['Address', address], ['Contract code', result.hasCode ? 'yes' : 'no'], ['Code size', `${result.codeBytes} bytes`], ['Balance (wei)', result.balanceWei], ['Nonce', result.nonce]]);
}

async function explorerCommand(args) {
  if (args.address) {
    const url = explorerAddressUrl(toChecksumAddress(args.address), args.network);
    if (args.json) printJson({ type: 'address', url }); else process.stdout.write(`${url}\n`);
    return;
  }
  if (args.tx) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(args.tx)) throw new Error('Transaction hash must be 32 bytes.');
    const url = explorerTransactionUrl(args.tx, args.network);
    if (args.json) printJson({ type: 'transaction', url }); else process.stdout.write(`${url}\n`);
    return;
  }
  throw new Error('explorer requires --address or --tx.');
}

export async function runCli(argv) {
  let parsed;
  try { parsed = parseArgs(argv); } catch (error) { errorMessage(error); return 1; }
  const { command, args, extraPositionals } = parsed;
  if (args.version) { process.stdout.write(`${VERSION}\n`); return 0; }
  if (!command || command === 'help' || args.help) { process.stdout.write(helpText()); return 0; }
  if (extraPositionals.length) { errorMessage(new Error(`Unexpected positional arguments: ${extraPositionals.join(' ')}`)); return 1; }
  try {
    switch (command) {
      case 'network': await networkCommand(args); return 0;
      case 'create2': await create2Command(args); return 0;
      case 'create': await createCommand(args); return 0;
      case 'checksum': await checksumCommand(args); return 0;
      case 'inspect': await inspectCommand(args); return 0;
      case 'verify': return await verifyCommand(args);
      case 'doctor': await doctorCommand(args); return 0;
      case 'fingerprint': await fingerprintCommand(args); return 0;
      case 'compare': await compareCommand(args); return 0;
      case 'code': await codeCommand(args); return 0;
      case 'rpc': await rpcCommand(args); return 0;
      case 'contract': await contractCommand(args); return 0;
      case 'explorer': await explorerCommand(args); return 0;
      default: errorMessage(new Error(`Unknown command: ${command}. Run "zynode help".`)); return 1;
    }
  } catch (error) { errorMessage(error); return 1; }
}
