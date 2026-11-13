(() => {
  'use strict';

  const API = 'https://jokstream-api.abdonarjah.workers.dev';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pick = (...v) => v.find(x => x !== undefined && x !== null && x !== '');
  const arr = x => Array.isArray(x) ? x : Array.isArray(x?.items) ? x.items : [];
  const name = x => String(pick(x?.name,x?.title,x?.stream_name,x?.stream_display_name,'Untitled'));
  const image = x => String(pick(x?.cover_big,x?.cover,x?.movie_image,x?.stream_icon,x?.icon,''));
  const id = x => String(pick(x?.stream_id,x?.series_id,x?.id,''));
  const rating = x => Number(pick(x?.rating,x?.rating_5,x?.rating_4_5,0)) || 0;
  const added = x => Number(x?.added || 0) || 0;
  const category = x => String(pick(x?.category_name,x?.category,'')).trim();

  const api = async path => {
    const r = await fetch(API + path, { cache:'no-store', headers:{Accept:'application/json'} });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Invalid Cloudflare response'); }
    if (!r.ok || data?.error) throw new Error(data?.error || ('Cloudflare HTTP ' + r.status));
    return data;
  };

  const css = `
    body.jok-premium .jok-sidebar{display:none!important}
    body.jok-premium .shell{width:min(1500px,94%)!important;margin:0 auto!important}
    body.jok-premium .top{display:none!important}
    #jokHome{display:block;margin:0 0 42px}
    .jh-header{position:sticky;top:0;z-index:70;height:72px;display:flex;align-items:center;gap:28px;padding:0 24px;background:#05070beF;border-bottom:1px solid #ffffff10;backdrop-filter:blur(22px)}
    .jh-logo{font-size:25px;font-weight:1000;letter-spacing:-1px;white-space:nowrap}.jh-logo b{color:#ff1744}.jh-logo small{display:block;color:#7f8a9b;font-size:8px;font-weight:700;letter-spacing:1px;margin-top:-4px}
    .jh-nav{display:flex;align-items:center;gap:4px;flex:1}.jh-nav button{border:1px solid transparent;background:transparent;color:#9aa5b5;padding:10px 13px;border-radius:12px;font-size:11px;font-weight:900}.jh-nav button:hover{color:#fff;background:#ffffff08}.jh-nav button.active{color:#fff;background:linear-gradient(135deg,#ff1744,#b30c31);box-shadow:0 0 25px #ff174455}
    .jh-head-actions{display:flex;align-items:center;gap:9px}.jh-head-actions button{width:36px;height:36px;border-radius:50%;border:1px solid #ffffff10;background:#0d121a;color:#e9edf4;font-size:15px}.jh-live-dot{width:7px;height:7px;background:#31e47b;border-radius:50%;box-shadow:0 0 12px #31e47b;display:inline-block;margin-right:5px}
    .jh-hero{min-height:500px;position:relative;overflow:hidden;border-radius:0 0 26px 26px;background:#090d14;border:1px solid #ffffff0b;box-shadow:0 28px 90px #0009}
    .jh-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:background-image .45s ease}
    .jh-hero-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#05070b 0%,#05070be6 28%,#05070b88 58%,#05070b18 100%),linear-gradient(0deg,#05070b 0%,transparent 50%,#05070b22 100%)}
    .jh-hero-content{position:relative;z-index:2;max-width:720px;padding:72px 54px 58px}
    .jh-badge{display:inline-flex;align-items:center;gap:7px;background:#ff1744e8;border-radius:999px;padding:7px 12px;font-size:10px;font-weight:1000;letter-spacing:.7px}
    .jh-hero h1{font-size:clamp(38px,5.5vw,72px);line-height:1.02;letter-spacing:-2px;margin:17px 0 13px;font-weight:1000;text-shadow:0 12px 45px #000}
    .jh-hero p{color:#c1cbd7;max-width:600px;font-size:13px;line-height:1.8;margin:0}
    .jh-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.jh-meta span{padding:5px 9px;border-radius:8px;background:#ffffff0b;border:1px solid #ffffff10;color:#dbe1e9;font-size:10px}
    .jh-actions{display:flex;gap:9px;margin-top:22px}.jh-actions button{border:0;border-radius:11px;padding:11px 18px;font-weight:1000}.jh-play{background:#fff;color:#080b10}.jh-info{background:#ffffff10;color:#fff;border:1px solid #ffffff18!important}
    .jh-dots{display:flex;gap:6px;margin-top:20px}.jh-dot{width:7px;height:7px;border-radius:50%;background:#707b8a}.jh-dot.active{width:22px;border-radius:8px;background:#ff1744}
    .jh-quick{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:18px 0 30px;padding:12px;border:1px solid #ffffff12;border-radius:18px;background:linear-gradient(145deg,#111722,#090d14);box-shadow:0 18px 50px #0008}
    .jh-quick button{border:1px solid #ffffff0b;background:#0d121a;color:#e8edf4;border-radius:13px;padding:14px 9px;min-height:72px;font-weight:1000;display:flex;align-items:center;justify-content:center;gap:8px;transition:.2s}
    .jh-quick button:hover{transform:translateY(-2px);border-color:#ff174455;background:#141b26}.jh-quick i{font-style:normal;font-size:23px}
    .jh-section{margin:30px 0}.jh-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.jh-section-head h2{margin:0;font-size:23px;font-weight:1000;letter-spacing:-.5px}.jh-section-head span{color:#7d8999;font-size:10px}
    .jh-row{display:grid;grid-auto-flow:column;grid-auto-columns:164px;gap:13px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:thin}
    .jh-card{border:0;background:transparent;color:#fff;padding:0;text-align:left;cursor:pointer;min-width:0}.jh-poster{height:244px;border-radius:14px;overflow:hidden;background:#111721;border:1px solid #ffffff10;position:relative;box-shadow:0 15px 35px #0008}.jh-poster img{width:100%;height:100%;object-fit:cover;transition:transform .25s}.jh-card:hover .jh-poster img{transform:scale(1.045)}.jh-rate{position:absolute;left:8px;bottom:8px;background:#070a0ddd;border:1px solid #ffffff18;border-radius:8px;padding:4px 7px;font-size:9px;font-weight:1000}.jh-card-title{font-size:12px;font-weight:1000;margin-top:7px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.jh-card-meta{font-size:9px;color:#778496;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .jh-sport{display:grid;grid-template-columns:1fr 220px;min-height:150px;border-radius:17px;overflow:hidden;border:1px solid #ffffff12;background:linear-gradient(105deg,#101827,#0b1018);box-shadow:0 18px 45px #0008}.jh-sport-main{padding:22px 24px;display:flex;align-items:center;gap:22px}.jh-sport-icon{font-size:50px}.jh-sport-main strong{font-size:22px}.jh-sport-main p{margin:4px 0 0;color:#8895a7;font-size:10px}.jh-sport-list{display:flex;flex-direction:column;justify-content:center;gap:7px;padding:14px;background:#070b11aa}.jh-sport-list span{display:block;padding:8px 10px;border-radius:9px;background:#ffffff08;color:#d7dee7;font-size:10px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .jh-country-row{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.jh-country{border:1px solid #ffffff12;background:linear-gradient(145deg,#101722,#0a0f16);color:#fff;border-radius:14px;padding:17px 10px;text-align:center;font-weight:1000}.jh-country strong{display:block;font-size:15px}.jh-country small{display:block;color:#7d8999;font-size:9px;margin-top:3px}
    .jh-empty{border:1px dashed #ffffff18;border-radius:15px;padding:28px;text-align:center;color:#788597;font-size:11px}
    .jh-mobile-only{display:none}
    @media(max-width:1000px){.jh-header{padding:0 14px;height:64px;gap:14px}.jh-nav button{padding:8px 9px;font-size:9px}.jh-logo{font-size:21px}.jh-head-actions button{width:32px;height:32px}.jh-hero{min-height:500px}.jh-hero-content{padding:55px 30px 42px}.jh-quick{grid-template-columns:repeat(3,1fr)}.jh-country-row{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:700px){body.jok-premium{padding-bottom:78px}.jh-header{height:62px;gap:10px;padding:0 12px}.jh-logo{font-size:19px}.jh-logo small{font-size:6px}.jh-nav{display:none}.jh-head-actions{margin-left:auto}.jh-head-actions button:nth-child(2){display:none}.jh-mobile-only{display:inline}.jh-hero{min-height:490px;border-radius:0 0 20px 20px}.jh-hero-bg{background-position:center}.jh-hero-content{padding:48px 20px 30px;max-width:100%}.jh-badge{font-size:9px}.jh-hero h1{font-size:37px;letter-spacing:-1.2px}.jh-hero p{font-size:11px;max-width:95%}.jh-actions button{padding:10px 14px}.jh-quick{gap:6px;padding:8px;border-radius:15px;margin:12px 0 25px}.jh-quick button{min-height:62px;font-size:9px;flex-direction:column;gap:3px;padding:7px 3px}.jh-quick i{font-size:20px}.jh-section{margin:24px 0}.jh-section-head h2{font-size:19px}.jh-row{grid-auto-columns:137px;gap:9px}.jh-poster{height:198px;border-radius:12px}.jh-card-title{font-size:11px}.jh-sport{grid-template-columns:1fr;min-height:0}.jh-sport-main{padding:18px}.jh-sport-icon{font-size:38px}.jh-sport-main strong{font-size:17px}.jh-sport-list{display:grid;grid-template-columns:repeat(2,1fr)}.jh-country-row{grid-template-columns:repeat(2,1fr)}}
  `;

  function inject(){ if(!document.getElementById('jokHomeCss')){const s=document.createElement('style');s.id='jokHomeCss';s.textContent=css;document.head.appendChild(s);} }

  function showOldApp(show){
    ['.hero','.toolbar','.folder-area','#notice','#subtitleAuditReport','#playerBox','.sectionhead','#catalog','#empty','#loadMore','footer'].forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>el.hidden=!show);
    });
  }

  function nav(tab){
    showOldApp(true);
    document.getElementById('jokHome')?.setAttribute('hidden','');
    const b=document.querySelector('.tab[data-tab="'+tab+'"]');
    if(b)b.click();
    document.querySelector('.toolbar')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function home(){
    showOldApp(false);
    document.getElementById('jokHome')?.removeAttribute('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
    document.querySelectorAll('.jh-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='home'));
  }

  function openItem(x,tab){
    nav(tab);
    const s=document.getElementById('search');
    if(s){s.value=name(x);s.dispatchEvent(new Event('input',{bubbles:true}));}
  }

  function card(x,tab){
    const n=name(x),im=image(x),r=rating(x),m=pick(category(x),x?.year,'');
    return '<button class="jh-card" data-tab="'+esc(tab)+'" data-id="'+esc(id(x))+'" data-name="'+esc(n)+'"><div class="jh-poster">'+(im?'<img loading="lazy" src="'+esc(im)+'" alt="" onerror="this.style.display=\'none\'">':'')+(r?'<span class="jh-rate">★ '+r.toFixed(1)+'</span>':'')+'</div><div class="jh-card-title">'+esc(n)+'</div><div class="jh-card-meta">'+esc(m)+'</div></button>';
  }

  function section(title,items,tab){
    if(!items.length)return '';
    return '<section class="jh-section"><div class="jh-section-head"><h2>'+title+'</h2><span>'+items.length+' items</span></div><div class="jh-row">'+items.map(x=>card(x,tab)).join('')+'</div></section>';
  }

  let spotlight=[],spot=0,timer=null;

  function renderSpot(i){
    if(!spotlight.length)return;
    spot=(i+spotlight.length)%spotlight.length;
    const x=spotlight[spot],root=document.getElementById('jokHome');if(!root)return;
    const bg=root.querySelector('.jh-hero-bg'),im=image(x);
    bg.style.backgroundImage=im?'url("'+im.replace(/"/g,'\\\"')+'")':'linear-gradient(120deg,#101827,#251040)';
    root.querySelector('.jh-hero h1').textContent=name(x);
    root.querySelector('.jh-meta').innerHTML='<span>★ '+(rating(x)?rating(x).toFixed(1):'—')+'</span><span>'+esc(pick(x.year,'JokStream'))+'</span><span>JokStream</span>';
    root.querySelector('.jh-dots').innerHTML=spotlight.map((_,n)=>'<span class="jh-dot '+(n===spot?'active':'')+'"></span>').join('');
    root.querySelector('.jh-play').onclick=()=>openItem(x,'movie');
    root.querySelector('.jh-info').onclick=()=>openItem(x,'movie');
  }

  function build(){
    if(document.getElementById('jokHome'))return;
    const shell=document.querySelector('.shell');if(!shell)return;
    const oldTop=document.querySelector('.top');
    const header=document.createElement('header');header.className='jh-header';
    header.innerHTML='<div class="jh-logo">JOK<b>STREAM</b><small>Watch More ... Feel More</small></div><nav class="jh-nav"><button data-tab="home" class="active">⌂ Home</button><button data-tab="live">◉ Live TV</button><button data-tab="movie">▣ Movies</button><button data-tab="series">▤ Series</button><button data-tab="sports">🏆 Sports</button><button data-tab="search">⌕ Search</button><button data-tab="favorites">★ Favorites</button></nav><div class="jh-head-actions"><button title="Live"><span class="jh-live-dot"></span>●</button><button title="Search">⌕</button><button title="Theme">◐</button></div>';
    shell.insertBefore(header,oldTop||shell.firstChild);

    const homeEl=document.createElement('main');homeEl.id='jokHome';
    homeEl.innerHTML='<section class="jh-hero"><div class="jh-hero-bg"></div><div class="jh-hero-content"><span class="jh-badge">🔥 JOKSTREAM SPOTLIGHT</span><h1>Loading…</h1><p>Discover live channels, movies and series in a premium, fast and simple experience.</p><div class="jh-meta"></div><div class="jh-actions"><button class="jh-play">▶ Watch Now</button><button class="jh-info">More Info</button></div><div class="jh-dots"></div></div></section><div class="jh-quick"><button data-action="live"><i>📺</i><span>Live TV</span></button><button data-action="movie"><i>🎬</i><span>Movies</span></button><button data-action="series"><i>📺</i><span>Series</span></button><button data-action="sports"><i>⚽</i><span>Sports</span></button><button data-action="countries"><i>🌍</i><span>Countries</span></button><button data-action="search"><i>⌕</i><span>Search</span></button></div><div id="jhSections"></div>';
    shell.insertBefore(homeEl,document.querySelector('.toolbar')||shell.lastChild);

    header.querySelectorAll('.jh-nav button').forEach(b=>b.onclick=()=>{
      const a=b.dataset.tab;
      if(a==='home')home();
      else if(a==='search'){showOldApp(true);document.getElementById('jokHome')?.setAttribute('hidden','');document.getElementById('search')?.focus();}
      else if(a==='sports'){nav('live');setTimeout(()=>{const c=document.getElementById('category');const o=c&&[...c.options].find(x=>/sport|dazn|sky sport|bein|espn|ssc/i.test(x.textContent));if(o){c.value=o.value;c.dispatchEvent(new Event('change',{bubbles:true}));}else{const s=document.getElementById('search');if(s){s.value='sport';s.dispatchEvent(new Event('input',{bubbles:true));}}},250);}
      else if(a==='favorites'){alert('Favorites will be enabled in the next phase.');}
      else nav(a);
    });
    header.querySelectorAll('.jh-head-actions button').forEach((b,i)=>b.onclick=()=>{if(i===1){showOldApp(true);document.getElementById('jokHome')?.setAttribute('hidden','');document.getElementById('search')?.focus();}else if(i===0)nav('live');});
    homeEl.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.action;
      if(a==='countries'){nav('live');setTimeout(()=>document.getElementById('country')?.focus(),250);}
      else if(a==='search'){showOldApp(true);homeEl.hidden=true;document.getElementById('search')?.focus();}
      else if(a==='sports'){nav('live');}
      else nav(a);
    });
  }

  async function load(){
    build();
    const root=document.getElementById('jokHome'),host=document.getElementById('jhSections');if(!root||!host)return;
    host.innerHTML='<div class="jh-empty">Loading JokStream catalog…</div>';
    try{
      const [movies,series,live]=await Promise.all([
        api('/api/catalog?kind=movies&page=1&limit=80&sort=recent'),
        api('/api/catalog?kind=series&page=1&limit=50&sort=recent'),
        api('/api/catalog?kind=live&page=1&limit=180&sort=recent')
      ]);
      const ms=arr(movies),ss=arr(series),ls=arr(live);
      spotlight=ms.filter(x=>image(x)).sort((a,b)=>added(b)-added(a)||rating(b)-rating(a)).slice(0,6);
      if(!spotlight.length)spotlight=ms.slice(0,6);
      const newest=ms.slice().sort((a,b)=>added(b)-added(a)).slice(0,12);
      const topRated=ms.slice().sort((a,b)=>rating(b)-rating(a)).slice(0,12);
      const seriesNew=ss.slice().sort((a,b)=>added(b)-added(a)).slice(0,12);
      const sports=ls.filter(x=>/sport|dazn|sky\s*sports?|bein|espn|ssc|eurosport|bundesliga|nba|nfl|mlb|nhl|ufc|wwe|canal\+\s*sport/i.test(name(x)+' '+category(x))).slice(0,14);
      const groups={};ls.forEach(x=>{const c=category(x);if(c&&c.length<36)groups[c]=(groups[c]||0)+1});
      const countries=Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,6);
      const sportsNames=sports.slice(0,5).map(x=>name(x));

      host.innerHTML=
        section('🔥 New Releases',newest,'movie')+
        section('📺 Live TV',ls.slice(0,12),'live')+
        section('⭐ Top Rated',topRated,'movie')+
        (sports.length?'<section class="jh-section"><div class="jh-section-head"><h2>🏆 Live Sports</h2><span>'+sports.length+' channels</span></div><div class="jh-sport"><div class="jh-sport-main"><div class="jh-sport-icon">⚽</div><div><strong>Sports Packages</strong><p>Live sports channels detected from your provider. No fake events are shown until a real event source is connected.</p></div></div><div class="jh-sport-list">'+sportsNames.map(n=>'<span>● '+esc(n)+'</span>').join('')+'</div></div></section>':'')+
        section('📺 Series',seriesNew,'series')+
        (countries.length?'<section class="jh-section"><div class="jh-section-head"><h2>🌍 Countries</h2><span>Explore provider groups</span></div><div class="jh-country-row">'+countries.map(([c,n])=>'<button class="jh-country" data-country="'+esc(c)+'"><strong>'+esc(c)+'</strong><small>'+n+' channels</small></button>').join('')+'</div></section>':'')+
        (sports.length?section('⚽ More Sports Channels',sports.slice(0,12),'live'):'')+
        '<section class="jh-section"><div class="jh-empty">More personalized sections, real sports events, reminders, favorites and ad placement will be connected after the core playback and provider pipeline is stable.</div></section>';

      renderSpot(0);clearInterval(timer);timer=setInterval(()=>renderSpot(spot+1),3000);
      host.querySelectorAll('.jh-card').forEach(b=>b.onclick=()=>{const x={id:b.dataset.id,name:b.dataset.name};openItem(x,b.dataset.tab);});
      host.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{nav('live');setTimeout(()=>{const c=document.getElementById('category');if(c){const o=[...c.options].find(x=>x.textContent.trim()===b.dataset.country);if(o){c.value=o.value;c.dispatchEvent(new Event('change',{bubbles:true));return;}}const s=document.getElementById('search');if(s){s.value=b.dataset.country;s.dispatchEvent(new Event('input',{bubbles:true));}}},250);});
    }catch(e){
      host.innerHTML='<div class="jh-empty">JokStream could not load the home data: '+esc(e.message)+'</div>';
    }
  }

  function init(){
    inject();
    build();
    home();
    setTimeout(load,500);
    window.JokHome={home,load};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();