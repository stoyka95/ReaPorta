import fs from "node:fs/promises";
import path from "node:path";
import { sanitizeStorageKey, getImageVariantUrl } from "./media-url";

export { sanitizeStorageKey, getImageVariantUrl };

export interface StorageProvider {
  put(key: string, buffer: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  url(key: string): string;
  resolvePath(key: string): string;
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
