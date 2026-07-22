import type { Clock } from "@workspace/kernel/clock"

export const systemClock = Object.freeze({
  now: () => new Date(),
}) satisfies Clock
