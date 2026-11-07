const CACHE_VERSION='jokstream-media-v1';
const APP_CACHE='jokstream-shell-v1';
const MEDIA_RE=/\.(?:m3u8|ts|m4s|aac|mp4)(?:$|\?)/i;
async function trim(cache,max=32){const keys=await cache.keys();if(keys.length<=max)return;for(const key of keys.slice(0,keys.length-max))await cache.delete(key);}
self.addEventListener('install',event=>{event.waitUntil(caches.open(APP_CACHE).then(c=>c.addAll(['/','/index.html','/jok-enhance.js','/player-buffer.js'])).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>![APP_CACHE,CACHE_VERSION].includes(n)).map(n=>caches.delete(n)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(MEDIA_RE.test(url.pathname)){event.respondWith((async()=>{const cache=await caches.open(CACHE_VERSION);try{const res=await fetch(req);if(res&&res.ok)event.waitUntil(cache.put(req,res.clone()).then(()=>trim(cache,32)).catch(()=>{}));return res;}catch{const hit=await cache.match(req);if(hit)return hit;throw new Error('media unavailable');}})().catch(()=>fetch(req)));return;}
  if(url.origin===location.origin&&(req.mode==='navigate'||url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.html'))){
    event.respondWith((async()=>{const hit=await caches.match(req);try{const res=await fetch(req);if(res.ok)event.waitUntil(caches.open(APP_CACHE).then(c=>c.put(req,res.clone())).catch(()=>{}));return res}catch{return hit||new Response('',{status:504})}})());
  }
});