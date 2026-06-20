import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);
const RUNTIMES = ["docker", "podman", "nerdctl"] as const;
const MAX_OUTPUT = 20000;

type RuntimeName = (typeof RUNTIMES)[number];
type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  details?: Record<string, unknown>;
  isError?: boolean;
};

const emptySchema = {
  type: "object",
  properties: {},
  additionalProperties: false
} as any;

const idSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Container name or ID" }
  },
  required: ["id"],
  additionalProperties: false
} as any;

export default function piDocker(pi: ExtensionAPI) {
  pi.registerCommand("docker:ps", {
    description: "List local containers",
    handler: async (args, ctx) => notifyResult(ctx, await dockerPs(args.includes("-a")))
  });

  pi.registerCommand("docker:logs", {
    description: "Tail local container logs",
    handler: async (args, ctx) => {
      const [id, maybeLines] = splitArgs(args);
      if (!id) return ctx.ui.notify("Usage: /docker:logs <container> [lines]", "warn");
      notifyResult(ctx, await dockerLogs(id, Number(maybeLines) || 100));
    }
  });

  pi.registerCommand("docker:stats", {
    description: "Show local container resource usage",
    handler: async (_args, ctx) => notifyResult(ctx, await dockerStats())
  });

  pi.registerCommand("docker:inspect", {
    description: "Inspect a local container",
    handler: async (args, ctx) => {
      const [id] = splitArgs(args);
      if (!id) return ctx.ui.notify("Usage: /docker:inspect <container>", "warn");
      notifyResult(ctx, await dockerInspect(id));
    }
  });

  for (const action of ["start", "stop", "restart"] as const) {
    pi.registerCommand(`docker:${action}`, {
      description: `${action[0].toUpperCase()}${action.slice(1)} a local container`,
      handler: async (args, ctx) => {
        const [id] = splitArgs(args);
        if (!id) return ctx.ui.notify(`Usage: /docker:${action} <container>`, "warn");
        if (!(await confirmMutation(ctx, action, id))) return;
        notifyResult(ctx, await dockerContainerAction(action, id));
      }
    });
  }

  pi.registerTool({
    name: "docker_ps",
    label: "Docker PS",
    description: "List local containers from Docker, Podman, or Nerdctl.",
    promptSnippet: "List local containers using Docker, Podman, or Nerdctl",
    parameters: {
      type: "object",
      properties: {
        all: { type: "boolean", description: "Include stopped containers" }
      },
      additionalProperties: false
    } as any,
    execute: async (_id, params) => dockerPs(Boolean(params.all))
  });

  pi.registerTool({
    name: "docker_logs",
    label: "Docker Logs",
    description: "Read recent logs from a local container.",
    promptSnippet: "Read recent logs from a local container",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Container name or ID" },
        lines: { type: "number", description: "Number of lines, default 100, max 500" }
      },
      required: ["id"],
      additionalProperties: false
    } as any,
    execute: async (_toolCallId, params) => dockerLogs(params.id, params.lines)
  });

  pi.registerTool({
    name: "docker_stats",
    label: "Docker Stats",
    description: "Show one-shot local container CPU, memory, and network usage.",
    parameters: emptySchema,
    execute: async () => dockerStats()
  });

  pi.registerTool({
    name: "docker_inspect",
    label: "Docker Inspect",
    description: "Inspect a local container by name or ID.",
    parameters: idSchema,
    execute: async (_toolCallId, params) => dockerInspect(params.id)
  });

  for (const action of ["start", "stop", "restart"] as const) {
    pi.registerTool({
      name: `docker_${action}`,
      label: `Docker ${action}`,
      description: `${action[0].toUpperCase()}${action.slice(1)} a local container after interactive confirmation.`,
      parameters: idSchema,
      execute: async (_toolCallId, params, _signal, _onUpdate, ctx) => {
        if (!(await confirmMutation(ctx, action, params.id))) {
          return textResult(`${action} cancelled for ${params.id}.`, { action, id: params.id });
        }
        return dockerContainerAction(action, params.id);
      }
    });
  }
}

async function dockerPs(all: boolean): Promise<ToolResult> {
  const runtime = await detectRuntime();
  if (!runtime) return missingRuntime();

  const args = ["ps"];
  if (all) args.push("-a");
  args.push("--format", "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}");

  const result = await runRuntime(runtime, args);
  if (!result.ok) return commandError(runtime, args, result.output);

  const header = "ID\tNAME\tIMAGE\tSTATUS\tPORTS";
  const output = result.output.trim() ? `${header}\n${result.output.trim()}` : "No containers found.";
  return textResult(`Runtime: ${runtime}\n\n${output}`, { runtime, all });
}

