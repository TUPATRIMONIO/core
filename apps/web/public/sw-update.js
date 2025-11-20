/**
 * Service Worker para detección de actualizaciones - TuPatrimonio Web App
 * 
 * Estrategia:
 * - Network-first para /api/version.json (siempre buscar la última versión)
 * - Cache-first para assets estáticos (performance)
 * - Notifica al cliente cuando detecta nueva versión
 */

const CACHE_NAME = 'tupatrimonio-web-v1';
const VERSION_ENDPOINT = '/api/version.json';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Tomar control de todas las páginas inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia Network-first para version.json
  if (url.pathname === VERSION_ENDPOINT) {
    event.respondWith(
      fetch(request, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
        .then((response) => {
          // Clonar la respuesta para poder leerla
          const responseClone = response.clone();
          
          // Verificar si hay una nueva versión
          responseClone.json().then((newVersion) => {
            checkForUpdates(newVersion);
          }).catch((err) => {
            console.error('[SW] Error parsing version:', err);
          });

          return response;
        })
        .catch((error) => {
          console.error('[SW] Error fetching version:', error);
          // Si falla, intentar desde caché
          return caches.match(request);
        })
    );
    return;
  }

  // Estrategia Cache-first para otros assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Solo cachear respuestas exitosas
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clonar para guardar en caché
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Solo cachear GET requests
          if (request.method === 'GET') {
            cache.put(request, responseToCache);
          }
        });

        return response;
      });
    })
  );
});

/**
 * Verifica si hay actualizaciones y notifica a los clientes
 */
function checkForUpdates(newVersion) {
  // Obtener la versión almacenada localmente
  try {
    // Notificar a todos los clientes activos
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: newVersion,
        });
      });
    });
  } catch (error) {
    console.error('[SW] Error checking updates:', error);
  }
}

// Escuchar mensajes desde la página
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');