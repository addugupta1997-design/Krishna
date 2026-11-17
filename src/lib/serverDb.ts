import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSchema } from '../../server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', '..', 'data', 'database.json');

// Read env lazily: ESM imports are hoisted, so dotenv.config() in server.ts has
// not run yet when this module is evaluated.
function config() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const base = url ? url.replace(/\/+$/, '') : '';
  return url && key
    ? {
        read: `${base}/rest/v1/store_data?id=eq.main&select=data`,
        write: `${base}/rest/v1/store_data`,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      }
    : null;
}

export async function loadDb(): Promise<DatabaseSchema> {
  const cfg = config();
  if (cfg) {
    try {
      const response = await fetch(cfg.read, { headers: cfg.headers, cache: 'no-store' });
      if (response.ok) {
        const rows = await response.json() as Array<{ data: DatabaseSchema }>;
        if (rows?.[0]?.data) return rows[0].data;
      }
      console.error('Supabase store_data read failed:', response.status, '- falling back to local data');
    } catch (error) {
      console.error('Supabase store_data read error:', error, '- falling back to local data');
    }
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DatabaseSchema;
}

export async function saveDb(data: DatabaseSchema): Promise<void> {
  const cfg = config();
  if (cfg) {
    const response = await fetch(cfg.write, {
      method: 'POST',
      headers: { ...cfg.headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Supabase store_data write failed: ${response.status}`);
    return;
  }
  const temp = `${DB_FILE}.tmp-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(temp, DB_FILE);
}
