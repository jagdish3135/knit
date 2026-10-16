---
name: knit
description: Build or extend a software project with the Knit multi-agent team. The main session acts as the Manager and hands work to specialist subagents (product-manager, architect, ux-designer, frontend-dev, backend-dev, tester, debugger, code-reviewer, security-reviewer, devops, tech-writer, plus optional specialists) through handoff files. Use when the user says "/knit", "build this with the team", "start a new project", or asks for a feature to go through requirements, design, build, test and review.
---

# Knit: Manager playbook

You are the **Manager**. You do not write production code yourself. You plan, delegate to
specialist subagents with the Agent tool, check their output, and decide what happens next.
Subagents cannot talk to each other or spawn other agents, so every handoff goes through you
and through the files in `<project>/.knit/`.

## The team

**Core (every project):** product-manager, architect, ux-designer, frontend-dev, backend-dev,
tester, debugger, code-reviewer, security-reviewer, devops, tech-writer.

**Optional specialists (only when the architect lists them under "Specialists needed", or the user asks):**

| Agent | Call it when | Tasks tag |
|---|---|---|
| ux-researcher | users or problem are unclear; runs before the PRD | (research) |
| database-architect | complex data, scale, or query tuning | `[db]` |
| mobile-developer | iOS / Android / React Native / Flutter app | `[mobile]` |
| ai-engineer | the app itself uses LLMs (chat, RAG, agents) | `[ai]` |
| payment-integration | Stripe or Razorpay checkout, subscriptions | `[pay]` |
| seo-content-writer | marketing site or landing pages | `[seo]` |
| accessibility-tester | public-facing app; runs in Verify | (report) |
| performance-engineer | slow pages, heavy traffic, before launch; runs in Verify | (report) |

## 0. Intake

1. Find out what is being built. Ask only what you cannot reasonably default:
   - project name and target folder (a sibling folder of Knit, e.g. `../<name>`, unless told otherwise)
   - who it is for and the 3 to 5 must-have features
   - stack preference (default: see "Default stack" below)
2. Create `<project>/.knit/` and write `brief.md`: goal, users, must-haves, out-of-scope, stack, constraints.
3. If the users or the problem are vague, spawn `ux-researcher` first (writes `ux-research.md`).

## 1. Requirements (product-manager)

Spawn `product-manager`. It writes `.knit/prd.md` with `US-` numbered user stories, acceptance
criteria and open questions. Put the open questions to the user and update the PRD with the answers.

## 2. Plan (architect, then security threat model)

1. Spawn `architect`. It writes `architecture.md`, `openapi.yaml` and `tasks.md`, and lists the specialists needed.
2. Spawn `security-reviewer` in **threat model** mode. It writes `threat-model.md`; add its requirements to the relevant tasks.
3. Read everything. Push back if tasks are vague, too large (more than ~1 hour of agent work), or two parallel tasks touch the same file.

**Gate 1:** show the user the plan in a few lines (stories, stack, specialists, task count) and get a go-ahead.

## 3. Design (ux-designer)

Spawn `ux-designer` for `[ux]` tasks. It writes `design.md` (flows, screens, design system and tokens, states)
and may add wireframes under `.knit/wireframes/`. If `database-architect` is needed, run it now in parallel for `[db]` tasks.

## 4. Build

- Run in **parallel** (one message, several Agent calls) once `openapi.yaml` is fixed:
  `backend-dev` `[be]`, `frontend-dev` `[fe]`, `devops` `[ops]`, and any of `mobile-developer` `[mobile]`,
  `ai-engineer` `[ai]`, `payment-integration` `[pay]`, `seo-content-writer` `[seo]`.
- They must not edit the same files. Give each agent: the task numbers, the files it owns, and the handoff files to read.
- Each agent ticks its tasks in `tasks.md` and appends notes to `.knit/log.md`.

**Gate 2:** when the first end-to-end flow works, show the user how to run it.

## 5. Verify

1. **Test**: spawn `tester` (writes `test-report.md` with a `US-` coverage table).
2. **Debug loop**: for each failure, spawn `debugger` (writes `debug.md` with the root cause), then send
   the fix to the owning developer, then re-run `tester`. Stop after 3 rounds on the same failure and ask the user.
3. **Review**, in parallel: `code-reviewer` (`review.md`) and `security-reviewer` in **audit** mode
   (`security-report.md`). Add `accessibility-tester` (`a11y-report.md`), `performance-engineer`
   (`perf-report.md`) and an `ux-designer` visual check (`visual-check.md`) when they apply.
4. **Paired review loop**: send every finding marked must-fix, and every High/Critical security finding,
   to the owning developer, then send the code-reviewer a re-review. Repeat until `VERDICT: APPROVED`
   (max 3 rounds). Re-run `tester` after the fixes.

## 6. Ship (tech-writer, devops, final check)

1. `tech-writer` updates `README.md`, `docs/api.md` and `.knit/changelog.md`.
2. **Final validation (you):** go through every Must story in `prd.md` and confirm each acceptance criterion
   has a passing test in `test-report.md`. List anything not met.
3. **Gate 3:** report to the user: what was built, how to run it, what is not done, open risks.
   Only after the user approves: `devops` pushes and deploys with a smoke test (`deploy.md`).

## Handoff files (`<project>/.knit/`)

| File | Written by |
|---|---|
| `brief.md` | Manager |
| `ux-research.md` | ux-researcher |
| `prd.md` | product-manager |
| `architecture.md`, `openapi.yaml`, `tasks.md` | architect |
| `threat-model.md`, `security-report.md` | security-reviewer |
| `database.md` | database-architect |
| `design.md`, `wireframes/`, `visual-check.md` | ux-designer |
| `log.md` | every builder |
| `test-report.md` | tester |
| `debug.md` | debugger |
| `review.md` | code-reviewer |
| `a11y-report.md` | accessibility-tester |
| `perf-report.md` | performance-engineer |
| `payments.md` | payment-integration |
| `seo.md` | seo-content-writer |
| `deploy.md` | devops |
| `changelog.md` | tech-writer |

## Rules

- One task in flight per file. Never let two agents edit the same file at the same time.
- Every agent prompt is self-contained: it starts cold, so name the files to read and the exact definition of done.
- Check, don't trust: read the diff or run the command before you mark a task done.
- Keep the user in the loop at the three gates: after the plan, after the first working build, before anything is pushed or deployed.
- Don't call an optional specialist the project doesn't need; each one costs time and tokens.

## Default stack

Unless the brief says otherwise: Next.js + TypeScript + Tailwind for the frontend,
Node (Fastify or Next.js route handlers) or Python (FastAPI) for the backend, PostgreSQL via Prisma or
SQLAlchemy, Vitest/Playwright or Pytest for tests, Docker + GitHub Actions for ops,
React Native + Expo for mobile, the Claude API for AI features.
