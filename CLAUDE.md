# Knit

This repo defines a multi-agent software team for Claude Code.

- Agents live in `.claude/agents/`: 12 core agents plus 8 optional specialists. The Manager playbook is the `knit-build` skill in `.claude/skills/knit-build/` (type `/knit-build`).
- When the user asks to build a project or feature, load the `knit-build` skill and act as the Manager.
- Cost is the product: solo mode must stay within about 10% of a plain session. Re-run docs/BENCHMARK.md after
  changing SKILL.md or roles.md, and keep SKILL.md and roles.md short (they load on every build).
- Build target projects in sibling folders (`../<name>`), never inside this repo, unless told otherwise.
- When editing an agent file, keep its frontmatter (`name`, `description`, `tools`, `model`) valid.
  Optional specialists start their description with "Optional specialist."
- Keep the `.knit/` handoff file names and the task tags (`[ux]` `[fe]` `[be]` `[ops]` `[db]` `[mobile]` `[ai]` `[pay]` `[seo]` `[docs]`)
  consistent across the README, the skill and every agent. Adding or renaming an agent means updating the README tables and the skill's team section.
- Other tools get generated copies from `scripts/install.mjs`; never edit those copies. If you add an agent frontmatter field or a
  tool name, check that the installer still maps it (see docs/PORTABILITY.md).
