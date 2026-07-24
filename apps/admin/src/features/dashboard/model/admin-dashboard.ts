import type { getAdminDashboard } from "@workspace/http-client/admin"

export type AdminDashboard = Awaited<ReturnType<typeof getAdminDashboard>>
