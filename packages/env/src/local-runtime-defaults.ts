const localRuntimeProtocol = "http"
const localRuntimeHost = "localhost"

export const localRuntimePorts = Object.freeze({
  adminApi: 4001,
  adminWeb: 3001,
  learnerApi: 4000,
  learnerWeb: 3000,
})

export function createLocalRuntimeUrl(port: number): string {
  return `${localRuntimeProtocol}://${localRuntimeHost}:${port}`
}

export const localRuntimeDefaults = Object.freeze({
  adminApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.adminApi),
  adminWebOrigin: createLocalRuntimeUrl(localRuntimePorts.adminWeb),
  learnerApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.learnerApi),
  learnerWebOrigin: createLocalRuntimeUrl(localRuntimePorts.learnerWeb),
})
