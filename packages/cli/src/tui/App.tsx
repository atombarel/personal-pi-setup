import React, { useMemo, useState } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import type { AgentRunResult, AgentRuntime } from "@pi/core";

type Role = "user" | "assistant" | "system" | "error";

interface TranscriptMessage {
  id: number;
  role: Role;
  text: string;
}

interface ActivityItem {
  id: number;
  text: string;
  tone?: "normal" | "muted" | "success" | "error";
}

export interface TuiAppProps {
  runtime: AgentRuntime;
  provider: string;
  model?: string;
  cwd: string;
  skills: string[];
}

export function TuiApp({ runtime, provider, model, cwd, skills }: TuiAppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const session = useMemo(() => runtime.startSession(), [runtime]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messageId, setMessageId] = useState(1);
  const [activityId, setActivityId] = useState(1);
  const [messages, setMessages] = useState<TranscriptMessage[]>([
    {
      id: 0,
      role: "system",
      text: "Welcome to Pi. Type /help for commands, /exit to quit."
    }
  ]);
  const [activity, setActivity] = useState<ActivityItem[]>([
    { id: 0, text: "session ready", tone: "success" }
  ]);

  const height = stdout.rows || 30;
  const transcriptHeight = Math.max(8, height - 9);

  useInput((_input, key) => {
    if (key.ctrl && _input === "c") {
      exit();
    }
  });

  const appendMessage = (role: Role, text: string) => {
    setMessages((current) => [...current, { id: messageId, role, text }]);
    setMessageId((current) => current + 1);
  };

  const appendActivity = (text: string, tone: ActivityItem["tone"] = "normal") => {
    setActivity((current) => [...current.slice(-12), { id: activityId, text, tone }]);
    setActivityId((current) => current + 1);
  };

  const handleSubmit = async (value: string) => {
    const prompt = value.trim();

    if (!prompt || busy) {
      return;
    }

    setInput("");

    if (prompt.startsWith("/")) {
      handleCommand(prompt);
      return;
    }

    appendMessage("user", prompt);
    appendActivity("prompt submitted", "muted");
    setBusy(true);

    try {
      const result = await session.run(prompt);
      appendMessage("assistant", result.content.trim() || "(empty response)");
      appendActivity(activityFromResult(result), "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendMessage("error", message);
      appendActivity("turn failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleCommand = (command: string) => {
    if (command === "/exit" || command === "/quit") {
      exit();
      return;
    }

    if (command === "/clear") {
      setMessages([]);
      appendActivity("transcript cleared", "muted");
      return;
    }

    if (command === "/help") {
      appendMessage("system", [
        "Commands:",
        "/help        show commands",
        "/status      show provider and workspace state",
        "/extensions  list loaded extensions",
        "/skills      list loaded skills",
        "/tools       list loaded tools",
        "/clear       clear transcript",
        "/exit        quit"
      ].join("\n"));
      return;
    }

    if (command === "/status") {
      appendMessage("system", statusText({ runtime, provider, model, cwd, skills }));
      return;
    }

    if (command === "/extensions") {
      appendMessage("system", listText(
        "Extensions",
        runtime.listExtensions().map((extension) => `${extension.id} (${extension.tools?.length ?? 0} tools)`)
      ));
      return;
    }

    if (command === "/skills") {
      appendMessage("system", listText(
        "Skills",
        runtime.listSkills().map((skill) => `${skill.id} - ${skill.description}`)
      ));
      return;
    }

    if (command === "/tools") {
      appendMessage("system", listText(
        "Tools",
        runtime.listTools().map((tool) => `${tool.name} - ${tool.description}`)
      ));
      return;
    }

    appendMessage("error", `Unknown command: ${command}`);
  };

  return (
    <Box flexDirection="column" minHeight={height}>
      <Header provider={provider} model={model} cwd={cwd} busy={busy} />
      <Box flexGrow={1}>
        <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor="gray" paddingX={1}>
          <Text bold>Transcript</Text>
          <Box flexDirection="column" height={transcriptHeight}>
            {messages.slice(-10).map((message) => (
              <MessageView key={message.id} message={message} />
            ))}
          </Box>
        </Box>
        <Box width={34} flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} marginLeft={1}>
          <Text bold>Activity</Text>
          {activity.slice(-10).map((item) => (
            <Text key={item.id} color={activityColor(item.tone)}>
              {clip(item.text, 30)}
            </Text>
          ))}
          <Box marginTop={1} flexDirection="column">
            <Text bold>Status</Text>
            <Text color="cyan">{provider}</Text>
            <Text color="gray">{model ?? "default model"}</Text>
            <Text color="gray">{skills.length > 0 ? skills.join(", ") : "no skills"}</Text>
          </Box>
        </Box>
      </Box>
      <Box borderStyle="round" borderColor={busy ? "yellow" : "cyan"} paddingX={1}>
        <Text color={busy ? "yellow" : "cyan"}>{busy ? "busy" : "pi"} </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={busy ? "Waiting for the current turn..." : "Ask Pi or type /help"}
        />
      </Box>
    </Box>
  );
}

function Header({ provider, model, cwd, busy }: { provider: string; model?: string; cwd: string; busy: boolean }) {
  return (
    <Box justifyContent="space-between" borderStyle="single" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">Personal Pi</Text>
      <Text color="gray">{provider}{model ? ` / ${model}` : ""}</Text>
      <Text color={busy ? "yellow" : "green"}>{busy ? "thinking" : "ready"}</Text>
      <Text color="gray">{clip(cwd, 42)}</Text>
    </Box>
  );
}

function MessageView({ message }: { message: TranscriptMessage }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color={roleColor(message.role)} bold>{roleLabel(message.role)}</Text>
      {clipBlock(message.text, 10).map((line, index) => (
        <Text key={`${message.id}-${index}`} wrap="truncate">{line}</Text>
      ))}
    </Box>
  );
}

function roleLabel(role: Role): string {
  if (role === "assistant") {
    return "Pi";
  }

  if (role === "user") {
    return "You";
  }

  if (role === "error") {
    return "Error";
  }

  return "System";
}

function roleColor(role: Role): string {
  if (role === "assistant") {
    return "cyan";
  }

  if (role === "user") {
    return "green";
  }

  if (role === "error") {
    return "red";
  }

  return "gray";
}

function activityColor(tone: ActivityItem["tone"]): string {
  if (tone === "success") {
    return "green";
  }

  if (tone === "error") {
    return "red";
  }

  if (tone === "muted") {
    return "gray";
  }

  return "white";
}

function statusText({ runtime, provider, model, cwd, skills }: TuiAppProps): string {
  return [
    `provider: ${provider}`,
    `model: ${model ?? "default"}`,
    `cwd: ${cwd}`,
    `extensions: ${runtime.listExtensions().map((extension) => extension.id).join(", ") || "none"}`,
    `skills: ${skills.join(", ") || "none"}`,
    `tools: ${runtime.listTools().map((tool) => tool.name).join(", ") || "none"}`
  ].join("\n");
}

function listText(title: string, items: string[]): string {
  if (items.length === 0) {
    return `${title}: none`;
  }

  return [title, ...items.map((item) => `- ${item}`)].join("\n");
}

function activityFromResult(result: AgentRunResult): string {
  const raw = result.raw as { threadId?: string; usage?: { input_tokens?: number; output_tokens?: number } } | undefined;
  const thread = raw?.threadId ? `thread ${raw.threadId}` : result.provider;
  const usage = raw?.usage ? `, ${raw.usage.input_tokens ?? 0} in / ${raw.usage.output_tokens ?? 0} out` : "";

  return `${thread}${usage}`;
}

function clip(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function clipBlock(text: string, maxLines: number): string[] {
  const lines = text.split("\n");

  if (lines.length <= maxLines) {
    return lines;
  }

  return [...lines.slice(0, maxLines - 1), "…"];
}
