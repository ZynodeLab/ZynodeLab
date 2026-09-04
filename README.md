# Zynode Lab

Zynode Lab is a zero-runtime-dependency command-line toolkit for **Robinhood Chain** developers. It focuses on deterministic EVM contract deployment, exact CREATE and CREATE2 address prediction, recipe diagnostics, EIP-55 checksums, explorer links, and optional JSON-RPC checks against Robinhood Chain mainnet or testnet.

The tool is designed to be useful in deployment scripts, CI, audits, release checklists, and local development without requiring a wallet or private key.

> Zynode Lab is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by Robinhood Markets, Inc. or its affiliates.

## Robinhood Chain network support

| Network | Chain ID | Gas token | Public RPC | Explorer |
| --- | ---: | --- | --- | --- |
| Robinhood Chain | `4663` | ETH | `https://rpc.mainnet.chain.robinhood.com` | `https://robinhoodchain.blockscout.com` |
| Robinhood Chain Testnet | `46630` | ETH | `https://rpc.testnet.chain.robinhood.com` | `https://explorer.testnet.chain.robinhood.com` |

Robinhood Chain is an Ethereum-compatible Layer 2 built on Arbitrum technology. Zynode uses standard EVM address rules, which means deterministic CREATE and CREATE2 calculations can be performed locally and then checked against Robinhood Chain when needed.

## What it does

- predicts CREATE addresses from deployer + nonce;
- predicts CREATE2 addresses from deployer + salt + init code or init code hash;
- implements Keccak-256 locally with test vectors;
- implements the RLP path required by CREATE address derivation;
- converts and validates EIP-55 addresses;
- verifies predicted addresses with CI-friendly exit codes;
- diagnoses common CREATE2 input mistakes;
- fingerprints canonical deployment recipes;
- compares two CREATE2 recipes;
- generates deployment-address code for Solidity, ethers, Foundry, and this package;
- prints canonical Robinhood Chain network configuration;
- probes public or custom JSON-RPC endpoints;
- inspects deployed code, balance, and nonce for an address;
- builds mainnet and testnet explorer links;
- works with no runtime npm dependencies.

## Requirements

- Node.js 20 or newer

## Install

Run directly from a clone:

```bash
npm install
npm test
node src/cli.js help
```

Install the CLI globally from the repository:

```bash
npm install -g .
zynode help
```

## Quick start

### Show Robinhood Chain configuration

```bash
zynode network --network mainnet
```

Example output:

```text
Network       Robinhood Chain
Chain ID      4663
Chain ID hex  0x1237
Gas token     ETH
Public RPC    https://rpc.mainnet.chain.robinhood.com
Explorer      https://robinhoodchain.blockscout.com
```

### Predict a CREATE2 address

```bash
zynode create2 \
  --deployer 0x0000000000000000000000000000000000000000 \
  --salt 0x00 \
  --init-code 0x00
```

Expected address for this standard EIP-1014 vector:

```text
0x4D1A2e2bB4F88F0250f26Ffff098B0b30B26BF38
```

A salt shorter than 32 bytes is left-padded. Text salts are explicit:

```bash
zynode create2 \
  --deployer 0x1111111111111111111111111111111111111111 \
  --salt utf8:zynode-v1 \
  --init-code-hash 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Predict a CREATE address

```bash
zynode create \
  --deployer 0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0 \
  --nonce 1
```

CREATE prediction uses:

```text
keccak256(rlp([deployer, nonce]))[12:]
```

### Checksum an address

```bash
zynode checksum \
  --address 0x52908400098527886e0f7030069857d2e4169ee7
```

### Verify a predicted address in CI

```bash
zynode verify \
  --method create2 \
  --deployer 0x0000000000000000000000000000000000000000 \
  --salt 0x00 \
  --init-code 0x00 \
  --expect 0x4D1A2e2bB4F88F0250f26Ffff098B0b30B26BF38
```

Exit code is `0` for a match and `2` for an address mismatch.

### Diagnose a CREATE2 recipe

```bash
zynode doctor \
  --deployer 0x0000000000000000000000000000000000000000 \
  --salt 0x00 \
  --init-code 0x00
```

The doctor reports conditions such as a zero deployer, all-zero salt, empty init code, explicit UTF-8 salt handling, short-salt padding, and checksum normalization.

### Generate code

```bash
zynode code \
  --target solidity \
  --deployer 0x1111111111111111111111111111111111111111 \
  --salt 0x01 \
  --init-code 0x60006000
