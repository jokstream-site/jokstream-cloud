(() => {
  'use strict';
  const SITE='https://jokstream1.netlify.app';
  const LANGS={
    en:{name:'English',dir:'ltr',title:'JokStream — Live TV, Movies & Series',desc:'JokStream is a fast, clean streaming interface for live channels, movies and series. Search, browse and watch with a lightweight player.',hero:'Watch what you love.\\nSimpler. Faster. Better.',sub:'A clean viewing experience for live channels, movies and series — built to get you to content quickly.',watch:'Start watching',searchNow:'Search now',live:'Live',movies:'Movies',series:'Series',allCategories:'All categories',allCountries:'All countries',search:'Search channels, movies or series...',categories:'Categories',countries:'Countries',channels:'Live channels',details:'Details',play:'Play',episodes:'Episodes',loading:'Loading...',loadMore:'Load 100 more',noResults:'No matching results.',player:'Player',close:'Close ✕',retry:'Retry',subtitles:'Subtitles',other:'🌐 Find another language...',chat:'Channel chat',hideChat:'Hide chat',showChat:'Show chat',nickname:'Enter a nickname',nicknameHint:'Nickname only — no account required',message:'Write a message...',send:'Send',footer:'JokStream · Availability and stream quality depend on the content provider and your internet connection.',original:'JOKSTREAM ORIGINAL EXPERIENCE',cloudflare:'Cloudflare connected',source:'Source connected'},
    es:{name:'Español',dir:'ltr',title:'JokStream — TV en directo, películas y series',desc:'JokStream ofrece una interfaz rápida y limpia para canales en directo, películas y series.',hero:'Mira lo que te gusta.\\nMás simple. Más rápido. Mejor.',sub:'Una experiencia limpia para canales en directo, películas y series, diseñada para encontrar contenido rápidamente.',watch:'Empezar a ver',searchNow:'Buscar ahora',live:'Directo',movies:'Películas',series:'Series',allCategories:'Todas las categorías',allCountries:'Todos los países',search:'Busca canales, películas o series...',categories:'Categorías',countries:'Países',channels:'Canales en directo',details:'Detalles',play:'Reproducir',episodes:'Episodios',loading:'Cargando...',loadMore:'Cargar 100 más',noResults:'No hay resultados.',player:'Reproductor',close:'Cerrar ✕',retry:'Reintentar',subtitles:'Subtítulos',other:'🌐 Buscar otro idioma...',chat:'Chat del canal',hideChat:'Ocultar chat',showChat:'Mostrar chat',nickname:'Escribe un apodo',nicknameHint:'Solo apodo — no necesitas cuenta',message:'Escribe un mensaje...',send:'Enviar',footer:'JokStream · La disponibilidad y calidad dependen del proveedor y de tu conexión.',original:'EXPERIENCIA ORIGINAL DE JOKSTREAM',cloudflare:'Cloudflare conectado',source:'Fuente conectada'},
    fr:{name:'Français',dir:'ltr',title:'JokStream — TV en direct, films et séries',desc:'JokStream propose une interface rapide et claire pour les chaînes en direct, les films et les séries.',hero:'Regardez ce que vous aimez.\\nPlus simple. Plus rapide. Mieux.',sub:'Une expérience claire pour les chaînes en direct, les films et les séries, conçue pour accéder rapidement au contenu.',watch:'Commencer à regarder',searchNow:'Rechercher',live:'Direct',movies:'Films',series:'Séries',allCategories:'Toutes les catégories',allCountries:'Tous les pays',search:'Rechercher une chaîne, un film ou une série...',categories:'Catégories',countries:'Pays',channels:'Chaînes en direct',details:'Détails',play:'Lire',episodes:'Épisodes',loading:'Chargement...',loadMore:'Charger 100 de plus',noResults:'Aucun résultat.',player:'Lecteur',close:'Fermer ✕',retry:'Réessayer',subtitles:'Sous-titres',other:'🌐 Rechercher une autre langue...',chat:'Chat de la chaîne',hideChat:'Masquer le chat',showChat:'Afficher le chat',nickname:'Entrez un pseudo',nicknameHint:'Pseudo uniquement — aucun compte requis',message:'Écrire un message...',send:'Envoyer',footer:'JokStream · La disponibilité et la qualité dépendent du fournisseur et de votre connexion.',original:'EXPÉRIENCE ORIGINALE JOKSTREAM',cloudflare:'Cloudflare connecté',source:'Source connectée'},
    ar:{name:'العربية',dir:'rtl',title:'JokStream — بث مباشر وأفلام ومسلسلات',desc:'JokStream واجهة مشاهدة سريعة ونظيفة للقنوات المباشرة والأفلام والمسلسلات.',hero:'شاهد ما تحب.\\nأبسط. أسرع. أفضل.',sub:'تجربة مشاهدة احترافية للقنوات المباشرة والأفلام والمسلسلات، مصممة للوصول إلى المحتوى بسرعة.',watch:'ابدأ المشاهدة',searchNow:'ابحث الآن',live:'مباشر',movies:'أفلام',series:'مسلسلات',allCategories:'كل التصنيفات',allCountries:'كل الدول',search:'ابحث عن قناة أو فيلم أو مسلسل...',categories:'التصنيفات',countries:'الدول',channels:'القنوات المباشرة',details:'تفاصيل',play:'تشغيل',episodes:'الحلقات',loading:'جارٍ التحميل...',loadMore:'تحميل 100 إضافية',noResults:'لا توجد نتائج مطابقة.',player:'المشغل',close:'إغلاق ✕',retry:'إعادة المحاولة',subtitles:'الترجمة',other:'🌐 بحث عن لغة أخرى...',chat:'دردشة القناة',hideChat:'إخفاء الدردشة',showChat:'إظهار الدردشة',nickname:'اكتب اسماً مستعاراً',nicknameHint:'اسم مستعار فقط — دون تسجيل حساب',message:'اكتب رسالة...',send:'إرسال',footer:'JokStream · يعتمد توفر المحتوى وجودة البث على مزود الخدمة واتصال الإنترنت.',original:'JOKSTREAM ORIGINAL EXPERIENCE',cloudflare:'Cloudflare متصل',source:'المصدر متصل'}
  };
  const base={'مباشر':'live','أفلام':'movies','مسلسلات':'series','القنوات':'channels','القنوات المباشرة':'channels','التفاصيل':'details','تشغيل':'play','الحلقات':'episodes','جارٍ التحميل...':'loading','لا توجد نتائج مطابقة.':'noResults','المشغل':'player','إغلاق ✕':'close','إعادة المحاولة':'retry','🌐 بحث عن لغة أخرى...':'other','دردشة القناة':'chat','إخفاء الدردشة':'hideChat','إظهار الدردشة':'showChat','إرسال':'send','مجلدات التصنيفات':'categories','مجلدات الدول':'countries','كل التصنيفات':'allCategories','كل الدول':'allCountries','JOKSTREAM ORIGINAL EXPERIENCE':'original','ابدأ المشاهدة':'watch','ابحث الآن':'searchNow','Cloudflare متصل':'cloudflare','المصدر متصل':'source'};
  function currentPathLang(){const m=location.pathname.match(/^\\/(en|es|fr|ar)(?:\\/|$)/);return m?m[1]:(localStorage.getItem('jokstream.lang')||'en')}
  let lang=currentPathLang();
  function value(key){return LANGS[lang]?.[key]??LANGS.en[key]??key}
  function translate(text){
    const raw=text.trim();
    if(!raw)return text;
    const key=base[raw];
    if(key)return value(key);
    let m=raw.match(/^عرض\\s+(\\d+)\\s+من\\s+(\\d+)$/);
    if(m)return lang==='ar'?raw:(lang==='es'?'Mostrando '+m[1]+' de '+m[2]:lang==='fr'?'Affichage de '+m[1]+' sur '+m[2]:'Showing '+m[1]+' of '+m[2]);
    m=raw.match(/^تم تحميل\\s+(\\d+)\\s+عنصر\\.?$/);
    if(m)return lang==='ar'?raw:(lang==='es'?m[1]+' elementos cargados.':lang==='fr'?m[1]+' éléments chargés.':'Loaded '+m[1]+' items.');
    m=raw.match(/^جارٍ تحميل\\s+(?:نتائج البحث في\\s+)?(.+?)\\.\\.\\.$/);
    if(m)return value('loading')+' '+m[1]+'...';
    if(raw==='فيلم')return lang==='ar'?raw:(lang==='es'?'Película':lang==='fr'?'Film':'Movie');
    if(raw==='مسلسل')return lang==='ar'?raw:(lang==='es'?'Serie':lang==='fr'?'Série':'Series');
    if(raw==='بدون اسم')return lang==='ar'?raw:'Untitled';
    return text;
  }
  function walk(root=document.body){
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
    for(const n of nodes){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)||p.closest('[data-no-i18n]'))continue;const next=translate(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;}
    document.querySelectorAll('input[placeholder],button[title],select[aria-label]').forEach(el=>{if(el.placeholder)el.placeholder=translate(el.placeholder);if(el.title)el.title=translate(el.title);if(el.getAttribute('aria-label'))el.setAttribute('aria-label',translate(el.getAttribute('aria-label')));});
  }
  function meta(){
    const d=LANGS[lang]||LANGS.en;document.documentElement.lang=lang;document.documentElement.dir=d.dir;document.title=d.title;
    let desc=document.querySelector('meta[name="description"]');if(!desc){desc=document.createElement('meta');desc.name='description';document.head.appendChild(desc)}desc.content=d.desc;
    let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}canonical.href=SITE+(lang==='en'?'/' : '/'+lang+'/');
    document.querySelectorAll('link[data-jok-hreflang]').forEach(x=>x.remove());
    for(const l of ['en','es','fr','ar']){const link=document.createElement('link');link.rel='alternate';link.hreflang=l;link.href=SITE+(l==='en'?'/' : '/'+l+'/');link.dataset.jokHreflang='1';document.head.appendChild(link)} const def=document.createElement('link');def.rel='alternate';def.hreflang='x-default';def.href=SITE+'/';def.dataset.jokHreflang='1';document.head.appendChild(def);
    const og=(p,c)=>{let el=document.querySelector('meta[property="'+p+'"]');if(!el){el=document.createElement('meta');el.setAttribute('property',p);document.head.appendChild(el)}el.content=c};og('og:title',d.title);og('og:description',d.desc);og('og:url',canonical.href);og('og:type','website');
  }
  function staticUi(){
    const d=LANGS[lang];
    const set=(sel,html)=>{const el=document.querySelector(sel);if(el&&el.innerHTML!==html)el.innerHTML=html};
    set('.eyebrow',d.original);
    set('.hero h1',d.hero.replace(/\\n/g,'<br>'));
    set('.hero p',d.sub);
    set('.hero-btn.primary','▶ '+d.watch);
    set('.hero-btn.secondary','⌕ '+d.searchNow);
    const stat=(sel,label)=>{const el=document.querySelector(sel);if(!el)return;const strong=el.querySelector('strong');const val=strong?strong.textContent:'—';const html=label+' <strong>'+val+'</strong>';if(el.innerHTML!==html)el.innerHTML=html};
    stat('.stat:nth-child(1)',d.channels);stat('.stat:nth-child(2)',d.movies);stat('.stat:nth-child(3)',d.series);
    const search=document.getElementById('search');if(search&&search.placeholder!==d.search)search.placeholder=d.search;
    const tabs=document.querySelectorAll('.tab');if(tabs.length>=3){if(tabs[0].textContent!==d.live)tabs[0].textContent=d.live;if(tabs[1].textContent!==d.movies)tabs[1].textContent=d.movies;if(tabs[2].textContent!==d.series)tabs[2].textContent=d.series}
    const cat=document.getElementById('category');if(cat?.options?.length&&cat.options[0].textContent!==d.allCategories)cat.options[0].textContent=d.allCategories;
    const country=document.getElementById('country');if(country?.options?.length&&country.options[0].textContent!==d.allCountries)country.options[0].textContent=d.allCountries;
    const folderHead=document.querySelector('.folder-heading');if(folderHead&&folderHead.textContent!==d.categories)folderHead.textContent=d.categories;
    const countryHead=document.getElementById('countryFolderHeading');if(countryHead&&countryHead.textContent!==d.countries)countryHead.textContent=d.countries;
    const list=document.getElementById('listTitle');if(list){const tab=window.state?.tab||document.querySelector('.tab.active')?.dataset?.tab;const next=tab==='movie'?d.movies:tab==='series'?d.series:d.channels;if(list.textContent!==next)list.textContent=next}
    const more=document.getElementById('loadMore');if(more&&!more.disabled&&more.textContent!==d.loadMore)more.textContent=d.loadMore;
    const empty=document.getElementById('empty');if(empty&&empty.textContent!==d.noResults)empty.textContent=d.noResults;
    const player=document.getElementById('nowPlaying');if(player&&!player.textContent.trim())player.textContent=d.player;
    const close=document.getElementById('closePlayer');if(close&&close.textContent!==d.close)close.textContent=d.close;
    const retry=document.getElementById('retryPlayback');if(retry&&retry.textContent!==d.retry)retry.textContent=d.retry;
    const chat=document.querySelector('.chathead strong');if(chat&&chat.textContent!==d.chat)chat.textContent=d.chat;
    const chatToggle=document.getElementById('chatToggle');if(chatToggle)chatToggle.textContent=chatToggle.getAttribute('aria-expanded')==='false'?d.showChat:d.hideChat;
    const nick=document.getElementById('chatNickname');if(nick&&nick.placeholder!==d.nickname)nick.placeholder=d.nickname;
    const msg=document.getElementById('chatMessage');if(msg&&msg.placeholder!==d.message)msg.placeholder=d.message;
    const send=document.getElementById('chatSend');if(send&&send.textContent!==d.send)send.textContent=d.send;
    const foot=document.querySelector('footer');if(foot&&foot.textContent!==d.footer)foot.textContent=d.footer;
  }
  function languageUi(){
    const host=document.querySelector('.topright');if(!host)return;let box=document.getElementById('jokLang');
    if(!box){box=document.createElement('label');box.id='jokLang';box.className='jok-lang';box.innerHTML='<span aria-hidden="true">🌐</span><select aria-label="Language"><option value="en">EN</option><option value="es">ES</option><option value="fr">FR</option><option value="ar">AR</option></select>';host.appendChild(box);box.querySelector('select').addEventListener('change',e=>setLanguage(e.target.value));}
    box.querySelector('select').value=lang;
  }
  function setLanguage(next){
    if(!LANGS[next])return;lang=next;try{localStorage.setItem('jokstream.lang',next)}catch{}
    const target=next==='en'?'/':'/'+next+'/';if(location.pathname!==target)history.replaceState({},'',target+location.search);
    meta();staticUi();languageUi();walk();document.body.classList.toggle('jok-rtl',lang==='ar');
  }
  function reorder(){
    const folder=document.querySelector('.folder-area'),head=document.querySelector('.sectionhead'),catalog=document.getElementById('catalog'),empty=document.getElementById('empty'),more=document.getElementById('loadMore');
    if(folder&&head&&catalog&&folder.parentNode){const parent=folder.parentNode;parent.insertBefore(head,folder);parent.insertBefore(catalog,folder);if(empty)parent.insertBefore(empty,folder);if(more)parent.insertBefore(more,folder);parent.appendChild(folder);}
    const toolbar=document.querySelector('.toolbar');if(toolbar)toolbar.classList.add('jok-sticky-toolbar');
  }
  function resilience(){
    if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
    if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
  }
  function observe(){const mo=new MutationObserver(()=>{clearTimeout(observe.t);observe.t=setTimeout(()=>{staticUi();languageUi();walk()},40)});mo.observe(document.body,{subtree:true,childList:true,characterData:true});}
  function init(){meta();reorder();staticUi();languageUi();walk();resilience();observe();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.JokEnhance={setLanguage,getLanguage:()=>lang};
})();