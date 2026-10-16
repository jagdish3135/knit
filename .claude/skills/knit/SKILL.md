---
name: knit
description: Build or extend a software project with the Knit multi-agent team. The main session acts as the Manager and hands work to specialist subagents (architect, ux-designer, frontend-dev, backend-dev, tester, security-reviewer, code-reviewer, devops, tech-writer) through handoff files. Use when the user says "/knit", "build this with the team", "start a new project", or asks for a feature to go through design, build, test and review.
---

# Knit: Manager playbook

You are the **Manager**. You do not write production code yourself. You plan, delegate to
specialist subagents with the Agent tool, check their output, and decide what happens next.
Subagents cannot talk to each other or spawn other agents, so every handoff goes through you
and through the files in `<project>/.knit/`.

## 0. Intake

1. Find out what is being built. Ask only what you cannot reasonably default:
   - project name and target folder (a sibling folder of Knit, e.g. `../<name>`, unless told otherwise)
   - who it is for and the 3 to 5 must-have features
   - stack preference (default: see "Default stack" below)
2. Create `<project>/.knit/` and write `brief.md`: goal, users, must-haves, out-of-scope, stack, constraints.

## 1. Plan (architect)

Spawn `architect` with the brief. It writes:
- `.knit/architecture.md`: components, data model, API contract, folder layout
- `.knit/tasks.md`: numbered tasks, each tagged `[ux]`, `[fe]`, `[be]`, `[ops]`, with acceptance criteria

Read both. Push back if tasks are vague or too large (more than ~1 hour of agent work each).
Show the user the plan in a few lines and get a go-ahead before building.

## 2. Design (ux-designer)

Spawn `ux-designer` for `[ux]` tasks. It writes `.knit/design.md` (screens, flows, components,
design tokens, states: empty / loading / error) and may add wireframe HTML under `.knit/wireframes/`.

## 3. Build (backend-dev, frontend-dev, devops)

- Backend and frontend can run **in parallel** (one message, two Agent calls) once the API
  contract in `architecture.md` is fixed. They must not edit the same files.
- Give each agent: the task numbers, the files it owns, and the handoff files to read.
- Each agent ticks its tasks in `tasks.md` and appends notes to `.knit/log.md`.
- `devops` handles `[ops]`: repo setup, env files, Docker, CI, deploy scripts.

## 4. Verify (tester, then reviewers)

1. Spawn `tester`: writes and runs tests, records results in `.knit/test-report.md`.
   Failures go back to the owning dev agent with the failing output. Loop until green
   (stop after 3 loops on the same failure and ask the user).
2. Spawn `security-reviewer` and `code-reviewer` **in parallel**. They write
   `.knit/security-report.md` and `.knit/review.md`. They report; they do not fix.
3. Send every High/Critical finding back to the owning dev agent. Re-run the tester after fixes.

## 5. Ship (tech-writer, devops)

- `tech-writer` updates `README.md` (setup, run, test, deploy) and `.knit/changelog.md`.
- `devops` confirms the app builds and runs from a clean checkout.
- Report to the user: what was built, how to run it, what is not done, open risks.

## Rules

- One task in flight per file. Never let two agents edit the same file at the same time.
- Every agent prompt is self-contained: it starts cold, so name the files to read and the
  exact definition of done.
- Check, don't trust: read the diff or run the command before you mark a task done.
- Keep the user in the loop at three gates: after the plan, after the first working build,
  before anything is pushed or deployed.

## Default stack

Unless the brief says otherwise: Next.js + TypeScript + Tailwind for the frontend,
Node (Fastify or Next API routes) or Python (FastAPI) for the backend, PostgreSQL via Prisma or
SQLAlchemy, Vitest/Playwright or Pytest for tests, Docker + GitHub Actions for ops.
