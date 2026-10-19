// Compares the built Outis account class with the Argent Account v0.5.0 class it was renamed from.
//
//   scarb build && scarb --profile release build && node scripts/compare-with-upstream.mjs
//
// Prints what differs between the two classes, part by part, and exits non-zero if anything
// differs that the rename does not explain. Needs starkli on the path. The release build is what gets declared; the dev build
// of the same sources carries the type names needed to explain the differences.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { hash } from "starknet";

const UPSTREAM =
  "deployments/artifacts/account-0.5.0-0x073414441639dcd11d1846f287650a00c60c416b9d3ba45d31c651672125b2c2/ArgentAccount";
const RELEASE = "target/release/outis_OutisAccount";
const DEV = "target/dev/outis_OutisAccount";

// The values the Outis class may compute with differently: the renamed text constants. They are
// collected from the renamed source, so a constant that changed in any other way is not in the set.
const shortString = (text) => BigInt(`0x${Buffer.from(text).toString("hex")}`);
const toArgent = (text) =>
  text.replaceAll("OUTIS", "ARGENT").replaceAll("Outis", "Argent").replaceAll("outis", "argent");
const toOutis = (text) =>
  text.replaceAll("ARGENT", "OUTIS").replaceAll("Argent", "Outis").replaceAll("argent", "outis");
const renamedStrings = new Map();
for (const file of readdirSync("src", { recursive: true })) {
  if (!file.endsWith(".cairo")) continue;
  for (const [, text] of readFileSync(`src/${file}`, "utf8").matchAll(/'([^'\n]*outis[^'\n]*)'/gi)) {
    renamedStrings.set(shortString(toArgent(text)), shortString(text));
  }
}

const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const classHash = (path) => execFileSync("starkli", ["class-hash", path], { encoding: "utf8" }).trim();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const upstream = {
  sierra: load(`${UPSTREAM}.contract_class.json`),
  casm: load(`${UPSTREAM}.compiled_contract_class.json`),
};
const outis = { sierra: load(`${RELEASE}.contract_class.json`), casm: load(`${RELEASE}.compiled_contract_class.json`) };
const dev = load(`${DEV}.contract_class.json`);

let unexplained = 0;
const check = (label, ok, detail = "") => {
  if (!ok) unexplained++;
  console.log(`  ${label}: ${ok ? "ok" : "UNEXPLAINED"}${detail ? ` (${detail})` : ""}`);
};

function differences(before, after) {
  if (before.length !== after.length) return undefined;
  return before.flatMap((value, index) => (value === after[index] ? [] : [[BigInt(value), BigInt(after[index])]]));
}
const isRenamedString = ([before, after]) => renamedStrings.get(before) === after;
const distinct = (diffs) => new Set(diffs.map(([before]) => before)).size;

console.log("Sierra class (what is declared)");
{
  // A Sierra program refers to each struct and enum by the hash of its full name. Renaming the
  // package changes those names, so those hashes change and nothing else may.
  check(
    "the dev build is the same program as the release build",
    same(dev.sierra_program, outis.sierra.sierra_program),
  );
  const renamedTypes = new Map(
    dev.sierra_program_debug_info.type_names
      .map(([, name]) => name)
      .filter((name) => /outis/i.test(name))
      .map((name) => [BigInt(hash.starknetKeccak(toArgent(name))), BigInt(hash.starknetKeccak(name))]),
  );
  const diffs = differences(upstream.sierra.sierra_program, outis.sierra.sierra_program);
  check("program has the same length", diffs !== undefined, `${upstream.sierra.sierra_program.length} felts`);
  const typeNames = (diffs ?? []).filter(([before, after]) => renamedTypes.get(before) === after);
  const strings = (diffs ?? []).filter(isRenamedString);
  console.log(
    `  program: ${diffs?.length ?? "?"} felts differ: ${typeNames.length} hashes of renamed type names, ${
      strings.length
    } renamed text constants`,
  );
  check(
    "every differing felt is one of those",
    diffs !== undefined && diffs.length === typeNames.length + strings.length,
  );
  check("entry points are identical", same(upstream.sierra.entry_points_by_type, outis.sierra.entry_points_by_type));
  check(
    "the ABI is the upstream ABI with argent renamed to outis",
    same(JSON.parse(toOutis(JSON.stringify(upstream.sierra.abi))), outis.sierra.abi),
  );
}

console.log("Compiled class (what runs)");
{
  const diffs = differences(upstream.casm.bytecode, outis.casm.bytecode);
  check("bytecode has the same length", diffs !== undefined, `${upstream.casm.bytecode.length} felts`);
  const strings = (diffs ?? []).filter(isRenamedString);
  console.log(
    `  bytecode: ${diffs?.length ?? "?"} felts differ: ${strings.length} renamed text constants (${distinct(
      strings,
    )} distinct, of ${renamedStrings.size} in the source)`,
  );
  check("every differing felt is a renamed text constant", diffs !== undefined && diffs.length === strings.length);
  for (const part of ["bytecode_segment_lengths", "hints", "entry_points_by_type", "prime", "compiler_version"]) {
    check(`${part} identical`, same(upstream.casm[part], outis.casm[part]));
  }
}

console.log("Class hashes");
console.log(`  class hash           upstream ${classHash(`${UPSTREAM}.contract_class.json`)}`);
console.log(`                       outis     ${classHash(`${RELEASE}.contract_class.json`)}`);
console.log(`  compiled class hash  upstream ${classHash(`${UPSTREAM}.compiled_contract_class.json`)}`);
console.log(`                       outis     ${classHash(`${RELEASE}.compiled_contract_class.json`)}`);

console.log(
  unexplained === 0
    ? "\nNothing differs beyond the rename."
    : `\n${unexplained} check(s) found differences the rename does not explain.`,
);
process.exit(unexplained === 0 ? 0 : 1);
