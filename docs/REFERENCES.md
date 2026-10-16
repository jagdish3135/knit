# Existing multi-agent projects

Projects to study before extending Knit. Check each repo's current status and license yourself.

## Software-company simulators (closest to Knit)

- **MetaGPT** — https://github.com/FoundationAgents/MetaGPT
  Product manager, architect, project manager, engineer and QA roles follow standard
  operating procedures from requirements to code. Best reference for role prompts and handoff documents.
- **ChatDev** — https://github.com/OpenBMB/ChatDev
  A virtual software company (CEO, CTO, programmer, tester) running a waterfall lifecycle
  through chat between agents.
- **AgentMesh** (paper) — https://arxiv.org/abs/2507.19902
  Planner, coder, debugger and reviewer agents; a small, readable design.

## General multi-agent frameworks (to build a standalone Knit runner)

- **Claude Agent SDK** — https://docs.claude.com/en/docs/agent-sdk/overview
  Same agent loop as Claude Code, with subagents, skills, hooks and MCP. Natural next step for Knit.
- **CrewAI** — https://github.com/crewAIInc/crewAI — role-based crews with tasks and processes.
- **AutoGen** — https://github.com/microsoft/autogen — conversational multi-agent framework (archived; successor is Microsoft Agent Framework).
- **OpenHands** — https://github.com/OpenHands/OpenHands — autonomous coding agent platform.

## Claude Code subagent collections

- **wshobson/agents** — https://github.com/wshobson/agents
- **VoltAgent/awesome-claude-code-subagents** — https://github.com/VoltAgent/awesome-claude-code-subagents
- **anthropics/skills** — https://github.com/anthropics/skills

## What Knit does differently

- Lives inside Claude Code: no extra framework, runs in your normal session.
- File-based handoffs in `.knit/`, so every decision is readable and editable by you.
- Explicit verification loop (tester and two reviewers) before anything ships.
- Human approval gates at plan, first build and release.
