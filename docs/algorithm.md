# Deterministic EVM address algorithms

Zynode Lab implements two deterministic contract-address paths used by EVM chains, including Robinhood Chain.

## CREATE

The CREATE address is derived from the deployer address and deployer nonce:

```text
address = last20(keccak256(rlp([deployer, nonce])))
```

The deployer is exactly 20 bytes. The nonce is encoded as a canonical non-negative RLP integer.

## CREATE2

CREATE2 removes nonce dependence and adds a caller-selected 32-byte salt plus the hash of initialization code:

```text
address = last20(
  keccak256(
    0xff ++ deployer ++ salt ++ keccak256(init_code)
  )
)
```

The final CREATE2 preimage is exactly 85 bytes:

```text
1 byte   0xff domain separator
20 bytes deployer
32 bytes salt
32 bytes init code hash
```

A shorter hex salt supplied to the CLI is left-padded to 32 bytes. `utf8:TEXT` is UTF-8 encoded and then left-padded. Inputs larger than 32 bytes are rejected.

## Keccak-256

EVM address derivation uses Keccak-256, not standardized SHA3-256. The implementation in `src/lib/keccak.js` uses a 1600-bit state, 1088-bit rate, Keccak padding suffix `0x01`, and 24 Keccak-f rounds.

The test suite contains well-known empty-string and `abc` vectors.

## Checksummed addresses

Display addresses use EIP-55 mixed-case checksums. Derivation operates on raw 20-byte addresses, so casing does not affect the result.

## Chain relationship

CREATE and CREATE2 are EVM rules and do not include chain ID in their preimages. This means the same deployment inputs can produce the same address on multiple EVM chains. Zynode's Robinhood Chain integration is used for network configuration, explorer links, and optional RPC verification.
