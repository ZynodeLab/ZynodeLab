import { compareRecipes, diagnoseRecipe } from '../lib/diagnostics.js';
import { generateCode } from '../lib/generators.js';
import { exploreBumps, findProgramAddress, traceProgramAddress } from '../lib/pda.js';
import { fingerprintPayload, fingerprintRecipe, recipeFromCli } from '../lib/recipe.js';
import { inspectSeed, parseSeedSpec } from '../lib/seeds.js';
import { VERSION } from '../version.js';
import { parseArgs } from './args.js';
import { loadRecipe } from './recipes.js';
import { printFindings, printJson, printKeyValues, renderPreparedSeeds } from './render.js';

const TARGETS = new Set(['kit', 'web3', 'rust', 'anchor']);

function helpText() {
  return `Zynode Lab ${VERSION}\n\nExact-byte Solana PDA derivation and recipe diagnostics.\n\nUSAGE\n  zynode <command> [options]\n\nCOMMANDS\n  derive       Derive the canonical PDA and bump\n  inspect      Inspect one seed's exact byte representation\n  bumps        Evaluate all 256 bump candidates\n  trace        Show each rejected bump until the canonical PDA is found\n  verify       Assert that a recipe derives an expected PDA\n  doctor       Diagnose encoding, Unicode, and seed-boundary footguns\n  fingerprint  Fingerprint the typed recipe and its effective byte payload\n  compare      Compare two JSON recipes, including segmentation equivalence\n  code         Generate matching Solana Kit, web3.js, Rust, or Anchor code\n  help         Show this help\n\nCOMMON OPTIONS\n  -p, --program <PUBKEY>       Solana program ID\n  -s, --seed <TYPE:VALUE>      Seed. Repeat for multiple seeds\n  --json                       Print machine-readable JSON\n\nCOMMAND OPTIONS\n  verify  --expect <PUBKEY>\n  compare --left <FILE> --right <FILE>\n  code    --target <kit|web3|rust|anchor>\n\nSEED TYPES\n  string, pubkey, base58, hex, u8, u16le, u16be, u32le, u32be, u64le, u64be\n\nEXAMPLES\n  zynode derive -p 11111111111111111111111111111111 -s string:helloWorld\n  zynode trace -p 11111111111111111111111111111111 -s string:helloWorld\n  zynode doctor -p 11111111111111111111111111111111 -s string:profile -s string:user\n  zynode verify -p 11111111111111111111111111111111 -s string:helloWorld --expect 46GZzzetjCURsdFPb7rcnspbEMnCBXe9kpjrsZAkKb6X\n  zynode compare --left examples/segmentation-a.json --right examples/segmentation-b.json\n`;
}

function writeError(message) {
  process.stderr.write(`Error: ${message}\n`);
}

function requireProgram(program) {
  if (!program) throw new Error('A program ID is required. Use --program <PUBKEY>.');
}

function prepareRecipe(args) {
  requireProgram(args.program);
  return recipeFromCli(args.program, args.seeds);
}

async function deriveCommand(args) {
  const recipe = prepareRecipe(args);
  const result = await findProgramAddress(recipe.seeds.map((seed) => seed.bytes), recipe.program);
  const payload = {
    program: recipe.program,
    seeds: renderPreparedSeeds(recipe.seeds),
    pda: result.address,
    bump: result.bump,
    digestHex: result.digestHex,
  };
  if (args.json) printJson(payload);
  else printKeyValues([['PDA', result.address], ['Bump', String(result.bump)]]);
}

async function inspectCommand(args) {
  if (args.seeds.length !== 1) throw new Error('inspect requires exactly one --seed.');
  const seed = parseSeedSpec(args.seeds[0]);
  const report = inspectSeed(seed);
  if (!report.valid) throw new Error(report.error);
  const payload = {
    type: seed.type,
    endian: seed.endian ?? null,
    value: seed.value,
    byteLength: report.byteLength,
    bytes: [...report.bytes],
    hex: report.hex,
    variableWidth: report.variableWidth,
  };
  if (args.json) printJson(payload);
  else printKeyValues([
    ['Type', `${payload.type}${payload.endian ? ` ${payload.endian.toUpperCase()}` : ''}`],
    ['Length', `${payload.byteLength} byte${payload.byteLength === 1 ? '' : 's'}`],
    ['Width', payload.variableWidth ? 'variable' : 'fixed'],
    ['Hex', payload.hex || '(empty)'],
  ]);
}

async function bumpsCommand(args) {
  const recipe = prepareRecipe(args);
  const result = await exploreBumps(recipe.seeds.map((seed) => seed.bytes), recipe.program);
  if (args.json) {
    printJson({ program: recipe.program, seeds: renderPreparedSeeds(recipe.seeds), ...result });
    return;
  }
  printKeyValues([
    ['Canonical bump', result.canonical?.bump ?? 'none'],
    ['Canonical PDA', result.canonical?.address ?? 'none'],
  ]);
  process.stdout.write('\nBUMP  STATUS     CANDIDATE\n');
  for (const row of result.results) {
    process.stdout.write(`${String(row.bump).padStart(3)}   ${(row.valid ? 'valid' : 'on-curve').padEnd(9)}  ${row.candidateAddress}\n`);
  }
}

