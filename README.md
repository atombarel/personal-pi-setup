# Personal Pi Setup

Personal Pi Setup is the local base for my own Pi-style coding agent. The goal is a first-party terminal interface with the feel of Claude Code / OpenCode, backed by Codex SDK and OpenRouter provider profiles.

This repo is set up around:

- A TypeScript CLI named `pi`
- A real Ink-based terminal UI with transcript, activity, status, and composer panes
- A core runtime that composes prompts, loads extensions, registers tools, and talks to provider adapters
- Primary providers for Codex SDK and OpenRouter
- A Codex exec fallback for one-shot shell workflows
- An extension SDK for adding tools, system instructions, and reusable skills
- A base extension with starter skills like `codex-goal`, `rtk`, and `extension-author`
- A sample `repo-inspector` extension
- Tests and GitHub Actions CI

## Quick Start

```bash
npm install
npm run build
npm run dev -- tui --config pi.config.example.json --profile echo
npm run dev -- run "summarize this repo" --extension ./examples/extensions/repo-inspector/src/index.ts
npm run dev -- skills --extension ./extensions/base/src/index.ts
npm run dev -- run "add a Redux Toolkit slice" --extension ./extensions/base/src/index.ts --skill rtk
```

The default provider is `echo`, so the command works without API keys.

## TUI

Use `pi tui` for the interactive agent interface:

```bash
npm run dev -- tui --profile codex
npm run dev -- tui --profile openrouter --skill codex-goal
```

The current TUI includes:

- Header with provider, model, workspace, and busy state
- Transcript pane
- Activity and status pane
- Bottom composer
- Slash commands for `/help`, `/status`, `/extensions`, `/skills`, `/tools`, `/clear`, and `/exit`

Codex SDK sessions keep a persistent Codex thread alive. OpenRouter sessions keep chat history alive in the Pi runtime.

## Provider Setup

### Codex SDK

Use this when I want Pi to run through my Codex OAuth / ChatGPT subscription login.

```bash
codex login
npm run dev -- run "what should I build next?" --provider codex-sdk
```

The `codex-sdk` provider uses `@openai/codex-sdk`, so it keeps Codex's existing browser login, cached credentials, token refresh, workspace controls, and subscription access while giving Pi a proper thread-based integration.

### OpenRouter

Use this when I want routed model access outside the Codex subscription path.

```bash
export OPENROUTER_API_KEY=...
npm run dev -- run "what should I build next?" --provider openrouter --model anthropic/claude-sonnet-4
```

### Codex Exec Fallback

Use this when a plain noninteractive Codex CLI bridge is enough.

```bash
npm run dev -- run "summarize this repo" --provider codex-exec
```

### OpenAI API Key

This path is still available, but it is intentionally separate from Codex subscription auth.

```bash
export OPENAI_API_KEY=...
npm run dev -- run "what should I build next?" --provider openai --model gpt-4.1-mini
```

## Profiles

For everyday switching, copy `pi.config.example.json` to `pi.config.json` and use profiles:

```bash
npm run dev -- run "use my default profile"
PI_PROFILE=codex npm run dev -- run "use the Codex SDK profile"
PI_PROFILE=openrouter npm run dev -- run "try OpenRouter"
```

## Project Shape

```text
packages/
  cli/             command line app
  core/            runtime, providers, extension loading
  extension-sdk/   public types and helpers for extensions
extensions/
  base/            first-party starter skills
examples/
  extensions/
    repo-inspector/
docs/
  architecture.md
```

## Extension Example

```ts
import { defineExtension } from "@pi/extension-sdk";

export default defineExtension({
  id: "my-extension",
  displayName: "My Extension",
  systemPrompt: "Prefer tiny, reversible changes.",
  skills: [
    {
      id: "my-skill",
      title: "My Skill",
      description: "A focused operating mode.",
      prompt: "Use this mode for one specific workflow."
    }
  ],
  tools: [
    {
      name: "hello",
      description: "Say hello from an extension.",
      execute: async () => ({ content: "hello from Pi" })
    }
  ]
});
```

## Current Roadmap

- Stream provider events into the TUI activity pane
- Add command/file-change/diff panes
- Add approval prompts
- Add workspace permission policies
- Add session storage and replay
- Add richer keyboard navigation and transcript scrolling
