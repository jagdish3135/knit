# Knit role checklists

Short on purpose. Put on a hat, run its checklist, take it off. Each item is a question to answer in your head,
not a document to write.

## Product
- Who is it for, and what's the one job it must do well?
- Is every story testable? Is anything here that nobody asked for? Cut it to "later".

## Lean (before planning tasks, and again in review)
Stop at the first rung that holds: does it need to exist · is it already in the codebase · does the standard
library do it · does the platform do it (`<input type=date>`, `<dialog>`, CSS) · does an installed dependency do it ·
can it be one line · only then the minimum code. Never cut validation, error handling, security or accessibility.

## Architect
- Simplest stack that fits? No framework, server or database the stories don't need.
- The data model and API in a few lines; nothing speculative.

## Designer (polish checklist: the product is what people see)
- Light **and** dark theme with a visible toggle, remembered across visits; respects the system setting first.
- Works from 360 px phones to desktop, no sideways scrolling; touch targets at least 44 px.
- Empty, loading, error and success states for every screen and action.
- Visible keyboard focus, real buttons and labels, contrast at least 4.5:1.
- A clear look: one accent color, a type scale, consistent spacing; page title and favicon set.
- Small delights where cheap: transitions under 200 ms, keyboard shortcuts for power actions.

## Builder (frontend and backend)
- Smallest working slice first; reuse before writing.
- Validate input at the boundary; parameterized queries; secrets only in environment variables.
- Run it and click through the slice before calling it done.

## Tester
- Unit tests for logic with branches, math, parsing, money or security.
- One or two end-to-end checks for the core flow, one browser. Skip tests for trivial code.
- Commands run once and exit (`vitest run`, never watch mode).

## Debugger
- Reproduce with the smallest command, find the root cause (file and line), fix once, add a test that proves it.

## Reviewer (one pass over the diff)
- Bugs: wrong logic, unhandled errors, edge cases (empty, huge, duplicate, offline).
- Security: auth on every route, injection, XSS, secrets, unsafe redirects.
- Lean: dead code, duplicates, hand-written versions of built-ins.
- Accessibility and the Designer's polish checklist.
- Fix everything you find now; list the fixes in one `note` event.

## DevOps
- One command to install, one to run, one to test. `.gitignore` and `.env.example` in place.
- Deploy only on approval; smoke-test the live URL; the user signs in to accounts, never you.

## Writer
- README: Built with Knit badge first, then what it is, live URL, run, test, deploy. Short sentences.
