# Personal Pi Setup

Personal configuration for [Pi](https://pi.dev/), tuned for day-to-day coding work across Codex, GitHub Copilot, and OpenRouter-backed models.

The repository keeps Pi settings, local skills, prompt templates, model recipes, and setup checks in one place so a machine can be made ready with a small number of commands.

## Quick Start

```bash
npm install
npm run check
npm run pi
```

On the first interactive launch, trust the project so Pi loads the local `.pi` resources:

```text
/trust
```

Restart Pi after saving the trust decision.

For a one-off non-interactive run:

```bash
npx pi --approve -p "summarize this repo"
```

## Layout

```text
.
├── .pi/
│   ├── settings.json
│   ├── extensions/pi-workbench.ts
│   ├── skills/
│   └── prompts/
├── templates/
│   ├── models.openrouter.example.json
│   └── settings.enabled-models.example.json
├── scripts/
│   ├── check-config.mjs
│   └── doctor.mjs
├── AGENTS.md
└── package.json
```

## Running Pi

Default project settings use `openai-codex` with high thinking:

```bash
npm run pi
```

Pass Pi flags after `--`:

```bash
npm run pi -- --provider openai-codex
npm run pi -- --provider github-copilot
OPENROUTER_API_KEY=... npm run pi -- --provider openrouter --model moonshotai/kimi-k2.6
```

The local binary is also available through `npx`:

```bash
npx pi --provider openai-codex
```

## Providers

### OpenAI Codex

```bash
npm run pi -- --provider openai-codex
```

Authenticate from inside Pi:

```text
/login
```

Choose ChatGPT Plus/Pro (Codex). Pi stores and refreshes credentials in `~/.pi/agent/auth.json`.

### GitHub Copilot

```bash
npm run pi -- --provider github-copilot --models "github-copilot/*"
```

Authenticate through `/login`, then choose GitHub Copilot. If a model is unavailable, enable it from the VS Code Copilot Chat model selector first.

### OpenRouter

```bash
OPENROUTER_API_KEY=... npm run pi -- --provider openrouter --model moonshotai/kimi-k2.6
```

OpenRouter credentials can also be saved through `/login` or `~/.pi/agent/auth.json`.

## Model Files

Pi's custom provider and model definitions live at:

```text
~/.pi/agent/models.json
```

This repo includes an OpenRouter starter:

```bash
mkdir -p ~/.pi/agent
cp templates/models.openrouter.example.json ~/.pi/agent/models.json
```

Keep secrets out of this repository. Prefer `/login`, environment variables, 1Password, or macOS Keychain command interpolation for credentials.

## Model Cycling

Pi cycles models with `Ctrl+P` using the `enabledModels` setting.

The default project settings do not enable a cycling list because unauthenticated providers generate noisy warnings. After logging in, copy the block from:

```text
templates/settings.enabled-models.example.json
```

into either project settings or global settings:

```text
.pi/settings.json
~/.pi/agent/settings.json
```

## Local Resources

Paths in [`.pi/settings.json`](.pi/settings.json) resolve relative to `.pi`.

```json
{
  "extensions": ["extensions/pi-workbench.ts"],
  "skills": ["skills"],
  "prompts": ["prompts"]
}
```

Current resources:

- `/pi-status`: shows the personal setup status and provider lanes.
- `plan` skill: short planning mode for ambiguous work.
- `review` skill: findings-first code review mode.
- `provider-smoke` prompt: small read-only prompt for comparing providers.

## Checks

```bash
npm run check
npm run doctor
```

`check` validates local config and confirms the Pi binary version. `doctor` also reports optional auth/model state, including whether `~/.pi/agent/models.json` and `OPENROUTER_API_KEY` are present.
