// Service worker volontairement minimal : juste ce qu'il faut pour que le
// navigateur considère le site "installable" en PWA. Pas de cache agressif —
// on préfère toujours servir la dernière version plutôt que risquer de coincer
// quelqu'un sur du contenu périmé après un déploiement.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Simple passthrough réseau — pas de cache.
  event.respondWith(fetch(event.request))
})
