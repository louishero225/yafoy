/**
 * Tests de bout en bout : catalogue (filtres, tri, pagination, URL), panier,
 * permalien de commande, navigation mobile.
 * Prérequis : npm run build && npm run preview (dans un autre terminal).
 */
import { chromium } from 'playwright-core';
import os from 'node:os';
import fs from 'node:fs';
const S = process.env.SHOTS_DIR || fs.mkdtempSync(os.tmpdir() + '/yafoy-e2e-');
const B = process.env.BASE_URL || 'http://localhost:4321';
let fails = 0;
const ok = (c, msg) => { console.log((c ? 'OK   ' : 'FAIL ') + msg); if (!c) fails++; };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

// ── Catalogue : filtres
await page.goto(B + '/boutique', { waitUntil: 'networkidle' });
const visible = () => page.$$eval('[data-product]:not([hidden])', (els) => els.length);
ok((await visible()) === 48, 'catalogue : 48 produits affichés par défaut');
ok((await page.textContent('[data-count]')) === '563', 'catalogue : compteur 563');
ok(!(await page.isVisible('[data-empty]')), 'catalogue : état vide masqué par défaut');
ok(await page.isVisible('[data-more]'), 'catalogue : bouton « Afficher plus » visible');
await page.click('label.pill:has-text("Champagnes")');
ok((await page.textContent('[data-count]')) === '7', 'filtre famille Champagnes -> 7');
ok(page.url().includes('famille=champagne'), 'URL synchronisée (famille=champagne)');
await page.fill('#f-q', 'feuillate');
ok((await page.textContent('[data-count]')) === '2', 'recherche « feuillate » -> 2');
await page.fill('#f-q', 'FEUILLATE é');
await page.fill('#f-q', '');
await page.selectOption('#f-tri', 'prix-desc');
const first = await page.$eval('[data-product]:not([hidden]) .price', (e) => e.textContent);
ok(/130/.test(first), 'tri prix décroissant : premier = 130 000 (' + first.trim() + ')');
await page.click('[data-reset]');
ok((await page.textContent('[data-count]')) === '563', 'réinitialiser -> 563');
await page.click('label.switch');
const inStock = Number(await page.textContent('[data-count]'));
ok(inStock === 480, 'en stock uniquement -> ' + inStock + ' (attendu 480)');
await page.click('label.switch');
await page.fill('input[name="min"]', '100000');
ok(Number(await page.textContent('[data-count]')) > 0 && Number(await page.textContent('[data-count]')) < 40, 'prix min 100 000 filtre');
await page.click('[data-reset]');
await page.fill('#f-q', 'zzzzzz');
ok(await page.isVisible('[data-empty]'), 'état vide affiché');
await page.click('[data-empty] [data-reset]');
await page.click('[data-more]');
ok((await visible()) === 96, '« Afficher plus » -> 96');
await page.goto(B + '/boutique?famille=vin-rose&tri=prix-asc&stock=1', { waitUntil: 'networkidle' });
ok(Number(await page.textContent('[data-count]')) <= 35, 'URL partageable : famille=vin-rose appliquée (' + (await page.textContent('[data-count]')) + ')');

// ── Panier
await page.goto(B + '/boutique', { waitUntil: 'networkidle' });
await page.click('[data-product]:not([hidden]) .quick-add');
ok((await page.textContent('[data-cart-count]')) === '1', 'ajout rapide -> badge 1');
await page.goto(B + '/products/nicolas-feuillate-brut', { waitUntil: 'networkidle' });
ok((await page.textContent('[data-cart-count]')) === '1', 'panier persisté après navigation');
await page.click('[data-qty-step="1"]');
await page.click('[data-qty-step="1"]');
await page.click('.product__add');
await page.waitForSelector('#cart-drawer[open]');
ok(!(await page.isVisible('[data-cart-empty]')), 'tiroir : message « panier vide » masqué quand il y a des articles');
ok(await page.isVisible('[data-cart-foot]'), 'tiroir : total visible');
ok(true, 'tiroir panier ouvert');
ok((await page.textContent('[data-cart-count]')) === '4', 'badge = 1 + 3 cartons = 4');
const href = await page.getAttribute('[data-cart-checkout]', 'href');
console.log('     checkout href:', href);
ok(/^https:\/\/queugu-35\.myshopify\.com\/cart\/\d+:\d+,\d+:\d+\?return_to=\/checkout$/.test(href) || /\/cart\/\d+:\d+/.test(href), 'permalien de commande valide');
await page.waitForTimeout(500);
await page.screenshot({ path: S + '/cart_open.png' });
await page.click('.cart-line [data-line-step="-1"] >> nth=0');
await page.click('.cart-line [data-line-remove] >> nth=0');
ok(await page.isVisible('[data-cart-empty]') && !(await page.isVisible('[data-cart-foot]')), 'tiroir vide : message affiché, total masqué');
await page.keyboard.press('Escape');
ok(!(await page.$('#cart-drawer[open]')), 'Échap ferme le tiroir');
// rupture de stock
const sold = await page.evaluate(async () => (await (await fetch('/boutique')).text()).includes('En rupture'));
await page.goto(B + '/products/mucho-mas-5', { waitUntil: 'networkidle' });
ok((await page.$$('.product__add')).length === 0 && (await page.textContent('.product__buy')).includes('indisponible'), 'produit en rupture : pas de bouton d\'ajout');

// ── Mobile
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const mp = await m.newPage();
mp.on('pageerror', (e) => errors.push('mobile: ' + e));
await mp.goto(B + '/', { waitUntil: 'networkidle' });
await mp.click('[data-menu-open]');
await mp.waitForSelector('#mobile-nav[open]');
await mp.screenshot({ path: S + '/m_menu.png' });
await mp.click('#mobile-nav nav a:has-text("Catalogue")');
await mp.waitForURL('**/boutique');
ok(true, 'menu mobile -> navigation');
await mp.click('[data-filters-toggle]');
await mp.waitForTimeout(200);
await mp.screenshot({ path: S + '/m_boutique_filters.png' });
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
ok(!overflow, 'pas de défilement horizontal sur /boutique (mobile)');
for (const p of ['/', '/products/nicolas-feuillate-brut', '/nos-boutiques', '/qui-sommes-nous', '/collections/vin-rouge']) {
  await mp.goto(B + p, { waitUntil: 'networkidle' });
  ok(!(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'pas de défilement horizontal : ' + p);
}
ok(errors.length === 0, 'aucune erreur console/JS ' + JSON.stringify(errors.slice(0, 3)));
await browser.close();
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fails ? 1 : 0);
