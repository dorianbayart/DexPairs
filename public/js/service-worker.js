'use strict'

var CACHE_NAME = 'dexpairs'
var FILES_TO_CACHE = [
	'/',
	'/charts',
	'/wallet',
	'/news',
	'/donate',
	'/feed.atom',
]

// Start the service worker and cache all of the app's shell content
self.addEventListener('install', async e => {
	console.log('[ServiceWorker] Install')
	e.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return cache.addAll(FILES_TO_CACHE)
		})
	)
	self.skipWaiting()
})

// Check if service worker is activated
self.addEventListener('activate', async e => {
	console.log('[ServiceWorker] Activate')
	// Delete old static cache
	e.waitUntil(
		caches.keys().then(cacheNames => {
			console.log(cacheNames)
			return Promise.all(cacheNames
				.filter(cacheName => cacheName !== CACHE_NAME)
				.map(cacheName => caches.delete(cacheName))
			)
		})
	)
	self.clients.claim()
})

self.addEventListener('fetch', async event => {
	if(event.request.method !== "GET") {
		return
	}
	if (['font', 'image'].includes(event.request.destination)) {
		// Cache first, falling back to network
		console.log('[ServiceWorker][CacheFirst] ', event.request.url)
		event.respondWith(
			caches.open(CACHE_NAME).then((cache) => {
				return cache.match(event.request).then((cachedResponse) => {
					return cachedResponse || fetch(event.request.url).then((fetchedResponse) => {
						cache.put(event.request, fetchedResponse.clone())
						return fetchedResponse
					})
				})
			})
		)
	} else if (['document', 'script', 'style'].includes(event.request.destination) || event.request.url.includes('feed.atom')) {
		// Stale-while-revalidate
		console.log('[ServiceWorker][StaleRevalidate] ', event.request.url)
		event.respondWith(
			caches.open(CACHE_NAME).then(async cache => {
				return cache.match(event.request).then(async response => {
					const fetchPromise = fetch(event.request).then(async networkResponse => {
						cache.put(event.request, networkResponse.clone())
						return networkResponse
					})
					return response || fetchPromise
				})
			})
		)
	} else {
		// Network first, falling back to cache
		console.log('[ServiceWorker][NetworkFirst] ', event.request.url)
		event.respondWith(
			caches.open(CACHE_NAME).then(async cache => {
				return fetch(event.request.url).then(async fetchedResponse => {
					cache.put(event.request, fetchedResponse.clone())
					return fetchedResponse
				}).catch(() => {
					return cache.match(event.request.url)
				})
			})
		)
	}
})
