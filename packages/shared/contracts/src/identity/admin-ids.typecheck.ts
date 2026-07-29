import type { AdminId, UserId } from "#contracts/identity/admin-ids"

declare const adminId: AdminId
declare const userId: UserId

function acceptsAdminId(_value: AdminId): void {}
function acceptsUserId(_value: UserId): void {}

acceptsAdminId(adminId)
acceptsUserId(userId)

// @ts-expect-error UserId는 AdminId Interface에 전달할 수 없다.
acceptsAdminId(userId)
// @ts-expect-error AdminId는 UserId Interface에 전달할 수 없다.
acceptsUserId(adminId)
