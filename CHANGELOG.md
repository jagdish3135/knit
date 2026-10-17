# Changelog

## 0.3.0 · 2026-10-17

- **Version everywhere:** Knit says `Knit v0.3.0 · solo mode` at the start of every build, and the board shows the
  version. The board checks GitHub for a newer version and shows an update notice with the command to run.
- **Board opens by itself:** `/knit-build` starts the board with `--open`, so it opens in your browser and follows
  the run live. It moves to the next free port if 4321 is busy.
- **Watchguard:** an animated guard on the board. It shows what's running, flags anything silent for 5 minutes,
  lists `watch` alerts from the Manager, and turns to "Verified" when the quality card passes.
- **Quality card:** every build ends with 11 checks verified for real (tests, build, core flow in a browser,
  light/dark toggle, phone width, states, keyboard, contrast, security, lean, README), shown in chat and on the board.
- **Notion:** every doc page gets a nav bar at the top and bottom, so you can always get back to the project.

## 0.2.0 · 2026-10-17

- **Solo by default:** one session does the work with short role checklists, at about the cost of a plain session
  (+5% on the calculator benchmark). The multi-agent team is opt-in (team mode).
- One-page plan, one round of questions, cost rules, a watchdog for stuck commands, a design-polish checklist.

## 0.1.0 · 2026-10-16

- First version: 13 agents and 8 specialists, multiple-choice intake, chunk mode, Lean Coder, run log and reports,
  Knit Board, Notion docs, installer for Codex, Cursor, OpenCode and Antigravity, landing page.
