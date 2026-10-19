# Modifications

This repository is a modified copy of
[argentlabs/argent-contracts-starknet](https://github.com/argentlabs/argent-contracts-starknet) at
commit `c30f61c`, licensed under GPL-3.0 (see `LICENSE`). Its first commit is upstream's tree as it
was, so a diff against that commit shows every change.

Changes made for Outis, from 2026-09-30:

- Everything named argent is renamed to outis: the package, module paths, file names, identifiers,
  the `'argent/...'` error strings, and the names the contracts report (`'ArgentAccount'` is now
  `'OutisAccount'`, `'ArgentMultisig'` is now `'OutisMultisig'`). `scripts/rename-to-outis.py` is the
  whole change to `src/` and `tests/`: running it on the upstream tree reproduces them.
- Tests that upgrade an Argent 0.4.0 account or an Argent multisig into these classes are skipped,
  because an upgrade requires the old and the new class to report the same name.
- Added `scripts/compare-with-upstream.mjs`, `deployments/outis.txt` and the built Outis account class
  under `deployments/artifacts/`.
- On 2026-10-04 the TypeScript tests moved to a current devnet and starknet.js: the `Dockerfile`
  builds on `shardlabs/starknet-devnet-rs:0.10.0-seed0` (upstream: `0.6.0-seed0`, which spent about
  200 ms on every RPC call), and starknet.js is 10.8.0 (upstream: 8.5.4). Starknet 0.14.1 hashes
  compiled classes with Blake2s, which 8.5.4 can't. In starknet.js 10 an account holds its provider
  instead of being one, so the tests call `account.provider.waitForTransaction` and
  `account.provider.callContract`. The class hash cache is `dist/classHashCache-blake.json`, so
  Poseidon hashes cached before aren't sent.
- The Cairo CI no longer checks formatting (`scarb fmt --check`): sorted, `outis` comes after `core`
  and `crate` in imports where `argent` came before them, and the sources stay exactly as the rename
  makes them. `scripts/compare-with-upstream.mjs` is formatted with Prettier, as upstream's CI checks.

No statement of the contracts was added, removed or reordered. The README was rewritten for Outis on
2026-10-19 (Voyager shows it beside the verified class). The other files here, including the docs,
the changelogs and the audit reports, are upstream's and describe Argent's account.
