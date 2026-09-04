# PDA algorithm notes

A Solana Program Derived Address is computed from ordered seed bytes and a program ID, then rejected if the resulting 32-byte hash can be decompressed as an Ed25519 curve point.

## Candidate construction

For a specific seed list:

1. Validate no seed is longer than 32 bytes.
2. Validate no more than 16 total seeds are supplied.
3. Decode the program ID to exactly 32 bytes.
4. Hash each seed in order.
5. Hash the program ID and the bytes of `ProgramDerivedAddress` after the seeds.
6. Interpret the 32-byte SHA-256 result as a compressed Ed25519 point candidate.
7. Reject the candidate if it is on-curve.
8. Encode an off-curve digest as base58 to obtain the PDA.

Zynode's implementation builds the same effective concatenated SHA-256 preimage in one byte buffer. SHA-256 streaming updates and hashing the concatenated bytes are equivalent.

## Canonical bump

Canonical derivation adds a one-byte bump as the last seed. Search starts at 255 and decrements until an off-curve candidate is found.

Because the bump occupies one of Solana's 16 seed slots, Zynode permits at most 15 user seeds in canonical derivation mode.

`zynode trace` stops at the first valid bump and reports every preceding rejected digest. `zynode bumps` evaluates the complete 255-to-0 range.

## Exact bytes

These values are different PDA inputs:

```text
string "123"      -> 31 32 33
u64 LE 123         -> 7b 00 00 00 00 00 00 00
u32 BE 123         -> 00 00 00 7b
```

The CLI exposes bytes before derivation so a mismatch can be found before comparing addresses.

## Seed-boundary equivalence

The protocol does not prefix each seed with a length inside the PDA hash. As a result, different seed arrays can contribute the same concatenated bytes. This is why Zynode keeps seed-boundary diagnostics separate from ordinary seed validation.

See `seed-boundaries.md` for the dedicated comparison workflow.

## References

- https://solana.com/docs/core/pda
- https://docs.rs/solana-sdk/latest/solana_sdk/pubkey/struct.Pubkey.html
