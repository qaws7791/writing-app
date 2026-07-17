import { AppError } from "@/http/platform/errors"
import type { Context, Input } from "hono"
import type { z } from "zod"

import type { ApiHonoEnv } from "@/context/hono-env"

export type LearnerContractResponseInvalidEvent = {
  readonly classification: "response-schema-invalid"
  readonly contractName: string
  readonly deploymentVersion: string
  readonly event: "api.contract.response_invalid"
  readonly fieldPaths: readonly string[]
  readonly method: string
  readonly requestId: string
  readonly route: string
}

export type LearnerContractErrorLogger = (
  event: LearnerContractResponseInvalidEvent
) => void

export function parseLearnerRouteResponse<
  TSchema extends z.ZodType,
  TPath extends string,
  TInput extends Input,
>(
  context: Context<ApiHonoEnv, TPath, TInput>,
  contractName: string,
  schema: TSchema,
  value: unknown
): z.output<TSchema> {
  const requestContext = context.var.requestContext

  return parseLearnerResponse({
    contractName,
    deploymentVersion: requestContext.deploymentVersion,
    logContractError: requestContext.contractErrorLogger,
    method: context.req.method,
    requestId: context.get("requestId"),
    route: context.req.routePath,
    schema,
    value,
  })
}

export function parseLearnerResponse<TSchema extends z.ZodType>(input: {
  readonly contractName: string
  readonly deploymentVersion: string
  readonly logContractError?: LearnerContractErrorLogger
  readonly method: string
  readonly requestId: string
  readonly route: string
  readonly schema: TSchema
  readonly value: unknown
}): z.output<TSchema> {
  const result = input.schema.safeParse(input.value)

  if (result.success) {
    return result.data
  }

  input.logContractError?.({
    classification: "response-schema-invalid",
    contractName: input.contractName,
    deploymentVersion: input.deploymentVersion,
    event: "api.contract.response_invalid",
    fieldPaths: result.error.issues.map((issue) => formatPath(issue.path)),
    method: input.method,
    requestId: input.requestId,
    route: input.route,
  })

  throw new AppError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Learner response contract validation failed",
    status: 500,
  })
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) return "$"

  return path
    .map((segment) =>
      typeof segment === "symbol" ? (segment.description ?? "symbol") : segment
    )
    .join(".")
}
