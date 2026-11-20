/* Biome Planet V20: priorité au réseau pour empêcher les versions périmées. */
const CACHE = 'biome-planet-v34-ambiance';
const CORE = ['./index.html','./manifest.webmanifest','./icons/planet.svg'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(async asset => {
      const response = await fetch(new Request(asset, {cache:'reload'}));
      if (response.ok) await c.put(asset, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(k => k.startsWith('biome-planet-') && k !== CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url=new URL(req.url);
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    const cache=await caches.open(CACHE);
    try {
      const fresh=await fetch(new Request(req,{cache:'no-store'}));
      if(fresh.ok) await cache.put(req, fresh.clone());
      return fresh;
    } catch(err) {
      return (await cache.match(req)) || (req.mode==='navigate' && await cache.match('./index.html')) || Response.error();
    }
  })());
});
