import type {
  AdminId,
  ConversationId,
  UserId,
} from "#contracts/identity/admin-ids"

declare const adminId: AdminId
declare const conversationId: ConversationId
declare const userId: UserId

function acceptsAdminId(_value: AdminId): void {}
function acceptsConversationId(_value: ConversationId): void {}
function acceptsUserId(_value: UserId): void {}

acceptsAdminId(adminId)
acceptsConversationId(conversationId)
acceptsUserId(userId)

// @ts-expect-error UserId는 AdminId Interface에 전달할 수 없다.
acceptsAdminId(userId)
// @ts-expect-error AdminId는 ConversationId Interface에 전달할 수 없다.
acceptsConversationId(adminId)
// @ts-expect-error ConversationId는 UserId Interface에 전달할 수 없다.
acceptsUserId(conversationId)
