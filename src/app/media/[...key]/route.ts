import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const joined = key.join("/");
  const storage = getStorageProvider();

  let targetPath: string;
  try {
    targetPath = storage.resolvePath(joined);
  } catch {
    return NextResponse.json({ error: "Neplatná cesta souboru." }, { status: 400 });
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Nepodporovaný typ souboru." }, { status: 400 });
  }

  try {
    const file = await fs.readFile(targetPath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Soubor nenalezen." }, { status: 404 });
  }
}
