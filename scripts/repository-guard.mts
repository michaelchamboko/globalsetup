#!/usr/bin/env node
/** Fail closed when staged repository content violates GlobalSetup boundaries. */
import { spawnSync } from "node:child_process";
import * as path from "node:path";

function parseArguments(argv: string[]): { root: string; staged: boolean } {
  let root = ".";
  let staged = false;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") {
      if (!argv[index + 1]) throw new Error("--root requires a directory");
      root = argv[++index];
    } else if (argv[index] === "--staged") staged = true;
    else throw new Error(`unknown argument: ${argv[index]}`);
  }
  return { root: path.resolve(root), staged };
}
function stagedPaths(root: string): string[] {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    { cwd: root, encoding: "utf8" },
  );
  if (result.error || result.status !== 0)
    throw new Error(
      (
        result.stderr ||
        result.error?.message ||
        "could not inspect staged paths"
      ).trim(),
    );
  return (result.stdout || "").split("\0").filter(Boolean);
}
function violation(file: string): string | undefined {
  const normalized = file
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .toLowerCase();
  const name = path.posix.basename(normalized);
  if (normalized.startsWith(".github/workflows/"))
    return "GitHub Actions workflows and runners are prohibited; GitHub is source control only";
  if (name === ".env" || name.startsWith(".env."))
    return "environment files may contain secrets";
  if (
    name.endsWith(".pem") ||
    name.endsWith(".key") ||
    name === "id_rsa" ||
    name === "credentials.json"
  )
    return "likely credential material must not be committed";
  return undefined;
}
try {
  const options = parseArguments(process.argv.slice(2));
  if (!options.staged) throw new Error("--staged is required");
  const violations = stagedPaths(options.root)
    .map((file) => [file, violation(file)] as const)
    .filter(
      (entry): entry is readonly [string, string] => entry[1] !== undefined,
    );
  if (violations.length) {
    console.error("repository guard blocked the commit:");
    for (const [file, reason] of violations)
      console.error(`- ${file}: ${reason}`);
    process.exitCode = 1;
  } else console.log("repository guard passed");
} catch (error) {
  console.error(
    `repository guard failed closed: ${error instanceof Error ? error.message : error}`,
  );
  process.exitCode = 2;
}
