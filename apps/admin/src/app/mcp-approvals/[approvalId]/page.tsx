import { notFound, redirect } from "next/navigation"

import { decideAdminMcpApprovalAction } from "@/features/admin-mcp-approval/server/admin-mcp-approval-actions"
import { AdminMcpApprovalPage } from "@/features/admin-mcp-approval/ui/admin-mcp-approval-page"
import {
  adminLoginReasons,
  createAdminLoginPath,
} from "@/features/authentication/model/admin-auth-navigation"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  isAdminRequestAuthenticationError,
  settleAdminApiRequest,
} from "@/shared/http/admin-api-client"
import { adminMcpApprovalIdSchema } from "@workspace/contracts/operations/admin-mcp-approvals"
import { getAdminMcpApproval } from "@workspace/http-client/admin"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/primitives/alert"

export default async function AdminMcpApprovalRoute({
  params,
}: {
  readonly params: Promise<{ readonly approvalId: string }>
}) {
  const parsed = adminMcpApprovalIdSchema.safeParse((await params).approvalId)
  if (!parsed.success) notFound()

  const path = `/mcp-approvals/${parsed.data}`
  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) redirect(createAdminLoginPath(path))

  const result = await settleAdminApiRequest(
    getAdminMcpApproval(parsed.data, requestOptions)
  )
  if (result.status === "error") {
    if (isAdminRequestAuthenticationError(result.error)) {
      redirect(createAdminLoginPath(path, adminLoginReasons.sessionExpired))
    }
    if (result.error.kind === "http" && result.error.status === 404) {
      notFound()
    }
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-5 py-12 sm:px-8">
        <Alert variant="destructive">
          <AlertDescription>{result.error.message}</AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <AdminMcpApprovalPage
      approval={result.value}
      decideApproval={decideAdminMcpApprovalAction}
    />
  )
}
