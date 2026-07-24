const localRuntimeProtocol = "http"

export const localRuntimeHosts = {
  api: "localhost",
} as const

export const localRuntimePorts = {
  adminWeb: 3001,
  api: 4000,
  learnerWeb: 3000,
} as const

export function createLocalRuntimeUrl(host: string, port: number): string {
  return `${localRuntimeProtocol}://${host}:${port}`
}

export const localRuntimeDefaults = {
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
} as const
