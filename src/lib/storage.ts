import fs from "node:fs/promises";
import path from "node:path";

export interface StorageProvider {
  put(key: string, buffer: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  url(key: string): string;
  resolvePath(key: string): string;
}

export function sanitizeStorageKey(rawKey: string): string {
  const normalized = rawKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.includes("\0") ||
    !/^[a-zA-Z0-9/_\-.]+$/.test(normalized)
  ) {
    throw new Error(`Neplatný klíč úložiště: ${rawKey}`);
  }
  return normalized;
}

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir = process.env.STORAGE_DIR ?? "./storage") {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  resolvePath(key: string): string {
    const safeKey = sanitizeStorageKey(key);
    const fullPath = path.resolve(this.baseDir, safeKey);
    if (!fullPath.startsWith(this.baseDir + path.sep) && fullPath !== this.baseDir) {
      throw new Error("Přístup mimo složku úložiště je zakázán.");
    }
    return fullPath;
  }

  async put(key: string, buffer: Buffer): Promise<void> {
    const targetPath = this.resolvePath(key);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, buffer);
  }

  async delete(key: string): Promise<void> {
    const targetPath = this.resolvePath(key);
    try {
      await fs.unlink(targetPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  url(key: string): string {
    const safeKey = sanitizeStorageKey(key);
    return `/media/${safeKey}`;
  }
}

export function getStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}

export function getImageVariantUrl(
  storageKey: string,
  variant: "thumb" | "card" | "full" = "card",
): string {
  const safeKey = sanitizeStorageKey(storageKey);
  if (safeKey.endsWith("-full.webp")) {
    return `/media/${safeKey.replace(/-full\.webp$/, `-${variant}.webp`)}`;
  }
  if (safeKey.endsWith(".webp") || safeKey.endsWith(".svg") || safeKey.endsWith(".png")) {
    return `/media/${safeKey}`;
  }
  return `/media/${safeKey}-${variant}.webp`;
}
