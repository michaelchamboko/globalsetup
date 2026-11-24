import { existsSync, realpathSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export class NodePackageCommandError extends Error {}

export type NodePackageCommandOptions = {
  node?: string;
  pathExt?: string;
  pathValue?: string;
  platform?: NodeJS.Platform;
};

function isFile(candidate: string): boolean {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function findCommand(
  command: string,
  platform: NodeJS.Platform,
  pathValue: string,
  pathExt: string,
): string | undefined {
  const hasDirectory = path.isAbsolute(command) || /[\\/]/.test(command);
  const directories = hasDirectory
    ? [""]
    : pathValue.split(platform === "win32" ? ";" : path.delimiter);
  const configuredExtensions =
    platform === "win32" && path.extname(command) === ""
      ? pathExt.split(";").filter(Boolean)
      : [""];
  const extensions = [
    ...new Set(
      configuredExtensions.flatMap((extension) => [
        extension,
        extension.toLowerCase(),
        extension.toUpperCase(),
      ]),
    ),
  ];
  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = hasDirectory
        ? `${command}${extension}`
        : path.join(directory.replace(/^"|"$/g, ""), `${command}${extension}`);
      if (isFile(candidate)) return candidate;
    }
  }
  return undefined;
}

function packageExecutable(
  shim: string,
  packageName: string,
  executableName: string,
): string {
  const shimDirectory = path.dirname(shim);
  const roots = [
    path.join(shimDirectory, "node_modules", packageName),
    path.resolve(shimDirectory, "..", packageName),
  ];
  const packageRoot = roots.find((root) =>
    isFile(path.join(root, "package.json")),
  );
  if (!packageRoot)
    throw new NodePackageCommandError(
      `could not locate ${packageName} package metadata for ${shim}`,
    );
  const manifestPath = path.join(packageRoot, "package.json");
  let manifest: { bin?: string | Record<string, string> };
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error: any) {
    throw new NodePackageCommandError(
      `could not read ${packageName} package metadata for ${shim}: ${error.message}`,
    );
  }
  const relative =
    typeof manifest.bin === "string"
      ? manifest.bin
      : manifest.bin?.[executableName];
  if (!relative)
    throw new NodePackageCommandError(
      `${packageName} does not declare a ${executableName} executable`,
    );
  const executable = path.resolve(packageRoot, relative);
  const relation = path.relative(packageRoot, executable);
  if (
    relation === ".." ||
    relation.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relation) ||
    !existsSync(executable)
  )
    throw new NodePackageCommandError(
      `${packageName} declares an unsafe or missing ${executableName} executable`,
    );
  return executable;
}

/**
 * Resolve npm-created Windows command shims without a command shell.
 * Other platforms and native executables retain the original argument array.
 */
export function resolveNodePackageArgv(
  argv: readonly string[],
  options: NodePackageCommandOptions = {},
): string[] {
  if (!argv.length) return [];
  const platform = options.platform ?? process.platform;
  if (platform !== "win32") return [...argv];
  const pathValue = options.pathValue ?? process.env.PATH ?? "";
  const pathExt =
    options.pathExt ?? process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD";
  const shim = findCommand(argv[0], platform, pathValue, pathExt);
  if (!shim) return [...argv];
  const resolved = realpathSync(shim);
  if (/\.(?:exe|com)$/i.test(resolved)) return [...argv];
  if (/\.js$/i.test(resolved))
    return [options.node ?? process.execPath, resolved, ...argv.slice(1)];
  if (!/\.(?:cmd|bat)$/i.test(resolved)) return [...argv];

  const commandName = path
    .basename(resolved)
    .replace(/\.(?:cmd|bat)$/i, "")
    .toLowerCase();
  const node = options.node ?? process.execPath;
  if (commandName === "npm" || commandName === "npx") {
    const cli = path.join(
      path.dirname(resolved),
      "node_modules",
      "npm",
      "bin",
      `${commandName}-cli.js`,
    );
    if (!isFile(cli))
      throw new NodePackageCommandError(
        `could not resolve ${commandName} CLI from ${resolved}`,
      );
    return [node, cli, ...argv.slice(1)];
  }
  if (commandName === "gitnexus") {
    return [
      node,
      packageExecutable(resolved, "gitnexus", "gitnexus"),
      ...argv.slice(1),
    ];
  }
  throw new NodePackageCommandError(
    `cannot execute Windows command shim without a shell: ${resolved}`,
  );
}
