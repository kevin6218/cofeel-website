import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const writeJson = (file, data) => writeFileSync(path.join(root, file), JSON.stringify(data, null, 2) + '\n');

const current = readJson('tools/thelife-current.json');
const stockAudit = readJson('tools/thelife-stock-current.json');
const existing = readJson('tools/products.json');
const reportPath = path.join(root, 'tools/thelife-sync-report.json');
const previousReport = existsSync(reportPath) ? readJson('tools/thelife-sync-report.json') : null;
const sameAudit = previousReport?.audited_at === current.audited_at;
const priorAddedIds = new Set(sameAudit ? (previousReport.added || []).map((product) => String(product.id)) : []);
const oldById = new Map(existing.map((product) => [String(product.id), product]));
const liveIds = new Set(current.products.map((product) => String(product.id)));
const stockById = new Map(stockAudit.products.map((product) => [String(product.id), product]));

function auditedPrice(live) {
  const audit = stockById.get(String(live.id));
  const detailPrices = (audit?.detail_prices || []).filter((price) => Number.isFinite(price) && price > 0);
  if (!detailPrices.length || detailPrices.includes(Number(live.price))) return Number(live.price);
  return Math.min(...detailPrices);
}

function inferCategory(name) {
  if (/禮盒|體驗課|燕窩|蜂蜜/.test(name)) return '禮盒/體驗';
  if (/生豆|一起烘咖啡/.test(name)) return '生豆';
  if (/濾掛|耳掛|掛耳|浸泡式|冷熱萃咖啡包/.test(name)) return '濾掛咖啡';
  if (/磨豆機|研磨機|保溫瓶|咖啡架|手沖壺|細嘴壺|咖啡秤|電子秤|咖啡壺|香包|除臭包|除濕包|清潔刷/.test(name)) return '器具配件';
  if (/咖啡豆|鮮烘豆|鮮烘衣索/.test(name)) return '咖啡豆';
  return '器具配件';
}

function inferSize(name) {
  if (/一磅|227g\s*[xX×*]\s*2/.test(name)) return '一磅';
  if (/半磅|227g/.test(name)) return '半磅';
  const match = name.match(/(\d+(?:\.\d+)?\s*(?:公斤|公克|克|g|G|ml|ML)(?:\s*[xX×*]\s*\d+(?:包|袋|瓶)?)?)/);
  return match?.[1].replace(/\s+/g, '') || '';
}

function inferRoast(name) {
  const match = name.match(/(極淺焙|淺中焙|中淺焙|中深焙|極深焙|淺焙|中焙|深焙|極淺烘焙|淺中烘焙|中淺烘焙|中深烘焙|極深烘焙|淺烘焙|中烘焙|深烘焙)/);
  return match?.[1].replace('烘焙', '焙') || '';
}

function newProduct(live) {
  const size = inferSize(live.name);
  return {
    id: String(live.id),
    category: inferCategory(live.name),
    name: live.name,
    size,
    price: Number(live.price),
    origin: '',
    region: '',
    altitude: '',
    process: '',
    variety: '',
    grade: '',
    roast: inferRoast(live.name),
    net_weight: size,
    best_before: '',
    best_taste: '',
    flavors: [],
    image: live.image,
    buy_url: live.buy_url,
    status: 'active'
  };
}

const added = [];
const priceChanged = [];
const nameChanged = [];
const active = [];
const outOfStock = [];
for (const live of current.products) {
  const old = oldById.get(String(live.id));
  const audit = stockById.get(String(live.id));
  const verifiedLive = { ...live, price: auditedPrice(live) };
  const isAvailable = audit?.stock === 'in_stock';
  let merged;
  if (!old) {
    merged = newProduct(verifiedLive);
    added.push(merged);
  } else {
    if (Number(old.price) !== Number(verifiedLive.price)) priceChanged.push({ id: live.id, name: live.name, old: Number(old.price), current: Number(verifiedLive.price) });
    if (old.name !== live.name) nameChanged.push({ id: live.id, old: old.name, current: live.name });
    merged = {
      ...old,
      category: priorAddedIds.has(String(live.id)) ? inferCategory(live.name) : (old.category || inferCategory(live.name)),
      name: live.name,
      price: Number(verifiedLive.price),
      image: live.image || old.image,
      buy_url: live.buy_url
    };
  }
  if (isAvailable) {
    active.push({ ...merged, status: 'active', status_reason: '', last_stock_check: stockAudit.audited_at });
  } else {
    outOfStock.push({ ...merged, status: 'inactive', status_reason: audit?.stock || 'unknown', last_stock_check: stockAudit.audited_at });
  }
}

const removed = existing
  .filter((product) => !liveIds.has(String(product.id)))
  .map((product) => ({ ...product, status: 'inactive', status_reason: 'not_listed', last_stock_check: stockAudit.audited_at }));

const activeIds = new Set(active.map((product) => String(product.id)));
const activeById = new Map(active.map((product) => [String(product.id), product]));
const addedReport = sameAudit && previousReport.added?.length
  ? previousReport.added.filter((product) => activeIds.has(String(product.id))).map((product) => {
      const currentProduct = activeById.get(String(product.id));
      return { id: currentProduct.id, name: currentProduct.name, price: currentProduct.price };
    })
  : added.filter((product) => activeIds.has(String(product.id))).map(({ id, name, price }) => ({ id, name, price }));
const priceChangedReport = sameAudit && previousReport.price_changed?.length ? previousReport.price_changed : priceChanged;
const nameChangedReport = sameAudit && previousReport.name_changed?.length ? previousReport.name_changed : nameChanged;

writeJson('tools/products.json', [...active, ...outOfStock, ...removed]);
writeJson('tools/thelife-sync-report.json', {
  audited_at: current.audited_at,
  source: current.source,
  category_count: current.products.length,
  active_count: active.length,
  out_of_stock_count: outOfStock.length,
  not_listed_count: removed.length,
  added_count: addedReport.length,
  price_changed_count: priceChangedReport.length,
  name_changed_count: nameChangedReport.length,
  removed_count: outOfStock.length + removed.length,
  added: addedReport,
  price_changed: priceChangedReport,
  name_changed: nameChangedReport,
  detail_price_corrections: stockAudit.products
    .filter((product) => !product.price_verified)
    .map((product) => ({ id: product.id, name: product.name, category_price: product.price, detail_prices: product.detail_prices, applied_price: auditedPrice(product) })),
  out_of_stock: outOfStock.map(({ id, name, price }) => ({ id, name, price })),
  not_listed: removed.map(({ id, name, price }) => ({ id, name, price }))
});

console.log(`Synced ${active.length} purchasable products: ${outOfStock.length} out of stock and ${removed.length} no longer listed.`);
