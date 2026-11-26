import fs from "node:fs";
import path from "node:path";

interface Rule {
  name: string;
  regex: RegExp;
}

const RULES: Rule[] = [
  { name: "AWS Access Key ID", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Private key header", regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { name: "GitHub Personal Access Token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g },
  { name: "Stripe live secret key", regex: /\bsk_live_[0-9a-zA-Z]{24,}\b/g },
  { name: "OpenAI API key", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g },
  { name: "Slack token", regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
];

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "storage",
  "playwright-report",
  "test-results",
  "docs/screenshots",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".yml",
  ".yaml",
  ".sql",
  ".sh",
  ".example",
]);

function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(process.cwd(), fullPath);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name) || IGNORE_DIRS.has(rel)) continue;
      walk(fullPath, out);
    } else if (entry.isFile()) {
      if (entry.name === ".env" || entry.name === ".env.local") {
        // .env nesmí být sledováno gitem (kontroluje se níže)
        continue;
      }
      if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
        out.push(fullPath);
      }
    }
  }
}

function main(): void {
  const files: string[] = [];
  walk(process.cwd(), files);

  const findings: Array<{ file: string; line: number; rule: string }> = [];

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    if (rel === "scripts/check-secrets.ts") continue;
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]!;
      for (const rule of RULES) {
        rule.regex.lastIndex = 0;
        if (rule.regex.test(line)) {
          findings.push({ file: rel, line: i + 1, rule: rule.name });
        }
      }
    }
  }

  if (findings.length > 0) {
    console.error("check:secrets NALEZENA PODEZŘELÁ TAJEMSTVÍ:");
    for (const f of findings) {
      console.error(`  - ${f.file}:${f.line} (${f.rule})`);
    }
    process.exit(1);
  }

  console.log(`check:secrets OK (${files.length} zkontrolovaných souborů, 0 tajemství).`);
}

main();
