export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}

export type EntityId<TName extends string> = Brand<string, `${TName}Id`>

export function brandEntityId<TName extends string>(
  value: string
): EntityId<TName> {
  return value as EntityId<TName>
}

export * from "@workspace/core/shared/kernel/status"
