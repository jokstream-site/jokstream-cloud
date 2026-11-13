(function(){
  'use strict';
  var API='https://jokstream-api.abdonarjah.workers.dev';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function first(){for(var i=0;i<arguments.length;i++){if(arguments[i]!==undefined&&arguments[i]!==null&&arguments[i]!=='')return arguments[i];}return '';}
  function list(v){if(Array.isArray(v))return v;if(v&&Array.isArray(v.items))return v.items;return [];}
  function itemName(x){return String(first(x.name,x.title,x.stream_name,x.stream_display_name,'Untitled'));}
  function itemImage(x){return String(first(x.cover_big,x.cover,x.movie_image,x.stream_icon,x.icon,''));}
  function itemId(x){return String(first(x.stream_id,x.series_id,x.id,''));}
  function itemRating(x){return Number(first(x.rating,x.rating_5,x.rating_4_5,0))||0;}
  function itemAdded(x){return Number(x.added||0)||0;}
  function itemCategory(x){return String(first(x.category_name,x.category,'')).trim();}
  function api(path){
    return fetch(API+path,{cache:'no-store',headers:{Accept:'application/json'}}).then(function(r){
      return r.text().then(function(t){var d;try{d=JSON.parse(t);}catch(e){throw new Error('Invalid Cloudflare response');}if(!r.ok||d.error)throw new Error(d.error||('Cloudflare HTTP '+r.status));return d;});
    });
  }

  var css=[
    'body.jok-premium .jok-sidebar{display:none!important}',
    'body.jok-premium .shell{width:min(1500px,94%)!important;margin:0 auto!important}',
    'body.jok-premium .top{display:none!important}',
    '#jokHome{display:block;margin:0 0 50px}',
    '.jh-header{position:sticky;top:0;z-index:70;height:72px;display:flex;align-items:center;gap:24px;padding:0 24px;background:#05070bf2;border-bottom:1px solid #ffffff12;backdrop-filter:blur(22px)}',
    '.jh-logo{font-size:25px;font-weight:900;line-height:1;white-space:nowrap}.jh-logo b{color:#ff1744}.jh-logo small{display:block;color:#7d8796;font-size:8px;margin-top:4px;font-weight:700}',
    '.jh-nav{display:flex;gap:4px;flex:1}.jh-nav button{border:0;background:transparent;color:#9aa5b5;border-radius:11px;padding:10px 12px;font-size:11px;font-weight:900}.jh-nav button:hover{background:#ffffff09;color:#fff}.jh-nav button.active{background:#ff1744;color:#fff;box-shadow:0 0 24px #ff174455}',
    '.jh-actions{display:flex;gap:8px}.jh-actions button{width:36px;height:36px;border-radius:50%;border:1px solid #ffffff12;background:#0d121a;color:#fff}',
    '.jh-hero{min-height:500px;position:relative;overflow:hidden;border-radius:0 0 26px 26px;background:#090d14;box-shadow:0 28px 80px #0009}.jh-hero-bg{position:absolute;inset:0;background:center/cover no-repeat}.jh-hero-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#05070b 0%,#05070be8 28%,#05070b75 60%,#05070b16 100%),linear-gradient(0deg,#05070b,transparent 55%)}',
    '.jh-hero-content{position:relative;z-index:2;padding:70px 52px;max-width:760px}.jh-badge{display:inline-block;background:#ff1744;color:#fff;border-radius:999px;padding:7px 12px;font-size:10px;font-weight:900}.jh-hero h1{font-size:clamp(38px,5.5vw,72px);line-height:1.02;margin:18px 0 12px;letter-spacing:-2px;font-weight:900;text-shadow:0 10px 40px #000}.jh-hero p{color:#c5cdd8;font-size:13px;max-width:610px;line-height:1.8}.jh-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.jh-meta span{background:#ffffff0b;border:1px solid #ffffff12;border-radius:8px;padding:5px 9px;font-size:10px;color:#e3e8ef}.jh-buttons{display:flex;gap:9px;margin-top:22px}.jh-buttons button{border:0;border-radius:11px;padding:11px 18px;font-weight:900}.jh-play{background:#fff;color:#080b10}.jh-info{background:#ffffff10;color:#fff!important;border:1px solid #ffffff18!important}.jh-dots{display:flex;gap:6px;margin-top:20px}.jh-dot{width:7px;height:7px;border-radius:50%;background:#77808e}.jh-dot.active{width:22px;border-radius:8px;background:#ff1744}',
    '.jh-quick{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:18px 0 30px;padding:12px;border:1px solid #ffffff12;border-radius:18px;background:linear-gradient(145deg,#111722,#090d14)}.jh-quick button{border:1px solid #ffffff0d;background:#0d121a;color:#eef2f7;border-radius:13px;min-height:70px;font-weight:900}.jh-quick button:hover{border-color:#ff174466;transform:translateY(-2px)}.jh-quick i{display:block;font-style:normal;font-size:23px;margin-bottom:3px}',
    '.jh-section{margin:30px 0}.jh-section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.jh-section-head h2{margin:0;font-size:23px;font-weight:900}.jh-section-head span{font-size:10px;color:#7f8b9b}.jh-row{display:grid;grid-auto-flow:column;grid-auto-columns:164px;gap:13px;overflow-x:auto;padding:2px 2px 10px}.jh-card{border:0;background:transparent;color:#fff;text-align:left;padding:0;cursor:pointer}.jh-poster{height:244px;border-radius:14px;overflow:hidden;background:#111721;border:1px solid #ffffff10;position:relative;box-shadow:0 15px 35px #0008}.jh-poster img{width:100%;height:100%;object-fit:cover;transition:transform .25s}.jh-card:hover img{transform:scale(1.045)}.jh-rate{position:absolute;left:8px;bottom:8px;background:#070a0ddd;border-radius:8px;padding:4px 7px;font-size:9px;font-weight:900}.jh-title{font-size:12px;font-weight:900;line-height:1.45;margin-top:7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.jh-meta2{font-size:9px;color:#788597;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.jh-sport{display:grid;grid-template-columns:1fr 250px;min-height:150px;border:1px solid #ffffff12;border-radius:17px;overflow:hidden;background:linear-gradient(105deg,#101827,#0b1018)}.jh-sport-main{padding:22px;display:flex;gap:20px;align-items:center}.jh-sport-icon{font-size:48px}.jh-sport-main strong{font-size:21px}.jh-sport-main p{color:#8793a5;font-size:10px;margin:4px 0}.jh-sport-list{padding:14px;display:flex;flex-direction:column;justify-content:center;gap:7px;background:#070b11aa}.jh-sport-list span{background:#ffffff08;border-radius:9px;padding:8px 10px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.jh-countries{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.jh-country{border:1px solid #ffffff12;background:#0e141d;color:#fff;border-radius:14px;padding:16px 8px;font-weight:900}.jh-country strong{display:block;font-size:15px}.jh-country small{color:#7c899b;font-size:9px}.jh-empty{border:1px dashed #ffffff18;border-radius:15px;padding:25px;text-align:center;color:#788597;font-size:11px}',
    '@media(max-width:1000px){.jh-header{height:64px;padding:0 14px}.jh-nav button{padding:8px 8px;font-size:9px}.jh-logo{font-size:21px}.jh-quick{grid-template-columns:repeat(3,1fr)}.jh-countries{grid-template-columns:repeat(3,1fr)}}',
    '@media(max-width:700px){body.jok-premium{padding-bottom:78px}.jh-header{height:62px;padding:0 12px}.jh-logo{font-size:19px}.jh-logo small{font-size:6px}.jh-nav{display:none}.jh-hero{min-height:490px;border-radius:0 0 20px 20px}.jh-hero-content{padding:48px 20px 30px}.jh-hero h1{font-size:37px;letter-spacing:-1px}.jh-hero p{font-size:11px}.jh-quick{gap:6px;padding:8px;margin:12px 0 24px}.jh-quick button{min-height:62px;font-size:9px}.jh-quick i{font-size:20px}.jh-row{grid-auto-columns:137px;gap:9px}.jh-poster{height:198px;border-radius:12px}.jh-title{font-size:11px}.jh-section-head h2{font-size:19px}.jh-sport{grid-template-columns:1fr}.jh-sport-list{display:grid;grid-template-columns:repeat(2,1fr)}.jh-countries{grid-template-columns:repeat(2,1fr)}}'
  ].join('');

  function injectCss(){if(!document.getElementById('jokHomeCss')){var s=document.createElement('style');s.id='jokHomeCss';s.textContent=css;document.head.appendChild(s);}}

  function oldApp(show){var sels=['.hero','.toolbar','.folder-area','#notice','#subtitleAuditReport','#playerBox','.sectionhead','#catalog','#empty','#loadMore','footer'];sels.forEach(function(sel){document.querySelectorAll(sel).forEach(function(e){e.hidden=!show;});});}
  function go(tab){oldApp(true);var h=document.getElementById('jokHome');if(h)h.hidden=true;var b=document.querySelector('.tab[data-tab="'+tab+'"]');if(b)b.click();var t=document.querySelector('.toolbar');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}
  function home(){oldApp(false);var h=document.getElementById('jokHome');if(h)h.hidden=false;window.scrollTo(0,0);}

  function card(x,tab){
    var n=itemName(x),im=itemImage(x),r=itemRating(x);
    return '<button class="jh-card" data-tab="'+esc(tab)+'" data-id="'+esc(itemId(x))+'" data-name="'+esc(n)+'"><div class="jh-poster">'+(im?'<img loading="lazy" src="'+esc(im)+'" alt="">':'')+(r?'<span class="jh-rate">★ '+r.toFixed(1)+'</span>':'')+'</div><div class="jh-title">'+esc(n)+'</div><div class="jh-meta2">'+esc(first(itemCategory(x),x.year,''))+'</div></button>';
  }
  function section(title,items,tab){if(!items.length)return '';return '<section class="jh-section"><div class="jh-section-head"><h2>'+title+'</h2><span>'+items.length+' items</span></div><div class="jh-row">'+items.map(function(x){return card(x,tab);}).join('')+'</div></section>';}

  var spotlight=[],spot=0,timer=null;
  function setSpot(n){
    if(!spotlight.length)return;
    spot=(n+spotlight.length)%spotlight.length;
    var x=spotlight[spot],root=document.getElementById('jokHome');if(!root)return;
    var bg=root.querySelector('.jh-hero-bg');var im=itemImage(x);
    bg.style.backgroundImage=im?'url("'+im.replace(/"/g,'\\\"')+'")':'linear-gradient(120deg,#101827,#251040)';
    root.querySelector('.jh-hero h1').textContent=itemName(x);
    root.querySelector('.jh-meta').innerHTML='<span>★ '+(itemRating(x)?itemRating(x).toFixed(1):'—')+'</span><span>'+esc(first(x.year,'JokStream'))+'</span><span>JokStream</span>';
    root.querySelector('.jh-dots').innerHTML=spotlight.map(function(_,i){return '<span class="jh-dot '+(i===spot?'active':'')+'"></span>';}).join('');
    root.querySelector('.jh-play').onclick=function(){go('movie');var s=document.getElementById('search');if(s){s.value=itemName(x);s.dispatchEvent(new Event('input',{bubbles:true}));}};
  }

  function build(){
    if(document.getElementById('jokHome'))return;
    var shell=document.querySelector('.shell');if(!shell)return;
    var oldTop=document.querySelector('.top');
    var header=document.createElement('header');header.className='jh-header';
    header.innerHTML='<div class="jh-logo">JOK<b>STREAM</b><small>Watch More ... Feel More</small></div><nav class="jh-nav"><button data-t="home" class="active">⌂ Home</button><button data-t="live">◉ Live TV</button><button data-t="movie">▣ Movies</button><button data-t="series">▤ Series</button><button data-t="sports">🏆 Sports</button><button data-t="search">⌕ Search</button><button data-t="favorites">★ Favorites</button></nav><div class="jh-actions"><button data-head="live">●</button><button data-head="search">⌕</button></div>';
    shell.insertBefore(header,oldTop||shell.firstChild);

    var root=document.createElement('main');root.id='jokHome';
    root.innerHTML='<section class="jh-hero"><div class="jh-hero-bg"></div><div class="jh-hero-content"><span class="jh-badge">🔥 JOKSTREAM SPOTLIGHT</span><h1>Loading…</h1><p>Discover live channels, movies and series in a premium, fast and simple experience.</p><div class="jh-meta"></div><div class="jh-buttons"><button class="jh-play">▶ Watch Now</button><button class="jh-info">More Info</button></div><div class="jh-dots"></div></div></section><div class="jh-quick"><button data-q="live"><i>📺</i>Live TV</button><button data-q="movie"><i>🎬</i>Movies</button><button data-q="series"><i>📺</i>Series</button><button data-q="sports"><i>⚽</i>Sports</button><button data-q="countries"><i>🌍</i>Countries</button><button data-q="search"><i>⌕</i>Search</button></div><div id="jhSections"></div>';
    shell.insertBefore(root,document.querySelector('.toolbar')||shell.lastChild);

    header.querySelectorAll('[data-t]').forEach(function(b){b.onclick=function(){var t=b.getAttribute('data-t');if(t==='home')home();else if(t==='search'){go('live');var s=document.getElementById('search');if(s)s.focus();}else if(t==='sports'){go('live');setTimeout(function(){var s=document.getElementById('search');if(s){s.value='sport';s.dispatchEvent(new Event('input',{bubbles:true}));}},250);}else if(t!=='favorites')go(t);else alert('Favorites will be connected after the core experience is stable.');};});
    header.querySelectorAll('[data-head]').forEach(function(b){b.onclick=function(){var t=b.getAttribute('data-head');if(t==='live')go('live');else{go('live');var s=document.getElementById('search');if(s)s.focus();}};});
    root.querySelectorAll('[data-q]').forEach(function(b){b.onclick=function(){var t=b.getAttribute('data-q');if(t==='countries'){go('live');setTimeout(function(){var c=document.getElementById('country');if(c)c.focus();},250);}else if(t==='search'){go('live');var s=document.getElementById('search');if(s)s.focus();}else if(t==='sports')go('live');else go(t);};});
  }

  function load(){
    build();
    var root=document.getElementById('jokHome'),host=document.getElementById('jhSections');if(!root||!host)return;
    host.innerHTML='<div class="jh-empty">Loading JokStream catalog…</div>';
    Promise.all([
      api('/api/catalog?kind=movies&page=1&limit=80&sort=recent'),
      api('/api/catalog?kind=series&page=1&limit=50&sort=recent'),
      api('/api/catalog?kind=live&page=1&limit=180&sort=recent')
    ]).then(function(data){
      var ms=list(data[0]),ss=list(data[1]),ls=list(data[2]);
      spotlight=ms.filter(function(x){return itemImage(x);}).sort(function(a,b){return itemAdded(b)-itemAdded(a)||itemRating(b)-itemRating(a);}).slice(0,6);
      if(!spotlight.length)spotlight=ms.slice(0,6);
      var newest=ms.slice().sort(function(a,b){return itemAdded(b)-itemAdded(a);}).slice(0,12);
      var top=ms.slice().sort(function(a,b){return itemRating(b)-itemRating(a);}).slice(0,12);
      var series=ss.slice().sort(function(a,b){return itemAdded(b)-itemAdded(a);}).slice(0,12);
      var sports=ls.filter(function(x){return /sport|dazn|sky\s*sports?|bein|espn|ssc|eurosport|bundesliga|nba|nfl|mlb|nhl|ufc|wwe|canal\+\s*sport/i.test(itemName(x)+' '+itemCategory(x));}).slice(0,14);
      var groups={};ls.forEach(function(x){var c=itemCategory(x);if(c&&c.length<36)groups[c]=(groups[c]||0)+1;});
      var countries=Object.keys(groups).map(function(k){return [k,groups[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,6);
      var html=section('🔥 New Releases',newest,'movie')+section('📺 Live TV',ls.slice(0,12),'live')+section('⭐ Top Rated',top,'movie');
      if(sports.length){html+='<section class="jh-section"><div class="jh-section-head"><h2>🏆 Live Sports</h2><span>'+sports.length+' channels</span></div><div class="jh-sport"><div class="jh-sport-main"><div class="jh-sport-icon">⚽</div><div><strong>Sports Packages</strong><p>Real channels detected from the connected provider. Events will be shown only after a real event source is connected.</p></div></div><div class="jh-sport-list">'+sports.slice(0,5).map(function(x){return '<span>● '+esc(itemName(x))+'</span>';}).join('')+'</div></div></section>';}
      html+=section('📺 Series',series,'series');
      if(countries.length){html+='<section class="jh-section"><div class="jh-section-head"><h2>🌍 Countries / Groups</h2><span>Provider groups</span></div><div class="jh-countries">'+countries.map(function(c){return '<button class="jh-country" data-c="'+esc(c[0])+'"><strong>'+esc(c[0])+'</strong><small>'+c[1]+' channels</small></button>';}).join('')+'</div></section>';}
      html+=section('⚽ More Sports Channels',sports.slice(0,12),'live');
      host.innerHTML=html;
      setSpot(0);clearInterval(timer);timer=setInterval(function(){setSpot(spot+1);},3000);
      host.querySelectorAll('.jh-card').forEach(function(b){b.onclick=function(){var t=b.getAttribute('data-tab'),n=b.getAttribute('data-name');go(t);var s=document.getElementById('search');if(s){s.value=n;s.dispatchEvent(new Event('input',{bubbles:true}));}};});
      host.querySelectorAll('[data-c]').forEach(function(b){b.onclick=function(){go('live');var s=document.getElementById('search');if(s){s.value=b.getAttribute('data-c');s.dispatchEvent(new Event('input',{bubbles:true}));}};});
    }).catch(function(e){host.innerHTML='<div class="jh-empty">Could not load the JokStream home dashboard: '+esc(e.message)+'</div>';});
  }

  function init(){injectCss();build();home();setTimeout(load,400);window.JokHome={home:home,load:load};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();