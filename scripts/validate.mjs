// Validates every sites/<slug>/place.json. Fails the build on errors.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { checkPlace } from '../src/lib/place.mjs';

const only = process.argv[2];
const slugs = readdirSync('sites', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  .filter((s) => !only || s === only);
let failed = 0;
for (const slug of slugs) {
  const f = `sites/${slug}/place.json`;
  if (!existsSync(f)) { console.error(`✗ ${slug}: missing place.json`); failed++; continue; }
  let p;
  try { p = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { console.error(`✗ ${slug}: invalid JSON (${e.message})`); failed++; continue; }
  const { errors, warn } = checkPlace(p, slug);
  warn.forEach((w) => console.warn(`! ${slug}: ${w}`));
  if (errors.length) { failed++; errors.forEach((e) => console.error(`✗ ${slug}: ${e}`)); }
  else console.log(`✓ ${slug}`);
}
if (failed) { console.error(`\n${failed} site(s) failed validation`); process.exit(1); }
