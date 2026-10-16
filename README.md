# Knit

**A multi-agent software team that knits a project together, from idea to shipped code.**

Knit is a team of specialist AI agents built on Claude Code. You describe what you want to
build; the **Manager** turns it into requirements and a plan, hands work to specialists, checks
their output, and loops through testing and review until the project works.

## Core team (every project)

| # | Agent | File | Model | Job |
|---|---|---|---|---|
| 1 | Manager | [`skills/knit/SKILL.md`](.claude/skills/knit/SKILL.md) | your session | Intake, gates, delegation, debug and review loops, final validation |
| 2 | Product Manager | [`product-manager.md`](.claude/agents/product-manager.md) | opus | PRD, `US-` user stories, acceptance criteria |
| 3 | Architect | [`architect.md`](.claude/agents/architect.md) | opus | Architecture, `openapi.yaml` contract, tasks, specialists needed |
| 4 | UI/UX Designer | [`ux-designer.md`](.claude/agents/ux-designer.md) | sonnet | Flows, screens, design system and tokens, visual check |
| 5 | Frontend Developer | [`frontend-dev.md`](.claude/agents/frontend-dev.md) | sonnet | Web UI from the design and API contract |
| 6 | Backend Developer | [`backend-dev.md`](.claude/agents/backend-dev.md) | sonnet | API, auth, data access, migrations |
| 7 | Tester | [`tester.md`](.claude/agents/tester.md) | sonnet | Unit, API and Playwright e2e tests mapped to stories |
| 8 | Debugger | [`debugger.md`](.claude/agents/debugger.md) | opus | Root cause of failures before anyone fixes |
| 9 | Code Reviewer | [`code-reviewer.md`](.claude/agents/code-reviewer.md) | opus | Bugs, contract drift; paired loop until approved |
| 10 | Security Reviewer | [`security-reviewer.md`](.claude/agents/security-reviewer.md) | opus | Threat model at design time, audit before release |
| 11 | DevOps | [`devops.md`](.claude/agents/devops.md) | sonnet | Tooling, Docker, CI/CD, deploy with smoke test |
| 12 | Tech Writer | [`tech-writer.md`](.claude/agents/tech-writer.md) | haiku | README, API docs, changelog from the real code |

## Optional specialists (called only when a project needs them)

| Agent | File | Model | When |
|---|---|---|---|
| UX Researcher | [`ux-researcher.md`](.claude/agents/ux-researcher.md) | sonnet | Personas, journeys, competitor scan before the PRD |
| Accessibility Tester | [`accessibility-tester.md`](.claude/agents/accessibility-tester.md) | sonnet | Public-facing apps (WCAG 2.2 AA) |
| Database Architect | [`database-architect.md`](.claude/agents/database-architect.md) | sonnet | Complex data, scaling, query tuning |
| Mobile Developer | [`mobile-developer.md`](.claude/agents/mobile-developer.md) | sonnet | iOS / Android (React Native + Expo, or Flutter) |
| AI/LLM Engineer | [`ai-engineer.md`](.claude/agents/ai-engineer.md) | sonnet | The app uses AI (chat, RAG, agents) |
| Performance Engineer | [`performance-engineer.md`](.claude/agents/performance-engineer.md) | sonnet | Slow pages, heavy traffic, pre-launch |
| Payment Integration | [`payment-integration.md`](.claude/agents/payment-integration.md) | sonnet | Stripe or Razorpay checkout (test mode) |
| SEO / Content Writer | [`seo-content-writer.md`](.claude/agents/seo-content-writer.md) | haiku | Marketing sites and landing pages |

The Manager is a **skill run by the main session**, not a subagent, because subagents in
Claude Code cannot spawn other subagents. Only the main session can delegate.
Models: `opus` for judgment-heavy roles, `sonnet` for building, `haiku` for writing tasks.
Change the `model:` line in any agent file to suit your plan.

## How a build flows

```
You ─► Manager ─► (UX Researcher) ─► Product Manager ─► Architect + Security threat model
                                                                │
                                                     ── Gate 1: you approve the plan
                                                                │
                                             UI/UX Designer (+ Database Architect)
                                                                │
          Backend Dev · Frontend Dev · DevOps · (Mobile · AI · Payments · SEO)   ← in parallel
                                                                │
                                                     ── Gate 2: first working build
                                                                │
                        Tester ──fail──► Debugger ──► owning dev ──► Tester
                                                                │ pass
         Code Reviewer ⇄ dev (until APPROVED) · Security audit · (Accessibility · Performance)
                                                                │
                         Tech Writer ─► Manager checks every acceptance criterion
                                                                │
                                                     ── Gate 3: you approve release
                                                                │
                                                  DevOps deploys + smoke test
```

Agents never talk to each other directly. They read and write handoff files in the target
project's `.knit/` folder (`prd.md`, `architecture.md`, `openapi.yaml`, `tasks.md`, `design.md`,
`test-report.md`, `review.md`, ...). The full list is in the [Manager skill](.claude/skills/knit/SKILL.md#handoff-files-projectknit).

## Use it

1. Open a Claude Code session in this `knit` folder (so the agents and skill load).
2. Run `/knit` and describe the project, e.g.
   `/knit Build a habit tracker web app with login, daily check-ins and streak stats`.
3. The Manager writes the brief, gets the PRD and plan ready, and asks for your go-ahead.

New projects are created as sibling folders (`../<project-name>`) unless you say otherwise.

To use the team in another repo, copy `.claude/agents/` and `.claude/skills/knit/` into that
repo, or into `~/.claude/` to make them available everywhere.

## Docs

- [docs/ROLES.md](docs/ROLES.md): every role in MetaGPT, ChatDev, CrewAI, AutoGen, OpenHands, wshobson/agents and VoltAgent, and how Knit maps to them
- [docs/SKILLS.md](docs/SKILLS.md): skills and MCP connectors per agent
- [docs/REFERENCES.md](docs/REFERENCES.md): existing multi-agent projects Knit learns from

## Roadmap

- [x] Agent roster and Manager playbook
- [x] Product Manager, Debugger and 8 optional specialists; paired review loop; model per agent
- [ ] Project templates (Next.js + FastAPI, Next.js full-stack, Expo mobile)
- [ ] Extra skills: `api-contract`, `test-plan`, `threat-model`, `release-checklist`
- [ ] Hooks: block edits to `.env`, run lint/tests after each agent finishes
- [ ] Standalone runner on the Claude Agent SDK (run Knit outside Claude Code)
- [ ] Dashboard showing tasks, agent status and reports
