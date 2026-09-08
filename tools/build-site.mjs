import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const write=(f,s)=>{if(!existsSync(path.join(root,f))||read(f)!==s)writeFileSync(path.join(root,f),s);};
const site='https://www.cofeel.com.tw';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const products=JSON.parse(read('tools/products.json')).filter(p=>p.status==='active');
const stores=JSON.parse(read('data/stores.json'));
const assetHead='<link rel="stylesheet" href="/assets/site.css?v=20260908">\n<script src="/assets/site.js?v=20260908" defer></script>\n';
function frame(title,url,body,schema){return `<!doctype html>\n<html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | CoFeel 凱飛鮮烘豆</title><meta name="description" content="${esc(title)}，查詢 CoFeel 凱飛鮮烘豆的商品與門市資訊。"><link rel="canonical" href="${url}">${assetHead}<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head><body style="font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)"><nav class="nav" style="display:flex;justify-content:space-between;align-items:center;padding:12px 24px"><a class="nav-logo" href="/"><img src="/images/logo.png" alt="CoFeel 凱飛鮮烘豆"></a><a href="/#shop">選購咖啡</a><a href="/#store">門市資訊</a></nav>${body}<footer class="section"><a href="/">CoFeel 凱飛鮮烘豆</a> · <a href="tel:0222489938">02-2248-9938</a></footer></body></html>\n`;}
function storeCard(s){return `<div class="store-card"><h3>${esc(s.name)}</h3><div class="store-row"><span class="lbl">地址</span><span class="val">${esc(s.address)}</span></div><div class="store-row"><span class="lbl">時間</span><span class="val">${esc(s.hours)}</span></div><div class="store-row"><span class="lbl">電話</span><span class="val"><a href="tel:0222489938">${s.phone}</a></span></div>${s.public?'':'<p><strong>企業內部福利站，不開放外來民眾。</strong></p>'}<a class="store-map-link" href="/stores/${s.slug}">查看門市詳情 →</a>${s.public?`<br><a class="store-map-link" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">Google 地圖導航 →</a>`:''}</div>`;}
mkdirSync(path.join(root,'stores'),{recursive:true});
for(const s of stores){
  const url=site+'/stores/'+s.slug;
  const schema={'@context':'https://schema.org','@type':s.public?'Store':'Organization','@id':url+'#store',name:s.name,url,telephone:s.phone,address:{'@type':'PostalAddress',streetAddress:s.street,addressLocality:s.locality,addressRegion:s.region,addressCountry:'TW'}};
  if(s.days)schema.openingHoursSpecification=[{'@type':'OpeningHoursSpecification',dayOfWeek:s.days,opens:s.opens,closes:s.closes},...(s.extraHours||[])];
  if(!s.public)schema.description=s.service;
  write('stores/'+s.slug+'.html',frame(s.name,url,`<main class="store-detail"><p><a href="/">首頁</a> / <a href="/#store">門市資訊</a></p><h1>${esc(s.name)}</h1>${s.public?'':'<p><strong>此據點僅供企业內部使用，不開放外來民眾。</strong></p>'.replace('企业','企業')}<dl><dt>地址</dt><dd>${esc(s.address)}</dd><dt>營業時間</dt><dd>${esc(s.hours)}</dd><dt>聯絡電話</dt><dd><a href="tel:0222489938">${s.phone}</a>（統一客服）</dd>${s.service?`<dt>服務</dt><dd>${esc(s.service)}</dd>`:''}</dl><div class="action-row">${s.public?`<a class="action" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">開啟地圖導航</a>`:''}<a class="action secondary" href="https://line.me/ti/p/@cofeel" target="_blank" rel="noopener">LINE 詢問</a></div><p>國定假日或臨時異動，出發前歡迎先電話確認。</p></main>`,schema));
}

let home=read('index.html');
home=home.replace(/const PRODUCTS = .*?;\n/,()=>`const PRODUCTS = ${JSON.stringify(products)};\n`);
const contact='<div class="store-card"><h3>聯繫凱飛</h3><p>門市、商品與企業合作諮詢：<a href="tel:0222489938">02-2248-9938</a></p><a class="store-map-link" href="https://line.me/ti/p/@cofeel" target="_blank" rel="noopener">LINE @cofeel</a> · <a class="store-map-link" href="https://www.facebook.com/cofeel.tw" target="_blank" rel="noopener">Facebook</a></div>';
home=home.replace(/(<section id="store"[\s\S]*?<div class="store-grid">)[\s\S]*?(\n    <\/div>\n  <\/div>\n<\/section>)/,(_,a,b)=>a+'\n'+stores.map(storeCard).join('\n')+'\n'+contact+b);
function card(p){return `<article class="card"><a class="card-img" href="/products/${p.id}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" alt="" width="300" height="300" loading="lazy" decoding="async"></a><div class="card-body"><div class="card-cat">${esc(p.origin||p.category)} · ${esc(p.roast)}</div><a class="card-name" href="/products/${p.id}">${esc(p.name.replace(/^CoFeel\s*凱飛鮮烘豆\s*/i,''))}</a><div class="card-flavors">${(p.flavors||[]).slice(0,3).map(f=>`<span class="ftag">${esc(f)}</span>`).join('')}</div><p class="card-weight">${esc(p.net_weight||p.size||'規格請見商品頁')}</p><div class="card-footer"><span class="card-price">NT$ ${Number(p.price).toLocaleString('zh-TW')}</span><a class="card-buy" href="/products/${p.id}">查看商品</a></div></div></article>`;}
home=home.replace(/<div class="grid" id="product-grid">[\s\S]*?<\/div>\n  <nav class="pagination"/,()=>'<div class="grid" id="product-grid">'+products.slice(0,12).map(card).join('\n')+'</div>\n  <nav class="pagination"');
home=home.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_,raw)=>{
  const data=JSON.parse(raw);
  if(data['@type']==='FAQPage')for(const q of data.mainEntity){if(q.name.includes('門市在哪'))q.acceptedAnswer.text=stores.map(s=>`${s.name}：${s.address}，${s.hours}${s.public?'':'，不開放外來民眾'}`).join('；');if(q.name.includes('怎麼計價'))q.acceptedAnswer.text='門市秤重選購，1 克 1 元起；線上依商品頁標示包裝重量與售價販售，由 TheLife 樂生活結帳。';}
  return '<script type="application/ld+json">'+JSON.stringify(data)+'</script>';
});
const featured=['coffee-first-crack-guide','coffee-bean-oil-guide','peaberry-coffee-guide','coffee-bean-resting-guide'];
home=home.replace(/(<div class="blog-grid">)[\s\S]*?(\n    <\/div>)/,(_,a,b)=>a+featured.map(slug=>{const page=read('blog/'+slug+'.html');const title=page.match(/<title>(.*?)<\/title>/)[1].split('|')[0].trim();const description=page.match(/<meta name="description" content="([^"]*)"/)[1];return `<a class="blog-card" href="/blog/${slug}"><div class="blog-card-cat">咖啡文章</div><h3>${title}</h3><p>${description}</p><span class="blog-read-more">閱讀全文 →</span></a>`;}).join('\n')+b);
write('index.html',home);

const catalogueBody='<main class="section"><h1>CoFeel 咖啡商品目錄</h1><p>線上依包裝規格販售；門市可秤重選購。<a href="/#shop">使用風味與價格篩選</a></p><div class="grid">'+products.map(card).join('\n')+'</div></main>';
write('products/index.html',frame('咖啡商品目錄',site+'/products/',catalogueBody,{'@context':'https://schema.org','@type':'CollectionPage',name:'CoFeel 咖啡商品目錄',url:site+'/products/'}));
let blog=read('blog/index.html');
if(!blog.includes('id="article-search"'))blog=blog.replace('<div class="section-title">最新文章</div>','<div class="section-title">咖啡文章</div><div class="article-controls"><label class="control search">搜尋文章<input type="search" id="article-search" placeholder="例如：養豆、手沖、烘焙" maxlength="100"></label><label class="control">文章主題<select id="article-category"><option value="">全部主題</option></select></label></div><p id="article-result" role="status" aria-live="polite"></p>');
blog=blog.replace('飛仔帶你從零掌握精品咖啡的沖煮藝術，每篇都是實戰經驗的結晶','從選豆、保存到沖煮，找到你現在想了解的咖啡知識。');
write('blog/index.html',blog);

const all=['index.html','shipping-return.html',...['blog','products','stores'].flatMap(dir=>readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html')).map(f=>dir+'/'+f))];
function cleanUrl(value){if(typeof value!=='string')return value;if(value.startsWith(site+'/')||/^\/(blog|products|stores)\//.test(value))return value.replace(/\.html(?=$|[?#])/,'');return value;}
function cleanSchema(data){if(Array.isArray(data))return data.map(cleanSchema);if(data&&typeof data==='object')return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,cleanSchema(v)]));return cleanUrl(data);}
for(const f of all){
  let html=read(f);
  if(!html.includes('/assets/site.css'))html=html.replace('</head>',assetHead+'</head>');
  html=html.replace(/(href|content)="([^"]*)"/g,(_,attr,url)=>attr+'="'+cleanUrl(url)+'"');
  html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_,raw)=>'<script type="application/ld+json">'+JSON.stringify(cleanSchema(JSON.parse(raw))).replace(/</g,'\\u003c')+'</script>');
  if(f.startsWith('products/')&&f!=='products/index.html'){
    html=html.replace('class="buy-btn">立即訂購 →','class="buy-btn" rel="noopener">前往 TheLife 樂生活購買 →');
    if(!html.includes('class="checkout-note"'))html=html.replace(/(<a [^>]*class="buy-btn"[^>]*>[\s\S]*?<\/a>)/,'$1<p class="checkout-note">將開啟樂生活購物網站完成結帳，價格與可訂購狀態以該平台顯示為準。</p>');
  }
  if(f.startsWith('blog/')&&f!=='blog/index.html'){
    const matches=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const graph=matches.flatMap(m=>{const d=JSON.parse(m[1]);return d['@graph']||[d];});const article=graph.find(d=>d['@type']==='Article');
    if(article&&!html.includes('class="article-meta-visible"'))html=html.replace('</h1>',`</h1><p class="article-meta-visible">作者：${esc(article.author?.name||'CoFeel 凱飛鮮烘豆')}${article.dateModified?' · 更新：'+esc(article.dateModified):''}</p>`);
    let matching=[];
    if(f.includes('peaberry'))matching=products.filter(p=>p.category==='咖啡豆'&&/圓豆/.test(p.name));
    if(f.includes('oil-guide'))matching=products.filter(p=>p.category==='咖啡豆'&&p.roast==='深焙');
    if(f.includes('first-crack'))matching=products.filter(p=>p.category==='咖啡豆'&&/淺/.test(p.roast));
    if(matching.length&&!html.includes('class="related-products"')){
      const section='<section class="related-products"><h2>相關咖啡豆</h2><ul>'+matching.slice(0,2).map(p=>`<li><a href="/products/${p.id}">${esc(p.name)}</a></li>`).join('')+'</ul><a href="/#shop">依風味挑選更多咖啡豆</a></section>';
      html=html.replace('</main>',section+'</main>');
    }
  }
  write(f,html);
}

let sitemap=read('sitemap.xml');
for(const p of products)sitemap=sitemap.replaceAll(site+'/products/'+p.id+'.html',site+'/products/'+p.id);
for(const route of ['/products/',...stores.map(s=>'/stores/'+s.slug)])if(!sitemap.includes('<loc>'+site+route+'</loc>'))sitemap=sitemap.replace('</urlset>',`  <url><loc>${site+route}</loc><lastmod>2026-09-08</lastmod></url>\n</urlset>`);
write('sitemap.xml',sitemap);
for(const f of ['tools/merchant_feed_pilot.csv','tools/products_sitemap_urls.txt']){
  if(!existsSync(path.join(root,f)))continue;
  let text=read(f);for(const p of products)text=text.replaceAll(site+'/products/'+p.id+'.html',site+'/products/'+p.id);write(f,text);
}
let llms=read('llms.txt');llms=llms.replace(/## 實體門市[\s\S]*?(?=## 購買通路)/,'## 實體門市\n'+stores.map(s=>s.name+'\n地址：'+s.address+'\n時間：'+s.hours+'\n電話：'+s.phone+(s.public?'':'\n僅供企業內部使用，不開放外來民眾')+'\n').join('\n')+'\n');write('llms.txt',llms);
console.log('Updated '+products.length+' products, '+stores.length+' store pages, catalogue, articles and sitemap.');
