(() => {
  'use strict';
  const API = 'https://jokstream-api.abdonarjah.workers.dev';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pick = (...v) => v.find(x => x !== undefined && x !== null && x !== '');
  const arr = x => Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : [];
  const name = x => String(pick(x?.name,x?.title,x?.stream_name,x?.stream_display_name,'Untitled'));
  const image = x => String(pick(x?.stream_icon,x?.cover_big,x?.cover,x?.movie_image,x?.icon,''));
  const id = x => String(pick(x?.stream_id,x?.series_id,x?.id,''));
  const rating = x => Number(pick(x?.rating,x?.rating_5,x?.rating_4_5,0)) || 0;
  const added = x => Number(x?.added || 0) || 0;
  const cat = x => String(pick(x?.category_name,x?.category,''));
  const api = async path => {
    const r = await fetch(API + path,{cache:'no-store',headers:{Accept:'application/json'}});
    const t = await r.text(); let d;
    try { d = JSON.parse(t); } catch { throw new Error('Invalid API response'); }
    if(!r.ok || d?.error) throw new Error(d?.error || ('HTTP '+r.status));
    return d;
  };

  const css = `
  body.jok-premium .hero{display:none!important} body.jok-premium .brand:before,.jok-sidebar-brand:before{content:"";display:inline-block;width:26px;height:26px;margin-right:8px;vertical-align:-6px;background:linear-gradient(135deg,#ff1744,#ff5b73);clip-path:polygon(0 0,100% 50%,0 100%,0 78%,62% 50%,0 22%);filter:drop-shadow(0 0 9px #ff174488)} .jok-sidebar-brand:before{width:22px;height:22px} #jokHome{display:block;margin:18px 0 30px}
  .jh-quick{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:14px 0 24px}
  .jh-quick button{border:1px solid #ffffff12;background:linear-gradient(145deg,#111722,#0a0f16);color:#eef2f8;border-radius:15px;padding:13px 10px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:900;min-height:64px;box-shadow:0 12px 30px #0005}
  .jh-quick button:hover{border-color:#ff174466;transform:translateY(-2px)}
  .jh-icon{font-size:22px}
  .jh-hero{min-height:470px;border-radius:24px;overflow:hidden;position:relative;display:flex;align-items:flex-end;background:#0b1018;border:1px solid #ffffff12;box-shadow:0 25px 80px #0009}
  .jh-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(1.08);transition:opacity .35s}
  .jh-hero-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#05070b 0%,#05070bd9 32%,#05070b66 62%,#05070b22 100%),linear-gradient(0deg,#05070b 0%,transparent 48%,#05070b22 100%)}
  .jh-hero-content{position:relative;z-index:2;padding:44px;max-width:700px}
  .jh-badge{display:inline-flex;gap:7px;align-items:center;background:#ff1744e6;border-radius:999px;padding:6px 11px;font-size:10px;font-weight:900;letter-spacing:.8px}
  .jh-hero h2{font-size:clamp(34px,5vw,66px);line-height:1.05;margin:14px 0 12px;font-weight:900;letter-spacing:-1.8px;text-shadow:0 8px 35px #000}
  .jh-meta{display:flex;gap:9px;flex-wrap:wrap;color:#c6cfdb;font-size:12px}
  .jh-meta span{background:#ffffff0d;border:1px solid #ffffff12;border-radius:8px;padding:4px 8px}
  .jh-hero-actions{display:flex;gap:9px;margin-top:20px}
  .jh-hero-actions button{border:0;border-radius:11px;padding:11px 17px;font-weight:900}
  .jh-play{background:#fff;color:#07090d}.jh-info{background:#ffffff12;color:#fff;border:1px solid #ffffff18!important}
  .jh-dots{display:flex;gap:6px;margin-top:18px}.jh-dot{width:7px;height:7px;border-radius:50%;background:#6d7683}.jh-dot.active{width:22px;border-radius:10px;background:#ff1744}
  .jh-section{margin:28px 0}.jh-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:12px}.jh-head h3{font-size:22px;margin:0;font-weight:900}.jh-head span{color:#7e8999;font-size:11px}
  .jh-row{display:grid;grid-auto-flow:column;grid-auto-columns:160px;gap:12px;overflow-x:auto;padding:3px 2px 10px;scrollbar-width:thin}
  .jh-card{min-width:0;border:0;background:transparent;color:#fff;text-align:left;padding:0;cursor:pointer}.jh-poster{height:230px;border-radius:13px;overflow:hidden;background:#121823;border:1px solid #ffffff0d;position:relative;box-shadow:0 13px 30px #0007}.jh-poster img{width:100%;height:100%;object-fit:cover;transition:transform .25s}.jh-card:hover .jh-poster img{transform:scale(1.045)}.jh-rate{position:absolute;left:7px;top:7px;background:#080b10df;border:1px solid #ffffff15;border-radius:7px;padding:3px 6px;font-size:9px;font-weight:900}.jh-card-title{font-size:12px;font-weight:900;line-height:1.45;margin-top:7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.jh-card-meta{font-size:9px;color:#768396;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jh-country-row{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:10px}.jh-country{border:1px solid #ffffff12;background:linear-gradient(145deg,#101722,#0a0f16);color:#fff;border-radius:14px;padding:16px 10px;text-align:center;font-weight:900}.jh-country strong{display:block;font-size:16px}.jh-country small{display:block;color:#7f8b9d;font-size:9px;margin-top:2px}
  .jh-skeleton{height:230px;border-radius:13px;background:linear-gradient(90deg,#10151e,#171e29,#10151e);background-size:200% 100%;animation:jhsh 1.2s infinite}@keyframes jhsh{to{background-position:-200% 0}}
  @media(max-width:1000px){.jh-quick{grid-template-columns:repeat(3,1fr)}.jh-country-row{grid-template-columns:repeat(4,1fr)}}
  @media(max-width:700px){#jokHome{margin-top:10px}.jh-hero{min-height:470px;border-radius:18px}.jh-hero-content{padding:24px}.jh-hero h2{font-size:35px}.jh-quick{grid-template-columns:repeat(3,1fr);gap:7px}.jh-quick button{min-height:58px;padding:8px 5px;font-size:9px;flex-direction:column;gap:2px;border-radius:12px}.jh-icon{font-size:18px}.jh-row{grid-auto-columns:135px;gap:9px}.jh-poster{height:195px}.jh-head h3{font-size:18px}.jh-country-row{grid-template-columns:repeat(2,1fr)}}
  `;
  function inject(){if(document.getElementById('jokHomeCss'))return;const s=document.createElement('style');s.id='jokHomeCss';s.textContent=css;document.head.append(s)}
  function nav(tab){
    const b=document.querySelector('.tab[data-tab="'+tab+'"]');
    if(b)b.click();
    document.getElementById('jokHome')?.setAttribute('hidden','');
    ['.jok-sticky-toolbar','.sectionhead','#catalog','#empty','#loadMore','.folder-area'].forEach(sel=>document.querySelectorAll(sel).forEach(x=>x.hidden=false));
    document.querySelector('.toolbar')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function home(){
    document.getElementById('jokHome')?.removeAttribute('hidden');
    ['.jok-sticky-toolbar','.sectionhead','#catalog','#empty','#loadMore','.folder-area'].forEach(sel=>document.querySelectorAll(sel).forEach(x=>x.hidden=true));
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function wireNav(){
    document.querySelectorAll('[data-jok-nav]').forEach(b=>{b.addEventListener('click',()=>{if(b.dataset.jokNav==='home')home();});});
  }
  function card(x,tab){
    const n=name(x),im=image(x),r=rating(x),m=cat(x)||pick(x.year,'');
    return '<button class="jh-card" data-jh-tab="'+esc(tab)+'" data-jh-id="'+esc(id(x))+'" data-jh-name="'+esc(n)+'"><div class="jh-poster">'+(im?'<img loading="lazy" src="'+esc(im)+'" alt="" onerror="this.style.display=\'none\'">':'')+(r?'<span class="jh-rate">★ '+r.toFixed(1)+'</span>':'')+'</div><div class="jh-card-title">'+esc(n)+'</div><div class="jh-card-meta">'+esc(m)+'</div></button>';
  }
  function section(title,items,tab){
    if(!items.length)return '';
    return '<section class="jh-section"><div class="jh-head"><h3>'+title+'</h3><span>'+items.length+' items</span></div><div class="jh-row">'+items.map(x=>card(x,tab)).join('')+'</div></section>';
  }
  function buildShell(){
    if(document.getElementById('jokHome'))return;
    const h=document.querySelector('.hero');if(!h)return;
    const homeEl=document.createElement('section');homeEl.id='jokHome';
    homeEl.innerHTML='<div class="jh-hero"><div class="jh-hero-bg"></div><div class="jh-hero-content"><span class="jh-badge">🔥 JOKSTREAM SPOTLIGHT</span><h2>Loading your spotlight…</h2><div class="jh-meta"></div><div class="jh-hero-actions"><button class="jh-play">▶ Watch</button><button class="jh-info">More info</button></div><div class="jh-dots"></div></div></div><div class="jh-quick"><button data-jh-action="live"><span class="jh-icon">📺</span>Live TV</button><button data-jh-action="movie"><span class="jh-icon">🎬</span>Movies</button><button data-jh-action="series"><span class="jh-icon">📺</span>Series</button><button data-jh-action="sports"><span class="jh-icon">⚽</span>Sports</button><button data-jh-action="countries"><span class="jh-icon">🌍</span>Countries</button><button data-jh-action="search"><span class="jh-icon">🔎</span>Search</button></div><div id="jhSections"></div>';
    h.insertAdjacentElement('afterend',homeEl);
    homeEl.querySelectorAll('[data-jh-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.jhAction;if(a==='sports'){nav('live');setTimeout(()=>{const c=document.getElementById('category');if(c){const o=[...c.options].find(x=>/sport|sports|dazn|sky sport|bein/i.test(x.textContent));if(o){c.value=o.value;c.dispatchEvent(new Event('change',{bubbles:true}));return}}const s=document.getElementById('search');if(s){s.value='sport';s.dispatchEvent(new Event('input',{bubbles:true}))},250);return}if(a==='countries'){nav('live');document.getElementById('country')?.focus();return}if(a==='search'){nav('live');document.getElementById('search')?.focus();return}nav(a)});
  }
  let spotlight=[],spot=0,timer=null;
  function showSpot(i){
    if(!spotlight.length)return;spot=i%spotlight.length;const x=spotlight[spot],homeEl=document.getElementById('jokHome');if(!homeEl)return;
    const bg=homeEl.querySelector('.jh-hero-bg');const im=image(x);bg.style.backgroundImage=im?'url("'+im.replace(/"/g,'\\\"')+'")':'linear-gradient(120deg,#101827,#35115c)';
    homeEl.querySelector('.jh-hero h2').textContent=name(x);
    homeEl.querySelector('.jh-meta').innerHTML='<span>★ '+(rating(x)?rating(x).toFixed(1):'—')+'</span><span>'+esc(pick(x.year,'Movie'))+'</span><span>JokStream</span>';
    homeEl.querySelector('.jh-dots').innerHTML=spotlight.map((_,i)=>'<span class="jh-dot '+(i===spot?'active':'')+'"></span>').join('');
    const play=homeEl.querySelector('.jh-play');play.onclick=()=>openItem(x,'movie');
    const info=homeEl.querySelector('.jh-info');info.onclick=()=>openItem(x,'movie');
  }
  function openItem(x,tab){
    const search=document.getElementById('search');if(!search)return;
    nav(tab);search.value=name(x);search.dispatchEvent(new Event('input',{bubbles:true}));
  }
  async function load(){
    buildShell();
    const sections=document.getElementById('jhSections');if(!sections)return;
    sections.innerHTML='<section class="jh-section"><div class="jh-row">'+Array(7).fill('<div class="jh-skeleton"></div>').join('')+'</div></section>';
    try{
      const [movies,series,live]=await Promise.all([
        api('/api/catalog?kind=movies&page=1&limit=60&sort=recent'),
        api('/api/catalog?kind=series&page=1&limit=30&sort=recent'),
        api('/api/catalog?kind=live&page=1&limit=120&sort=recent')
      ]);
      const ms=arr(movies.items), ss=arr(series.items), ls=arr(live.items);
      spotlight=ms.filter(x=>image(x)).sort((a,b)=>added(b)-added(a)||rating(b)-rating(a)).slice(0,5);
      const sports=ls.filter(x=>/sport|sports|dazn|sky sport|bein|beinsports|canal\+ sport|espn|ssc|eurosport|bundesliga|nba|nfl|mlb|nhl|ufc|wwe|dyn sport/i.test(name(x)+' '+cat(x))).slice(0,14);
      const countries={};ls.forEach(x=>{const c=cat(x).split('➾')[0].replace(/^.*?\b(?:DE|UK|FR|ES|IT|US|PT|TR|AR|NL|PL|GR|BE|CH|AT)\s*$/i,'').trim()||cat(x);if(c&&c.length<32)countries[c]=(countries[c]||0)+1});
      const categoryRows=Array.isArray(live.categories)?live.categories.filter(x=>String(x.parent_id??0)==='0'&&String(x.category_id??'')!=='0'):[];const topCountries=(categoryRows.length?categoryRows.map(x=>[String(x.category_name||'').replace(/\s+/g,' ').trim(),ls.filter(y=>String(y.category_id||'')===String(x.category_id||'')).length]).filter(x=>x[0]):Object.entries(countries)).sort((a,b)=>b[1]-a[1]).slice(0,8);
      const newest=ms.slice().sort((a,b)=>added(b)-added(a)).slice(0,12);
      const topRated=ms.slice().sort((a,b)=>rating(b)-rating(a)).slice(0,12);
      const seriesNew=ss.slice().sort((a,b)=>added(b)-added(a)).slice(0,12);
      sections.innerHTML=section('🔥 New Releases',newest,'movie')+section('📺 Live TV',ls.slice(0,12),'live')+section('🏆 Top Rated',topRated,'movie')+section('⚽ Sports',sports,'live')+section('📺 Series',seriesNew,'series')+(topCountries.length?'<section class="jh-section"><div class="jh-head"><h3>🌍 Countries</h3><span>Explore channels</span></div><div class="jh-country-row">'+topCountries.map(([c,n])=>'<button class="jh-country" data-jh-country="'+esc(c)+'"><strong>'+esc(c)+'</strong><small>'+n+' channels</small></button>').join('')+'</div></section>':'');
      showSpot(0);clearInterval(timer);timer=setInterval(()=>showSpot(spot+1),3000);
      sections.querySelectorAll('.jh-card').forEach(b=>b.addEventListener('click',()=>{const tab=b.dataset.jhTab;const n=b.dataset.jhName;nav(tab);const s=document.getElementById('search');if(s){s.value=n;s.dispatchEvent(new Event('input',{bubbles:true))}}}));
      sections.querySelectorAll('[data-jh-country]').forEach(b=>b.onclick=()=>{nav('live');const c=document.getElementById('country');if(c){c.value=b.dataset.jhCountry;c.dispatchEvent(new Event('change',{bubbles:true}))}});
    }catch(e){
      sections.innerHTML='<div class="notice error">Could not load the home dashboard yet: '+esc(e.message)+'</div>';
    }
  }
  function init(){
    inject();buildShell();wireNav();
    setTimeout(load,900);
    window.JokHome={home,load};
    document.querySelectorAll('.jok-side-btn[data-jok-nav="home"],.jok-bottom-nav button[data-jok-nav="home"]').forEach(b=>b.onclick=home);
    home();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();