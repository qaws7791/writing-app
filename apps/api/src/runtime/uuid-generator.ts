import type { IdGenerator } from "@workspace/kernel/clock"

/** Shared security-sensitive generator; runtime replacement would compromise IDs across modules. */
export const uuidGenerator = Object.freeze({
  next: () => crypto.randomUUID(),
}) satisfies IdGenerator<string>

export function createPrefixedIdGenerator<TId extends string>(
  prefix: string,
  generator: IdGenerator<string>
): IdGenerator<TId> {
  return {
    next: () => `${prefix}${generator.next()}` as TId,
  }
}