async function traceCommand(args) {
  const recipe = prepareRecipe(args);
  const result = await traceProgramAddress(recipe.seeds.map((seed) => seed.bytes), recipe.program);
  const payload = {
    program: recipe.program,
    seeds: renderPreparedSeeds(recipe.seeds),
    marker: result.marker,
    canonical: result.canonical,
    attempts: result.attempts,
  };
  if (args.json) {
    printJson(payload);
    return;
  }
  printKeyValues([
    ['Canonical PDA', result.canonical.address],
    ['Canonical bump', String(result.canonical.bump)],
    ['Attempts', String(result.attempts.length)],
  ]);
  process.stdout.write('\nBUMP  STATUS     SHA-256 DIGEST\n');
  for (const attempt of result.attempts) {
    process.stdout.write(`${String(attempt.bump).padStart(3)}   ${attempt.status.padEnd(9)}  ${attempt.digestHex}\n`);
  }
}

async function verifyCommand(args) {
  if (!args.expect) throw new Error('verify requires --expect <PDA>.');
  const recipe = prepareRecipe(args);
  const result = await findProgramAddress(recipe.seeds.map((seed) => seed.bytes), recipe.program);
  const match = result.address === args.expect;
  const payload = { expected: args.expect, actual: result.address, bump: result.bump, match };
  if (args.json) printJson(payload);
  else printKeyValues([
    ['Expected', args.expect],
    ['Actual', result.address],
    ['Bump', String(result.bump)],
    ['Match', match ? 'yes' : 'no'],
  ]);
  return match ? 0 : 2;
}

async function doctorCommand(args) {
  const recipe = prepareRecipe(args);
  const report = await diagnoseRecipe(recipe);
  if (args.json) {
    printJson(report);
    return;
  }
  printKeyValues([
    ['PDA', report.canonicalPda],
    ['Bump', String(report.canonicalBump)],
    ['Recipe fingerprint', report.recipeFingerprint.base58],
    ['Payload fingerprint', report.payloadFingerprint.base58],
    ['Warnings', String(report.summary.warnings)],
  ]);
  process.stdout.write('\n');
  printFindings(report.findings);
}

async function fingerprintCommand(args) {
  const recipe = prepareRecipe(args);
  const [typed, payload, pda] = await Promise.all([
    fingerprintRecipe(recipe),
    fingerprintPayload(recipe),
    findProgramAddress(recipe.seeds.map((seed) => seed.bytes), recipe.program),
  ]);
  const report = { program: recipe.program, pda: pda.address, bump: pda.bump, typedRecipe: typed, effectivePayload: payload };
  if (args.json) printJson(report);
  else printKeyValues([
    ['PDA', pda.address],
    ['Bump', String(pda.bump)],
    ['Typed recipe', typed.base58],
    ['Effective payload', payload.base58],
  ]);
}

async function compareCommand(args) {
  if (!args.left || !args.right) throw new Error('compare requires --left <FILE> and --right <FILE>.');
  const [left, right] = await Promise.all([loadRecipe(args.left), loadRecipe(args.right)]);
  const report = await compareRecipes(left, right);
  if (args.json) {
    printJson(report);
    return;
  }
  printKeyValues([
    ['Same program', report.sameProgram ? 'yes' : 'no'],
    ['Same payload bytes', report.samePayloadBytes ? 'yes' : 'no'],
    ['Same boundaries', report.sameSeedBoundaries ? 'yes' : 'no'],
    ['Same typed recipe', report.sameTypedRecipe ? 'yes' : 'no'],
    ['Same canonical PDA', report.sameCanonicalPda ? 'yes' : 'no'],
    ['Segmentation equivalent', report.segmentationEquivalent ? 'yes' : 'no'],
  ]);
  process.stdout.write('\nLEFT\n');
  printKeyValues([['PDA', report.left.pda], ['Bump', String(report.left.bump)], ['Boundaries', report.left.seedBoundaries.join(', ') || '(none)']]);
  process.stdout.write('\nRIGHT\n');
  printKeyValues([['PDA', report.right.pda], ['Bump', String(report.right.bump)], ['Boundaries', report.right.seedBoundaries.join(', ') || '(none)']]);
}

async function codeCommand(args) {
  const recipe = prepareRecipe(args);
  if (!TARGETS.has(args.target)) throw new Error(`Unsupported target: ${args.target}. Use kit, web3, rust, or anchor.`);
  process.stdout.write(`${generateCode(args.target, recipe.program, recipe.seeds)}\n`);
}

export async function runCli(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const { command, args, extraPositionals } = parsed;
  if (args.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (!command || command === 'help' || args.help) {
    process.stdout.write(helpText());
    return 0;
  }
  if (extraPositionals.length > 0) {
    writeError(`Unexpected positional arguments: ${extraPositionals.join(' ')}`);
    return 1;
  }

  try {
    switch (command) {
      case 'derive': await deriveCommand(args); return 0;
      case 'inspect': await inspectCommand(args); return 0;
      case 'bumps': await bumpsCommand(args); return 0;
      case 'trace': await traceCommand(args); return 0;
      case 'verify': return await verifyCommand(args);
      case 'doctor': await doctorCommand(args); return 0;
      case 'fingerprint': await fingerprintCommand(args); return 0;
      case 'compare': await compareCommand(args); return 0;
      case 'code': await codeCommand(args); return 0;
      default:
        writeError(`Unknown command: ${command}. Run "zynode help".`);
        return 1;
    }
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
