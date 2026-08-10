import type { getAdminMcpApproval } from "@workspace/http-client/admin"

export type AdminMcpApproval = Awaited<ReturnType<typeof getAdminMcpApproval>>
