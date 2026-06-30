import json
import csv
import os
import html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.cofeel.com.tw"

# Pilot batch: 15 representative products across categories,
# chosen to cross-link with existing blog articles where possible.
PILOT_IDS = [
    "19410",  # 衣索比亞 Baby Geisha 一磅 -> geisha-coffee-guide.html
    "19409",  # 衣索比亞 Baby Geisha 半磅
    "19500",  # 哥斯大黎加蜜處理一磅 -> coffee-processing-methods.html
    "19348",  # 衣索比亞古吉水仙蜜處理一磅 -> coffee-processing-methods.html
    "19408",  # 印度賴比瑞亞一磅 -> coffee-bean-species.html
    "18380",  # 瓜地馬拉薇薇特南果一磅
    "19432",  # 宏都拉斯蜜處理一磅
    "18835",  # 火山噴泉Ai嚴選特調一磅
    "19005",  # 衣索比亞品味世界濾掛20包 -> drip-bag-vs-pour-over.html
    "18957",  # 衣索柑橘耳掛20包
    "18278",  # 啡嚐親蜜禮盒
    "18276",  # 馬拉威厭氧酒香藝妓禮盒
    "19081",  # 宏都拉斯希望曙光1公斤
    "18834",  # 火山噴泉特調227g
    "19349",  # 緬甸依濃巧克力堅果半磅
]

