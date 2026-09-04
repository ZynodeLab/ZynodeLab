# Architecture

Zynode Lab separates command-line concerns from byte-level PDA logic so the derivation engine can be used independently.

```text
src/cli.js
  └─ cli/run.js
      ├─ cli/args.js
      ├─ cli/recipes.js
      ├─ cli/render.js
      └─ lib/*

lib/seeds.js       typed seed syntax -> bytes
lib/recipe.js      recipe normalization + dual fingerprints
lib/diagnostics.js schema/encoding diagnostics + recipe comparison
lib/pda.js         candidate hash, curve check, canonical bump search
lib/ed25519.js     compressed Ed25519 point validity
lib/base58.js      Solana-style base58 codec
lib/bytes.js       byte framing, equality, boundaries, hex
lib/hash.js        SHA-256 wrapper
lib/generators.js  code output for four targets
```

## Data flow

For ordinary derivation:

1. CLI seed strings are parsed into typed seed descriptors.
2. Each descriptor is encoded into a `Uint8Array`.
3. The recipe validates the program ID and the user-seed count.
4. `findProgramAddress` appends bump candidates from 255 down to 0.
5. Every candidate is hashed using the Solana PDA preimage shape.
6. On-curve digests are rejected.
7. The first off-curve digest becomes the canonical PDA.

The CLI never implements PDA math itself. It only prepares input and renders output.

## Two fingerprints, two meanings

Zynode deliberately keeps two hashes because a typed recipe and its effective PDA byte payload are not the same concept.

`zynode-recipe-v1` frames the program, seed type, endian label, original textual value, byte length, and bytes. It changes if a developer rewrites the same bytes using a different seed type.

`zynode-payload-v1` hashes the program plus concatenated user seed bytes. It intentionally ignores seed boundaries. Two recipes with the same payload fingerprint are algorithmically equivalent for canonical PDA derivation when the program ID is also the same.

Neither fingerprint is part of the Solana protocol.

## Offline boundary

Production source contains no HTTP client, RPC client, telemetry code, wallet SDK, or remote configuration. `scripts/check.mjs` enforces that boundary with a static source check in addition to syntax and package validation.
