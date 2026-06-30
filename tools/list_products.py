import json

products = json.load(open('tools/products.json', encoding='utf-8'))
with open('tools/products_list.txt', 'w', encoding='utf-8') as f:
    for p in products:
        f.write("{} | {} | {} | {} | NT{}\n".format(
            p['id'], p['category'], p['name'], p.get('origin', ''), p['price']
        ))
