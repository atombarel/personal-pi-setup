# Agent Instructions

Use `zsh -lc` for shell commands.

This repository configures the real Pi coding agent from `@earendil-works/pi-coding-agent`. Do not rebuild an agent loop, provider runtime, patch engine, or TUI here unless explicitly asked.

Prefer upstream Pi extension points:

- `.pi/settings.json` for defaults
- `.pi/extensions/` for behavior
- `.pi/skills/` for reusable operating modes
- `.pi/prompts/` for prompt templates
- `~/.pi/agent/models.json` for custom model/provider definitions

Keep this setup easy to rebase mentally against upstream Pi. Small local extensions are good; replacing core Pi behavior is a last resort.
