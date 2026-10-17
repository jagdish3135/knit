# Run log: `.knit/events.jsonl`

The Manager appends one JSON object per line to `<project>/.knit/events.jsonl` as the run happens.
It is the single source for the run report, the token usage report, Notion pages and the Knit Board UI.
Append only; never rewrite earlier lines.

## Fields

| Field | Required | Meaning |
|---|---|---|
| `ts` | yes | ISO 8601 time with offset, e.g. `2026-10-17T00:16:32+05:30` |
| `type` | yes | One of the types below |
| `agent` | most types | Agent name as in `.claude/agents/` (`backend-dev`), or `manager`, or `user` |
| `msg` | yes | One plain sentence: what happened |
| `phase` | no | `intake`, `requirements`, `plan`, `design`, `build`, `verify`, `ship` |
| `chunk` | no | Chunk number in chunk mode (0 = foundation) |
| `task` | no | Task number(s) from `tasks.md`, e.g. `"4-7"` |
| `file` | no | Handoff file written or passed on, e.g. `prd.md` |
| `to` | `handoff` | Agent that receives the file |
| `tokens`, `tool_uses`, `duration_ms` | `agent_end` | Usage the host reported when the agent handed back |
| `model` | no | `opus`, `sonnet`, `haiku` |
| `result` | no | `done`, `failed`, `stopped`, `approved`, `changes_requested`, `passed`, `found_issues` |
| `counts` | `test` | e.g. `{"passed": 110, "failed": 2}` |

## Types

| Type | When the Manager writes it |
|---|---|
| `phase` | A phase or chunk starts |
| `agent_start` | An agent is spawned or resumed (include `task`) |
| `agent_end` | An agent hands back (include usage and `result`) |
| `handoff` | A file goes from one agent to another (`agent` → `to`, `file`) |
| `gate` | A gate opens or the user answers it (`result`: `approved` or `changes_requested`) |
| `decision` | The Manager or the user decides something that changes the plan |
| `test` | A test run finishes (`counts`) |
| `review` | A review verdict or audit result |
| `commit` | A wave is committed (`msg` = commit subject) |
| `note` | Anything else worth keeping, e.g. a lesson for next time |

## Example

```json
{"ts":"2026-10-17T00:02:10+05:30","type":"agent_start","agent":"architect","phase":"plan","model":"opus","msg":"Architect writes architecture, contract and tasks"}
{"ts":"2026-10-17T00:10:02+05:30","type":"agent_end","agent":"architect","tokens":129408,"tool_uses":12,"duration_ms":472046,"result":"done","msg":"16 tasks in 6 waves, no specialists needed"}
{"ts":"2026-10-17T00:10:05+05:30","type":"handoff","agent":"architect","to":"security-reviewer","file":"openapi.yaml","msg":"Contract handed to security for the threat model"}
```

## Reports

```bash
node scripts/knit-report.mjs ../my-project
```

Writes `run-report.md`, `token-report.md` and `tokens.svg` into the project's `.knit/` folder.
No dependencies; Node 18 or newer.
