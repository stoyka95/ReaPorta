import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

interface DirectionSpec {
  id: "a" | "b" | "c";
  fileName: string;
  label: string;
  renderSvg: (mode: "color" | "dark" | "light", uid?: string) => string;
}

// Direction A: Oblouk-brána (monogram R s klenutým otvorem)
function renderDirectionA(mode: "color" | "dark" | "light", uid = "a"): string {
  const fill = mode === "dark" ? "#17171E" : mode === "light" ? "#FFFFFF" : `url(#rp-grad-${uid})`;
  const defs =
    mode === "color"
      ? `<defs><linearGradient id="rp-grad-${uid}" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#8560F5"/><stop offset="100%" stop-color="#5B2FC2"/></linearGradient></defs>`
      : "";
  // Single compound path: R monogram with arched gateway counter cut cleanly out of the base
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">${defs}<path fill-rule="evenodd" clip-rule="evenodd" d="M7 5h14.5C28.8 5 33.5 9.1 33.5 15.2c0 4.3-2.4 7.6-6.2 9.1L34 35h-8.1l-4.9-8.8A4.2 4.2 0 0 0 13 28.4V35H7V5Zm7.2 13.6h6.8c2.8 0 4.6-1.4 4.6-3.5 0-2.2-1.8-3.6-4.6-3.6h-6.8v7.1Z" fill="${fill}"/></svg>`;
}

// Direction B: Oblouk + bod (čistá architektonická brána s bodem polohy / světlem uvnitř)
function renderDirectionB(mode: "color" | "dark" | "light", uid = "b"): string {
  const fill = mode === "dark" ? "#17171E" : mode === "light" ? "#FFFFFF" : `url(#rp-grad-${uid})`;
  const dotFill = mode === "dark" ? "#17171E" : mode === "light" ? "#FFFFFF" : "#6D3FE0";
  const defs =
    mode === "color"
      ? `<defs><linearGradient id="rp-grad-${uid}" x1="5" y1="4" x2="35" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#8560F5"/><stop offset="55%" stop-color="#6D3FE0"/><stop offset="100%" stop-color="#5B2FC2"/></linearGradient></defs>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">${defs}<path d="M6 35V18C6 10.268 12.268 4 20 4s14 6.268 14 14v17h-7.2V18a6.8 6.8 0 1 0-13.6 0v17H6Z" fill="${fill}"/><circle cx="20" cy="24.5" r="4.1" fill="${dotFill}"/></svg>`;
}

// Direction C: Skleněná dlaždice (zaoblený čtverec s klenutým výřezem a jemným přechodem)
function renderDirectionC(mode: "color" | "dark" | "light", uid = "c"): string {
  const fill = mode === "dark" ? "#17171E" : mode === "light" ? "#FFFFFF" : `url(#rp-grad-${uid})`;
  const defs =
    mode === "color"
      ? `<defs><linearGradient id="rp-grad-${uid}" x1="3" y1="2" x2="37" y2="38" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#8560F5"/><stop offset="55%" stop-color="#6D3FE0"/><stop offset="100%" stop-color="#5B2FC2"/></linearGradient></defs>`
      : "";
  const specular =
    mode === "color"
      ? `<rect x="3" y="3" width="34" height="34" rx="10" fill="none" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="1.25"/>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">${defs}<path fill-rule="evenodd" clip-rule="evenodd" d="M13 2h14c6.075 0 11 4.925 11 11v14c0 6.075-4.925 11-11 11h-0.4V22a6.6 6.6 0 1 0-13.2 0v16H13C6.925 38 2 33.075 2 27V13C2 6.925 6.925 2 13 2Z" fill="${fill}"/>${specular}<circle cx="20" cy="23" r="3" fill="${fill}"/></svg>`;
}

const DIRECTIONS: DirectionSpec[] = [
  {
    id: "a",
    fileName: "direction-a-arch-r.svg",
    label: "Směr A: Oblouk-brána (R)",
    renderSvg: renderDirectionA,
  },
  {
    id: "b",
    fileName: "direction-b-arch-dot.svg",
    label: "Směr B: Oblouk + bod (VYBRÁNO)",
    renderSvg: renderDirectionB,
  },
  {
    id: "c",
    fileName: "direction-c-glass-tile.svg",
    label: "Směr C: Skleněná dlaždice",
    renderSvg: renderDirectionC,
  },
];

