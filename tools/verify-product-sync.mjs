import { chromium } from './node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDir = path.join(root, '.playwright-cli');
mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('http://127.0.0.1:4317/', { waitUntil: 'networkidle' });
const home = await page.evaluate(() => ({
  products: PRODUCTS.length,
  renderedCards: document.querySelectorAll('#product-grid .card').length,
  bodyWidth: document.body.scrollWidth,
  viewportWidth: document.documentElement.clientWidth
}));
if (home.products !== 158) throw new Error(`Expected 158 products, got ${home.products}`);
if (!home.renderedCards) throw new Error('Homepage product cards did not render');
if (home.bodyWidth > home.viewportWidth + 2) throw new Error(`Desktop horizontal overflow: ${home.bodyWidth} > ${home.viewportWidth}`);
await page.screenshot({ path: path.join(outputDir, 'product-sync-desktop.png'), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
const mobile = await page.evaluate(() => ({ bodyWidth: document.body.scrollWidth, viewportWidth: document.documentElement.clientWidth }));
if (mobile.bodyWidth > mobile.viewportWidth + 2) throw new Error(`Mobile horizontal overflow: ${mobile.bodyWidth} > ${mobile.viewportWidth}`);
await page.screenshot({ path: path.join(outputDir, 'product-sync-mobile.png'), fullPage: true });

await page.goto('http://127.0.0.1:4317/products/19513', { waitUntil: 'networkidle' });
const newProduct = await page.locator('body').innerText();
if (!newProduct.includes('荔枝雙重厭氧蜜處理') || !newProduct.includes('NT$590')) throw new Error('New product 19513 content is incorrect');

await page.goto('http://127.0.0.1:4317/products/19129', { waitUntil: 'networkidle' });
const correctedProduct = await page.locator('body').innerText();
if (!correctedProduct.includes('NT$7960')) throw new Error('Product 19129 detail-page price correction was not applied');

for (const id of ['16614', '19505']) {
  const response = await page.goto(`http://127.0.0.1:4317/products/${id}`, { waitUntil: 'domcontentloaded' });
  if (response?.status() !== 404) throw new Error(`Inactive product ${id} should return 404`);
}

await browser.close();
console.log(JSON.stringify({ home, mobile, newProduct: 'ok', correctedPrice: 'ok', inactiveProducts: '404' }, null, 2));
