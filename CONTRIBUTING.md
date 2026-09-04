# Contributing

Zynode Lab is deliberately narrow: exact-byte Solana PDA derivation and diagnostics with no runtime dependencies or network requirement.

## Before opening a change

Run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run ci
```

For changes to derivation, seed encoding, or curve checks, add a deterministic test that would fail without the change.

## Design rules

- Keep the derivation core offline.
- Do not add wallet, RPC, telemetry, analytics, or remote configuration code to `src/`.
- Prefer exact byte behavior over convenience abstractions.
- Preserve the distinction between a typed recipe and its effective concatenated seed payload.
- Generated snippets must reproduce the inspected bytes.
- New seed types need explicit range, width, endian, and failure tests.
- Changes that affect PDA output need a reference to the relevant Solana behavior or a cross-implementation fixture.

## Pull requests

Describe the byte-level behavior that changes. Include a small reproduction when fixing a mismatch. Avoid unrelated formatting churn in correctness-sensitive modules.

## Commit history

Use ordinary chronological commits that describe work actually performed. Do not fabricate authors, dates, contributors, or development history.
