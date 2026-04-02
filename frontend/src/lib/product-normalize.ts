/** Normaliza colunas opcionais vindas do Supabase / API. */

export function normalizeProductImages(row: Record<string, unknown>): string[] {
  const raw = row.images;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map(String).filter(Boolean);
  }
  const single = row.image_url;
  if (typeof single === 'string' && single.trim()) {
    return [single.trim()];
  }
  return [];
}

export function normalizeProductSizes(row: Record<string, unknown>): string[] {
  const raw = row.sizes;
  if (Array.isArray(raw)) {
    return raw.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
