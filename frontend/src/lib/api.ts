export function apiUrl(path: string): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!raw) {
    throw new Error('NEXT_PUBLIC_API_URL não está definida.');
  }
  const base = raw.endsWith('/api') ? raw : `${raw}/api`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
