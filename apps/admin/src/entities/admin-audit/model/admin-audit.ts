import type { AdminAuditCategory } from "@workspace/contracts/operations/admin-audit"
import type { getAdminAuditEvents } from "@workspace/http-client/admin"

export type AdminAuditEvents = Awaited<ReturnType<typeof getAdminAuditEvents>>
export type AdminAuditEvent = AdminAuditEvents["items"][number]

/** 빈 문자열은 해당 조건을 두지 않는다는 뜻이며 GET form이 왕복시키는 표현이다. */
export type ReadAdminAuditEventsInput = Readonly<{
  category: AdminAuditCategory | ""
  from: string
  page: number
  pageSize: number
  to: string
}>
