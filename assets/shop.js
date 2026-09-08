/* The initial cards are static HTML; filters progressively enhance the catalogue. */
(function () {
  const grid = document.getElementById('product-grid');
  if (!grid || typeof PRODUCTS === 'undefined') return;
  const state = {cat:'', roast:'', pick:'', query:'', brew:'', budget:0, page:1};
  const perPage = 12;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bean = p => p.category === '咖啡豆';
  const dark = p => ['中深焙','深焙'].includes(p.roast);
  const flower = p => /花|果|柑橘|莓|葡萄|檸檬/.test((p.flavors || []).join(' '));
  const picks = {
    beginner: {match:p=>bean(p)&&['中焙','中深焙'].includes(p.roast),reason:'中焙至中深焙，適合從苦甜平衡開始嘗試。'},
    mellow: {match:p=>bean(p)&&dark(p),reason:'以中深焙、深焙篩選，酸感仍會受沖法影響。'},
    floral: {match:p=>bean(p)&&flower(p),reason:'商品風味標示含花香或果香。'},
    latte: {match:p=>bean(p)&&dark(p),reason:'烘焙調性較厚實，可作為加奶的起點。'}
  };
  function renderCard(p) {
    const url = '/products/' + encodeURIComponent(p.id);
    const name = p.name.replace(/^CoFeel\s*凱飛鮮烘豆\s*/i, '');
    const reason = picks[state.pick]?.reason;
    return `<article class="card"><a class="card-img" href="${url}" tabindex="-1" aria-hidden="true"><img src="${escape(p.image)}" alt="" loading="lazy" decoding="async" width="300" height="300"></a><div class="card-body"><div class="card-cat">${escape(p.origin || p.category)}${p.roast?' · '+escape(p.roast):''}</div><a class="card-name" href="${url}">${escape(name)}</a><div class="card-flavors">${(p.flavors||[]).slice(0,3).map(f=>`<span class="ftag">${escape(f)}</span>`).join('')}</div><p class="card-weight">${escape(p.net_weight || p.size || '規格請見商品頁')}</p>${reason?`<p class="card-reason">${escape(reason)}</p>`:''}<div class="card-footer"><span class="card-price">${p.price?'NT$ '+Number(p.price).toLocaleString('zh-TW'):'查看價格'}</span><a class="card-buy" href="${url}">查看商品</a></div></div></article>`;
  }
  function render() {
    const words = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = PRODUCTS.filter(p => {
      if (p.status !== 'active') return false;
      if(state.cat && p.category !== state.cat) return false;
      if(state.roast && p.roast !== state.roast) return false;
      if(state.pick && !picks[state.pick].match(p)) return false;
      if(state.budget && (!Number(p.price) || Number(p.price)>state.budget)) return false;
      if(state.brew==='filter' && !bean(p)) return false;
      if(state.brew==='milk' && !(bean(p)&&dark(p))) return false;
      if(state.brew==='drip' && p.category!=='濾掛咖啡') return false;
      return words.every(w=>[p.name,p.origin,p.roast,p.process,...(p.flavors||[])].join(' ').toLowerCase().includes(w));
    });
    const pages = Math.ceil(list.length/perPage);
    state.page = Math.max(1,Math.min(state.page,pages||1));
    document.getElementById('result-count').textContent = `共 ${list.length} 款商品`;
    grid.innerHTML = list.length ? list.slice((state.page-1)*perPage,state.page*perPage).map(renderCard).join('') : '<div class="empty"><p>沒有符合條件的商品，試試放寬價格或風味條件。</p><button class="filter-reset" data-reset>清除所有篩選</button></div>';
    const pg = document.getElementById('pagination');
    pg.innerHTML = pages<=1?'':Array.from({length:pages},(_,i)=>`<button class="page-btn ${state.page===i+1?'active':''}" data-page="${i+1}" aria-label="第 ${i+1} 頁" ${state.page===i+1?'aria-current="page"':''}>${i+1}</button>`).join('');
    document.querySelectorAll('[data-pick]').forEach(b=>b.setAttribute('aria-pressed',String(state.pick===b.dataset.pick)));
    document.querySelectorAll('.filter-btn').forEach(b=>{const selected=state[b.dataset.type]===b.dataset.val;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  }
  document.getElementById('shop').addEventListener('click', e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-pick')){state.pick=state.pick===button.dataset.pick?'':button.dataset.pick;state.cat='';state.roast='';state.brew='';document.getElementById('brew-select').value='';state.page=1;}
    else if(button.dataset.type){state[button.dataset.type]=button.dataset.val;state.page=1;}
    else if(button.hasAttribute('data-reset')){Object.assign(state,{cat:'',roast:'',pick:'',query:'',brew:'',budget:0,page:1});document.getElementById('product-search').value='';document.getElementById('brew-select').value='';document.getElementById('budget-select').value='0';}
    else if(button.dataset.page){state.page=Number(button.dataset.page);document.getElementById('shop').scrollIntoView({behavior:'smooth'});}
    else return;
    render();
  });
  document.getElementById('product-search').addEventListener('input',e=>{state.query=e.target.value;state.page=1;render();});
  document.getElementById('brew-select').addEventListener('change',e=>{state.brew=e.target.value;state.page=1;render();});
  document.getElementById('budget-select').addEventListener('change',e=>{state.budget=Number(e.target.value);state.page=1;render();});
  const stat=document.getElementById('stat-total');if(stat)stat.textContent=PRODUCTS.filter(p=>p.status==='active').length;
  render();
})();
