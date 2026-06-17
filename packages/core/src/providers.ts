import type { AgentTool } from "@pi/extension-sdk";

export interface ProviderRequest {
  prompt: string;
  systemPrompt: string;
  tools: AgentTool[];
  model?: string;
}

export interface ProviderResponse {
  content: string;
  raw?: unknown;
}

export interface AgentProvider {
  name: string;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}

export class EchoProvider implements AgentProvider {
  readonly name = "echo";

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const toolNames = request.tools.map((tool) => tool.name).join(", ") || "none";
    return {
      content: [
        "Pi echo provider",
        "",
        `Model: ${request.model ?? "none"}`,
        `Tools: ${toolNames}`,
        "",
        "System prompt:",
        request.systemPrompt,
        "",
        "User prompt:",
        request.prompt
      ].join("\n")
    };
  }
}

export interface OpenAIProviderOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class OpenAIResponsesProvider implements AgentProvider {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(options: OpenAIProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = options.baseUrl ?? "https://api.openai.com/v1";
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: request.model ?? this.model,
        instructions: request.systemPrompt,
        input: request.prompt
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI provider failed with ${response.status}: ${body}`);
    }

    const body = await response.json() as { output_text?: string };
    return {
      content: body.output_text ?? JSON.stringify(body, null, 2),
      raw: body
    };
  }
}
