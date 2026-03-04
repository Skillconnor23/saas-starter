import {promises as fs} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const TARGET_DIRS = ['app', 'components'];
const TSX_REGEX = /\.(tsx)$/i;

// Very simple heuristic: look for double-quoted strings with spaces or letters,
// skip import/export lines and obvious code-only strings like className, href starting with /, etc.
const STRING_REGEX = /"([^"]*[a-zA-Z][^"]*)"/g;

async function walk(dir) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (TSX_REGEX.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function looksLikeCodeOnly(key, value) {
  if (!value) return true;
  // Ignore apparent JSX props or tailwind-style tokens
  if (key.includes('className') || key.includes('aria-') || key.includes('data-')) return true;
  if (/^\/[a-zA-Z0-9/_-]*$/.test(value)) return true; // paths
  if (/^[A-Z0-9_-]+$/.test(value)) return true; // constants
  return false;
}

async function main() {
  const report = [];
  for (const dir of TARGET_DIRS) {
    const base = path.join(ROOT, dir);
    try {
      const files = await walk(base);
      for (const file of files) {
        const rel = path.relative(ROOT, file);
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (/^\s*(import|export)\s/.test(line)) return;
          let match;
          while ((match = STRING_REGEX.exec(line)) !== null) {
            const value = match[1];
            const before = line.slice(0, match.index);
            if (looksLikeCodeOnly(before, value)) continue;
            report.push({
              file: rel,
              line: idx + 1,
              snippet: line.trim().slice(0, 200),
              text: value,
            });
          }
        });
      }
    } catch {
      // ignore missing dirs
    }
  }

  if (report.length === 0) {
    console.log('No probable hardcoded UI strings found.');
    return;
  }

  console.log('Probable hardcoded UI strings (manual review needed):');
  for (const item of report) {
    console.log(
      `\n${item.file}:${item.line}\n  "${item.text}"\n  ${item.snippet}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

