async (page) => {
  const products = [];
  for (let pageNumber = 1; pageNumber <= 5; pageNumber += 1) {
    const url = `https://www.thelife.com.tw/product/list.aspx?cId=202&Page=${pageNumber}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const pageProducts = await page.evaluate(() => {
      const items = [];
      for (const card of document.querySelectorAll('li')) {
        const links = [...card.querySelectorAll('a[href*="detail.aspx?Id="]')];
        if (!links.length) continue;
        const url = new URL(links[0].href, location.href);
        const id = url.searchParams.get('Id');
        if (!id || items.some(item => item.id === id)) continue;
        const priceText = card.innerText.match(/\$[\d,]+/)?.[0] || '';
        const image = card.querySelector('img');
        const name = links.map(link => link.textContent.trim()).sort((a, b) => b.length - a.length)[0] || '';
        items.push({
          id,
          name,
          price: Number(priceText.replace(/[^\d]/g, '')),
          image: image?.currentSrc || image?.src || image?.dataset.src || image?.dataset.original || '',
          buy_url: url.href,
          page: Number(new URL(location.href).searchParams.get('Page') || 1),
        });
      }
      return items;
    });
    products.push(...pageProducts);
  }
  return products;
}
