import type { Clock } from "@workspace/kernel/clock"

/** Shared clock used by retention and security decisions; runtime replacement must be rejected. */
export const systemClock = Object.freeze({
  now: () => new Date(),
}) satisfies Clock
