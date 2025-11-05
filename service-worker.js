// PRODESAL de Castro - Service Worker para funcionalidad offline

const CACHE_NAME = 'infocenter-v1.0.0';
const STATIC_CACHE_NAME = 'infocenter-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'infocenter-dynamic-v1.0.0';

// Recursos estáticos para cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/scripts/app.js',
    '/manifest.json',
    // Google Fonts
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    // Lucide Icons (primera carga)
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// Recursos dinámicos que pueden ser cacheados
const DYNAMIC_ASSETS = [
    '/api/weather',
    '/api/news',
    '/api/animals',
    '/api/plants'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        (async () => {
            try {
                // Cache de recursos estáticos
                const staticCache = await caches.open(STATIC_CACHE_NAME);
                await staticCache.addAll(STATIC_ASSETS);
                
                console.log('Service Worker: Recursos estáticos cacheados');
                
                // Cache inicial del contenido dinámico
                const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
                
                // Cache algunas respuestas por defecto
                const defaultWeather = {
                    temperature: 25,
                    condition: 'Soleado',
                    humidity: 65,
                    windSpeed: 15,
                    visibility: 10,
                    pressure: 1013
                };
                
                const defaultNews = [
                    {
                        title: 'Bienvenido a PRODESAL de Castro',
                        content: 'Tu centro de información personalizado está listo para usar.',
                        category: 'Local',
                        time: 'Ahora'
                    }
                ];
                
                await dynamicCache.put('/api/weather', new Response(JSON.stringify(defaultWeather)));
                await dynamicCache.put('/api/news', new Response(JSON.stringify(defaultNews)));
                
                console.log('Service Worker: Cache inicializado');
                
                // Activar inmediatamente
                self.skipWaiting();
                
            } catch (error) {
                console.error('Service Worker: Error durante la instalación:', error);
            }
        })()
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activando...');
    
    event.waitUntil(
        (async () => {
            try {
                // Limpiar caches antiguos
                const cacheNames = await caches.keys();
                const oldCaches = cacheNames.filter(name => 
                    name !== STATIC_CACHE_NAME && 
                    name !== DYNAMIC_CACHE_NAME &&
                    name !== CACHE_NAME
                );
                
                await Promise.all(
                    oldCaches.map(cacheName => caches.delete(cacheName))
                );
                
                console.log('Service Worker: Caches antiguos eliminados');
                
                // Tomar control inmediato de todos los clientes
                self.clients.claim();
                
            } catch (error) {
                console.error('Service Worker: Error durante la activación:', error);
            }
        })()
    );
});

// Intercepción de requests (fetch)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Solo interceptar requests del mismo origen
    if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) {
        return;
    }
    
    event.respondWith(handleFetch(request));
});

// Estrategia de cache personalizada
async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Para recursos estáticos: Cache First
        if (isStaticAsset(url.pathname)) {
            return await cacheFirst(request, STATIC_CACHE_NAME);
        }
        
        // Para APIs: Network First con fallback a cache
        if (url.pathname.startsWith('/api/')) {
            return await networkFirst(request, DYNAMIC_CACHE_NAME);
        }
        
        // Para navegación: Network First con fallback
        if (request.mode === 'navigate') {
            return await networkFirst(request, DYNAMIC_CACHE_NAME);
        }
        
        // Para otros requests: Cache First
        return await cacheFirst(request, DYNAMIC_CACHE_NAME);
        
    } catch (error) {
        console.error('Service Worker: Error en fetch:', error);
        
        // Fallback en caso de error
        if (request.mode === 'navigate') {
            const cache = await caches.open(STATIC_CACHE_NAME);
            return await cache.match('/') || new Response('Página no disponible', { status: 503 });
        }
        
        return new Response('Recurso no disponible', { status: 503 });
    }
}

// Estrategia Cache First
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Actualizar en background
        updateCache(request, cache);
        return cachedResponse;
    }
    
    // Si no está en cache, hacer fetch y cachear
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

