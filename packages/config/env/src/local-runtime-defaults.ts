const localRuntimeProtocol = "http"

export const localRuntimeHosts = Object.freeze({
  api: "localhost",
})

export const localRuntimePorts = Object.freeze({
  adminWeb: 3001,
  api: 4000,
  learnerWeb: 3000,
})

export function createLocalRuntimeUrl(host: string, port: number): string {
  return `${localRuntimeProtocol}://${host}:${port}`
}

export const localRuntimeDefaults = Object.freeze({
  adminWebOrigin: createLocalRuntimeUrl(
    "localhost",
    localRuntimePorts.adminWeb
  ),
  apiBaseUrl: createLocalRuntimeUrl(
    localRuntimeHosts.api,
    localRuntimePorts.api
  ),
  learnerWebOrigin: createLocalRuntimeUrl(
    "localhost",
    localRuntimePorts.learnerWeb
  ),
})
