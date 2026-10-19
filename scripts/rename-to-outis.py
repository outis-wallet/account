"""Renames the Argent account code base to Outis. Run once from contracts/ on the upstream tree
(tag argent-baseline).

Everything that says argent becomes outis: the package, module paths, file names, identifiers,
the 'argent/...' error strings and the names the contracts report ('ArgentAccount',
'ArgentMultisig'). No statement is added, removed or reordered. Running this on the upstream tree
reproduces src/ and tests/ exactly, and scripts/compare-with-upstream.mjs checks the built class
against the upstream artifact.

Not renamed: the upstream artifacts in deployments/ (the comparison baseline and the fixtures the
upgrade tests start from), the helper names of the TypeScript test harness, and the upstream docs.
"""

import pathlib
import re
import subprocess

MOVES = [
    ("src/multiowner_account/argent_account.cairo", "src/multiowner_account/outis_account.cairo"),
    ("src/mocks/future_argent_account.cairo", "src/mocks/future_outis_account.cairo"),
    ("src/mocks/future_argent_multisig.cairo", "src/mocks/future_outis_multisig.cairo"),
    ("tests/argent_account", "tests/outis_account"),
    ("tests/outis_account/test_argent_account.cairo", "tests/outis_account/test_outis_account.cairo"),
    ("tests/setup/argent_account_setup.cairo", "tests/setup/outis_account_setup.cairo"),
]

# Comments that talk about Argent's own earlier releases, which stay Argent's.
KEEP = [
    "upgrading from Argent account <0.4.0",
]

# In the TypeScript test harness: the contracts built from this tree, the error strings the
# contracts revert with, and the names they report.
BUILT_CONTRACT = re.compile(r'((?:declareLocalContract|getContractSize)\(")(\w*Argent\w*)')
ERROR_STRING = re.compile(r"""(["'])argent/""")
REPORTED_NAME = re.compile(r'(encodeShortString\(")(Argent\w*)')
# An error string as the node prints it: the felt in hex, starting with the bytes of "argent".
HEX_ERROR_STRING = re.compile(r"0x617267656e74(?:[0-9a-f]{2})+")


def rename(text: str) -> str:
    return text.replace("ARGENT", "OUTIS").replace("Argent", "Outis").replace("argent", "outis")


def rename_cairo(text: str) -> str:
    return "\n".join(line if any(kept in line for kept in KEEP) else rename(line) for line in text.split("\n"))


def rename_harness(text: str) -> str:
    text = BUILT_CONTRACT.sub(lambda match: match.group(1) + rename(match.group(2)), text)
    text = REPORTED_NAME.sub(lambda match: match.group(1) + rename(match.group(2)), text)
    text = ERROR_STRING.sub(lambda match: f"{match.group(1)}outis/", text)
    text = HEX_ERROR_STRING.sub(lambda match: "0x" + rename(bytes.fromhex(match.group(0)[2:]).decode()).encode().hex(), text)
    return text.replace('"./target/release/argent_"', '"./target/release/outis_"')


def rewrite(path: pathlib.Path, change) -> None:
    text = path.read_text()
    changed = change(text)
    if changed != text:
        path.write_text(changed)


def main() -> None:
    for source, target in MOVES:
        subprocess.run(["git", "mv", source, target], check=True)

    for root in ("src", "tests"):
        for path in sorted(pathlib.Path(root).rglob("*.cairo")):
            rewrite(path, rename_cairo)

    for root in ("lib", "tests-integration", "scripts"):
        for path in sorted(pathlib.Path(root).rglob("*.ts")):
            rewrite(path, rename_harness)

    for name in ("Scarb.toml", "Scarb.lock"):
        rewrite(pathlib.Path(name), lambda text: text.replace('name = "argent"', 'name = "outis"'))
    rewrite(pathlib.Path("package.json"), lambda text: text.replace('"name": "argent_contracts_starknet"', '"name": "outis_contracts_starknet"'))


if __name__ == "__main__":
    main()
