import type { PiExtension } from "@pi/extension-sdk";
import type { AgentProvider, ProviderResponse } from "./providers.js";
import { ToolRegistry } from "./tool-registry.js";

export interface AgentRuntimeOptions {
  cwd: string;
  provider: AgentProvider;
  model?: string;
  extensions?: PiExtension[];
}

export interface AgentRunResult {
  content: string;
  provider: string;
  toolCount: number;
  raw?: unknown;
}

const BASE_SYSTEM_PROMPT = [
  "You are Pi, a local-first coding agent.",
  "Be direct, inspect the workspace before making claims, and prefer small reversible changes.",
  "Explain tool use and file edits clearly."
].join("\n");

export class AgentRuntime {
  private readonly cwd: string;
  private readonly provider: AgentProvider;
  private readonly model?: string;
  private readonly extensions: PiExtension[];
  private readonly registry = new ToolRegistry();

  constructor(options: AgentRuntimeOptions) {
    this.cwd = options.cwd;
    this.provider = options.provider;
    this.model = options.model;
    this.extensions = options.extensions ?? [];

    for (const extension of this.extensions) {
      for (const tool of extension.tools ?? []) {
        this.registry.register(tool);
      }
    }
  }

  async run(prompt: string): Promise<AgentRunResult> {
    const response = await this.provider.complete({
      prompt,
      systemPrompt: this.systemPrompt(),
      tools: this.registry.list(),
      model: this.model
    });

    return this.formatResult(response);
  }

  listExtensions(): PiExtension[] {
    return [...this.extensions];
  }

  listTools() {
    return this.registry.list();
  }

  private systemPrompt(): string {
    const extensionPrompts = this.extensions
      .map((extension) => extension.systemPrompt)
      .filter((prompt): prompt is string => Boolean(prompt));

    return [BASE_SYSTEM_PROMPT, ...extensionPrompts].join("\n\n");
  }

  private formatResult(response: ProviderResponse): AgentRunResult {
    return {
      content: response.content,
      provider: this.provider.name,
      toolCount: this.registry.list().length,
      raw: response.raw
    };
  }
}
