// Facts for the site, copied from the README's agent table and the board's station map.
const A = "https://github.com/jagdish3135/knit/blob/main/.claude/agents/";
export const CORE = [
  { key: "manager", name: "Manager", model: "your session", job: "Intake, build mode, gates, delegation, loops, final validation.", file: "https://github.com/jagdish3135/knit/blob/main/.claude/skills/knit-build/SKILL.md" },
  { key: "product-manager", name: "Product Manager", model: "opus", job: "PRD, US- user stories, acceptance criteria." },
  { key: "architect", name: "Architect", model: "opus", job: "Architecture, openapi.yaml contract, tasks grouped into chunks." },
  { key: "lean-coder", name: "Lean Coder", model: "sonnet", job: "Plan check and trim review: the best code is the code nobody had to write." },
  { key: "ux-designer", name: "UI/UX Designer", model: "sonnet", tag: "[ux]", job: "Flows, screens, design system and tokens, visual check." },
  { key: "frontend-dev", name: "Frontend Developer", model: "sonnet", tag: "[fe]", job: "Web UI from the design and API contract." },
  { key: "backend-dev", name: "Backend Developer", model: "sonnet", tag: "[be]", job: "API, auth, data access, migrations." },
  { key: "tester", name: "Tester", model: "sonnet", job: "Unit, API and Playwright e2e tests mapped to stories." },
  { key: "debugger", name: "Debugger", model: "opus", job: "Root cause of failures before anyone fixes." },
  { key: "code-reviewer", name: "Code Reviewer", model: "opus", job: "Bugs and contract drift; paired loop until approved." },
  { key: "security-reviewer", name: "Security Reviewer", model: "opus", job: "Threat model at design time, audit before release." },
  { key: "devops", name: "DevOps", model: "sonnet", tag: "[ops]", job: "Tooling, CI/CD, deploy with a smoke test." },
  { key: "tech-writer", name: "Tech Writer", model: "haiku", tag: "[docs]", job: "README, API docs, changelog from the real code." },
].map((a) => ({ file: `${A}${a.key}.md`, ...a }));

export const ONCALL = [
  { key: "ux-researcher", name: "UX Researcher", job: "Personas, journeys, competitor scan" },
  { key: "accessibility-tester", name: "Accessibility Tester", job: "WCAG 2.2 AA for public apps" },
  { key: "database-architect", name: "Database Architect", job: "Complex data, scale, query tuning" },
  { key: "mobile-developer", name: "Mobile Developer", job: "React Native + Expo, or Flutter" },
  { key: "ai-engineer", name: "AI/LLM Engineer", job: "AI features inside the app" },
  { key: "performance-engineer", name: "Performance Engineer", job: "Page speed, load, slow queries" },
  { key: "payment-integration", name: "Payment Integration", job: "Stripe or Razorpay, test mode only" },
  { key: "seo-content-writer", name: "SEO / Content Writer", job: "Marketing pages, meta tags, structured data" },
];

export const NAMES = Object.fromEntries([...CORE, ...ONCALL].map((a) => [a.key, a.name]));
NAMES.user = "You";
export const threadOf = (key) => (CORE.some((a) => a.key === key) ? key : "oncall");

// Same stations as the Knit Board (board/board.js).
export const STATIONS = [
  { name: "Intake", agents: ["manager"] },
  { name: "Requirements", agents: ["product-manager", "ux-researcher"] },
  { name: "Plan", agents: ["architect", "lean-coder", "security-reviewer"] },
  { name: "Design", agents: ["ux-designer", "database-architect"] },
  { name: "Build", agents: ["frontend-dev", "backend-dev", "devops", "mobile-developer", "ai-engineer", "payment-integration", "seo-content-writer"] },
  { name: "Verify", agents: ["tester", "debugger", "code-reviewer", "lean-coder", "security-reviewer", "accessibility-tester", "performance-engineer"] },
  { name: "Your OK", agents: ["manager", "user"] },
  { name: "Ship", agents: ["tech-writer", "devops"] },
];
export const PHASE = { intake: 0, requirements: 1, plan: 2, design: 3, build: 4, verify: 5, ship: 7 };

export const PROJECTS = [
  { name: "LexAgent", img: "media/lexagent.webp", live: "https://lexagent-ai.vercel.app", repo: "https://github.com/jagdish3135/lexagent", text: "Four AI agents read Indian legal case files, cross-check each other and hand you a PDF brief. Decision support, not a decision." },
  { name: "JanDrishti", img: "media/jandrishti.webp", live: "https://jandrishti-app.vercel.app", repo: "https://github.com/jagdish3135/jandrishti", text: "Central civic complaint dashboard: every complaint gets a named officer and a deadline, missed deadlines escalate automatically, and cases close only with verified proof photos." },
  { name: "Glim", img: "media/glim.webp", live: "https://glim-mcp.vercel.app", repo: "https://github.com/jagdish3135/glim", text: "MCP server for Instagram Business & Creator accounts: insights, two-step publishing, comments, DMs and hashtags via Meta's official Graph API. Demo mode included." },
  { name: "Calculator 2.0", img: "media/calculator.webp", live: "https://calculator-2-umber.vercel.app", repo: "https://github.com/jagdish3135/Calculator-2.0", text: "An animated calculator with a living number background. Its Knit run is the one replayed above." },
];
