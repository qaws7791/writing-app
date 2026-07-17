import type { AdminUserReader } from "#core/modules/admin/application/ports/admin-user.reader"

type Assert<TValue extends true> = TValue
type Equal<TLeft, TRight> = [TLeft] extends [TRight]
  ? [TRight] extends [TLeft]
    ? true
    : false
  : false

export type AdminUserBoundary = [
  Assert<Equal<keyof AdminUserReader, "readUser" | "readUsers">>,
]
