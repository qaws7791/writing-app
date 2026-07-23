import { isIP } from "node:net"

const trustedClientIpHeader = "x-writing-app-client-ip"

export function readTrustedClientIp(request: Request): string {
  const clientIp = request.headers.get(trustedClientIpHeader)?.trim()

  return clientIp !== undefined && isIP(clientIp) !== 0 ? clientIp : "unknown"
}
