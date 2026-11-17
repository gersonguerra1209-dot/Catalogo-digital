// Service worker simples: deixa o painel instalável e abre rápido.
const CACHE = "painel-v1";
const BASE = ["/painel.html", "/estilo.css", "/comum.js", "/icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // rede primeiro; se estiver sem internet, usa a cópia guardada
  e.respondWith(fetch(e.request).then(r => { if (BASE.includes(u.pathname)) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});
