# Recipe format

A Zynode recipe is intentionally small and portable.

```json
{
  "program": "11111111111111111111111111111111",
  "seeds": [
    "string:profile",
    "pubkey:...",
    "u64le:42"
  ]
}
```

## Fields

`program` is a base58 Solana public key that decodes to 32 bytes.

`seeds` is an ordered array using the same `TYPE:VALUE` syntax as the CLI. Seed order is part of the derivation recipe.

Supported types:

```text
string
pubkey
base58
hex
u8
u16le
u16be
u32le
u32be
u64le
u64be
```

## Intentional omissions

The format does not store a bump. Canonical bump selection is derived from the program and user seeds.

The format does not store a PDA. Use `zynode verify` if an expected PDA needs to be asserted.

The format does not include private keys, wallet metadata, RPC URLs, or network names. PDA derivation depends on the program ID and exact seed bytes, not on an RPC cluster label.

## Safety

Recipe files are plain text. Do not place sensitive seed material in a repository merely because it is used as a PDA seed.
