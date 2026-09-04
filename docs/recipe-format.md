# Recipe format

Zynode recipes are small JSON objects used for reproducible deterministic deployment checks.

## CREATE2

```json
{
  "method": "CREATE2",
  "deployer": "0x0000000000000000000000000000000000000000",
  "salt": "0x00",
  "initCode": "0x00"
}
```

`deployer` must be a 20-byte EVM address.

`salt` may be hexadecimal or `utf8:TEXT`. Zynode normalizes it to 32 bytes by left-padding.

Provide `initCode`, `initCodeHash`, or both. If both are present, `keccak256(initCode)` must equal `initCodeHash`.

## CREATE

```json
{
  "method": "CREATE",
  "deployer": "0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0",
  "nonce": "1"
}
```

Nonce may be stored as a decimal string or a `0x`-prefixed hexadecimal string.

## Fingerprint

The CREATE2 fingerprint command canonicalizes the recipe and hashes the canonical JSON with Keccak-256. The fingerprint is Zynode metadata and is not part of the EVM protocol.

## Security

Recipes are plain text. They should never contain private keys, seed phrases, API keys, or credentials. Deterministic deployment calculations only require public deployment inputs.
