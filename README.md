# Personal Pi Setup

This repo is my setup layer for the real [Pi coding agent](https://pi.dev/).

It is not a custom agent loop, not a separate TUI, and not a fork. The goal is to keep upstream Pi as the daily interface and put personal behavior in places Pi already supports:

- `.pi/settings.json` for project-local defaults
- `.pi/extensions/` for small behavior tweaks and commands
- `.pi/skills/` for focused operating modes
- `.pi/prompts/` for reusable prompt templates
- `AGENTS.md` for baseline repo instructions
- `templates/` for global files that Pi expects under `~/.pi/agent/`

## Direction

The setup is built around three model lanes:

- **OpenAI Codex subscription** via Pi's `openai-codex` provider and `/login`
- **GitHub Copilot** via Pi's `github-copilot` provider and `/login`
- **OpenRouter** via `OPENROUTER_API_KEY` or Pi's auth file, with optional model overrides

The interface stays Pi's interface. Customization should be small enough that updating Pi remains boring.

## Install

```bash
npm install
npm run check
```

Then start Pi from this repo:

```bash
npm run pi
```

On first launch, run `/trust` so Pi can load the project-local `.pi` resources.

## Auth

Inside Pi, run:

```text
/login
```

Then choose:

- ChatGPT Plus/Pro (Codex)
- GitHub Copilot
- OpenRouter, or set `OPENROUTER_API_KEY`

Useful direct launches:

```bash
npx pi --provider openai-codex
npx pi --provider github-copilot --models "github-copilot/*"
OPENROUTER_API_KEY=... npx pi --provider openrouter --model moonshotai/kimi-k2.6
```

## Global OpenRouter Overrides

Pi loads custom model definitions from `~/.pi/agent/models.json`. This repo keeps a starter file at:

```text
templates/models.openrouter.example.json
```

Apply it manually when you want curated OpenRouter routing:

```bash
mkdir -p ~/.pi/agent
cp templates/models.openrouter.example.json ~/.pi/agent/models.json
```

Do not commit real secrets. Prefer `/login`, environment variables, or the macOS keychain/1Password command interpolation supported by Pi.

## Optional Model Cycling

Before auth, model cycling patterns can be noisy because Pi only lists available authenticated models. After `/login`, copy the `enabledModels` block from:

```text
templates/settings.enabled-models.example.json
```

into `.pi/settings.json` or `~/.pi/agent/settings.json`.

## What Lives Here

```text
.pi/
  settings.json
  extensions/pi-workbench.ts
  skills/review/SKILL.md
  skills/plan/SKILL.md
  prompts/provider-smoke.md
templates/
  models.openrouter.example.json
  settings.enabled-models.example.json
scripts/
  check-config.mjs
  doctor.mjs
AGENTS.md
```

## Useful Checks

```bash
npm run check
npm run doctor
npm run models:core
```

`models:core` requires network access and may depend on provider auth state.
