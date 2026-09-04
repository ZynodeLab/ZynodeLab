# Provenance and release integrity

Zynode Lab keeps all runtime implementation in readable JavaScript source. The npm package is built directly from repository files and has no generated runtime bundle, vendored dependency tree, hidden binary, hosted API client, or minified application artifact.

A release review should include:

1. a clean checkout of the tagged commit;
2. `npm ci --ignore-scripts --no-audit --no-fund`;
3. `npm run release:check`;
4. inspection of the `npm pack --dry-run` file list;
5. release creation from the same reviewed commit.

The repository should reflect real development history. Do not fabricate commit dates, authorship, contributors, attestations, or third-party audit claims.

Zynode's recipe and payload fingerprints are application diagnostics. They are not authorship proofs, package attestations, or substitutes for Git/GitHub provenance.
