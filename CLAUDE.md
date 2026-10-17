# Knit

This repo defines a multi-agent software team for Claude Code.

- Agents live in `.claude/agents/`: 12 core agents plus 8 optional specialists. The Manager playbook is the `knit` skill in `.claude/skills/knit/`.
- When the user asks to build a project or feature, load the `knit` skill and act as the Manager.
- Build target projects in sibling folders (`../<name>`), never inside this repo, unless told otherwise.
- When editing an agent file, keep its frontmatter (`name`, `description`, `tools`, `model`) valid.
  Optional specialists start their description with "Optional specialist."
- Keep the `.knit/` handoff file names and the task tags (`[ux]` `[fe]` `[be]` `[ops]` `[db]` `[mobile]` `[ai]` `[pay]` `[seo]` `[docs]`)
  consistent across the README, the skill and every agent. Adding or renaming an agent means updating the README tables and the skill's team section.
