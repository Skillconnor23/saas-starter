import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');

const files = [
  path.join(ROOT, 'messages', 'en.json'),
  path.join(ROOT, 'messages', 'mn.json')
];

function setNested(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) {
      current[key] = value;
    } else {
      if (typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
  }
}

function flattenSectionToNested(sectionObject) {
  const result = {};
  for (const [key, value] of Object.entries(sectionObject)) {
    if (typeof value === 'string') {
      if (key.includes('.')) {
        setNested(result, key, value);
      } else {
        result[key] = value;
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Already nested; copy as-is.
      result[key] = flattenSectionToNested(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function processFile(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const json = JSON.parse(raw);

  const transformed = {};
  for (const [topKey, section] of Object.entries(json)) {
    if (section && typeof section === 'object' && !Array.isArray(section)) {
      transformed[topKey] = flattenSectionToNested(section);
    } else {
      transformed[topKey] = section;
    }
  }

  await writeFile(filePath, JSON.stringify(transformed, null, 2) + '\n', 'utf8');
  console.log(`Flattened dot-keys to nested objects in ${path.relative(ROOT, filePath)}`);
}

for (const file of files) {
  await processFile(file);
}

