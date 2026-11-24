import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const checked = new Set();
const problems = [];
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) problems.push('Duplicate HTML IDs');
for (const match of html.matchAll(/<a\b[^>]*href="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) problems.push(`Missing anchor #${match[1]}`);
}
if (/<(?:script|link)\b[^>]*(?:src|href)="https?:/i.test(html)) problems.push('External runtime script/style');
if (/\/honeycomb\/assets\/|\/media\/|\/src\/|type="module"/.test(html)) problems.push('Non-standalone HTML reference');

function inspect(url, from = resolve(root, 'index.html')) {
  const clean = url.split(/[?#]/)[0];
  // Cabinet SVG reuses the already-audited image element at runtime.
  if (clean.includes('${')) return;
  if (!clean || /^(?:data:|mailto:|tel:|https?:|\/\/)/.test(clean)) return;
  const file = clean.startsWith('/') ? resolve(root, '.' + clean) : resolve(dirname(from), clean);
  if (!file.startsWith(root) || !existsSync(file)) { problems.push(`Missing/outside asset: ${url}`); return; }
  if (checked.has(file)) return;
  checked.add(file);
  if (!/\.(?:html|css|js|svg)$/.test(file)) return;
  const source = readFileSync(file, 'utf8');
  if (/\.(?:js|css)$/.test(file) && /\/honeycomb\/assets\/|\/media\//.test(source)) problems.push(`Parent reference: ${relative(root, file)}`);
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  for (const match of source.matchAll(/(?:src|href)="([^"#]+)"|url\(\s*['"]?([^)'"\s]+)|['"](\/assets\/[^'"`]+)['"]/g)) {
    // External links in the document are contact/navigation, not dependencies.
    if (file.endsWith('.html') && /^https?:/.test(match[1] || '')) continue;
    inspect(match[1] || match[2] || match[3], file);
  }
}
inspect('/index.html');
execFileSync(process.execPath, ['--check', resolve(root, 'preview.mjs')]);
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${checked.size} local documents/assets, anchor targets, standalone paths and loaded JavaScript syntax. No linter is configured.`);
