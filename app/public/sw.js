/* Service worker do FibraCampo: guarda a "casca" do app para abrir sem internet (RNF04).
   Os dados da API NÃO passam por aqui: o próprio app guarda a última lista no aparelho. */
const CACHE = "fibracampo-__VERSAO__";
const CASCA = ["./", "index.html", "app.js", "estilo.css", "manifest.webmanifest", "icons/icone-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;
  // rede primeiro (pega versão nova), cache se estiver sem sinal
  e.respondWith(
    fetch(e.request).then((r) => {
      const copia = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});

// tocar na notificação abre o detalhe do ponto (RF07)
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const alvo = "./#/ponto/" + encodeURIComponent((e.notification.data || {}).chave || "");
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) { c.focus(); c.navigate(alvo); return; }
      return self.clients.openWindow(alvo);
    })
  );
});
