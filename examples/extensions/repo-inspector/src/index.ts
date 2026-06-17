import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { defineExtension } from "@pi/extension-sdk";

export default defineExtension({
  id: "repo-inspector",
  displayName: "Repo Inspector",
  systemPrompt: [
    "When the repo-inspector extension is available, inspect package metadata before recommending project changes.",
    "Prefer grounded observations over generic advice."
  ].join("\n"),
  tools: [
    {
      name: "list_workspace_files",
      description: "List top-level files and directories in the current workspace.",
      execute: async (_args, context) => {
        const entries = await readdir(context.cwd, { withFileTypes: true });
        const lines = entries
          .filter((entry) => !entry.name.startsWith(".git"))
          .map((entry) => `${entry.isDirectory() ? "dir " : "file"} ${entry.name}`)
          .sort();

        return { content: lines.join("\n") || "No files found." };
      }
    },
    {
      name: "read_package_json",
      description: "Read the workspace package.json when present.",
      execute: async (_args, context) => {
        const packagePath = path.join(context.cwd, "package.json");
        const content = await readFile(packagePath, "utf8");
        return { content };
      }
    }
  ]
});
