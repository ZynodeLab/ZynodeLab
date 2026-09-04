# Seed boundaries and algorithmic equivalence

Solana's PDA seed hashing is sequential rather than length-framed. Within one program ID, two seed arrays that concatenate to the same byte sequence can produce the same program address.

This is a protocol property, not a Zynode-specific interpretation. Solana's Rust `Pubkey` documentation warns about equivalent groupings of seed bytes and recommends designing seed schemes that avoid unintended collisions.

## Why a normal PDA checker can miss this

Consider two human-readable recipes:

```text
A: string:alpha | string:beta
B: string:alph  | string:abeta
```

Both contribute the UTF-8 bytes for:

```text
alphabeta
```

The typed recipes differ, and their seed boundaries differ, but the effective user-seed payload is identical. With the same program ID, canonical bump search sees the same byte stream and returns the same PDA.

## Zynode's model

`zynode compare` reports these concepts independently:

- same program ID;
- same concatenated payload bytes;
- same seed boundaries;
- same typed recipe fingerprint;
- same canonical PDA;
- segmentation equivalence.

This separation is useful during client/program reviews because a source-level difference does not always mean a byte-level difference.

## Doctor warning

`zynode doctor` warns when adjacent variable-width seed types appear. The current variable-width types are:

```text
string
base58
hex
```

A warning is not a vulnerability finding. Fixed schemas, explicit separators, fixed-width fields, and program-specific validation may make the design perfectly acceptable. The goal is to surface the boundary so it can be reviewed deliberately.
