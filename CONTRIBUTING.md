# Contributing

Zynode Lab is focused on practical Robinhood Chain developer tooling built on standard EVM behavior.

## Before submitting

```bash
npm run ci
npm run release:check
```

## Pull requests

Keep changes small enough to review. Correctness changes should include deterministic tests.

Changes affecting Keccak, RLP, EIP-55, CREATE, or CREATE2 calculations must cite a specification or include cross-implementation fixtures.

Changes to Robinhood Chain network metadata should be verified against official chain documentation.

Do not add wallet key management, seed phrase handling, or embedded service credentials.

## Style

- ES modules
- Node.js 20+
- no runtime dependencies unless there is a strong technical reason
- explicit validation at module boundaries
- JSON output suitable for automation
- human-readable CLI output suitable for terminals
