# Knit in other tools

The team is written once, in Claude Code's format (`.claude/agents/*.md` and `.claude/skills/knit-build/`).
`scripts/install.mjs` turns it into each tool's own format. No dependencies; Node 18 or newer.

```bash
# into a project (default: the current folder)
node scripts/install.mjs cursor --target ../my-project
# several tools at once
node scripts/install.mjs codex opencode --target ../my-project
# every tool
node scripts/install.mjs all --target ../my-project
# for every project on this computer (user folders); not available for Antigravity
node scripts/install.mjs claude cursor --global
```

## What gets written

| Tool | Agents | Knit skill | Delegation | Notes |
|---|---|---|---|---|
| **Claude Code** | `.claude/agents/*.md` | `.claude/skills/knit-build/` | Subagents, in parallel | Native format; full support |
| **Codex** | `.codex/agents/*.toml` | `.agents/skills/knit-build/` | Subagents, only when asked by name | Adds a note to `AGENTS.md`. Model is inherited; `opus` roles get `high` reasoning effort, `sonnet` `medium`, `haiku` `low` |
| **Cursor** | `.cursor/agents/*.md` | `.cursor/skills/knit-build/` | Subagents via the Task tool | `model: inherit`. Cursor also reads `.claude/agents/`, but its own folder wins |
| **OpenCode** | `.opencode/agents/*.md` | `.opencode/skills/knit-build/` | Subagents via the Task tool or `@name` | `mode: subagent`; each role's tool list becomes `permission` (edit, bash, webfetch, websearch) |
| **Antigravity** | `.agents/knit/agents/*.md` | `.agents/skills/knit-build/` | **Single-agent mode** | No documented custom subagents, so the Manager plays each role in turn. Adds a note to `AGENTS.md` |

`--global` writes to the user folders instead: `~/.claude/`, `~/.codex/agents/` + `~/.agents/skills/`,
`~/.cursor/`, `~/.config/opencode/`.

## Differences you will notice

- **Intake questions:** only Claude Code has clickable multiple-choice questions. Other tools get the same
  questions as a numbered list with lettered options; answer in one line, e.g. `1a 2c 3a`.
- **Parallel work:** Claude Code, Cursor and OpenCode can run builders side by side. Codex runs subagents when
  the Manager names them. Antigravity runs every role one after another, so a run takes longer.
- **Models:** only Claude Code uses the `opus` / `sonnet` / `haiku` choice per role. The other tools run every
  agent on the model you picked for the session (Codex adjusts reasoning effort instead).
- **Token report:** usage numbers come from what the tool reports when an agent hands back. Tools that don't
  report usage still get a run report, with blank token columns.

## Keeping it in sync

Edit the agents and the skill in `.claude/`, then re-run the installer. It overwrites the generated files and
leaves everything else (including the rest of `AGENTS.md`) alone.

Sources for each format: [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents),
[Cursor subagents](https://cursor.com/docs/agent/subagents), [Cursor skills](https://cursor.com/docs/context/skills),
[OpenCode agents](https://opencode.ai/docs/agents/), [OpenCode skills](https://opencode.ai/docs/skills/),
[Antigravity skills codelab](https://codelabs.developers.google.com/getting-started-with-antigravity-skills),
and [Ponytail's portability notes](https://github.com/DietrichGebert/ponytail/blob/main/docs/agent-portability.md).
