# Support

Before filing an issue, run:

```bash
npm run ci
zynode help
```

For deterministic deployment mismatches, include:

- CREATE or CREATE2 method;
- deployer address;
- nonce or salt;
- init code hash;
- expected address;
- Zynode version;
- an independent EVM tool result if available.

For RPC issues, include the selected network, whether the built-in or custom endpoint was used, and the error message. Never include API keys or credentials.
