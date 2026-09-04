# Robinhood Chain RPC checks

Zynode includes two read-only network commands.

## `zynode rpc`

The command calls:

- `eth_chainId`
- `eth_blockNumber`
- `eth_gasPrice`

It compares the returned chain ID with the selected Robinhood Chain configuration.

## `zynode contract`

The command calls:

- `eth_getCode`
- `eth_getBalance`
- `eth_getTransactionCount`

No signing methods are used.

## Endpoints

Built-in public endpoints:

```text
mainnet  https://rpc.mainnet.chain.robinhood.com
testnet  https://rpc.testnet.chain.robinhood.com
```

Public endpoints can be rate-limited. A custom endpoint can be supplied with `--rpc-url`.

## Timeouts

Default timeout is 8 seconds. Use `--timeout` with a value from 100 to 60000 milliseconds.
