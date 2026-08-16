/* Service Worker für den Workout Tracker.
 *
 * Ziel: Die App startet auch ohne Empfang (Kellergym), zeigt aber trotzdem
 * neue Versionen, sobald wieder Netz da ist.
 *
 * Strategie:
 *   - App-Dateien (index.html, manifest, icon) und Navigationen:
 *     network-first mit Cache-Fallback. Online = aktuelle Version,
 *     offline = die zuletzt gesehene.
 *   - Demo-Bilder/-Videos (auch von fremden Servern wie wger.de):
 *     cache-first. Einmal angeschaut = ab dann offline verfügbar.
 *   - Alles andere wird nicht angefasst.
 *
 * Trainingsdaten liegen NICHT hier drin, sondern im localStorage.
 */

const VERSION = "v3";
const SHELL   = "wt-shell-" + VERSION;
const MEDIA   = "wt-media-" + VERSION;

const SHELL_URLS  = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
// Absolute Pfade – funktioniert auch, wenn die App in einem Unterordner
// liegt (z.B. https://name.github.io/workout/).
const SHELL_PATHS = new Set(SHELL_URLS.map(u => new URL(u, self.location).pathname));
const INDEX_URL   = new URL("./index.html", self.location).href;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== MEDIA).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Den Klon immer konsumieren: ein liegengelassener clone() kann in Chrome
   den Original-Stream blockieren – dann lädt das Bild nie fertig. */
function cachePut(cacheName, request, response){
  const copy = response.clone();
  return caches.open(cacheName)
    .then(c => c.put(request, copy))
    .catch(() => {});
}

function isMedia(request){
  if(request.destination === "image" || request.destination === "video") return true;
  return /\.(gif|png|jpe?g|webp|avif|svg|mp4|webm|mov|m4v)(\?|#|$)/i.test(request.url);
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  let url;
  try{ url = new URL(req.url); }catch(e){ return; }

  const isShell = url.origin === self.location.origin && SHELL_PATHS.has(url.pathname);

  // 1. App-Dateien und Seitenaufrufe: erst Netz, dann Cache.
  //    cache:"no-cache" erzwingt eine Rueckfrage beim Server. Ohne das liefert
  //    der HTTP-Cache (GitHub Pages setzt max-age=600 auf HTML) bis zu zehn
  //    Minuten die alte Datei – die dann auch noch hier im Cache landen wuerde.
  //    Bei unveraendertem Inhalt antwortet der Server mit 304, kostet also kaum
  //    Daten.
  if(req.mode === "navigate" || isShell){
    event.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
        .then(res => {
          if(res && res.ok) event.waitUntil(cachePut(SHELL, req, res));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match(INDEX_URL)))
    );
    return;
  }

  // 2. Demo-Medien: erst Cache, sonst laden und ablegen.
  //    Auch opaque Antworten (fremde Server ohne CORS) werden abgelegt.
  if(isMedia(req)){
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if(res) event.waitUntil(cachePut(MEDIA, req, res));
        return res;
      }))
    );
    return;
  }

  // 3. Alles Übrige läuft ganz normal am Service Worker vorbei.
});
