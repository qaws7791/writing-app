import { resetAdminContentAction } from "@/features/content-maintenance/server/admin-content-maintenance-actions"
import { AdminContentMaintenancePage } from "@/features/content-maintenance/ui/admin-content-maintenance-page"

export default function AdminContentMaintenanceRoute() {
  return <AdminContentMaintenancePage resetContent={resetAdminContentAction} />
}
