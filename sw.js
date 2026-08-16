/* Service Worker für den Workout Tracker.
 *
 * Ziel: Die App startet auch ohne Empfang (Kellergym), zeigt aber trotzdem
 * neue Versionen, sobald wieder Netz da ist.
 *
 * Strategie:
 *   - App-Dateien (index.html, manifest, icon): network-first mit Cache-Fallback.
 *     Online = immer die aktuelle Version, offline = die zuletzt gesehene.
 *   - Demo-Bilder/-Videos (auch von fremden Servern): cache-first.
 *     Einmal angeschaut = ab dann offline verfügbar.
 *
 * Trainingsdaten liegen NICHT hier drin, sondern im localStorage.
 */

const VERSION    = "v1";
const SHELL      = "wt-shell-" + VERSION;
const MEDIA      = "wt-media-" + VERSION;
const SHELL_URLS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

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

function isMedia(request){
  if(request.destination === "image" || request.destination === "video") return true;
  return /\.(gif|png|jpe?g|webp|avif|svg|mp4|webm|mov|m4v)(\?|#|$)/i.test(request.url);
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;

  // Demo-Medien: erst Cache, sonst laden und ablegen.
  if(isMedia(req) && !SHELL_URLS.some(u => req.url.endsWith(u.replace("./", "")))){
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        // Auch opaque Antworten (fremde Server ohne CORS) werden abgelegt.
        const copy = res.clone();
        caches.open(MEDIA).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // App-Dateien: erst Netz, dann Cache.
  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
