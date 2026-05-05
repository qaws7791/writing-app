/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const sw = self

sw.addEventListener("install", () => {
  void sw.skipWaiting()
})

sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim())
})