// Estrategia Network First
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cachear respuesta exitosa
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback a cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Actualizar cache en background
async function updateCache(request, cache) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // Fallar silenciosamente para no interrumpir la UX
        console.debug('Service Worker: Error actualizando cache:', error);
    }
}

// Determinar si es recurso estático
function isStaticAsset(pathname) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
    const staticPaths = ['/', '/index.html', '/manifest.json'];
    
    return staticPaths.includes(pathname) || 
           staticExtensions.some(ext => pathname.endsWith(ext));
}

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;
            
        default:
            console.warn('Service Worker: Mensaje no reconocido:', type);
    }
});

// Obtener estado del cache
async function getCacheStatus() {
    try {
        const cacheNames = await caches.keys();
        const status = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            status[cacheName] = keys.length;
        }
        
        return status;
    } catch (error) {
        console.error('Service Worker: Error obteniendo estado del cache:', error);
        return {};
    }
}

// Limpiar todos los caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: Todos los caches eliminados');
    } catch (error) {
        console.error('Service Worker: Error limpiando caches:', error);
    }
}

// Notificación de actualización disponible
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        // Verificar actualizaciones y notificar si hay nuevas
        checkForUpdates().then(hasUpdate => {
            if (hasUpdate) {
                notifyUpdateAvailable();
            }
        });
    }
});

// Verificar actualizaciones
async function checkForUpdates() {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const response = await fetch('/manifest.json');
        const currentManifest = await response.json();
        
        // Aquí se podría comparar versiones
        // Por simplicidad, siempre retornamos false
        return false;
    } catch (error) {
        console.error('Service Worker: Error verificando actualizaciones:', error);
        return false;
    }
}

// Notificar actualización disponible
function notifyUpdateAvailable() {
    // Enviar mensaje a todos los clientes
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'UPDATE_AVAILABLE',
                payload: {
                    message: 'Nueva versión disponible',
                    action: 'Recargar página'
                }
            });
        });
    });
}

// Manejo de notificaciones push (futuro)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/assets/icon-192.png',
            badge: '/assets/icon-72.png',
            data: data.data,
            actions: data.actions || [],
            vibrate: [100, 50, 100],
            requireInteraction: true
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (error) {
        console.error('Service Worker: Error procesando push:', error);
    }
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data;
    
    event.waitUntil(
        (async () => {
            const clients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });
            
            // Si ya hay una ventana abierta, enfocarla
            const existingClient = clients.find(client => 
                client.url.includes(self.location.origin)
            );
            
            if (existingClient) {
                existingClient.focus();
                
                // Enviar mensaje para navegar a la sección específica
                if (data?.section) {
                    existingClient.postMessage({
                        type: 'NAVIGATE',
                        payload: { section: data.section }
                    });
                }
            } else {
                // Abrir nueva ventana
                const url = data?.section ? `/?section=${data.section}` : '/';
                await self.clients.openWindow(url);
            }
        })()
    );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-content') {
        event.waitUntil(syncContent());
    }
});

// Sincronizar contenido en background
async function syncContent() {
    try {
        // Actualizar contenido desde APIs
        const [weatherResponse, newsResponse] = await Promise.allSettled([
            fetch('/api/weather'),
            fetch('/api/news')
        ]);
        
        const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
        
        if (weatherResponse.status === 'fulfilled' && weatherResponse.value.ok) {
            await dynamicCache.put('/api/weather', weatherResponse.value);
        }
        
        if (newsResponse.status === 'fulfilled' && newsResponse.value.ok) {
            await dynamicCache.put('/api/news', newsResponse.value);
        }
        
        console.log('Service Worker: Sincronización de contenido completada');
        
    } catch (error) {
        console.error('Service Worker: Error en sincronización:', error);
    }
}

console.log('Service Worker: Cargado y listo');