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
