// One look for every agent, shared by the README graphics and the reports. The colours are the Loom
// thread colours from site/tokens.css (--t-<agent>, AA-safe as text); on-call specialists share the grey thread.
// d1/d2: stroke paths on a 24x24 grid. light/dark: stroke color for light and dark backgrounds.
export const AGENTS = {
  manager: { name: "Manager", d1: "M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z", d2: "M8.5 12h7M12 8.5v7", light: "#855A00", dark: "#F0B73A" },
  "product-manager": { name: "Product Manager", d1: "M12 3a9 9 0 1 0 0.01 0z", d2: "M12 8a4 4 0 1 0 0.01 0z", light: "#B23A22", dark: "#FF8A6E" },
  architect: { name: "Architect", d1: "M12 3.5L21 20H3z", d2: "M7.5 15h9M12 10v5", light: "#2C5AA8", dark: "#86AEFF" },
  "lean-coder": { name: "Lean Coder", d1: "M6 4.5a2.5 2.5 0 1 0 0.01 0zM6 14.5a2.5 2.5 0 1 0 0.01 0z", d2: "M8.2 8.2L20 17M8.2 15.8L20 7", light: "#466E0F", dark: "#B0DA62" },
  "ux-designer": { name: "UI/UX Designer", d1: "M12 3l7 8-7 10-7-10z", d2: "M12 11v4", light: "#AE2E6C", dark: "#FF8EC4" },
  "frontend-dev": { name: "Frontend Dev", d1: "M3 5h18v14H3z", d2: "M3 9h18M9 13l-2 2 2 2M15 13l2 2-2 2", light: "#0B6F6B", dark: "#55D9CF" },
  "backend-dev": { name: "Backend Dev", d1: "M4 5h16v5H4zM4 14h16v5H4z", d2: "M7.5 7.5h.01M7.5 16.5h.01", light: "#5A45B6", dark: "#AE9CFF" },
  devops: { name: "DevOps", d1: "M7 8a4 4 0 1 0 0 8c3 0 7-8 10-8a4 4 0 1 1 0 8c-3 0-7-8-10-8z", d2: "", light: "#863C88", dark: "#E4A2EE" },
  tester: { name: "Tester", d1: "M9 3h6M10 3v6l-5 10h14l-5-10V3", d2: "M7.5 15h9", light: "#286F43", dark: "#74D69A" },
  debugger: { name: "Debugger", d1: "M8 9a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0z", d2: "M4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2", light: "#A35000", dark: "#FFAA55" },
  "code-reviewer": { name: "Code Reviewer", d1: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", d2: "M12 9.5a2.5 2.5 0 1 0 0.01 0z", light: "#575D6C", dark: "#BEC5D4" },
  "security-reviewer": { name: "Security Reviewer", d1: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", d2: "M9 12l2 2 4-4", light: "#A3263A", dark: "#FF7A90" },
  "tech-writer": { name: "Tech Writer", d1: "M6 3h9l4 4v14H6z", d2: "M9 11h7M9 15h7M9 7h4", light: "#7A5230", dark: "#E6BE94" },
  "ux-researcher": { name: "UX Researcher", optional: true, d1: "M12 3a9 9 0 1 0 0.01 0z", d2: "M15.5 8.5l-2 5-5 2 2-5z", light: "#65615A", dark: "#A9A496" },
  "accessibility-tester": { name: "Accessibility", optional: true, d1: "M12 4a1.6 1.6 0 1 0 0.01 0z", d2: "M5 9h14M12 9v5M9 21l3-7 3 7", light: "#65615A", dark: "#A9A496" },
  "database-architect": { name: "Database Architect", optional: true, d1: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3v12c0 1.7-3.1 3-7 3s-7-1.3-7-3z", d2: "M5 6c0 1.7 3.1 3 7 3s7-1.3 7-3M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3", light: "#65615A", dark: "#A9A496" },
  "mobile-developer": { name: "Mobile Dev", optional: true, d1: "M7 2.5h10v19H7z", d2: "M11 18h2", light: "#65615A", dark: "#A9A496" },
  "ai-engineer": { name: "AI/LLM Engineer", optional: true, d1: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z", d2: "", light: "#65615A", dark: "#A9A496" },
  "performance-engineer": { name: "Performance", optional: true, d1: "M4 17a8 8 0 1 1 16 0", d2: "M12 17l4-5", light: "#65615A", dark: "#A9A496" },
  "payment-integration": { name: "Payments", optional: true, d1: "M3 6h18v12H3z", d2: "M3 10h18M7 15h4", light: "#65615A", dark: "#A9A496" },
  "seo-content-writer": { name: "SEO / Content", optional: true, d1: "M12 3a9 9 0 1 0 0.01 0z", d2: "M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18", light: "#65615A", dark: "#A9A496" },
};

export const THEMES = {
  light: { bg: "#F3EEE4", panel: "#FFFDF8", line: "#D9D0BF", ink: "#1E2A5A", muted: "#5E5A50", accent: "#C4432B", faint: "#C9C0AE" },
  dark: { bg: "#0D1230", panel: "#151B3D", line: "#272E58", ink: "#EDE8DD", muted: "#A9A6BE", accent: "#F07A5E", faint: "#3A4170" },
};

// An agent's glyph as SVG markup at (x, y), drawn `size` px wide.
export const glyph = (key, x, y, size, mode, width = 1.8) => {
  const a = AGENTS[key], s = size / 24, c = a[mode];
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${c}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${a.d1}"/>${a.d2 ? `<path d="${a.d2}"/>` : ""}</g>`;
};
