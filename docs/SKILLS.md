# Skills for Knit

Skills are reusable playbooks an agent loads when a task matches. Put project skills in
`.claude/skills/<name>/SKILL.md` (or `~/.claude/skills/` for every project).

## 1. Already available in your Claude Code (use them now)

| Skill | Best for agent | What it gives |
|---|---|---|
| `frontend-design` | UX Designer, Frontend Dev | Distinctive, production-grade UI, avoids generic AI look |
| `ui-ux-pro-max` | UX Designer | Styles, palettes, font pairings, UX guidelines, accessibility |
| `code-review` | Code Reviewer | Structured bug review of a diff or PR |
| `security-review` | Security Reviewer | Security review of pending changes on a branch |
| `simplify` | Code Reviewer, devs | Cleanups for reuse and simplicity |
| `run` | Tester, DevOps | Launch the app and confirm a change works |
| `init` | Architect | Generate a `CLAUDE.md` for a new codebase |
| `claude-api` | Backend Dev | When the project itself calls Claude / builds AI features |
| `dataviz` | Frontend Dev | Charts and dashboards that look consistent |
| `skill-creator` | you | Write and test new Knit skills (section 3) |
| `schedule`, `loop` | Manager | Recurring checks (nightly test runs, dependency audits) |
| `pdf`, `docx`, `xlsx`, `pptx` | Tech Writer | Docs, reports and decks as files |

## 2. Worth installing

- **Anthropic skills repo**: https://github.com/anthropics/skills — includes `webapp-testing`
  (Playwright-driven testing, great for the Tester), `mcp-builder` (when a project needs an MCP
  server), `frontend-design` and `skill-creator`.
- **Community subagent collections** for extra roles (data engineer, mobile dev, DBA, SRE):
  `wshobson/agents`, `VoltAgent/awesome-claude-code-subagents`. Copy only what you need and
  read each file before using it.

## 3. Knit skills to build next (with `skill-creator`)

| Skill | Agent | Purpose |
|---|---|---|
| `knit` | Manager | Done: the orchestration playbook |
| `api-contract` | Architect, Backend | Write an OpenAPI spec first, generate types for frontend and backend |
| `db-migration` | Backend | Safe schema changes, rollback plan, seed data |
| `design-tokens` | UX, Frontend | Turn `design.md` tokens into Tailwind config / CSS variables |
| `accessibility-audit` | UX, Tester | WCAG 2.2 AA checks with axe + keyboard walkthrough |
| `test-plan` | Tester | Acceptance criteria to test matrix (unit / API / e2e) |
| `e2e-playwright` | Tester | Standard Playwright setup, fixtures, CI run |
| `threat-model` | Security | STRIDE threat model from `architecture.md` |
| `perf-audit` | Code Reviewer | Lighthouse, bundle size, slow queries |
| `release-checklist` | DevOps | Version bump, changelog, tag, deploy, smoke test, rollback |
| `commit-and-pr` | DevOps | Conventional commits, PR description template |

## 4. MCP connectors that make the agents stronger

| Connector | Used by | Why |
|---|---|---|
| GitHub | Manager, DevOps, Reviewers | Issues, PRs, CI status |
| Playwright / browser | Tester, UX | Click through the real app, take screenshots |
| Context7 or docs search | all devs | Up-to-date library docs |
| Figma | UX, Frontend | Read designs directly |
| PostgreSQL | Backend, Tester | Inspect schema and data |
| Sentry | DevOps, Backend | Real production errors |
