import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { afterEach } from "node:test";
import {
  NodePackageCommandError,
  resolveNodePackageArgv,
} from "../scripts/node-package-command.ts";

const temporaryDirectories = new Set<string>();

function fixture(): string {
  const root = mkdtempSync(path.join(tmpdir(), "node-package-command-"));
  temporaryDirectories.add(root);
  return root;
}

function write(pathname: string, value = ""): void {
  mkdirSync(path.dirname(pathname), { recursive: true });
  writeFileSync(pathname, value);
}

afterEach(() => {
  for (const directory of temporaryDirectories)
    rmSync(directory, { recursive: true, force: true });
  temporaryDirectories.clear();
});

test("non-Windows commands preserve their argument arrays", () => {
  const argv = ["npm", "test", "--", "focused"];
  assert.deepEqual(resolveNodePackageArgv(argv, { platform: "linux" }), argv);
});

test("Windows npm and npx shims resolve to their JavaScript CLIs", () => {
  const bin = fixture();
  write(path.join(bin, "npm.cmd"));
  write(path.join(bin, "npx.cmd"));
  write(path.join(bin, "node_modules", "npm", "bin", "npm-cli.js"));
  write(path.join(bin, "node_modules", "npm", "bin", "npx-cli.js"));
  const options = {
    node: "C:\\Node\\node.exe",
    pathExt: ".CMD",
    pathValue: bin,
    platform: "win32" as const,
  };
  assert.deepEqual(resolveNodePackageArgv(["npm", "test"], options), [
    options.node,
    path.join(bin, "node_modules", "npm", "bin", "npm-cli.js"),
    "test",
  ]);
  assert.deepEqual(resolveNodePackageArgv(["npx", "tool", "arg"], options), [
    options.node,
    path.join(bin, "node_modules", "npm", "bin", "npx-cli.js"),
    "tool",
    "arg",
  ]);
});

test("Windows gitnexus shim resolves through package bin metadata", () => {
  const bin = fixture();
  write(path.join(bin, "gitnexus.cmd"));
  write(
    path.join(bin, "node_modules", "gitnexus", "package.json"),
    JSON.stringify({ bin: { gitnexus: "dist/cli.js" } }),
  );
  const cli = path.join(bin, "node_modules", "gitnexus", "dist", "cli.js");
  write(cli);
  assert.deepEqual(
    resolveNodePackageArgv(["gitnexus", "analyze", "--index-only"], {
      node: "node.exe",
      pathExt: ".CMD",
      pathValue: bin,
      platform: "win32",
    }),
    ["node.exe", cli, "analyze", "--index-only"],
  );
});

test("local node_modules bin gitnexus shim resolves its sibling package", () => {
  const root = fixture();
  const bin = path.join(root, "node_modules", ".bin");
  write(path.join(bin, "gitnexus.cmd"));
  write(
    path.join(root, "node_modules", "gitnexus", "package.json"),
    JSON.stringify({ bin: "cli.js" }),
  );
  const cli = path.join(root, "node_modules", "gitnexus", "cli.js");
  write(cli);
  assert.deepEqual(
    resolveNodePackageArgv(["gitnexus", "status"], {
      node: "node.exe",
      pathExt: ".CMD",
      pathValue: bin,
      platform: "win32",
    }),
    ["node.exe", cli, "status"],
  );
});

test("unknown Windows command shims fail closed without a shell", () => {
  const bin = fixture();
  write(path.join(bin, "custom.cmd"));
  assert.throws(
    () =>
      resolveNodePackageArgv(["custom", "argument"], {
        pathExt: ".CMD",
        pathValue: bin,
        platform: "win32",
      }),
    (error: unknown) =>
      error instanceof NodePackageCommandError &&
      /cannot execute Windows command shim without a shell/.test(error.message),
  );
});
