import { chromium } from './node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalogue = JSON.parse(readFileSync(path.join(root, 'tools/thelife-current.json'), 'utf8'));
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ locale: 'zh-TW' });
const queue = [...catalogue.products];
const results = [];

async function auditProduct(page, product) {
  const response = await page.goto(product.buy_url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(350);
  const detail = await page.evaluate(() => {
    const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim();
    const controls = [...document.querySelectorAll('button, input[type="button"], input[type="submit"], a')]
      .map((element) => ({
        text: (element.innerText || element.value || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
        disabled: Boolean(element.disabled) || element.getAttribute('aria-disabled') === 'true' || element.classList.contains('disabled'),
        visible: Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
      }))
      .filter((control) => control.visible && control.text);
    const prices = [...document.querySelectorAll('body *')]
      .filter((element) => !element.children.length && Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length))
      .map((element) => element.textContent.replace(/\s+/g, ' ').trim())
      .filter((text) => /^\$[\d,]+$/.test(text))
      .map((text) => Number(text.replace(/[^\d]/g, '')))
      .filter((price, index, all) => price > 0 && all.indexOf(price) === index);
    const heading = document.querySelector('h1, .product-name, .pro_title, .title');
    return { bodyText, controls, prices, heading: heading?.textContent?.replace(/\s+/g, ' ').trim() || '' };
  });

  const outPattern = /售完補貨中|貨到通知我|已售完|暫時缺貨|缺貨中|已停售|停止販售/;
  const buyPattern = /加入購物車|立即購買|直接購買|放入購物車|馬上購買/;
  const outControl = detail.controls.find((control) => outPattern.test(control.text));
  const buyControl = detail.controls.find((control) => buyPattern.test(control.text) && !control.disabled);
  let stock = 'unknown';
  if (outControl || outPattern.test(detail.bodyText)) stock = 'out_of_stock';
  else if (buyControl) stock = 'in_stock';
  else if (response?.status() === 404 || /找不到商品|商品不存在|頁面不存在/.test(detail.bodyText)) stock = 'unavailable';

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    url: page.url(),
    http_status: response?.status() || 0,
    stock,
    matched_control: outControl?.text || buyControl?.text || '',
    heading: detail.heading,
    detail_prices: detail.prices,
    price_verified: detail.prices.includes(Number(product.price))
  };
}

async function worker(index) {
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  while (queue.length) {
    const product = queue.shift();
    if (!product) break;
    try {
      const result = await auditProduct(page, product);
      results.push(result);
      console.log(`[${results.length}/${catalogue.products.length}] ${result.id} ${result.stock} ${result.matched_control}`);
    } catch (error) {
      results.push({ id: product.id, name: product.name, price: product.price, url: product.buy_url, http_status: 0, stock: 'error', error: error.message });
      console.error(`[worker ${index}] ${product.id}: ${error.message}`);
    }
  }
  await page.close();
}

await Promise.all(Array.from({ length: 4 }, (_, index) => worker(index + 1)));
await browser.close();

results.sort((a, b) => Number(b.id) - Number(a.id));
const summary = results.reduce((counts, product) => {
  counts[product.stock] = (counts[product.stock] || 0) + 1;
  return counts;
}, {});
summary.price_verified = results.filter((product) => product.price_verified).length;
summary.price_mismatch = results.filter((product) => !product.price_verified).length;
const output = {
  audited_at: new Date().toISOString(),
  source: catalogue.source,
  count: results.length,
  summary,
  products: results
};
writeFileSync(path.join(root, 'tools/thelife-stock-current.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(summary));
