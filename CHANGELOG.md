# Changelog

## 1.2.0

- Added canonical bump tracing with per-attempt SHA-256 candidate digests.
- Added CI-friendly PDA verification with distinct mismatch exit status.
- Added typed-recipe and effective-payload fingerprints.
- Added recipe diagnostics for Unicode normalization and variable-width seed boundaries.
- Added JSON recipe comparison with segmentation-equivalence detection.
- Split CLI parsing, rendering, recipe loading, and command routing into focused modules.
- Added byte framing/equality helpers and structured Zynode errors.
- Expanded the automated suite to cover CLI behavior, recipe fingerprints, diagnostics, byte utilities, and curve checks.
- Strengthened repository checks to enforce the offline, zero-runtime-dependency boundary.
- Rewrote tool documentation around exact-byte debugging and repository-only usage.

## 1.1.0

- Converted Zynode Lab to a CLI-only repository.
- Removed website and hosting code.
- Added derive, inspect, bumps, and code commands.
- Added JSON output and reusable ES-module exports.

## 1.0.0

- Initial PDA derivation engine, seed utilities, bump exploration, code generation, tests, and repository policies.
