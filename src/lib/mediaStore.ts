// Server-side persistent media storage via Supabase Storage REST API.
// Uses the service-role key (never exposed to the browser).

const BUCKET = 'website-media';

interface StorageConfig {
  base: string;
  key: string;
}

function config(): StorageConfig | null {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { base: url.replace(/\/+$/, ''), key } : null;
}

function headers(key: string, extra: Record<string, string> = {}): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

export function isMediaStorageConfigured(): boolean {
  return config() !== null;
}

export function publicUrlFor(name: string): string | null {
  const cfg = config();
  return cfg ? `${cfg.base}/storage/v1/object/public/${BUCKET}/${name}` : null;
}

export async function uploadMedia(file: Express.Multer.File): Promise<{ name: string; url: string; size: number }> {
  const cfg = config();
  if (!cfg) throw new Error('Media storage is not configured');

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
  const response = await fetch(`${cfg.base}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: headers(cfg.key, {
      'Content-Type': file.mimetype || 'application/octet-stream',
      'Cache-Control': '3600',
      'x-upsert': 'false',
    }),
    body: new Uint8Array(file.buffer),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Upload failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  const url = publicUrlFor(name);
  if (!url) throw new Error('Media storage is not configured');
  return { name, url, size: file.size };
}

export async function listMedia(): Promise<Array<{ name: string; url: string; createdAt?: string; size?: number }>> {
  const cfg = config();
  if (!cfg) return [];
  const response = await fetch(`${cfg.base}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: headers(cfg.key, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefix: '', limit: 500, offset: 0, sortBy: { column: 'created_at', order: 'desc' } }),
  });
  if (!response.ok) return [];
  const rows = await response.json() as Array<{ name: string; created_at?: string; metadata?: { size?: number } }>;
  return rows
    .filter((row) => Boolean(row.name))
    .map((row) => ({
      name: row.name,
      url: `${cfg.base}/storage/v1/object/public/${BUCKET}/${row.name}`,
      createdAt: row.created_at,
      size: row.metadata?.size,
    }));
}

export async function deleteMedia(name: string): Promise<boolean> {
  const cfg = config();
  if (!cfg) return false;
  if (name.includes('/') || name.includes('..')) return false;
  const response = await fetch(`${cfg.base}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: headers(cfg.key),
  });
  return response.ok;
}
