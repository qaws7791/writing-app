export const COMPANION_SNAP_ORDER = ["compact", "split", "read"] as const

export type CompanionSnap = (typeof COMPANION_SNAP_ORDER)[number]

export const COMPANION_SNAP_FRACTIONS = {
  compact: 0.24,
  split: 0.4,
  read: 0.75,
} as const satisfies Record<CompanionSnap, number>

export const COMPANION_SNAP_POINTS: number[] = [
  COMPANION_SNAP_FRACTIONS.compact,
  COMPANION_SNAP_FRACTIONS.split,
  COMPANION_SNAP_FRACTIONS.read,
]

export const COMPANION_SNAP_LABELS = {
  compact: "간단히",
  split: "나누기",
  read: "읽기",
} as const satisfies Record<CompanionSnap, string>

export function nearestCompanionSnap(fraction: number): CompanionSnap {
  let best: CompanionSnap = "split"
  let bestDistance = Number.POSITIVE_INFINITY

  for (const snap of COMPANION_SNAP_ORDER) {
    const distance = Math.abs(fraction - COMPANION_SNAP_FRACTIONS[snap])
    if (distance < bestDistance) {
      best = snap
      bestDistance = distance
    }
  }

  return best
}

export function companionSnapFromPoint(
  point: number | string | null
): CompanionSnap {
  if (typeof point !== "number") return "split"
  return nearestCompanionSnap(point)
}

export function stepCompanionSnap(
  snap: CompanionSnap,
  direction: 1 | -1
): CompanionSnap {
  const next = COMPANION_SNAP_ORDER.indexOf(snap) + direction
  if (next <= 0) return "compact"
  if (next >= 2) return "read"
  return "split"
}
