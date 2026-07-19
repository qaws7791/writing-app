const localRuntimeProtocol = "http"

export const localRuntimeHosts = Object.freeze({
  admin: "127.0.0.1",
  learner: "localhost",
})

export const localRuntimePorts = Object.freeze({
  adminWeb: 3001,
  learnerApi: 4000,
  learnerWeb: 3000,
})

export function createLocalRuntimeUrl(host: string, port: number): string {
  return `${localRuntimeProtocol}://${host}:${port}`
}

export const localRuntimeDefaults = Object.freeze({
  adminApiBaseUrl: createLocalRuntimeUrl(
    localRuntimeHosts.admin,
    localRuntimePorts.learnerApi
  ),
  adminWebOrigin: createLocalRuntimeUrl(
    localRuntimeHosts.admin,
    localRuntimePorts.adminWeb
  ),
  learnerApiBaseUrl: createLocalRuntimeUrl(
    localRuntimeHosts.learner,
    localRuntimePorts.learnerApi
  ),
  learnerWebOrigin: createLocalRuntimeUrl(
    localRuntimeHosts.learner,
    localRuntimePorts.learnerWeb
  ),
})
