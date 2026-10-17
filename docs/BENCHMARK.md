# Benchmark: Knit vs a plain session

Knit's rule is that a build costs about the same as building the same thing in one normal session.
This is how we check it. Same request, same model (Opus), run side by side on 2026-10-17.

## The request

A one-page calculator: + − × ÷ with decimals, clear, backspace, full keyboard input, a history of the last
10 calculations (click to reuse), a light/dark toggle. Static HTML/CSS/JS, no framework.

## Results

| | Plain session | **Knit v0.2 (solo, default)** | Knit v0.1 (team) |
|---|---:|---:|---:|
| Tokens | 117,960 | **124,120** (+5%) | 268,021 |
| Time | 4 m 30 s | 5 m 56 s | - |
| Tool calls | 39 | 32 | - |
| Code (lines, excl. tests) | 622 | 447 | - |
| Tests | 21 logic checks | 11 unit tests + 22 scripted browser checks | - |
| Extras | - | one-page plan, run log, run and token reports, README with badge, favicon, screen-reader announcements | - |

Both apps worked and both builds were checked in a real browser. The Knit build wrote less code, checked more
in the browser and left a plan, a run log and a README behind, for 5% more tokens. The v0.1 team mode (11 agents,
long handoff documents) cost 2.3 times as much for the same kind of app; that's why solo is now the default.

Token numbers are what each run reported when it finished (subagent usage), so both columns are measured the
same way. The v0.1 figure is from an earlier team-mode calculator run in the user's Notion Projects database.

## How to repeat it

Give two fresh agents on the same model the request above. Tell one to "work the way you normally would" and the
other to follow `.claude/skills/knit-build/SKILL.md` with the intake pre-answered (simplest stack, only locally,
solo). Compare the reported tokens, then open both apps. Add new rows here when the playbook changes.
