import { AdminAuditPage } from "@/features/audit/ui/admin-audit-page"
import {
  parseAdminAuditFilters,
  toAdminAuditEventsQuery,
} from "@/features/audit/model/admin-audit-filters"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { getAdminAuditEvents } from "@workspace/http-client/admin"

export default async function AdminAuditRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filters = parseAdminAuditFilters(await searchParams)
  const requestOptions = await getServerAdminRequestOptions()
  const auditResult =
    requestOptions === null
      ? unauthenticatedAdminRequestFailure()
      : await settleAdminApiRequest(
          getAdminAuditEvents(toAdminAuditEventsQuery(filters), requestOptions)
        )

  return <AdminAuditPage auditResult={auditResult} filters={filters} />
}
