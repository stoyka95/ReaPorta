import fs from "node:fs";
import path from "node:path";

interface Violation {
  file: string;
  line: number;
  rule: string;
  snippet: string;
}

const EXCLUDED_FILES = new Set([
  path.normalize("src/styles/tokens.css"),
  path.normalize("src/app/globals.css"),
]);

const HEX_COLOR_RE =
  /(?<![a-zA-Z0-9_-])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const RGB_HSL_RE = /\b(?:rgba?|hsla?)\s*\(/i;
const FORBIDDEN_TW_COLOR_RE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:blue|indigo|sky|cyan|purple|pink|rose|slate|zinc|neutral|stone|emerald|amber|red|green|yellow)-\d{2,3}\b/;
const INLINE_PX_RE =
  /(?:fontSize|padding|margin|gap|borderRadius|boxShadow|letterSpacing|lineHeight)\s*:\s*["'`][^"'`]*\d+px/;

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      walk(full, acc);
    } else if (entry.isFile() && /\.(tsx|css)$/.test(entry.name)) {
      // Satori OG image routes cannot read CSS variables
      if (entry.name.includes("opengraph-image")) continue;
      acc.push(full);
    }
  }
  return acc;
}

function main(): void {
  const root = process.cwd();
  const srcDir = path.join(root, "src");
  const files = walk(srcDir);
  const violations: Violation[] = [];

  for (const absPath of files) {
    const relPath = path.normalize(path.relative(root, absPath));
    if (EXCLUDED_FILES.has(relPath)) continue;

    const lines = fs.readFileSync(absPath, "utf-8").split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes("token-ok")) return;
      // Skip pure comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

      if (HEX_COLOR_RE.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "hex-color",
          snippet: trimmed.slice(0, 110),
        });
      }
      if (RGB_HSL_RE.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "raw-rgb-hsl",
          snippet: trimmed.slice(0, 110),
        });
      }
      if (FORBIDDEN_TW_COLOR_RE.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "forbidden-tailwind-palette",
          snippet: trimmed.slice(0, 110),
        });
      }
      if (INLINE_PX_RE.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          rule: "inline-px-style",
          snippet: trimmed.slice(0, 110),
        });
      }
    });
  }

  if (violations.length > 0) {
    console.error(`check:tokens selhal — nalezeno ${violations.length} porušení:`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line} [${v.rule}] ${v.snippet}`);
    }
    process.exit(1);
  }

  console.log(`check:tokens OK (${files.length} souborů v src/ bez pevných hodnot).`);
}

main();
