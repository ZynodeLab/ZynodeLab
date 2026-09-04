# Security policy

Zynode Lab is a deterministic deployment and read-only network inspection tool for Robinhood Chain.

## Security boundaries

The project does not require or process private keys, seed phrases, signing payloads, or wallet credentials. Do not add secrets to CLI arguments, recipes, fixtures, issue reports, or logs.

Correctness-sensitive areas include:

- Keccak-256 permutation and padding;
- RLP integer/list encoding;
- EIP-55 checksum generation;
- CREATE deployer/nonce derivation;
- CREATE2 salt width and init-code hashing;
- JSON-RPC chain identity checks.

## Reporting

Use GitHub private vulnerability reporting when available. Include the affected version or commit, minimal public inputs, expected result, actual result, and an independent reference implementation when possible.

Do not include API keys or provider credentials in reports.

## RPC note

Built-in Robinhood Chain public RPC endpoints are read-only destinations chosen for convenience. Users can pass `--rpc-url` to use their own infrastructure. Provider availability and rate limits are outside Zynode's control.
