/**
 * Service Worker PWA - TuPatrimonio Web App
 * 
 * Estrategias de caché:
 * - Network-first: /version.json, API calls
 * - Cache-first: Assets estáticos (_next/static/*)
 * - Stale-while-revalidate: Páginas HTML
 * - Offline fallback: /offline para cuando no hay conexión
 */

const CACHE_NAME = 'tupatrimonio-web-v1';
const OFFLINE_URL = '/offline';
const VERSION_ENDPOINT = '/version.json';

// Assets críticos para precachear
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/dashboard',
];

// ==================== INSTALL ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching offline assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Activar inmediatamente sin esperar
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Tomar control de todas las páginas inmediatamente
        console.log('[SW] Taking control of all clients');
        return self.clients.claim();
      })
  );
});

// ==================== FETCH ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origin
  if (url.origin !== location.origin) {
    return;
  }

  // ===== Estrategia 1: Network-first para version.json =====
  if (url.pathname === VERSION_ENDPOINT) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // ===== Estrategia 2: Network-first para API calls =====
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // ===== Estrategia 3: Cache-first para assets estáticos =====
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // ===== Estrategia 4: Stale-while-revalidate para páginas =====
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// ==================== ESTRATEGIAS DE CACHÉ ====================

/**
 * Network-first: Intenta red primero, cae a caché si falla
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    // Si es version.json, verificar actualizaciones
    if (request.url.includes(VERSION_ENDPOINT)) {
      const responseClone = response.clone();
      try {
        const newVersion = await responseClone.json();
        checkForUpdates(newVersion);
      } catch (err) {
        console.error('[SW] Error parsing version:', err);
      }
    }

    // Guardar en caché
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());

    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Cache-first: Busca en caché primero, luego red
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    // Solo cachear respuestas exitosas
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Cache-first failed for:', request.url, error);
    throw error;
  }
}

/**
 * Stale-while-revalidate: Retorna caché y actualiza en background
 */
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        const cache = caches.open(CACHE_NAME);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] Fetch failed, using cache:', request.url);
      return null;
    });

  // Si hay caché, retornarlo inmediatamente
  if (cachedResponse) {
    return cachedResponse;
  }

  // Si no hay caché, esperar al fetch
  try {
    const response = await fetchPromise;
    if (response) {
      return response;
    }
  } catch (error) {
    // Caer a página offline
    console.log('[SW] Falling back to offline page');
  }

  // Última opción: página offline
  const offlineResponse = await caches.match(OFFLINE_URL);
  if (offlineResponse) {
    return offlineResponse;
  }

  // Si todo falla, retornar error básico
  return new Response('Offline - No cached content available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * Network con fallback a caché
 */
async function networkWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200 && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// ==================== ACTUALIZACIONES ====================

/**
 * Verifica si hay actualizaciones y notifica a los clientes
 */
function checkForUpdates(newVersion) {
  try {
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

// ==================== MENSAJES ====================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting...');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing cache...');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

// ==================== PUSH NOTIFICATIONS (opcional) ====================

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'TuPatrimonio';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/dashboard')
  );
});

console.log('[SW] Service Worker PWA loaded successfully');

