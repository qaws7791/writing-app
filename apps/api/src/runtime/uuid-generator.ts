import type { IdGenerator } from "@workspace/kernel/clock"

export const uuidGenerator = Object.freeze({
  next: () => crypto.randomUUID(),
}) satisfies IdGenerator<string>

export function createPrefixedIdGenerator<TId extends string>(
  prefix: string,
  generator: IdGenerator<string>
): IdGenerator<TId> {
  return Object.freeze({
    next: () => `${prefix}${generator.next()}` as TId,
  })
}
