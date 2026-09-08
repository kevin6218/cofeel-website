(function () {
  const fab=document.getElementById('ai-fab'),panel=document.getElementById('ai-panel');
  if(!fab||!panel)return;
  const messages=document.getElementById('ai-messages'),input=document.getElementById('ai-input'),send=document.getElementById('ai-send');
  let busy=false,history=[],initialized=false;
  function append(role,text,sources=[]) {
    const row=document.createElement('div');row.className='ai-msg '+(role==='user'?'user':'bot');
    const avatar=document.createElement('div');avatar.className='ai-msg-avatar';avatar.textContent=role==='user'?'你':'飛';
    const bubble=document.createElement('div');bubble.className='ai-msg-bubble';bubble.style.whiteSpace='pre-wrap';
    // Model output and customer text stay inert; only our own source links become anchors.
    bubble.textContent=String(text).replace(/\*\*/g,'');
    for(const source of sources){try{const url=new URL(source.url);if(url.origin!=='https://www.cofeel.com.tw')continue;const a=document.createElement('a');a.href=url.href;a.textContent=String(source.title);a.style.display='block';bubble.appendChild(a);}catch{}}
    row.append(avatar,bubble);messages.appendChild(row);messages.scrollTop=messages.scrollHeight;return row;
  }
  function open(value){panel.classList.toggle('open',value);panel.setAttribute('aria-hidden',String(!value));panel.inert=!value;fab.setAttribute('aria-expanded',String(value));if(value){if(!initialized){append('bot','您好，我是凱飛 AI 咖啡顧問。告訴我喜歡的風味或沖煮器具，我可以協助選豆。商品價格與門市資訊請以附上的官網頁面為準。');initialized=true;}input.focus();}else fab.focus();}
  panel.inert=true;
  fab.addEventListener('click',()=>open(!panel.classList.contains('open')));
  document.querySelectorAll('[data-open-chat]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();open(true);}));
  document.getElementById('ai-panel-close').addEventListener('click',()=>open(false));
  panel.addEventListener('keydown',e=>{if(e.key==='Escape')open(false);});
  async function submit(text){
    text=text.trim();if(!text||busy)return;
    if(text.length>1200){append('bot','請將問題縮短至 1,200 字以內。');return;}
    append('user',text);input.value='';busy=true;send.disabled=true;input.disabled=true;
    const pending=append('bot','正在查詢咖啡與門市資料…');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
    try{
      const api=['localhost','127.0.0.1'].includes(location.hostname)?'/api/chat':'https://cofeel-website.vercel.app/api/chat';
      const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:history.slice(-8)}),signal:controller.signal});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'服務暫時無法回覆，請稍後再試或透過 LINE 聯繫我們。');
      if(typeof data.text!=='string')throw new Error('服務暫時無法回覆，請透過 LINE 聯繫我們。');
      pending.remove();append('bot',data.text,Array.isArray(data.sources)?data.sources:[]);
      history.push({role:'user',text},{role:'model',text:data.text.slice(0,4000)});history=history.slice(-8);
      while(history.reduce((n,m)=>n+m.text.length,0)>16000)history=history.slice(2);
    }catch(error){pending.remove();append('bot',error.name==='AbortError'?'回覆時間較長，請稍後再試或點下方 LINE 聯繫我們。':error.message);}
    finally{clearTimeout(timer);busy=false;send.disabled=false;input.disabled=false;input.focus();}
  }
  send.addEventListener('click',()=>submit(input.value));
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit(input.value);}});
  document.querySelectorAll('.ai-prompt-chip').forEach(b=>b.addEventListener('click',()=>submit(b.textContent)));
})();
