# Outis account contracts

The account contract of the [Outis](https://outis.xyz) wallet on Starknet.

This is [argentlabs/argent-contracts-starknet](https://github.com/argentlabs/argent-contracts-starknet)
at commit `c30f61c` (Argent Account 0.5.0) with everything named argent renamed to outis: the package,
module paths, file names, identifiers, the error strings and the name the account reports
(`'OutisAccount'`). No statement was added, removed or reordered. Licensed under GPL-3.0, as upstream.
The first commit is upstream's tree as it was, so a diff against it shows every change;
`MODIFICATIONS.md` lists them.

Declared on Starknet mainnet and Sepolia: `OutisAccount`,
`0x00eb49f5299d144f0b2e434e483758fb6d7d8241632534d86b098047fe4e2b42` (transactions in
`deployments/outis.txt`).

Build with Scarb 2.10.1: `scarb --release build`. The multisig and the mocks in `src/` build with it
but aren't deployed.