```

Targets:

```text
solidity
ethers
foundry
node
```

### Probe Robinhood Chain RPC

```bash
zynode rpc --network mainnet
```

This requests `eth_chainId`, `eth_blockNumber`, and `eth_gasPrice`, then verifies the returned chain ID against the built-in Robinhood Chain configuration.

Public endpoints are rate-limited. For sustained production use, pass a provider endpoint:

```bash
zynode rpc \
  --network mainnet \
  --rpc-url https://YOUR_PROVIDER_ENDPOINT
```

### Inspect an address on-chain

```bash
zynode contract \
  --network mainnet \
  --address 0x1111111111111111111111111111111111111111
```

The command reads code, balance, and nonce only. It never signs or sends a transaction.

### Build explorer links

```bash
zynode explorer --network mainnet --address 0x1111111111111111111111111111111111111111
```

or:

```bash
zynode explorer --network testnet --tx 0xYOUR_32_BYTE_TX_HASH
```

## JSON output

Most commands support `--json`:

```bash
zynode create2 \
  --deployer 0x0000000000000000000000000000000000000000 \
  --salt 0x00 \
  --init-code 0x00 \
  --json
```

Big integers are serialized as decimal strings, making output safe for shells and JSON processors.

## Library API

The repository can also be used as an ES module:

```js
import {
  predictCreate2Address,
  getNetwork,
  toChecksumAddress,
} from 'zynode-lab';

const deployment = predictCreate2Address({
  deployer: '0x0000000000000000000000000000000000000000',
  salt: '0x00',
  initCode: '0x00',
});

console.log(deployment.address);
console.log(getNetwork('mainnet').chainId);
console.log(toChecksumAddress(deployment.address));
```

Exports are also available as:

```text
zynode-lab/address
zynode-lab/create
zynode-lab/create2
zynode-lab/network
zynode-lab/rpc
zynode-lab/generators
```

## CREATE2 formula

Zynode follows the standard EVM CREATE2 preimage:

```text
0xff ++ deployer ++ salt(bytes32) ++ keccak256(init_code)
```

The final contract address is the last 20 bytes of the Keccak-256 digest.

Zynode accepts either the full initialization code or an already-computed 32-byte init code hash. If both are provided, the tool verifies that they match.

## Recipe files

A CREATE2 recipe can be stored as JSON:

```json
{
  "method": "CREATE2",
  "deployer": "0x0000000000000000000000000000000000000000",
  "salt": "0x00",
  "initCode": "0x00"
}
```

See [`docs/recipe-format.md`](docs/recipe-format.md).

Compare two recipes:

```bash
zynode compare \
  --left examples/create2.json \
  --right examples/create2-alt.json
```

## Security model

Zynode is not a wallet and does not need:

- private keys;
- seed phrases;
- transaction signatures;
- custody permissions;
- signing RPC methods.

Local derivation commands do not make network requests. `rpc` and `contract` are read-only network commands and accept a custom endpoint.

For correctness-sensitive code, the test suite includes standard Keccak-256 vectors, EIP-55 checksum vectors, EIP-1014 CREATE2 vectors, and known CREATE address fixtures.

See [`SECURITY.md`](SECURITY.md).

## Repository layout

```text
src/
  cli.js
  cli/
    args.js
    recipes.js
    render.js
    run.js
  lib/
    address.js
    bytes.js
    create.js
    create2.js
    diagnostics.js
    generators.js
    index.js
    keccak.js
    network.js
    recipe.js
    rlp.js
    rpc.js

tests/
examples/
docs/
scripts/
.github/workflows/
```

## Development

```bash
npm run check
npm test
npm run smoke
npm run ci
npm run release:check
```

The repository intentionally has no runtime dependencies. This keeps the derivation surface small and makes releases easy to audit.

## Reference material

- Robinhood Chain documentation: `https://docs.robinhood.com/chain`
- Robinhood Chain network connection guide: `https://docs.robinhood.com/chain/connecting/`
- Robinhood Chain deployment guide: `https://docs.robinhood.com/chain/deploy-smart-contracts/`
- EIP-1014 CREATE2 specification: `https://eips.ethereum.org/EIPS/eip-1014`
- Ethereum RLP documentation: `https://ethereum.org/developers/docs/data-structures-and-encoding/rlp/`

## License

MIT. See [`LICENSE`](LICENSE).
