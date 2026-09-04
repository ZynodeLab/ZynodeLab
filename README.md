# Zynode Lab

Zynode Lab is an offline, zero-runtime-dependency Solana PDA engineering tool. It is built for the part of PDA work that usually causes bugs: exact seed bytes, canonical bump selection, cross-language encoding, and seed schemes that look different in source code but hash to the same effective payload.

The repository ships a CLI and reusable ES modules. It does not contain a website, wallet connector, RPC client, database, telemetry SDK, or hosted API.

## What makes it useful

Most PDA utilities stop after printing an address. Zynode Lab can also:

- derive canonical PDAs and bumps;
- display exact bytes for typed seed inputs;
- trace rejected on-curve bump candidates until the canonical bump is found;
- inspect all 256 bump values;
- verify a known PDA with a CI-friendly exit code;
- detect Unicode normalization differences in string seeds;
- warn about adjacent variable-width seed boundaries;
- compare two PDA recipes and prove when different seed segmentations produce the same effective payload;
- create two fingerprints: one for the typed recipe and one for the bytes that actually reach the PDA hash;
- generate matching Solana Kit, web3.js, Rust, and Anchor snippets.

## Requirements

Node.js 20 or newer.

## Install from source

```bash
git clone <your-repository-url>
cd zynode-lab
npm ci
npm test
npm link
```

After `npm link`, run:

```bash
zynode help
```

You can also use the CLI directly:

```bash
node src/cli.js help
```

## Quick start

### Derive

```bash
zynode derive \
  --program 11111111111111111111111111111111 \
  --seed string:helloWorld
```

Expected deterministic fixture:

```text
PDA   46GZzzetjCURsdFPb7rcnspbEMnCBXe9kpjrsZAkKb6X
Bump  254
```

### Inspect exact seed bytes

```bash
zynode inspect --seed u64le:12345
```

```text
Type    u64 LE
Length  8 bytes
Width   fixed
Hex     39 30 00 00 00 00 00 00
```

### Trace canonical bump search

```bash
zynode trace \
  -p 11111111111111111111111111111111 \
  -s string:helloWorld
```

The trace includes every candidate digest from bump 255 down to the first off-curve address. This is useful when debugging a client that reports the wrong bump or when validating a custom PDA implementation.

### Verify a PDA in CI

```bash
zynode verify \
  -p 11111111111111111111111111111111 \
  -s string:helloWorld \
  --expect 46GZzzetjCURsdFPb7rcnspbEMnCBXe9kpjrsZAkKb6X
```

Exit status is `0` for a match and `2` for a mismatch.

### Run the recipe doctor

```bash
zynode doctor \
  -p 11111111111111111111111111111111 \
  -s string:profile \
  -s string:user
```

The doctor checks encoding and schema footguns. It does not claim a PDA is insecure. It points out byte-level conditions that deserve review.

### Compare two recipes

```bash
zynode compare \
  --left examples/segmentation-a.json \
  --right examples/segmentation-b.json
```

The bundled examples deliberately use different seed boundaries that concatenate to the same bytes. Zynode reports whether the program, effective payload, typed recipe, canonical PDA, and seed boundaries match.

### Fingerprint a derivation recipe

```bash
zynode fingerprint \
  -p 11111111111111111111111111111111 \
  -s string:profile \
  -s u64le:42
```

Zynode emits:

- `zynode-recipe-v1`: identifies the typed seed recipe, including type, endian choice, textual value, and exact bytes;
- `zynode-payload-v1`: identifies the program ID plus concatenated user seed bytes, intentionally ignoring seed segmentation.

These fingerprints are Zynode metadata, not Solana addresses and not a replacement for the canonical PDA.

## Seed syntax

Repeat `--seed` for each seed, in order.

```text
string:user
pubkey:7x...
base58:3MN5...
hex:deadbeef
u8:7
u16le:500
u16be:500
u32le:123456
u32be:123456
u64le:12345
u64be:12345
```

