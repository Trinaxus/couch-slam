import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';

async function loadDotEnv(filePath = '.env') {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

function argValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return '';
  return String(process.argv[idx + 1] || '');
}

const dotEnv = await loadDotEnv('.env');

const supabaseUrl = argValue('--url') || process.env.VITE_SUPABASE_URL || dotEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = argValue('--key') || process.env.VITE_SUPABASE_ANON_KEY || dotEnv.VITE_SUPABASE_ANON_KEY || '';
const outPath = argValue('--out') || process.env.OUT || 'events.supabase.json';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Provide --url/--key or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pageSize = 1000;
let from = 0;
let all = [];

while (true) {
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Supabase export failed:', error);
    process.exit(1);
  }

  const page = Array.isArray(data) ? data : [];
  all = all.concat(page);

  if (page.length < pageSize) break;
  from += pageSize;
}

await fs.writeFile(outPath, JSON.stringify(all, null, 2), 'utf8');
console.log(`Exported ${all.length} events to ${outPath}`);
