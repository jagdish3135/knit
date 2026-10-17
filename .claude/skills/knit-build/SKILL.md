---
name: knit-build
description: Build or extend a software project the Knit way - a team's discipline (plan, lean check, design polish, tests, review, docs, live deploy) at the cost of one normal session. You do the work yourself, switching roles with short checklists; the multi-agent team is opt-in. Use when the user types /knit-build or /knit, says "build this with Knit", or asks for a project or feature to go from idea to shipped.
---

# Knit: build like a team, spend like one developer

**The rule that beats every other rule:** a Knit build must cost about the same as building the same thing in one
normal session. A team's value is its discipline, not its headcount. So by default **you** (this session) do all
the work, putting on each role's hat with the checklists in [roles.md](roles.md). No subagents, no long documents.
Anything that doesn't make the product better or safer is waste.

Knit lives at `<knit>` (scripts, board). Projects go in a sibling folder `../<name>` unless the user says otherwise.

**Start your first reply with `Knit v<version> · solo mode` (or `team mode`)**, so the user always knows which Knit
is running. (The installer fills in the number; if you see a placeholder instead, read `<knit>/VERSION`.)

## 1. Intake: one round of questions

Ask once, with the host's question tool (Claude Code: `AskUserQuestion`; recommended option first, marked
"(Recommended)"). Without one, ask a numbered list with lettered options. Skip anything the request already answers.

| Question | Options |
|---|---|
| Must-haves for v1? (multiSelect) | 3 or 4 suggested from the idea, plus "Other" |
| Stack? | **Simplest that fits (Recommended)** · I'll name it |
| Go live? | **Vercel (Recommended)** · GitHub Pages (static only) · Only locally |
| Mode? | **Solo: same cost as a normal session (Recommended)** · Team: parallel agents, costs more |

Then create `<project>/.knit/plan.md` (see 2) and start the run log and board (see "Watching the run").
"Simplest that fits": plain HTML/CSS/JS for single pages and small tools, a framework only when the app needs routing,
a server or a database.

## 2. Plan: one page, `.knit/plan.md`

Hard cap: **about 80 lines**. It replaces the PRD, architecture, design and task files.

```
# <Project>        Goal: one sentence. Users: one line.
## Stories         US-1 ... US-n, each with 1-3 testable acceptance bullets (v1: about 8 at most)
## Look            3-5 lines: feel, colors, type, light/dark, the polish checklist items that apply
## Build           stack, folder layout, data model or API in a few lines; only what a reader needs
## Tasks           - [ ] thin end-to-end slices in order, each naming the stories it delivers
## Decisions       anything the user decided, and risks
```

Before writing Tasks, run the **Lean** checklist on the plan: cut every task that doesn't need to exist.
Show the user the plan in chat (stories, stack, task list) and get a go-ahead. This is the only gate before building.

## 3. Build: slice by slice

For each task: put on the right hat (Designer, Builder), build the thinnest working slice, write tests only where
the Tester checklist says they earn their keep, run them, tick the task in `plan.md`, commit, and post one short
progress line to the user. Keep context small: read only the files a task touches; don't re-read what you just wrote.

## 4. Check: one pass, no extra agents

1. Run the full test suite, lint and build. Fix failures (Debugger hat: find the root cause first).
2. Put on the **Reviewer** hat and go through the diff once with its checklist (bugs, security, lean, accessibility,
   polish). Fix what you find immediately. Don't write a review document; list the fixes in the run log.
