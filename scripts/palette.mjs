// One look for every agent, shared by the README graphics, the reports and the Knit Board.
// d1/d2: stroke paths on a 24x24 grid. light/dark: stroke color for light and dark backgrounds.
export const AGENTS = {
  manager: { name: "Manager", d1: "M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z", d2: "M8.5 12h7M12 8.5v7", light: "#8F6A00", dark: "#F2C230" },
  "product-manager": { name: "Product Manager", d1: "M12 3a9 9 0 1 0 0.01 0z", d2: "M12 8a4 4 0 1 0 0.01 0z", light: "#B4461F", dark: "#FF8A5B" },
  architect: { name: "Architect", d1: "M12 3.5L21 20H3z", d2: "M7.5 15h9M12 10v5", light: "#2B5FC2", dark: "#6EA8FF" },
  "lean-coder": { name: "Lean Coder", d1: "M6 4.5a2.5 2.5 0 1 0 0.01 0zM6 14.5a2.5 2.5 0 1 0 0.01 0z", d2: "M8.2 8.2L20 17M8.2 15.8L20 7", light: "#4F7A00", dark: "#C7F264" },
  "ux-designer": { name: "UI/UX Designer", d1: "M12 3l7 8-7 10-7-10z", d2: "M12 11v4", light: "#AD2F76", dark: "#FF7AC6" },
  "frontend-dev": { name: "Frontend Dev", d1: "M3 5h18v14H3z", d2: "M3 9h18M9 13l-2 2 2 2M15 13l2 2-2 2", light: "#0B7D8C", dark: "#4FD6E8" },
  "backend-dev": { name: "Backend Dev", d1: "M4 5h16v5H4zM4 14h16v5H4z", d2: "M7.5 7.5h.01M7.5 16.5h.01", light: "#5644CC", dark: "#9B8CFF" },
  devops: { name: "DevOps", d1: "M7 8a4 4 0 1 0 0 8c3 0 7-8 10-8a4 4 0 1 1 0 8c-3 0-7-8-10-8z", d2: "", light: "#7E43BA", dark: "#D4A5FF" },
  tester: { name: "Tester", d1: "M9 3h6M10 3v6l-5 10h14l-5-10V3", d2: "M7.5 15h9", light: "#1B7F57", dark: "#5AD1A0" },
  debugger: { name: "Debugger", d1: "M8 9a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0z", d2: "M4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2", light: "#A85A00", dark: "#FFB347" },
  "code-reviewer": { name: "Code Reviewer", d1: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", d2: "M12 9.5a2.5 2.5 0 1 0 0.01 0z", light: "#4A5563", dark: "#C3CEDB" },
  "security-reviewer": { name: "Security Reviewer", d1: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", d2: "M9 12l2 2 4-4", light: "#B8332C", dark: "#FF6B6B" },
  "tech-writer": { name: "Tech Writer", d1: "M6 3h9l4 4v14H6z", d2: "M9 11h7M9 15h7M9 7h4", light: "#7A5A30", dark: "#E8C9A0" },
  "ux-researcher": { name: "UX Researcher", optional: true, d1: "M12 3a9 9 0 1 0 0.01 0z", d2: "M15.5 8.5l-2 5-5 2 2-5z", light: "#22789A", dark: "#8FE3FF" },
  "accessibility-tester": { name: "Accessibility", optional: true, d1: "M12 4a1.6 1.6 0 1 0 0.01 0z", d2: "M5 9h14M12 9v5M9 21l3-7 3 7", light: "#2F7A2F", dark: "#A6F0A6" },
  "database-architect": { name: "Database Architect", optional: true, d1: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3v12c0 1.7-3.1 3-7 3s-7-1.3-7-3z", d2: "M5 6c0 1.7 3.1 3 7 3s7-1.3 7-3M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3", light: "#A04A78", dark: "#FFB8DC" },
  "mobile-developer": { name: "Mobile Dev", optional: true, d1: "M7 2.5h10v19H7z", d2: "M11 18h2", light: "#267A6A", dark: "#9FE7D8" },
  "ai-engineer": { name: "AI/LLM Engineer", optional: true, d1: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z", d2: "", light: "#866800", dark: "#FFE08A" },
  "performance-engineer": { name: "Performance", optional: true, d1: "M4 17a8 8 0 1 1 16 0", d2: "M12 17l4-5", light: "#A9472A", dark: "#FF9E80" },
  "payment-integration": { name: "Payments", optional: true, d1: "M3 6h18v12H3z", d2: "M3 10h18M7 15h4", light: "#356C9C", dark: "#A8D8FF" },
  "seo-content-writer": { name: "SEO / Content", optional: true, d1: "M12 3a9 9 0 1 0 0.01 0z", d2: "M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18", light: "#5E7A18", dark: "#D0F08A" },
};

export const THEMES = {
  light: { bg: "#FFFFFF", panel: "#F8F6F1", line: "#DCD7CB", ink: "#16181D", muted: "#525965", accent: "#C99200", faint: "#CFC8BA" },
  dark: { bg: "#0D1117", panel: "#151A22", line: "#2A3340", ink: "#E9EDF3", muted: "#A3AEBD", accent: "#F2C230", faint: "#36404D" },
};

// An agent's glyph as SVG markup at (x, y), drawn `size` px wide.
export const glyph = (key, x, y, size, mode, width = 1.8) => {
  const a = AGENTS[key], s = size / 24, c = a[mode];
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${c}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${a.d1}"/>${a.d2 ? `<path d="${a.d2}"/>` : ""}</g>`;
};
