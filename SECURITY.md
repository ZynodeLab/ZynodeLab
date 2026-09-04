# Security policy

## Scope

Zynode Lab is an offline derivation tool. Its main security property is correctness: the same validated program ID and seed bytes must produce the same PDA behavior as Solana's program-address algorithm.

High-impact bug classes include:

- incorrect seed encoding;
- accepting an invalid program ID;
- incorrect Ed25519 on-curve detection;
- selecting a non-canonical bump;
- displaying bytes that differ from the bytes actually derived;
- generated code that does not reproduce the inspected recipe;
- recipe comparison that incorrectly claims byte equivalence.

## Reporting

Use GitHub private vulnerability reporting when available. Include the affected version or commit, a minimal program/seed reproduction, expected behavior, actual behavior, and an independent Solana SDK result when possible.

Do not publish real secrets in a report. Zynode never needs private keys or seed phrases, and some PDA seed material may also be sensitive.

## Network and dependency surface

The runtime package has no npm dependencies and production source is designed to make no network requests. Repository checks enforce this boundary. Development automation still depends on GitHub Actions and the Node.js toolchain, which should be reviewed like any other build infrastructure.
