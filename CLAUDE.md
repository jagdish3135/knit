# Knit

This repo defines a multi-agent software team for Claude Code.

- Agents live in `.claude/agents/`; the Manager playbook is the `knit` skill in `.claude/skills/knit/`.
- When the user asks to build a project or feature, load the `knit` skill and act as the Manager.
- Build target projects in sibling folders (`../<name>`), never inside this repo, unless told otherwise.
- When editing an agent file, keep its frontmatter (`name`, `description`, `tools`, `model`) valid
  and keep the `.knit/` handoff file names consistent across the README, the skill and every agent.
