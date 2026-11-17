import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSchema } from '../../server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', '..', 'data', 'database.json');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const endpoint = url && key ? `${url.replace(/\/+$/, '')}/rest/v1/store_data?id=eq.main&select=data` : null;
const writeEndpoint = url && key ? `${url.replace(/\/+$/, '')}/rest/v1/store_data` : null;

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: key!,
    Authorization: `Bearer ${key!}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function loadDb(): Promise<DatabaseSchema> {
  if (endpoint) {
    try {
      const response = await fetch(endpoint, { headers: headers(), cache: 'no-store' });
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
  if (writeEndpoint) {
    const response = await fetch(writeEndpoint, {
      method: 'POST',
      headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw new Error(`Supabase store_data write failed: ${response.status}`);
    return;
  }
  const temp = `${DB_FILE}.tmp-${Date.now()}`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(temp, DB_FILE);
}
