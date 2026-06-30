import json, sys

with open('index.html', encoding='utf-8') as f:
    for line in f:
        if line.strip().startswith('const PRODUCTS'):
            raw = line.strip()
            break
    else:
        raise SystemExit('PRODUCTS line not found')

raw = raw[len('const PRODUCTS = '):].rstrip(';')
products = json.loads(raw)

with open('tools/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

cats = {}
for p in products:
    cats[p['category']] = cats.get(p['category'], 0) + 1

with open('tools/extract_report.txt', 'w', encoding='utf-8') as f:
    f.write(f"total: {len(products)}\n")
    for k, v in cats.items():
        f.write(f"{k}: {v}\n")
