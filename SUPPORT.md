# Support

For reproducible bugs, open an issue with the Zynode version, command, program ID, non-sensitive seed recipe, expected result, and actual result. JSON output from `derive`, `trace`, `doctor`, or `compare` is especially useful.

For a PDA mismatch, try these commands before filing:

```bash
zynode inspect --seed TYPE:VALUE
zynode trace -p PROGRAM -s TYPE:VALUE --json
zynode doctor -p PROGRAM -s TYPE:VALUE --json
```

Never post private keys, seed phrases, signing material, or sensitive PDA seed values.
