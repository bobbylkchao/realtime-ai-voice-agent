# Claude Code (optional)

This folder is for **Claude Code** project-level configuration when you use it in this repository.

- **Project instructions for the AI** live in the repo root **`CLAUDE.md`** (same content as **`AGENTS.md`**).
- This repo includes a minimal **`settings.json`** (schema only). Extend it for shared [permissions / tool defaults](https://docs.anthropic.com/en/docs/claude-code/settings) as needed.
- Prefer **`settings.local.json`** for machine-specific overrides and add that filename to `.gitignore` if it contains personal paths or secrets.
