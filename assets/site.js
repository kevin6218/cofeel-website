(function () {
  // No network analytics is enabled until a real GA4 ID is configured.
  window.dataLayer = window.dataLayer || [];
  document.addEventListener('click', event => {
    const a=event.target.closest('a[href]');if(!a)return;
    const url=new URL(a.href,location.href);
    let name;
    if(url.hostname==='www.thelife.com.tw') name='purchase_outbound';
    else if(url.hostname==='line.me') name='contact_line';
    else if(/(^|\.)google\.com$/.test(url.hostname)&&/maps/.test(url.href)) name='store_directions';
    else if(url.origin===location.origin&&url.pathname.startsWith('/products/')) name='view_product_link';
    if(name) window.dataLayer.push({event:name,link_path:url.pathname,product_id:url.searchParams.get('Id') || url.pathname.split('/').pop(),page_path:location.pathname});
  });
  const menu=document.getElementById('navHamburger');
  const links=document.querySelector('.nav-links');
  if(menu&&links){
    const close=()=>{links.classList.remove('open');menu.classList.remove('open');menu.setAttribute('aria-expanded','false');};
    menu.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));});
    links.addEventListener('click',e=>{if(e.target.closest('a'))close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&links.classList.contains('open')){close();menu.focus();}});
  }
  document.querySelectorAll('.faq-q').forEach((q,i)=>{
    const answer=q.nextElementSibling;answer.id='faq-answer-'+i;
    q.setAttribute('aria-controls',answer.id);q.setAttribute('aria-expanded','false');answer.hidden=true;
    q.addEventListener('click',()=>{const open=q.getAttribute('aria-expanded')==='true';q.setAttribute('aria-expanded',String(!open));answer.hidden=open;q.parentElement.classList.toggle('open',!open);});
  });
  const blog=document.querySelector('.post-grid');
  if(blog){
    const search=document.getElementById('article-search'),category=document.getElementById('article-category');
    if(search&&category){
      const cards=[...blog.querySelectorAll('.post-card')];
      const update=()=>{let count=0;for(const card of cards){const topic=card.querySelector('.post-cat').textContent;const match=card.textContent.toLowerCase().includes(search.value.trim().toLowerCase())&&(!category.value||topic===category.value);card.hidden=!match;if(match)count++;}document.getElementById('article-result').textContent=count?`共 ${count} 篇文章`:'找不到文章，請換個關鍵字或主題。';};
      [...new Set(cards.map(c=>c.querySelector('.post-cat').textContent))].sort().forEach(c=>{const option=document.createElement('option');option.value=c;option.textContent=c;category.appendChild(option);});
      search.addEventListener('input',update);category.addEventListener('change',update);update();
    }
  }
})();
