'use strict'

window.addEventListener('load', function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/public/js/service-worker.js', { scope: '/' })
    .then(function (reg) {
      console.log('[ServiceWorker] Registered', reg)
    }).catch(function (error) {
      console.error('[ServiceWorker] Not registered', error)
    })
  } else {
    console.log('serviceWorker is not available')
  }
})
