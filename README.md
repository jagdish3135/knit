# Knit

**A multi-agent software team that knits a project together, from brief to shipped code.**

Knit is a team of specialist AI agents built on Claude Code. You describe what you want to
build; the **Manager** turns it into a plan, hands work to specialists (architect, designer,
frontend and backend developers, tester, security and code reviewers, devops, tech writer),
checks their output, and loops until the project works.

## The team

| Agent | File | Job |
|---|---|---|
| Manager | [`.claude/skills/knit/SKILL.md`](.claude/skills/knit/SKILL.md) | Runs the main session: intake, planning gates, delegation, verification, report |
| Architect | [`architect.md`](.claude/agents/architect.md) | Architecture, data model, API contract, task breakdown |
| UI/UX Designer | [`ux-designer.md`](.claude/agents/ux-designer.md) | Flows, screens, design tokens, components, accessibility |
| Frontend Developer | [`frontend-dev.md`](.claude/agents/frontend-dev.md) | Builds the UI from the design and API contract |
| Backend Developer | [`backend-dev.md`](.claude/agents/backend-dev.md) | APIs, database, migrations, business logic |
| Tester | [`tester.md`](.claude/agents/tester.md) | Unit, integration and e2e tests; failure reports |
| Security Reviewer | [`security-reviewer.md`](.claude/agents/security-reviewer.md) | OWASP-style audit, secrets, dependencies |
| Code Reviewer | [`code-reviewer.md`](.claude/agents/code-reviewer.md) | Bugs, contract drift, duplication, performance |
| DevOps | [`devops.md`](.claude/agents/devops.md) | Tooling, Docker, CI/CD, deploy |
| Tech Writer | [`tech-writer.md`](.claude/agents/tech-writer.md) | README, API docs, changelog |

The Manager is a **skill run by the main session**, not a subagent, because subagents in
Claude Code cannot spawn other subagents. Only the main session can delegate.

## How a build flows

```
brief ──► Architect ──► UX Designer ──► Backend Dev ─┐
 (you +    plan +        design.md      Frontend Dev ─┤ (parallel)
 Manager)  tasks.md                     DevOps ───────┘
                                              │
                                              ▼
                     Tester ──► fixes loop back to the owning dev
                                              │
                                              ▼
                 Security Reviewer + Code Reviewer (parallel)
                                              │
                                              ▼
                         Tech Writer + DevOps ──► ship
```

Agents never talk to each other directly. They read and write handoff files in the target
project's `.knit/` folder:

| File | Written by |
|---|---|
| `brief.md` | Manager |
| `architecture.md`, `tasks.md` | Architect |
| `design.md`, `wireframes/` | UX Designer |
| `log.md` | every builder |
| `test-report.md` | Tester |
| `security-report.md` | Security Reviewer |
| `review.md` | Code Reviewer |
| `changelog.md` | Tech Writer |

You approve at three gates: after the plan, after the first working build, and before
anything is pushed or deployed.

## Use it

1. Open a Claude Code session in this `knit` folder (so the agents and skill load).
2. Run `/knit` and describe the project, e.g.
   `/knit Build a habit tracker web app with login, daily check-ins and streak stats`.
3. The Manager writes the brief, shows you the plan, and starts the team.

New projects are created as sibling folders (`../<project-name>`) unless you say otherwise.

To use the team in another repo, copy `.claude/agents/` and `.claude/skills/knit/` into that
repo, or into `~/.claude/` to make them available everywhere.

## Recommended skills and tools

See [docs/SKILLS.md](docs/SKILLS.md) for the skill list per agent and the MCP connectors worth adding.

## Prior art

See [docs/REFERENCES.md](docs/REFERENCES.md) for existing open-source multi-agent projects Knit learns from.

## Roadmap

- [x] Agent roster and Manager playbook
- [ ] Project templates (Next.js + FastAPI, Next.js full-stack, mobile)
- [ ] Extra skills: `api-contract`, `test-plan`, `threat-model`, `release-checklist`
- [ ] Hooks: block edits to `.env`, run lint/tests after each agent finishes
- [ ] Standalone runner on the Claude Agent SDK (run Knit outside Claude Code)
- [ ] Dashboard showing tasks, agent status and reports
