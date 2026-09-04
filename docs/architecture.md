# Architecture

Zynode Lab separates pure deterministic computation from optional network access.

```text
CLI parsing/rendering
        |
        v
Pure EVM modules
  address / RLP / Keccak
  CREATE / CREATE2
  recipe / diagnostics
        |
        +------> code generators
        |
        +------> Robinhood Chain config
                    |
                    v
              optional JSON-RPC
```

## Pure modules

`address.js` handles 20-byte EVM addresses and EIP-55 checksums.

`keccak.js` implements Keccak-256 locally with no package dependency.

`rlp.js` implements the canonical encoding needed for CREATE address derivation.

`create.js` predicts addresses derived by CREATE.

`create2.js` normalizes salts and init code hashes, constructs the fixed CREATE2 preimage, and predicts addresses.

`diagnostics.js` identifies suspicious or easy-to-misread CREATE2 inputs.

`recipe.js` canonicalizes recipes and provides deterministic fingerprints/comparison.

## Network modules

`network.js` is the single source of truth for Robinhood Chain mainnet and testnet metadata.

`rpc.js` uses Node's built-in `fetch` for read-only JSON-RPC calls. It does not sign transactions or require wallet material.

## Failure behavior

Invalid local input fails before hashing. RPC failures return concise errors without printing secrets or response bodies that may contain provider metadata.

The `verify` command returns exit code `2` for a valid computation that does not match the expected address. Input and operational errors return exit code `1`.
