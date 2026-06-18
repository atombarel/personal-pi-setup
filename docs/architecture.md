# Architecture

Pi starts as a personal coding agent with a deliberately small kernel and a first-party terminal interface. The TUI should feel closer to Claude Code / OpenCode than to a plain prompt wrapper.

## Principles

- The core owns orchestration, provider calls, extension loading, permissions, and session state.
- The TUI owns the user workspace: transcript, activity, status, composer, and eventually diffs and approvals.
- Extensions own domain-specific tools, extra instructions, skills, and workflow shortcuts.
- Providers are adapters. The rest of the agent should not care whether the model is OpenAI, local, hosted, or something else.
- Provider profiles make switching cheap: `echo` for no-key local testing, `codex-sdk` for Codex OAuth/subscription access through `@openai/codex-sdk`, `codex-exec` as a shell fallback, and `openrouter` for routed multi-model access.
- Dangerous capabilities must pass through a permission layer before they become default behavior.

## Runtime Flow

1. The CLI parses a user prompt and runtime options.
2. The extension loader imports configured extensions.
3. The runtime registers extension tools and merges system instructions.
4. Selected skills are appended as focused operating-mode instructions.
5. The provider receives a composed prompt.
6. `pi run` executes a single provider call; `pi tui` keeps a provider session alive across turns.
7. The Ink TUI renders transcript, activity, status, and composer panes.
8. Later versions will stream provider events, command activity, file changes, and approvals into the TUI.

## Extension Contract

An extension can provide:

- `systemPrompt`: guidance appended to the runtime prompt.
- `tools`: callable capabilities with names, descriptions, optional JSON schemas, and execute handlers.
- `skills`: named instruction bundles that can be activated for a single run.

Extensions should be ordinary npm packages whenever possible. Local file extensions are supported for fast iteration.

## Skill Contract

A skill is a lightweight operating mode:

- `id`: stable command-line identifier, such as `codex-goal` or `rtk`.
- `title`: human-friendly label.
- `description`: one-line purpose shown by `pi skills`.
- `prompt`: focused instructions appended only when the skill is selected.

Skills should be narrow. Prefer several small skills over one broad "do everything" prompt.

## Provider Profiles

`pi.config.json` can define named provider profiles:

```json
{
  "activeProfile": "echo",
  "profiles": {
    "codex": {
      "provider": "codex-sdk",
      "codexSandbox": "workspace-write"
    },
    "codex-exec": {
      "provider": "codex-exec",
      "codexSandbox": "workspace-write"
    },
    "openai-api": {
      "provider": "openai",
      "model": "gpt-4.1-mini"
    },
    "openrouter": {
      "provider": "openrouter",
      "model": "anthropic/claude-sonnet-4"
    }
  }
}
```

Precedence is: CLI flags, environment variables, selected profile, flat config defaults, then `echo`.

## TUI

`pi tui` is the first-party terminal interface. It is built with Ink and React.

Current scope:

- Persistent Codex SDK thread for `codex-sdk`.
- Persistent OpenRouter chat history for `openrouter`.
- Header with provider/model/workspace/busy state.
- Transcript pane.
- Activity and status pane.
- Bottom composer.
- Slash commands for status, loaded extensions, skills, tools, clear, and exit.

Next scope:

- Streamed provider events.
- Command and tool-call activity.
- File-change and diff panes.
- Approval prompts.
- Keyboard navigation and transcript scrolling.

## Near-Term Build Plan

1. Stream provider events into the TUI.
2. Add command/file-change/diff panes.
3. Add explicit permission decisions for shell and file writes.
4. Store sessions as JSONL for replay and debugging.
5. Add richer keyboard navigation and transcript scrolling.
