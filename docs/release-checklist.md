# Release checklist

1. Run `npm run ci`.
2. Run `npm run release:check`.
3. Confirm all standard Keccak, EIP-55, CREATE, and EIP-1014 fixtures pass.
4. Verify mainnet/testnet constants against official Robinhood Chain documentation.
5. Review changes to `keccak.js`, `rlp.js`, `create.js`, `create2.js`, and `address.js` as correctness-sensitive code.
6. Confirm no signing, private-key, or secret-handling functionality was added unintentionally.
7. Review generated code examples for current syntax.
8. Update `CHANGELOG.md`.
9. Tag only from a clean working tree.
10. Attach the npm package checksum or release archive checksum when publishing binaries/artifacts.
