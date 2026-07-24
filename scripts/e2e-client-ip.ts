const documentationNetworks = ["192.0.2", "198.51.100", "203.0.113"] as const
const hostsPerNetwork = 254
const availableAddressCount = documentationNetworks.length * hostsPerNetwork

export function deriveE2eClientIp(
  testId: string,
  unavailableAddresses: ReadonlySet<string> = new Set()
): string {
  if (testId.length === 0) {
    throw new Error("E2E client IP 파생에는 test id가 필요합니다.")
  }

  const initialSlot = hashTestId(testId) % availableAddressCount

  for (let offset = 0; offset < availableAddressCount; offset += 1) {
    const address = addressAtSlot(
      (initialSlot + offset) % availableAddressCount
    )
    if (!unavailableAddresses.has(address)) return address
  }

  throw new Error("E2E client IP 문서용 주소 범위를 모두 사용했습니다.")
}

function hashTestId(testId: string): number {
  let hash = 2_166_136_261

  for (const character of new TextEncoder().encode(testId)) {
    hash ^= character
    hash = Math.imul(hash, 16_777_619)
  }

  return hash >>> 0
}

function addressAtSlot(slot: number): string {
  const network = documentationNetworks[Math.floor(slot / hostsPerNetwork)]
  const host = (slot % hostsPerNetwork) + 1

  if (network === undefined) {
    throw new Error(`E2E client IP slot이 유효하지 않습니다: ${slot}`)
  }

  return `${network}.${host}`
}