async function dockerLogs(id: string, lines?: number): Promise<ToolResult> {
  const runtime = await detectRuntime();
  if (!runtime) return missingRuntime();

  const tail = Math.min(Math.max(Number(lines) || 100, 1), 500);
  const args = ["logs", "--tail", String(tail), id];
  const result = await runRuntime(runtime, args);
  if (!result.ok) return commandError(runtime, args, result.output);

  return textResult(`Runtime: ${runtime}\nContainer: ${id}\n\n${result.output.trim()}`, {
    runtime,
    id,
    lines: tail
  });
}

async function dockerStats(): Promise<ToolResult> {
  const runtime = await detectRuntime();
  if (!runtime) return missingRuntime();

  const args = [
    "stats",
    "--no-stream",
    "--format",
    "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
  ];
  const result = await runRuntime(runtime, args);
  if (!result.ok) return commandError(runtime, args, result.output);

  const header = "NAME\tCPU\tMEMORY\tNET IO\tBLOCK IO";
  const output = result.output.trim() ? `${header}\n${result.output.trim()}` : "No running containers.";
  return textResult(`Runtime: ${runtime}\n\n${output}`, { runtime });
}

async function dockerInspect(id: string): Promise<ToolResult> {
  const runtime = await detectRuntime();
  if (!runtime) return missingRuntime();

  const args = ["inspect", id];
  const result = await runRuntime(runtime, args);
  if (!result.ok) return commandError(runtime, args, result.output);

  return textResult(`Runtime: ${runtime}\nContainer: ${id}\n\n${result.output.trim()}`, {
    runtime,
    id
  });
}

async function dockerContainerAction(action: "start" | "stop" | "restart", id: string): Promise<ToolResult> {
  const runtime = await detectRuntime();
  if (!runtime) return missingRuntime();

  const args = [action, id];
  const result = await runRuntime(runtime, args);
  if (!result.ok) return commandError(runtime, args, result.output);

  return textResult(`Runtime: ${runtime}\n${action} ${id}\n\n${result.output.trim()}`, {
    runtime,
    action,
    id
  });
}

async function detectRuntime(): Promise<RuntimeName | undefined> {
  for (const runtime of RUNTIMES) {
    const result = await run(runtime, ["--version"]);
    if (result.ok) return runtime;
  }
  return undefined;
}

async function runRuntime(runtime: RuntimeName, args: string[]) {
  return run(runtime, args);
}

async function run(command: string, args: string[]) {
  try {
    const result = await execFileAsync(command, args, {
      encoding: "utf8",
      maxBuffer: 1024 * 1024
    });
    return { ok: true, output: truncate(`${result.stdout}${result.stderr}`) };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      output: truncate(`${failure.stdout ?? ""}${failure.stderr ?? ""}${failure.message ?? ""}`)
    };
  }
}

async function confirmMutation(ctx: ExtensionContext, action: string, id: string) {
  if (!ctx.hasUI) return false;
  return ctx.ui.confirm("Local Docker action", `Run docker ${action} on ${id}?`);
}

function notifyResult(ctx: ExtensionContext, result: ToolResult) {
  const text = result.content.map((item) => item.text).join("\n");
  ctx.ui.notify(text, result.isError ? "error" : "info");
}

function splitArgs(args: string) {
  return args.trim().split(/\s+/).filter(Boolean);
}

function missingRuntime(): ToolResult {
  return {
    content: [{ type: "text", text: "No local Docker, Podman, or Nerdctl binary was found." }],
    details: { runtime: "none" },
    isError: true
  };
}

function commandError(runtime: RuntimeName, args: string[], output: string): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: `Runtime: ${runtime}\nCommand failed: ${runtime} ${args.join(" ")}\n\n${output}`
      }
    ],
    details: { runtime, args, output },
    isError: true
  };
}

function textResult(text: string, details?: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: "text", text: truncate(text) }],
    details
  };
}

function truncate(text: string) {
  if (text.length <= MAX_OUTPUT) return text;
  return `${text.slice(0, MAX_OUTPUT)}\n\n[truncated ${text.length - MAX_OUTPUT} chars]`;
}
