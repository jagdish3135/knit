# Role catalog

Every agent role in the main open-source multi-agent projects, and where each idea landed in Knit.
Pulled from each repository through the GitHub API on 2026-10-16. Knit's agent files are written
from scratch; these projects were used as references, not copied.

| Repo | Stars | License | Status |
|---|---|---|---|
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | 71k | MIT | Last push Jan 2026 |
| [OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev) | 35k | Apache-2.0 | Active; 2.0 is now a general platform |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | 60k | MIT | Active |
| [microsoft/autogen](https://github.com/microsoft/autogen) | 61k | CC-BY-4.0 (docs) | Archived; successor is Microsoft Agent Framework |
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 91k | MIT | Active |
| [wshobson/agents](https://github.com/wshobson/agents) | 41k | MIT | Active |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 26k | MIT | Active |

## MetaGPT

- **Software team:** Product Manager, Architect, Project Manager, Engineer, QA Engineer
- **Newer agents:** Team Leader, Engineer2, SWE Agent, Data Analyst, Data Interpreter
- **Other:** Researcher, Searcher, Assistant, Teacher, Tutorial Assistant, Sales, Customer Service, Invoice OCR Assistant

## ChatDev

- **1.0 (virtual software company, `chatdev1.0` branch):** Chief Executive Officer, Chief Product Officer,
  Chief Technology Officer, Chief Human Resource Officer, Chief Creative Officer, Counselor, Programmer,
  Code Reviewer, Software Test Engineer
- **2.0 (DevAll, `main`):** zero-code platform; you define agents in YAML. Sample workflows include
  GameDev with a manager, deep research, data visualization, Blender 3D builders, reflexion and majority voting.

## CrewAI, AutoGen, OpenHands

- **CrewAI:** no fixed roles; every agent is user-defined with a role, goal and backstory.
- **AutoGen:** generic agent types: Assistant, User Proxy, Code Executor, Society of Mind, Message Filter;
  Magentic-One extension adds Web Surfer, File Surfer, Video Surfer and Coder.
- **OpenHands:** centered on one general-purpose coding agent rather than a team of roles.

## wshobson/agents (about 150 roles)

- **Lead / orchestration:** team-lead, orchestrate, conductor-validator, context-manager, tdd-orchestrator, business-analyst, startup-analyst
- **Architecture:** architect, architect-review, backend-architect, cloud-architect, hybrid-cloud-architect, kubernetes-architect, database-architect, graphql-architect, event-sourcing-architect, monorepo-architect, dotnet-architect, design-system-architect, c4-context, c4-container, c4-component, c4-code, service-mesh-expert
- **Design:** ui-designer, ui-ux-designer, ui-visual-validator, accessibility-expert, mermaid-expert, image-generator
- **Development:** frontend-developer, mobile-developer, ios-developer, flutter-expert, unity-developer, blockchain-developer, payment-integration, team-implementer; language experts for Python, TypeScript, JavaScript, Go, Rust, Java, C, C++, C#, PHP, Ruby, Scala, Elixir, Haskell, Julia, SQL, Bash, POSIX shell, Django, FastAPI, Temporal, ARM Cortex
- **Data / AI:** ai-engineer, ml-engineer, mlops-engineer, data-engineer, data-scientist, database-admin, database-optimizer, vector-database-engineer, prompt-engineer, LLM fine-tuning architect / training / eval engineers, eval-judge, eval-orchestrator, quant-analyst, risk-manager
- **Quality:** qa, test-automator, playwright, debugger, team-debugger, error-detective, code-reviewer, code-review-preshipment, team-reviewer, performance-engineer, review-policy-author, policy-enforcer
- **Security:** security-auditor, backend-security-coder, frontend-security-coder, mobile-security-coder, threat-modeling-expert, malware-analyst, reverse-engineer, firmware-analyst
- **Ops:** deployment-engineer, deploy-with-verification, devops-troubleshooter, incident-responder, observability-engineer, terraform-specialist, network-engineer, prod-logs-health-check, dx-optimizer, legacy-modernizer
- **Docs:** docs-architect, api-documenter, tutorial-engineer, reference-builder
- **Business:** content-marketer, sales-automator, customer-support, legal-advisor, hr-pro, search-specialist, 11 SEO agents (keyword strategist, content writer, meta optimizer, structure architect, ...)

## VoltAgent/awesome-claude-code-subagents (163 agents)

- **Core development:** api-designer, auth-integration-engineer, backend-developer, design-bridge, electron-pro, frontend-developer, fullstack-developer, graphql-architect, microservices-architect, mobile-developer, ui-designer, webhook-engineer, websocket-engineer
- **Language specialists (30):** Angular, C++, C#, Django, .NET, Elixir, Expo/React Native, FastAPI, Flutter, Go, Java, JavaScript, Kotlin, Laravel, Next.js, Node, PHP, PowerShell, Python, Rails, React, Rust, Spring Boot, SQL, Swift, Symfony, TypeScript, Vue
- **Infrastructure:** azure-infra-engineer, cloud-architect, database-administrator, deployment-engineer, devops-engineer, devops-incident-responder, docker-expert, incident-responder, kubernetes-specialist, network-engineer, platform-engineer, security-engineer, sre-engineer, terraform-engineer, terragrunt-expert, windows-infra-admin
- **Quality / security:** accessibility-tester, architect-reviewer, chaos-engineer, code-reviewer, compliance-auditor, debugger, error-detective, gdpr-ccpa-compliance, penetration-tester, performance-engineer, qa-expert, security-auditor, test-automator, ui-ux-tester, and more
- **Data / AI:** ai-engineer, data-analyst, data-engineer, data-scientist, database-optimizer, llm-architect, machine-learning-engineer, mlops-engineer, nlp-engineer, postgres-pro, prompt-engineer, reinforcement-learning-engineer
- **Developer experience:** build-engineer, cli-developer, dependency-manager, documentation-engineer, dx-optimizer, git-workflow-manager, legacy-modernizer, mcp-developer, readme-generator, refactoring-specialist, tooling-engineer
- **Specialized domains:** api-documenter, blockchain-developer, embedded-systems, fintech-engineer, game-developer, hipaa-compliance, iot-engineer, payment-integration, quant-analyst, seo-specialist
- **Business / product:** business-analyst, product-manager, project-manager, scrum-master, ux-researcher, technical-writer, backlog-grooming, landing-page-copywriter, legal-advisor, customer-success-manager
- **Meta-orchestration:** agent-organizer, context-manager, error-coordinator, knowledge-synthesizer, memory-curator, multi-agent-coordinator, task-distributor, workflow-orchestrator
- **Research:** competitive-analyst, market-researcher, project-idea-validator, research-analyst, trend-analyst, and more

## How Knit maps to them

| Knit agent | Closest roles elsewhere | Idea Knit took |
|---|---|---|
| Manager (skill) | MetaGPT Team Leader, ChatDev CEO, wshobson team-lead, VoltAgent multi-agent-coordinator | Gates, final validation of every acceptance criterion (wshobson conductor-validator) |
| product-manager | MetaGPT Product Manager, ChatDev CPO, VoltAgent product-manager | PRD with numbered stories before any design (MetaGPT SOP) |
| architect | MetaGPT Architect, ChatDev CTO, wshobson backend-architect | API-first contract, Mermaid diagrams |
| lean-coder | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) (MIT), VoltAgent refactoring-specialist | The reuse-first ladder, plan check and trim review |
| ux-designer | ChatDev CCO, wshobson ui-ux-designer and ui-visual-validator | Design system tokens, screenshot visual check |
| frontend-dev | wshobson frontend-developer, VoltAgent nextjs/react specialists | Stack-specific rules |
| backend-dev | MetaGPT Engineer, VoltAgent backend-developer, auth-integration-engineer | Auth and migration rules |
| tester | MetaGPT QA Engineer, ChatDev Test Engineer, wshobson playwright | Story-mapped tests, Playwright e2e |
| debugger | wshobson debugger / error-detective, VoltAgent debugger | Root cause before fixes |
| code-reviewer | ChatDev Code Reviewer, wshobson code-reviewer | Paired review loop with a verdict (ChatDev) |
| security-reviewer | wshobson security-auditor / threat-modeling-expert, VoltAgent penetration-tester | Threat model at design time + audit |
| devops | wshobson deploy-with-verification, VoltAgent devops-engineer | Smoke test after deploy |
| tech-writer | wshobson docs-architect, VoltAgent technical-writer | Docs from the real code |
| Optional specialists | ux-researcher, accessibility-tester, database-architect, mobile-developer, ai-engineer, performance-engineer, payment-integration, seo roles | Called only when the architect lists them |