Each user seed is limited to 32 bytes. Canonical derivation accepts at most 15 user seeds because the one-byte bump occupies the final seed slot.

## JSON recipe format

`compare` reads small portable JSON recipes:

```json
{
  "program": "11111111111111111111111111111111",
  "seeds": [
    "string:profile",
    "u64le:42"
  ]
}
```

See [`docs/recipe-format.md`](docs/recipe-format.md).

## Machine-readable output

Commands that produce structured results support `--json`:

```bash
zynode trace \
  -p 11111111111111111111111111111111 \
  -s string:helloWorld \
  --json
```

This makes Zynode suitable for scripts, test harnesses, release checks, and editor integrations.

## Code generation

```bash
zynode code \
  -p 11111111111111111111111111111111 \
  -s string:user \
  --target rust
```

Targets:

```text
kit
web3
rust
anchor
```

For non-string seeds, generated snippets prefer exact byte arrays. This keeps the output faithful to the inspected recipe even when a framework has several higher-level encoding helpers.

## Library usage

```js
import {
  diagnoseRecipe,
  findProgramAddress,
  normalizeRecipe,
} from 'zynode-lab';

const recipe = normalizeRecipe({
  program: '11111111111111111111111111111111',
  seeds: ['string:profile', 'u64le:42'],
});

const result = await findProgramAddress(
  recipe.seeds.map((seed) => seed.bytes),
  recipe.program,
);

const diagnostics = await diagnoseRecipe(recipe);

console.log(result.address, result.bump);
console.log(diagnostics.findings);
```

## Why seed boundaries matter

Solana hashes PDA seeds sequentially. Seed boundaries are not length-framed in the PDA hash input. For a single program ID, different seed arrays can therefore be algorithmically equivalent when their concatenated bytes are identical. Solana's Rust documentation explicitly warns about this class of collision.

Zynode's `doctor` and `compare` commands make that property visible instead of treating every seed list as a distinct byte payload.

See [`docs/seed-boundaries.md`](docs/seed-boundaries.md).

## Repository structure

```text
zynode-lab/
├── src/
│   ├── cli.js
│   ├── cli/
│   │   ├── args.js
│   │   ├── recipes.js
│   │   ├── render.js
│   │   └── run.js
│   ├── version.js
│   └── lib/
│       ├── base58.js
│       ├── bytes.js
│       ├── diagnostics.js
│       ├── ed25519.js
│       ├── errors.js
│       ├── generators.js
│       ├── hash.js
│       ├── index.js
│       ├── pda.js
│       ├── recipe.js
│       └── seeds.js
├── examples/
├── tests/
├── scripts/
├── docs/
└── .github/
```

## Development

```bash
npm run check
npm test
npm run smoke
npm run doctor:fixture
npm run compare:fixture
npm run ci
npm run release:check
```

The test suite uses Node's built-in test runner. The runtime package has no npm dependencies.

## Security model

Zynode performs local deterministic computation. It never needs a private key, seed phrase, wallet connection, or RPC endpoint. Do not put secrets into CLI arguments or example recipes. PDA seeds can themselves be sensitive depending on the application.

Correctness risks are concentrated in byte encoding, Ed25519 curve rejection, canonical bump selection, and generated-code fidelity. See [`SECURITY.md`](SECURITY.md).

## Documentation

- [`docs/algorithm.md`](docs/algorithm.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/seed-boundaries.md`](docs/seed-boundaries.md)
- [`docs/recipe-format.md`](docs/recipe-format.md)
- [`docs/release-checklist.md`](docs/release-checklist.md)

## References

- Solana PDA documentation: https://solana.com/docs/core/pda
- Solana SDK `Pubkey` documentation: https://docs.rs/solana-sdk/latest/solana_sdk/pubkey/struct.Pubkey.html

## License

MIT. See [`LICENSE`](LICENSE).
