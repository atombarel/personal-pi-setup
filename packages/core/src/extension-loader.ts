import { pathToFileURL } from "node:url";
import path from "node:path";
import type { PiExtension } from "@pi/extension-sdk";

export async function loadExtension(extensionPath: string, cwd: string): Promise<PiExtension> {
  const resolvedPath = path.isAbsolute(extensionPath)
    ? extensionPath
    : path.resolve(cwd, extensionPath);
  const moduleUrl = pathToFileURL(resolvedPath).href;
  const loaded = await import(moduleUrl) as { default?: unknown; extension?: unknown };
  const extension = loaded.default ?? loaded.extension;

  if (!isPiExtension(extension)) {
    throw new Error(`Module "${extensionPath}" does not export a Pi extension.`);
  }

  return extension;
}

function isPiExtension(value: unknown): value is PiExtension {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<PiExtension>;
  return typeof candidate.id === "string";
}
