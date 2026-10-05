/**
 * SmartPIM end-to-end demo flow test.
 *
 * Drives a real Chrome instance through the hackathon demo flows:
 * Dashboard → Catalog (search/edit) → AI Product Agent (generate/approve)
 * → Attributes → Synchronization, collecting console/runtime errors.
 *
 * Usage:
 *   npm run build && npm start        # in one terminal (or `npm run dev`)
 *   npm run test:e2e                  # in another
 *
 * Env: E2E_BASE_URL (default http://localhost:3000), CHROME_PATH
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';
const TEST_INPUT =
  'Premium black wireless headphones with active noise cancellation, Bluetooth 5.3 and 40-hour battery life.';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chromePath = CHROME_CANDIDATES.find(p => fs.existsSync(p));
if (!chromePath) {
  console.error('Could not find a Chrome/Chromium installation. Set CHROME_PATH.');
  process.exit(2);
}

const results = [];
const consoleErrors = [];
const pageErrors = [];

function check(name, condition, detail = '') {
  results.push({ name, pass: !!condition, detail });
  console.log(`${condition ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForText(page, text, timeout = 20000) {
  const needle = text.toLowerCase();
  try {
    await page.waitForFunction(
      t => document.body && document.body.innerText.toLowerCase().includes(t),
      { timeout },
      needle
    );
    return true;
  } catch {
    return false;
  }
}

/** Page text lowercased, so CSS `text-transform: uppercase` does not matter. */
async function pageText(page) {
  return (await page.evaluate(() => document.body.innerText)).toLowerCase();
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1366,768'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(String(err)));
  page.on('response', res => {
    if (res.status() >= 400 && res.url().startsWith(BASE)) {
      consoleErrors.push(`HTTP ${res.status()} ${res.url()}`);
    }
  });

  /* ---------- A. Dashboard ---------- */
  console.log('\nA. Dashboard');
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  check('Dashboard loads', (await page.title()).includes('SmartPIM'));
  check('Statistics cards rendered', (await page.$$('.grid > .bg-white.rounded-xl')).length >= 4);
  const bodyText = (await pageText(page));
  check('Statistics displayed', /total products/.test(bodyText) && /needs attention/.test(bodyText));
  const recentRows = await page.$$('table tbody tr');
  check('Recent products listed', recentRows.length > 0, `${recentRows.length} rows`);
  const navHrefs = await page.$$eval('aside nav a', els => els.map(e => e.getAttribute('href')));
  check(
    'Navigation includes all pages',
    ['/', '/products', '/ai-generator', '/attributes', '/sync'].every(h => navHrefs.includes(h)),
    navHrefs.join(', ')
  );

  /* ---------- B. Product catalog ---------- */
  console.log('\nB. Product catalog');
  await page.goto(BASE + '/products', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('table tbody tr', { timeout: 20000 });
  const allRows = (await page.$$('table tbody tr')).length;
  check('Products load', allRows >= 10, `${allRows} products`);

  const searchInput = await page.$('main input[placeholder="Search products..."]');
  await searchInput.type('headphones', { delay: 20 });
  await sleep(1200);
  const filteredRows = (await page.$$('table tbody tr')).length;
  check('Search filters the catalog', filteredRows > 0 && filteredRows < allRows, `${filteredRows} after search`);

  const statusSelects = await page.$$('select');
  const statusSelect = statusSelects[1]; // [0] = category, [1] = status
  await statusSelect.select('active');
  await sleep(1000);
  check('Status filter applies', (await page.$$('table tbody tr')).length >= 1);

  // Reset filters, open detail
  await searchInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await statusSelect.select('all');
  await sleep(1000);
  await page.click('table tbody tr a[href^="/products/"]');
  await page.waitForFunction(
    () => window.location.pathname.startsWith('/products/'),
    { timeout: 30000 }
  );
  check('Product detail opens', /\/products\/prod_/.test(page.url()), page.url());
  check('Detail shows product info', await waitForText(page, 'Completeness Score'));

  // Edit + save (no field changes, just verify the save round-trip)
  const editClicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Edit Product'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(500);
  const saveClicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Save Changes'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  check('Edit mode + save works', editClicked && saveClicked && await waitForText(page, 'Product updated successfully.'));

  /* ---------- C. Attributes ---------- */
  console.log('\nC. Attributes');
  await page.goto(BASE + '/attributes', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(800);
  const attrText = await pageText(page);
  check('Attributes page loads', /attribute definitions/.test(attrText));
  check('Attribute values displayed', /color/.test(attrText) && /material/.test(attrText));
  check('Usage counts displayed', /used by/.test(attrText));

  /* ---------- D. AI Product Agent ---------- */
  console.log('\nD. AI Product Agent');
  await page.goto(BASE + '/ai-generator', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('textarea', { timeout: 20000 });
  await page.type('textarea', TEST_INPUT, { delay: 5 });
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b =>
      b.innerText.includes('Analyze & Optimize Product')
    );
    btn.click();
  });
  check('Workflow steps run', await waitForText(page, 'Recommend', 15000));
  check('Generation produces a product', await waitForText(page, 'Full Description', 30000));

  const aiText = await pageText(page);
  check('Completeness score displayed', /\d+\s*\/\s*100/.test(aiText));
  check('Category generated', /electronics/.test(aiText));
  check('Attributes generated', /attributes/.test(aiText));
  check('SEO generated', /seo title|title:/.test(aiText));
  check('Missing information identified', /missing information/.test(aiText));
  check('Input analysis detected info', /detected information/.test(aiText));
  check('Recommendations shown', /recommendations/.test(aiText));
  check('Validation shown', /validation results/.test(aiText));
  check('Demo mode disclosed', /demo mode/.test(aiText));

  // Approve → catalog
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b =>
      b.innerText.includes('Approve & Add to Catalog')
    );
    btn.click();
  });
  check('Approval adds product to catalog', await waitForText(page, 'Product added to catalog successfully', 20000));

  const listRes = await fetch(`${BASE}/api/products?search=${encodeURIComponent('Premium Black Wireless Headphones')}`);
  const listData = await listRes.json();
  const created = listData.products?.[0];
  check('Approved product is in the catalog', listData.total >= 1, created ? created.id : 'not found');

  /* ---------- E. Synchronization ---------- */
  console.log('\nE. Synchronization');
  await page.goto(BASE + '/sync', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(500);
  const syncText0 = await pageText(page);
  check('Sync page shows demo mode', /demo mode/.test(syncText0));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b =>
      b.innerText.includes('Run Synchronization')
    );
    btn.click();
  });
  check('Demo sync completes', await waitForText(page, 'Synchronization Complete', 30000));
  const syncText = await pageText(page);
  check('Sync reports results', /successful/.test(syncText) && /demo mode/.test(syncText));

  // API route health
  console.log('\nF. API health');
  for (const route of ['/api/products', '/api/attributes']) {
    const r = await fetch(BASE + route);
    check(`${route} responds`, r.status === 200, `HTTP ${r.status}`);
  }
  const genRes = await fetch(BASE + '/api/generate-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productIdea: TEST_INPUT }),
  });
  check('generate-product responds', genRes.status === 200, `HTTP ${genRes.status}`);

  // Cleanup: remove the product created by this test run
  if (created) {
    await fetch(`${BASE}/api/products/${created.id}`, { method: 'DELETE' });
    console.log(`  (cleaned up test product ${created.id})`);
  }

  await browser.close();

  /* ---------- Report ---------- */
  console.log('\n--- Console / runtime errors ---');
  const relevant = consoleErrors.filter(e => !/React DevTools|Download the React DevTools/.test(e));
  if (pageErrors.length === 0 && relevant.length === 0) {
    console.log('  none');
  } else {
    pageErrors.forEach(e => console.log(`  [pageerror] ${e}`));
    relevant.forEach(e => console.log(`  [console] ${e}`));
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('Failed checks:');
    failed.forEach(f => console.log(`  - ${f.name} ${f.detail}`));
  }
  process.exit(failed.length || pageErrors.length ? 1 : 0);
}

main().catch(err => {
  console.error('E2E run failed:', err);
  process.exit(1);
});
