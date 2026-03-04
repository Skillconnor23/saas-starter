import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const enPath = path.join(ROOT, 'messages', 'en.json');
const mnPath = path.join(ROOT, 'messages', 'mn.json');

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

function hasPath(obj, pathStr) {
  const parts = pathStr.split('.');
  let current = obj;
  for (const p of parts) {
    if (!current || typeof current !== 'object' || !(p in current)) return false;
    current = current[p];
  }
  return true;
}

async function main() {
  const [enRaw, mnRaw] = await Promise.all([
    readFile(enPath, 'utf8'),
    readFile(mnPath, 'utf8'),
  ]);

  const en = JSON.parse(enRaw);
  const mn = JSON.parse(mnRaw);

  const enKeys = collectKeys(en);
  const missing = enKeys.filter((k) => !hasPath(mn, k));

  if (missing.length === 0) {
    console.log('No missing Mongolian keys. 🎉');
    return;
  }

  console.log('Missing Mongolian translation keys (messages/mn.json):');
  for (const k of missing) {
    console.log(`- ${k}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

