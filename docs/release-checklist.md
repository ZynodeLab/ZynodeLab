# Release checklist

1. Start from a clean checkout on a supported Node.js version.
2. Run `npm ci --ignore-scripts --no-audit --no-fund`.
3. Run `npm run release:check`.
4. Confirm deterministic PDA fixtures and CLI integration tests pass.
5. Run the segmentation comparison fixture and review its expected equivalence result.
6. Review any change to `base58.js`, `ed25519.js`, `pda.js`, or `seeds.js` as correctness-sensitive code.
7. Inspect `npm pack --dry-run` and confirm only intended runtime files are shipped.
8. Confirm `package.json` and `src/version.js` match.
9. Update `CHANGELOG.md` before tagging.
10. Create the release from the exact commit that passed CI. Do not rewrite or backdate history for release appearance.
