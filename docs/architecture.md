# Architecture

Pi starts as a local coding agent with a deliberately small kernel.

## Principles

- The core owns orchestration, provider calls, extension loading, permissions, and session state.
- Extensions own domain-specific tools, extra instructions, and workflow shortcuts.
- Providers are adapters. The rest of the agent should not care whether the model is OpenAI, local, hosted, or something else.
- Dangerous capabilities must pass through a permission layer before they become default behavior.

## Runtime Flow

1. The CLI parses a user prompt and runtime options.
2. The extension loader imports configured extensions.
3. The runtime registers extension tools and merges system instructions.
4. The provider receives a composed prompt.
5. Later versions will let the provider request tool calls through the runtime.

## Extension Contract

An extension can provide:

- `systemPrompt`: guidance appended to the runtime prompt.
- `tools`: callable capabilities with names, descriptions, optional JSON schemas, and execute handlers.

Extensions should be ordinary npm packages whenever possible. Local file extensions are supported for fast iteration.

## Near-Term Build Plan

1. Implement provider-driven tool calls.
2. Add explicit permission decisions for shell and file writes.
3. Store sessions as JSONL for replay and debugging.
4. Ship a VS Code extension that wraps the CLI/runtime.
5. Add a first-party extension registry format.
