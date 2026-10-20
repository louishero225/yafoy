/**
 * Audit d'accessibilité (axe-core, WCAG 2.1 AA) des pages principales.
 * Prérequis : npm run build && npm run preview (dans un autre terminal).
 * Sort en erreur s'il reste une violation.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const axe = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
let failed = 0;
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const p of ['/', '/boutique', '/collections/champagne', '/products/nicolas-feuillate-brut', '/products/mucho-mas-5', '/nos-boutiques', '/qui-sommes-nous', '/404']) {
  await page.goto((process.env.BASE_URL || 'http://localhost:4321') + p, { waitUntil: 'networkidle' });
  await page.evaluate(axe);
  const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }));
  console.log(p, '->', r.violations.length ? '' : 'OK');
  failed += r.violations.length;
  for (const v of r.violations) console.log('  ', v.impact, v.id, v.nodes.length + ' nœud(s)', '|', v.nodes[0].target.join(' '), '|', (v.nodes[0].failureSummary || '').split('\n')[1]);
}
await b.close();
process.exit(failed ? 1 : 0);