# Cross-links: product id -> (blog url, anchor text)
BLOG_LINKS = {
    "19410": ("geisha-coffee-guide.html", "藝伎咖啡為什麼這麼貴？"),
    "19409": ("geisha-coffee-guide.html", "藝伎咖啡為什麼這麼貴？"),
    "19500": ("coffee-processing-methods.html", "日曬、水洗、蜜處理差在哪？"),
    "19348": ("coffee-processing-methods.html", "日曬、水洗、蜜處理差在哪？"),
    "19432": ("coffee-processing-methods.html", "日曬、水洗、蜜處理差在哪？"),
    "19408": ("coffee-bean-species.html", "世界三大豆種咖啡因大PK"),
    "19005": ("drip-bag-vs-pour-over.html", "掛耳咖啡 vs 手沖哪個好？"),
    "18957": ("drip-bag-vs-pour-over.html", "掛耳咖啡 vs 手沖哪個好？"),
}

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} | CoFeel 凱飛鮮烘豆</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:title" content="{title} | CoFeel 凱飛鮮烘豆">
<meta property="og:description" content="{description}">
<meta property="og:type" content="product">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{image}">
<script type="application/ld+json">
{jsonld}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
:root{{
  --bg:#faf7f2;--bg2:#f3ede3;--bg3:#ede4d6;
  --brown:#2c1810;--brown2:#5c3520;
  --gold:#c8860a;--gold2:#e8a020;
  --text:#2c1810;--muted:#8a6a50;
  --border:rgba(44,24,16,0.1);
}}
body{{font-family:'Noto Sans TC',sans-serif;background:var(--bg);color:var(--text);line-height:1.8}}
a{{color:var(--gold);text-decoration:none}}
.nav{{display:flex;align-items:center;justify-content:space-between;padding:.7rem 2rem;background:var(--bg);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;box-shadow:0 1px 12px rgba(44,24,16,0.06)}}
.nav-logo img{{height:42px;width:auto}}
.nav-back{{font-size:13px;color:var(--muted);font-weight:500}}
.nav-back:hover{{color:var(--brown)}}
.wrap{{max-width:920px;margin:0 auto;padding:3rem 2rem}}
.product-grid{{display:grid;grid-template-columns:380px 1fr;gap:2.5rem;align-items:start}}
.product-img{{background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;aspect-ratio:1}}
.product-img img{{width:100%;height:100%;object-fit:cover}}
.product-cat{{font-size:11px;font-weight:700;color:var(--gold);letter-spacing:.1em;margin-bottom:.5rem}}
h1{{font-family:'Noto Serif TC',serif;font-size:1.6rem;font-weight:700;color:var(--brown);line-height:1.5;margin-bottom:.8rem}}
.product-price{{font-family:'Noto Serif TC',serif;font-size:1.8rem;font-weight:700;color:var(--gold);margin-bottom:1.2rem}}
.spec-table{{width:100%;border-collapse:collapse;margin:1.2rem 0;font-size:14px}}
.spec-table th{{text-align:left;color:var(--muted);font-weight:500;padding:.5rem .8rem .5rem 0;width:90px;vertical-align:top;white-space:nowrap}}
.spec-table td{{padding:.5rem 0;color:var(--text);border-bottom:1px solid var(--border)}}
.flavor-tags{{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 1.2rem}}
.ftag{{font-size:11px;padding:.25rem .7rem;background:var(--bg3);color:var(--brown2);border-radius:14px;font-weight:500}}
.buy-btn{{display:inline-block;background:var(--brown);color:#fff;padding:.8rem 2.2rem;border-radius:24px;font-size:14px;font-weight:700;margin-top:.5rem}}
.buy-btn:hover{{background:var(--brown2);color:#fff}}
.related-box{{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:1.2rem 1.5rem;margin-top:1.5rem;font-size:13px;color:var(--muted)}}
.related-box a{{font-weight:700}}
.cofeel-note{{background:linear-gradient(135deg,#2c1810,#5c3520);color:#fff;border-radius:12px;padding:1.5rem;margin-top:2.5rem;text-align:center;font-size:13px}}
.cofeel-note strong{{color:var(--gold2)}}
.back-btn{{display:inline-block;margin-top:2rem;padding:.6rem 1.4rem;background:var(--gold);color:#fff;border-radius:6px;font-size:14px;font-weight:700}}
.back-btn:hover{{background:var(--brown2);color:#fff}}
.footer{{background:var(--bg2);border-top:1px solid var(--border);padding:1.5rem 2rem;text-align:center;margin-top:3rem}}
.footer img{{height:24px;width:auto;margin-bottom:.5rem}}
.footer p{{font-size:11px;color:var(--muted)}}
@media(max-width:700px){{
  .product-grid{{grid-template-columns:1fr}}
  .wrap{{padding:2rem 1rem}}
}}
</style>
</head>
<body>
<nav class="nav">
  <a href="/" class="nav-logo"><img src="../images/logo.png" alt="CoFeel 凱飛鮮烘豆"></a>
  <a href="/#shop" class="nav-back">← 全部商品</a>
</nav>
<div class="wrap">
  <div class="product-grid">
    <div class="product-img"><img src="{image}" alt="{title}" loading="lazy"></div>
    <div>
      <div class="product-cat">{category}{origin_suffix}</div>
      <h1>{title}</h1>
      <div class="product-price">NT${price}</div>
      <table class="spec-table">
        {spec_rows}
      </table>
      <div class="flavor-tags">{flavor_tags}</div>
      <a href="{buy_url}" target="_blank" class="buy-btn">立即訂購 →</a>
      {related_html}
    </div>
  </div>

  <div class="cofeel-note">
    <strong>☕ CoFeel 凱飛堅持</strong>　SCA 認證職人接單鮮烘，1 克 1 元起秤重計價，每一包都是新鮮烘焙後出貨，歡迎到永安門市現場挑選試聞。
  </div>

  <a href="/#shop" class="back-btn">← 回到全部商品</a>
</div>
<footer class="footer">
  <img src="../images/logo-footer.png" alt="CoFeel 凱飛鮮烘豆">
  <p>© 2025 凱飛國際有限公司 · <a href="https://www.cofeel.com.tw" style="color:var(--muted)">cofeel.com.tw</a></p>
</footer>
</body>
</html>
"""


def esc(s):
    return html.escape(str(s or ""), quote=True)


def build_description(p):
    parts = []
    if p.get("origin"):
        parts.append(f"產地：{p['origin']}")
    if p.get("process"):
        parts.append(f"處理法：{p['process']}")
    if p.get("roast"):
        parts.append(f"烘焙度：{p['roast']}")
    if p.get("flavors"):
        parts.append(f"風味：{'、'.join(p['flavors'])}")
    base = "、".join(parts)
    return f"{p['name']}。{base}。CoFeel 凱飛鮮烘豆，SCA認證職人接單鮮烘，1克1元起秤重計價。"[:300]


def build_spec_rows(p):
    rows = []
    field_labels = [
        ("origin", "產地"), ("region", "產區"), ("altitude", "海拔"),
        ("process", "處理法"), ("variety", "品種"), ("grade", "等級"),
        ("roast", "烘焙度"), ("net_weight", "淨重"),
        ("best_before", "保存期限"), ("best_taste", "最佳賞味"),
    ]
    for key, label in field_labels:
        val = p.get(key)
        if val:
            rows.append(f"<tr><th>{esc(label)}</th><td>{esc(val)}</td></tr>")
    return "\n        ".join(rows)


def build_related(pid):
    link = BLOG_LINKS.get(pid)
    if not link:
        return ""
    url, anchor = link
    return (f'<div class="related-box">📖 想了解更多？延伸閱讀：'
            f'<a href="/blog/{esc(url)}">{esc(anchor)}</a></div>')


def main():
    with open(os.path.join(ROOT, "tools", "products.json"), encoding="utf-8") as f:
        products = json.load(f)

    by_id = {p["id"]: p for p in products}
    out_dir = os.path.join(ROOT, "products")
    os.makedirs(out_dir, exist_ok=True)

    feed_rows = []

    for pid in PILOT_IDS:
        p = by_id.get(pid)
        if not p:
            print(f"WARN: product {pid} not found, skipping")
            continue

        canonical = f"{SITE}/products/{pid}.html"
        description = build_description(p)
        title = p["name"]
        flavor_tags = "".join(f'<span class="ftag">{esc(f)}</span>' for f in p.get("flavors", []))
        origin_suffix = f" · {esc(p['origin'])}" if p.get("origin") else ""

        jsonld = json.dumps({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": p["name"],
            "image": p.get("image", ""),
            "description": description,
            "brand": {"@type": "Brand", "name": "CoFeel 凱飛鮮烘豆"},
            "offers": {
                "@type": "Offer",
                "url": p.get("buy_url", canonical),
                "priceCurrency": "TWD",
                "price": p.get("price", ""),
                "availability": "https://schema.org/InStock",
                "itemCondition": "https://schema.org/NewCondition"
            }
        }, ensure_ascii=False, indent=2)

        page = PAGE_TEMPLATE.format(
            title=esc(title),
            description=esc(description),
            canonical=esc(canonical),
            image=esc(p.get("image", "")),
            jsonld=jsonld,
            category=esc(p.get("category", "")),
            origin_suffix=origin_suffix,
            price=p.get("price", ""),
            spec_rows=build_spec_rows(p),
            flavor_tags=flavor_tags,
            buy_url=esc(p.get("buy_url", "")),
            related_html=build_related(pid),
        )

        out_path = os.path.join(out_dir, f"{pid}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page)

        feed_rows.append({
            "id": pid,
            "title": title,
            "description": description,
            "link": canonical,
            "image_link": p.get("image", ""),
            "availability": "in stock",
            "price": f"{p.get('price','')} TWD",
            "brand": "CoFeel 凱飛鮮烘豆",
            "condition": "new",
            "identifier_exists": "no",
            "google_product_category": "Food, Beverages & Tobacco > Beverages > Coffee & Tea > Coffee",
        })

    feed_path = os.path.join(ROOT, "tools", "merchant_feed_pilot.csv")
    with open(feed_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(feed_rows[0].keys()))
        writer.writeheader()
        writer.writerows(feed_rows)

    print(f"Generated {len(feed_rows)} product pages in /products/")
    print(f"Generated feed: tools/merchant_feed_pilot.csv")


if __name__ == "__main__":
    main()
