#!/usr/bin/env node
/** Validate tracked agent-facing text as strict UTF-8 with live local references. */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import * as path from "node:path";

const TEXT_SUFFIXES = new Set([
  ".json",
  ".md",
  ".mdc",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".ps1",
  ".sh",
  ".toml",
  ".yaml",
  ".yml",
]);
const REFERENCE_SUFFIXES = new Set([
  ".json",
  ".md",
  ".mdc",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".ps1",
  ".sh",
]);
const IGNORED_PARTS = new Set([
  ".git",
  ".gitnexus",
  ".globalsetup-backups",
  "node_modules",
]);
const MOJIBAKE_MARKERS = [
  [0x00c3],
  [0x00c2],
  [0x00e2, 0x20ac],
  [0x00e2, 0x201e],
  [0x00e2, 0x0153],
  [0x00e2, 0x009d],
  [0x00e2, 0x201d],
  [0x00e2, 0x2013],
  [0x00e2, 0x2014],
  [0x00f0, 0x0178],
  [0x00ef, 0x00b8],
].map((points) => String.fromCodePoint(...points));
const MARKDOWN_LINK = /!?\[[^\]]*\]\(([^)]+)\)/g;

function parseArguments(argv: string[]): { root: string; staged: boolean } {
  let root = ".",
    staged = false;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") {
      if (!argv[index + 1]) throw new Error("--root requires a directory");
      root = argv[++index];
    } else if (argv[index] === "--staged") staged = true;
    else throw new Error(`unknown argument: ${argv[index]}`);
  }
  return { root: path.resolve(root), staged };
}
function walk(root: string, directory = root): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED_PARTS.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(root, full));
    else if (entry.isFile()) files.push(path.relative(root, full));
  }
  return files;
}
function candidates(root: string, staged: boolean): string[] {
  if (!staged) return walk(root);
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    { cwd: root },
  );
  if (result.error || result.status !== 0)
    throw new Error(
      (
        result.stderr?.toString("utf8") ||
        result.error?.message ||
        "could not inspect staged text"
      ).trim(),
    );
  return (result.stdout ?? Buffer.alloc(0))
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}
function validateFile(root: string, relative: string): string[] {
  const file = path.resolve(root, relative),
    extension = path.extname(file).toLowerCase();
  if (!existsSync(file) || !TEXT_SUFFIXES.has(extension)) return [];
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(file));
  } catch (error) {
    return [
      `${relative}: invalid UTF-8: ${error instanceof Error ? error.message : error}`,
    ];
  }
  const errors: string[] = [];
  for (const [offset, rawLine] of text.split("\n").entries()) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine,
      lineNumber = offset + 1;
    const marker = MOJIBAKE_MARKERS.find((candidate) =>
      line.includes(candidate),
    );
    if (marker)
      errors.push(
        `${relative}:${lineNumber}: mojibake marker ${JSON.stringify(marker)}`,
      );
    const control = [...line].find(
      (character) => character.codePointAt(0)! < 32 && character !== "\t",
    );
    if (control)
      errors.push(
        `${relative}:${lineNumber}: control character U+${control.codePointAt(0)!.toString(16).padStart(4, "0").toUpperCase()}`,
      );
    if (extension !== ".md") continue;
    for (const match of line.matchAll(MARKDOWN_LINK)) {
      const target = match[1]
        .trim()
        .replace(/^<|>$/g, "")
        .split("#", 1)[0]
        .split("?", 1)[0];
      if (
        !target ||
        /^(https?:|mailto:|#|\/)/.test(target) ||
        target.includes("[") ||
        !REFERENCE_SUFFIXES.has(path.extname(target).toLowerCase())
      )
        continue;
      const resolved = path.resolve(path.dirname(file), target),
        insideRoot =
          resolved === root || resolved.startsWith(`${root}${path.sep}`);
      if (insideRoot && !existsSync(resolved))
        errors.push(
          `${relative}:${lineNumber}: missing local reference ${target}`,
        );
    }
  }
  return errors;
}
try {
  const options = parseArguments(process.argv.slice(2));
  const errors = candidates(options.root, options.staged).flatMap((file) =>
    validateFile(options.root, file),
  );
  if (errors.length) {
    console.error("repository text validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else console.log("repository text validation passed");
} catch (error) {
  console.error(
    `repository text validation failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exitCode = 2;
}
