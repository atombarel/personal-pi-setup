# Agent Instructions

This repository is a personal setup layer for the real Pi coding agent from `@earendil-works/pi-coding-agent`.

Keep the repo focused on configuring Pi, not reimplementing it.

## Scope

This repo owns:

- project-local Pi settings in `.pi/settings.json`
- small Pi extensions in `.pi/extensions/`
- reusable Pi skills in `.pi/skills/`
- prompt templates in `.pi/prompts/`
- permission, theme, model, and tool-display templates under `templates/`
- setup, validation, and doctor scripts under `scripts/`
- documentation that explains how to run and maintain this setup

Pi owns:

- the TUI
- the agent loop
- provider runtimes
- auth storage
- patch/edit tooling
- shell execution
- session management

Do not rebuild those Pi internals here unless the user explicitly asks for a fork-level experiment.

## Change Policy

Prefer upstream Pi extension points over local runtime patches.

- Add or tune behavior through `.pi/settings.json`, `.pi/extensions/`, `.pi/skills/`, and `.pi/prompts/`.
- Keep local extensions small, auditable, and easy to delete when upstream Pi grows the feature.
- Pin project Pi packages in `.pi/settings.json`; avoid floating package references.
- Keep custom provider/model definitions out of this repo unless they are safe templates. Real machine-local definitions belong in `~/.pi/agent/models.json`.
- Do not commit runtime or secret-bearing state: `.env`, `.env.*`, `.pi/sessions/`, `.pi/npm/`, `.pi/agent/auth.json`, or `.pi/agent/models.json`.

## Skills

The project skills should be real operating modes, not placeholder slogans.

- `plan` should guide repo inspection, dependency ordering, vertical task slicing, acceptance criteria, checkpoints, risk handling, and verification.
- `review` should lead with actionable findings and assess correctness, readability, architecture, security, performance, and test coverage.
- Keep one skill per intended command. Do not keep duplicate alias directories for the same workflow.
- When importing external skills, copy only the skills this repo actually uses and adapt their metadata to the local command names.

## Documentation

When changing setup behavior, update the docs in the same change:

- `README.md` for user-facing setup and commands
- `docs/architecture.md` for ownership boundaries
- `SECURITY.md` for secret handling and safety expectations
- `templates/` examples when defaults or recommended modes change

Avoid documenting aspirational behavior as if it is already wired.

## Verification

Before handing off a change, run the smallest relevant checks. For repo-level setup changes, run:

```bash
npm run check
git diff --check
```

Run `npm run audit` when dependencies or package pins change.

Run `npm run doctor` when the change affects local Pi installation, auth/model expectations, permissions, tool display, or optional machine state.