3. **Quality card.** This is what the user gets for Knit's few extra percent of tokens, so every item is checked for
   real (run it, click it, measure it), never from memory. Mark each `pass`, `fail` or `n/a` with a short detail:
   Tests · Build and lint · Core flow clicked in a browser · Light and dark theme with a working toggle ·
   Phone width (360 px, no sideways scroll) · Empty, loading and error states · Keyboard and focus ·
   Contrast and labels · Security basics (input validation, no secrets in code) · Lean pass · README with badge.
   Fix every `fail` before shipping, or tell the user plainly why it stays. Log the card as one `quality` event
   (`"items": [{"name", "status", "detail"}]`; the board's Watchguard shows it) and show it as a table in chat.

## 5. Ship

1. **Writer hat:** README with the Built with Knit badge on the first line, what it is, the live URL, how to run and test.
2. Tell the user what was built, how to try it, what's not done, and ask before anything goes public.
3. **Going live** (on approval): GitHub repo (private unless they say public), then Vercel by default (use a Vercel
   connector when the host has one; otherwise the Vercel CLI) or GitHub Pages for static sites. The user signs in to
   accounts themselves; never ask for, type or store a password or token. Local SQLite won't survive on Vercel:
   switch to a hosted database first. Smoke-test the live URL. Add a small "Built with Knit" footer link to
   https://jagdish3135.github.io/knit/ in the app:
   `[![Built with Knit](https://jagdish3135.github.io/knit/badge.svg)](https://jagdish3135.github.io/knit/)`
4. Write the reports: `node <knit>/scripts/knit-report.mjs <project>`. Notion only if the user asked (see below).

## Notion docs (only when the user asked)

At the end, publish to the **Projects** database on the **Knit Projects** page (search for it; if it's missing,
create the page and a database with Name, Status, Mode, Tests, Tokens, Agent runs, Started, Repo).
- One row per project, its page a short summary: goal, live URL, how to run, the quality card.
- Three child pages under it: **Plan** (`plan.md`), **Quality** (quality card, test results, review fixes) and
  **Run report** (`run-report.md` and the token report). Convert files with `node <knit>/scripts/notion-md.mjs <file>`.
- **Every page starts with a nav bar** so readers never get stuck in a side peek: a line of page mentions,
  `← Knit Projects · <Project> · Plan · Quality · Run report`, and the same line at the bottom.
- Update the same pages on later builds; never create duplicates. Never put secrets or `.env` values in Notion.

## Watching the run (board and run log)

- At intake, start the board in the background: `node <knit>/board/server.mjs <project> --open`. It opens in the
  user's own browser by itself (next free port from 4321). Read its first output lines: they give the URL, the Knit
  version and, if there is one, an update notice. Pass the URL and any update notice on to the user in chat.
- **Watchguard:** each time you check on a running command, server or agent, append a `watch` event
  (`"status": "ok" | "warn" | "stuck"`, short `msg`). The board shows these, and raises its own alert when nothing
  has happened for 5 minutes while work is running.
- Append one-line JSON events to `<project>/.knit/events.jsonl` (format: `<knit>/docs/EVENTS.md`): a `phase` event
  per step, `agent_start`/`agent_end` when you switch hats (`agent` = the role's name, e.g. `frontend-dev`),
  `test`, `commit`, `gate`. Keep `msg` short. Solo mode has no per-agent token numbers; leave them out.

## Keep it cheap (non-negotiable)

- **No document over its cap**, and no fact written twice. The plan is the only planning document.
- **Read narrowly:** grep, then read the lines you need. Never re-read a file you just wrote or a whole folder.
- **Tests that pay:** logic, money, security and the one or two core user flows. No tests for trivial code; one
  browser for e2e unless asked; no screenshot or e2e suite for a static single page if a quick manual check does.
- **No ceremony:** no threat model, API docs, design doc or review report unless the project has auth, payments or
  a public API; then a short section in `plan.md`.
- **Spend on the product:** time saved goes into the Designer's polish checklist, not paperwork.

## Watchdog (nothing runs unwatched)

- Every command must end on its own: use run-once flags (`vitest run`, `CI=1`), add a timeout, and never start
  watch modes, interactive prompts or anything that waits for input.
- Servers and long jobs run in the background only, and you stop them as soon as they're not needed.
- Before waiting on anything, check it. If a command or agent shows no progress for 5 minutes, look at its output,
  stop it, say what happened, and retry once a smaller way. Log it as a `note` event; the board shows it.

## Team mode (opt-in only)

Only when the user picks **Team** or explicitly asks for parallel agents. First say plainly that it costs more,
because every agent re-reads the project, and roughly how much more. Then read [team-mode.md](team-mode.md) and
follow it, with these limits on top: give each agent only the excerpt of `plan.md` its task needs, prefer
`sonnet`/`haiku`, run agents only on truly independent parts, and apply the watchdog to every agent.

## Running in other tools

The same playbook works in Codex, Cursor, OpenCode and Antigravity (install with `node <knit>/scripts/install.mjs`).
Solo mode needs no subagents, so it behaves the same everywhere. Without a question tool, ask as a numbered list.
