#!/usr/bin/env node
// Installs the Knit team into a project (or your user folders) for Claude Code, Codex, Cursor,
// OpenCode or Antigravity. Source of truth: .claude/agents/*.md and .claude/skills/knit-build/.
// Usage: node scripts/install.mjs <claude|codex|cursor|opencode|antigravity|all>... [--target <dir>] [--global]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const knit = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (f) => { const i = args.indexOf(f); return i < 0 ? undefined : args.splice(i, f === "--global" ? 1 : 2)[1] ?? true; };
const global = flag("--global") === true;
const target = resolve(flag("--target") ?? ".");
const TOOLS = ["claude", "codex", "cursor", "opencode", "antigravity"];
const tools = args.includes("all") ? TOOLS : args;
if (!tools.length || tools.some((t) => !TOOLS.includes(t))) {
  console.error(`Usage: node scripts/install.mjs <${TOOLS.join("|")}|all>... [--target <dir>] [--global]`);
  process.exit(1);
}
if (global && tools.includes("antigravity")) {
  console.error("Antigravity has no documented user-level folder for Knit; install it per project (without --global).");
  process.exit(1);
}

// Parse each agent file: simple `key: value` frontmatter, then the prompt body.
const agents = readdirSync(join(knit, ".claude/agents")).filter((f) => f.endsWith(".md")).sort().map((f) => {
  const [, fm, body] = readFileSync(join(knit, ".claude/agents", f), "utf8").replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = Object.fromEntries(fm.split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]));
  return { ...meta, tools: meta.tools.split(",").map((t) => t.trim()), body: body.trim() + "\n" };
});
const skill = join(knit, ".claude/skills/knit-build");
const home = homedir();
const base = (projectDir, userDir) => (global ? join(home, userDir) : join(target, projectDir));
const write = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };
// Installed copies live outside this repo, so the skill's `<knit>` placeholder becomes this repo's real path.
const copySkill = (dir) => {
  const out = join(dir, "knit-build");
  cpSync(skill, out, { recursive: true });
  const file = join(out, "SKILL.md");
  writeFileSync(file, readFileSync(file, "utf8").replaceAll("<knit>", knit.replace(/\\/g, "/")));
};
const can = (a, tool) => a.tools.includes(tool);
const yamlStr = (s) => JSON.stringify(s); // a JSON string is a valid YAML double-quoted scalar

// Tools that read AGENTS.md get one short note each; existing AGENTS.md content is kept.
const agentsMd = (tool, where, note) => {
  if (global) return;
  const file = join(target, "AGENTS.md"), mark = `<!-- knit:${tool} -->`;
  const old = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (old.includes(mark)) return;
  const head = old.includes("## Knit team") ? "" : "## Knit team\n\nTo build or extend this project with the Knit multi-agent team, load the `knit-build` skill (`/knit-build` where slash commands exist) and act as its Manager.\n\n";
  write(file, `${old}${old ? "\n" : ""}${head}${mark}\n- **${tool}:** role files are in \`${where}\`. ${note}\n`);
};

const installers = {
  claude() {
    const root = base(".claude", ".claude");
    cpSync(join(knit, ".claude/agents"), join(root, "agents"), { recursive: true });
    copySkill(join(root, "skills"));
    return root;
  },
  codex() {
    // Custom agents are TOML; the model is inherited, with reasoning effort set by role weight.
    const effort = { opus: "high", sonnet: "medium", haiku: "low" };
    const dir = base(".codex/agents", ".codex/agents");
    for (const a of agents) {
      if (a.body.includes("'''")) throw new Error(`${a.name}: body contains ''' and can't be a TOML literal string`);
      write(join(dir, `${a.name}.toml`), `name = ${JSON.stringify(a.name)}\ndescription = ${JSON.stringify(a.description)}\nmodel_reasoning_effort = "${effort[a.model] ?? "medium"}"\ndeveloper_instructions = '''\n${a.body}'''\n`);
    }
    copySkill(base(".agents/skills", ".agents/skills"));
    agentsMd("Codex", ".codex/agents/", "Codex delegates only when asked, so name the agent to spawn, e.g. \"spawn backend-dev for tasks 4-7\".");
    return dir;
  },
  cursor() {
    const dir = base(".cursor/agents", ".cursor/agents");
    for (const a of agents) write(join(dir, `${a.name}.md`), `---\nname: ${a.name}\ndescription: ${yamlStr(a.description)}\nmodel: inherit\nreadonly: ${!can(a, "Write") && !can(a, "Edit")}\n---\n\n${a.body}`);
    copySkill(base(".cursor/skills", ".cursor/skills"));
    return dir;
  },
  opencode() {
    const dir = base(".opencode/agents", ".config/opencode/agents");
    for (const a of agents) {
      const allow = (ok) => (ok ? "allow" : "deny");
      const perm = { edit: allow(can(a, "Write") || can(a, "Edit")), bash: allow(can(a, "Bash")), webfetch: allow(can(a, "WebFetch")), websearch: allow(can(a, "WebSearch")) };
      write(join(dir, `${a.name}.md`), `---\ndescription: ${yamlStr(a.description)}\nmode: subagent\npermission:\n${Object.entries(perm).map(([k, v]) => `  ${k}: ${v}`).join("\n")}\n---\n\n${a.body}`);
    }
    copySkill(base(".opencode/skills", ".config/opencode/skills"));
    return dir;
  },
  antigravity() {
    // No documented custom subagents: the Manager plays each role in turn (single-agent mode).
    const dir = join(target, ".agents/knit/agents");
    for (const a of agents) write(join(dir, `${a.name}.md`), `# ${a.name}\n\n${a.description}\n\n${a.body}`);
    copySkill(join(target, ".agents/skills"));
    agentsMd("Antigravity", ".agents/knit/agents/", "This tool has no custom subagents, so run in single-agent mode: take on each role in turn by reading its file (see \"Running in other tools\" in the skill).");
    return dir;
  },
};

for (const t of tools) console.log(`${t.padEnd(12)} ${agents.length} agents + knit-build skill -> ${installers[t]()}`);
