export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface ToolContext {
  cwd: string;
  log(message: string): void;
}

export interface ToolResult {
  content: string;
  metadata?: JsonObject;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters?: JsonObject;
  execute(args: JsonObject, context: ToolContext): Promise<ToolResult> | ToolResult;
}

export interface PiExtension {
  id: string;
  displayName?: string;
  systemPrompt?: string;
  tools?: AgentTool[];
}

export function defineExtension(extension: PiExtension): PiExtension {
  return extension;
}