async function generateContactSheet(): Promise<void> {
  const sizes = [16, 32, 64, 128];
  const outDir = path.resolve(process.cwd(), "docs/screenshots/etapa-2");
  await fs.mkdir(outDir, { recursive: true });

  const width = 1360;
  const height = 1040;
  const bgNames = [
    { name: "Světlé (#F4F4F6)", fill: "#F4F4F6", text: "#17171E", mode: "color" as const },
    { name: "Sklo (glass-1)", fill: "url(#glassBg)", text: "#17171E", mode: "color" as const },
    { name: "Fotka + scrim", fill: "url(#photoBg)", text: "#FFFFFF", mode: "light" as const },
    { name: "Tmavé (#17171E)", fill: "#17171E", text: "#FFFFFF", mode: "light" as const },
  ];

  const rowsSvg: string[] = [];
  let gradCounter = 0;

  for (let dIdx = 0; dIdx < DIRECTIONS.length; dIdx++) {
    const dir = DIRECTIONS[dIdx]!;
    const rowY = 70 + dIdx * 320;
    rowsSvg.push(
      `<text x="32" y="${rowY + 24}" font-family="Georgia, serif" font-size="22" font-weight="600" fill="#17171E">${dir.label}</text>`,
    );

    for (let bIdx = 0; bIdx < bgNames.length; bIdx++) {
      const bg = bgNames[bIdx]!;
      const cardX = 32 + bIdx * 328;
      const cardY = rowY + 40;
      rowsSvg.push(
        `<rect x="${cardX}" y="${cardY}" width="308" height="248" rx="16" fill="${bg.fill}" stroke="#DDDDE3" stroke-width="1"/>`,
        `<text x="${cardX + 16}" y="${cardY + 26}" font-family="sans-serif" font-size="13" font-weight="600" fill="${bg.text}" opacity="0.78">${bg.name}</text>`,
      );

      let cursorX = cardX + 20;
      const centerY = cardY + 142;
      for (const sz of sizes) {
        gradCounter++;
        const inner = dir
          .renderSvg(bg.mode, `cs${gradCounter}`)
          .replace(/^<svg[^>]*>/, "")
          .replace(/<\/svg>$/, "");
        const scale = sz / 40;
        const yPos = centerY - sz / 2;
        rowsSvg.push(
          `<g transform="translate(${cursorX}, ${yPos}) scale(${scale})">${inner}</g>`,
          `<text x="${cursorX + sz / 2}" y="${cardY + 230}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="${bg.text}" opacity="0.65">${sz}px</text>`,
        );
        cursorX += sz + 18;
      }
    }
  }

  const sheetSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="glassBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ECE6FF"/>
        <stop offset="50%" stop-color="#F7F4FF"/>
        <stop offset="100%" stop-color="#FFFFFF"/>
      </linearGradient>
      <linearGradient id="photoBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4A455B"/>
        <stop offset="100%" stop-color="#1E1D27"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#FFFFFF"/>
    <text x="32" y="42" font-family="Georgia, serif" font-size="28" font-weight="600" fill="#17171E">ReaPorta — Kontaktní arch návrhů loga (DESIGN.md kap. 15)</text>
    ${rowsSvg.join("\n")}
  </svg>`;

  await sharp(Buffer.from(sheetSvg)).png().toFile(path.join(outDir, "logo-contact-sheet.png"));
  console.log("Kontaktní arch uložen: docs/screenshots/etapa-2/logo-contact-sheet.png");
}

function buildIco(pngBuffers: Array<{ size: number; data: Buffer }>): Buffer {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = headerSize;
  pngBuffers.forEach((entry, i) => {
    const pos = 6 + i * 16;
    header.writeUInt8(entry.size >= 256 ? 0 : entry.size, pos);
    header.writeUInt8(entry.size >= 256 ? 0 : entry.size, pos + 1);
    header.writeUInt8(0, pos + 2);
    header.writeUInt8(0, pos + 3);
    header.writeUInt16LE(1, pos + 4);
    header.writeUInt16LE(32, pos + 6);
    header.writeUInt32LE(entry.data.length, pos + 8);
    header.writeUInt32LE(offset, pos + 12);
    offset += entry.data.length;
  });

  return Buffer.concat([header, ...pngBuffers.map((p) => p.data)]);
}

async function generateBrandFiles(): Promise<void> {
  const brandDir = path.resolve(process.cwd(), "public/brand");
  const altDir = path.join(brandDir, "alternatives");
  await fs.mkdir(altDir, { recursive: true });

  const wordmarkJson = JSON.parse(await fs.readFile("/tmp/wordmark-path.json", "utf-8")) as {
    d: string;
  };
  const wordmarkPath = wordmarkJson.d;

  // Winner: Direction B (Oblouk + bod)
  // Save alternatives A and C in public/brand/alternatives/
  await fs.writeFile(
    path.join(altDir, "direction-a-arch-r.svg"),
    renderDirectionA("color", "alt-a"),
    "utf-8",
  );
  await fs.writeFile(
    path.join(altDir, "direction-c-glass-tile.svg"),
    renderDirectionC("color", "alt-c"),
    "utf-8",
  );

  const markColor = renderDirectionB("color", "mark");
  const markMonoDark = renderDirectionB("dark", "mark-d");
  const markMonoLight = renderDirectionB("light", "mark-l");

  await fs.writeFile(path.join(brandDir, "logo-mark.svg"), markColor, "utf-8");
  await fs.writeFile(path.join(brandDir, "logo-mark-mono-dark.svg"), markMonoDark, "utf-8");
  await fs.writeFile(path.join(brandDir, "logo-mark-mono-light.svg"), markMonoLight, "utf-8");
  await fs.writeFile(path.join(brandDir, "favicon.svg"), markColor, "utf-8");

  const buildFullLogo = (mode: "color" | "dark" | "light") => {
    const innerMark = renderDirectionB(mode, `full-${mode}`)
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "");
    const textFill = mode === "light" ? "#FFFFFF" : "#17171E";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 206 40" fill="none">${innerMark}<g transform="translate(50, 0)"><path d="${wordmarkPath}" fill="${textFill}"/></g></svg>`;
  };

  await fs.writeFile(path.join(brandDir, "logo-full.svg"), buildFullLogo("color"), "utf-8");
  await fs.writeFile(
    path.join(brandDir, "logo-full-mono-dark.svg"),
    buildFullLogo("dark"),
    "utf-8",
  );
  await fs.writeFile(
    path.join(brandDir, "logo-full-mono-light.svg"),
    buildFullLogo("light"),
    "utf-8",
  );

  // Favicon ICO (16, 32, 48)
  const icoEntries: Array<{ size: number; data: Buffer }> = [];
  for (const sz of [16, 32, 48]) {
    const data = await sharp(Buffer.from(markColor)).resize(sz, sz).png().toBuffer();
    icoEntries.push({ size: sz, data });
  }
  await fs.writeFile(path.join(brandDir, "favicon.ico"), buildIco(icoEntries));

  // App icons (white mark on violet gradient squircle)
  const buildAppIconSvg = (size: number) => {
    const inner = renderDirectionB("light", `app-${size}`)
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "");
    const pad = size * 0.19;
    const scale = (size - pad * 2) / 40;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="appBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8560F5"/>
          <stop offset="55%" stop-color="#6D3FE0"/>
          <stop offset="100%" stop-color="#5B2FC2"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#appBg)"/>
      <g transform="translate(${pad}, ${pad}) scale(${scale})">${inner}</g>
    </svg>`;
  };

  await sharp(Buffer.from(buildAppIconSvg(180)))
    .png()
    .toFile(path.join(brandDir, "apple-touch-icon.png"));
  await sharp(Buffer.from(buildAppIconSvg(192)))
    .png()
    .toFile(path.join(brandDir, "icon-192.png"));
  await sharp(Buffer.from(buildAppIconSvg(512)))
    .png()
    .toFile(path.join(brandDir, "icon-512.png"));

  // Default OG image (1200x630)
  const fullInner = buildFullLogo("color")
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <radialGradient id="a1" cx="15%" cy="5%" r="55%">
        <stop offset="0%" stop-color="#8560F5" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#8560F5" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="a2" cx="92%" cy="12%" r="50%">
        <stop offset="0%" stop-color="#C1AEFF" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#C1AEFF" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="a3" cx="50%" cy="100%" r="55%">
        <stop offset="0%" stop-color="#DACEFF" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#DACEFF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="#F4F4F6"/>
    <rect width="1200" height="630" fill="url(#a1)"/>
    <rect width="1200" height="630" fill="url(#a2)"/>
    <rect width="1200" height="630" fill="url(#a3)"/>
    <rect x="88" y="96" width="1024" height="438" rx="32" fill="#FFFFFF" fill-opacity="0.78" stroke="#FFFFFF" stroke-width="2"/>
    <rect x="88" y="96" width="1024" height="438" rx="32" fill="none" stroke="#17171E" stroke-opacity="0.06" stroke-width="1"/>
    <g transform="translate(148, 162) scale(2.05)">${fullInner}</g>
    <text x="148" y="334" font-family="Georgia, serif" font-size="37" font-weight="500" fill="#17171E">Najděte místo, kterému budete říkat domov.</text>
    <text x="148" y="392" font-family="sans-serif" font-size="22" fill="#565665">Prodej a pronájem bytů, domů, pozemků a komerčních prostor po celé ČR.</text>
    <rect x="148" y="442" width="168" height="44" rx="22" fill="#ECE6FF"/>
    <text x="232" y="471" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="600" fill="#482699">reaporta.cz</text>
  </svg>`;

  await sharp(Buffer.from(ogSvg)).png().toFile(path.join(brandDir, "og-default.png"));
  console.log("Všechny brand soubory uloženy do public/brand/.");
}

async function main() {
  await generateContactSheet();
  await generateBrandFiles();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
