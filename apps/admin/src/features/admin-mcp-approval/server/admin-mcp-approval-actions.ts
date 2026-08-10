"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import type { AdminMcpApproval } from "@/entities/admin-mcp-approval/model/admin-mcp-approval"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  invalidAdminRequestFailure,
  settleAdminApiRequest,
  type AdminRequestResult,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import { adminMcpApprovalIdSchema } from "@workspace/contracts/operations/admin-mcp-approvals"
import {
  approveAdminMcpChange,
  rejectAdminMcpChange,
} from "@workspace/http-client/admin"

const decisionSchema = z
  .object({
    approvalId: adminMcpApprovalIdSchema,
    decision: z.enum(["approve", "reject"]),
  })
  .strict()

export async function decideAdminMcpApprovalAction(
  input: unknown
): Promise<AdminRequestResult<AdminMcpApproval>> {
  const command = decisionSchema.safeParse(input)
  if (!command.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const request =
    command.data.decision === "approve"
      ? approveAdminMcpChange(command.data.approvalId, requestOptions)
      : rejectAdminMcpChange(command.data.approvalId, requestOptions)
  const result = await settleAdminApiRequest(request)
  if (result.status === "ok") {
    revalidatePath(`/mcp-approvals/${command.data.approvalId}`)
  }
  return result
}
