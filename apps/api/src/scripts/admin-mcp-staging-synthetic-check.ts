import {
  Client,
  StreamableHTTPClientTransport,
  type FetchLike,
} from "@modelcontextprotocol/client"

const readToolNames = [
  "admin_list_courses",
  "admin_get_course_editor",
  "admin_get_dashboard",
  "admin_get_analytics",
  "admin_list_lesson_analytics",
  "admin_get_ai_feedback_quality",
  "admin_list_audit_events",
] as const
const readToolName = readToolNames[0]

export type AdminMcpSyntheticEnvironment = {
  readonly [name: string]: string | undefined
  readonly ADMIN_MCP_SYNTHETIC_BEARER_TOKEN?: string
  readonly ADMIN_MCP_SYNTHETIC_RESOURCE_URL?: string
}

export type AdminMcpSyntheticConfiguration = {
  readonly bearerToken: string
  readonly resourceUrl: URL
}

export type AdminMcpSyntheticCheckResult = {
  readonly protocolEra: "modern"
  readonly readToolName: typeof readToolName
  readonly toolCount: number
  readonly toolNames: readonly string[]
}

export class AdminMcpSyntheticConfigurationError extends Error {
  override readonly name = "AdminMcpSyntheticConfigurationError"
}

export class AdminMcpSyntheticCheckError extends Error {
  override readonly name = "AdminMcpSyntheticCheckError"
}

export function parseAdminMcpSyntheticEnvironment(
  environment: AdminMcpSyntheticEnvironment
): AdminMcpSyntheticConfiguration {
  const resourceUrl = parseHttpsUrl(
    environment.ADMIN_MCP_SYNTHETIC_RESOURCE_URL,
    "ADMIN_MCP_SYNTHETIC_RESOURCE_URL"
  )
  if (resourceUrl.pathname !== "/mcp/admin") {
    throw new AdminMcpSyntheticConfigurationError(
      "ADMIN_MCP_SYNTHETIC_RESOURCE_URL pathname은 /mcp/admin이어야 합니다."
    )
  }

  return {
    bearerToken: requireEnvironmentValue(
      environment.ADMIN_MCP_SYNTHETIC_BEARER_TOKEN,
      "ADMIN_MCP_SYNTHETIC_BEARER_TOKEN"
    ),
    resourceUrl,
  }
}

export async function runAdminMcpSyntheticCheck(
  configuration: AdminMcpSyntheticConfiguration,
  options: Readonly<{ fetch?: FetchLike }> = {}
): Promise<AdminMcpSyntheticCheckResult> {
  const transport = new StreamableHTTPClientTransport(
    configuration.resourceUrl,
    {
      authProvider: {
        token: async () => configuration.bearerToken,
      },
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      onInsufficientScope: "throw",
    }
  )
  const client = new Client(
    { name: "writing-app-admin-mcp-staging-synthetic", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } }
  )
  let phase = "connection"
  let checkResult: AdminMcpSyntheticCheckResult | undefined

  try {
    await client.connect(transport)
    if (client.getProtocolEra() !== "modern") {
      throw new AdminMcpSyntheticCheckError(
        "관리자 MCP staging synthetic check가 modern protocol을 협상하지 못했습니다."
      )
    }

    phase = "tools/list"
    const listedTools = await client.listTools()
    const listedToolNames = listedTools.tools.map((tool) => tool.name)
    if (!hasExactToolNames(listedToolNames, readToolNames)) {
      throw new AdminMcpSyntheticCheckError(
        "관리자 MCP staging synthetic 도구 집합이 읽기 전용 7개 계약과 일치하지 않습니다."
      )
    }
    if (listedTools.tools.some((tool) => !hasReadOnlyAnnotations(tool))) {
      throw new AdminMcpSyntheticCheckError(
        "관리자 MCP staging synthetic 도구 annotation이 읽기 전용 계약과 일치하지 않습니다."
      )
    }

    phase = readToolName
    const result = await client.callTool({
      arguments: {},
      name: readToolName,
    })
    if (result.isError === true) {
      throw new AdminMcpSyntheticCheckError(
        `${readToolName} Tool이 오류 결과를 반환했습니다.`
      )
    }

    checkResult = {
      protocolEra: "modern",
      readToolName,
      toolCount: listedTools.tools.length,
      toolNames: listedToolNames,
    }
  } catch (error) {
    try {
      await client.close()
    } catch {
      // The primary check error determines this failure path.
    }
    if (error instanceof AdminMcpSyntheticCheckError) throw error
    throw new AdminMcpSyntheticCheckError(
      `관리자 MCP staging synthetic check가 ${phase} 단계에서 실패했습니다.`
    )
  }

  try {
    await client.close()
  } catch {
    throw new AdminMcpSyntheticCheckError(
      "관리자 MCP staging synthetic client 종료에 실패했습니다."
    )
  }
  if (checkResult === undefined) {
    throw new AdminMcpSyntheticCheckError(
      "관리자 MCP staging synthetic check 결과가 없습니다."
    )
  }
  return checkResult
}

function hasExactToolNames(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  if (actual.length !== expected.length) return false
  const sortedActual = [...actual].sort()
  const sortedExpected = [...expected].sort()
  return sortedActual.every((name, index) => name === sortedExpected[index])
}

function hasReadOnlyAnnotations(
  tool: Readonly<{
    annotations?: Readonly<{
      destructiveHint?: boolean
      idempotentHint?: boolean
      openWorldHint?: boolean
      readOnlyHint?: boolean
    }>
  }>
): boolean {
  return (
    tool.annotations?.destructiveHint === false &&
    tool.annotations.idempotentHint === true &&
    tool.annotations.openWorldHint === false &&
    tool.annotations.readOnlyHint === true
  )
}

function requireEnvironmentValue(
  value: string | undefined,
  name: "ADMIN_MCP_SYNTHETIC_BEARER_TOKEN" | "ADMIN_MCP_SYNTHETIC_RESOURCE_URL"
): string {
  if (value === undefined || value.trim() === "") {
    throw new AdminMcpSyntheticConfigurationError(`${name}를 설정해야 합니다.`)
  }
  return value.trim()
}

function parseHttpsUrl(
  value: string | undefined,
  name: "ADMIN_MCP_SYNTHETIC_RESOURCE_URL"
): URL {
  const rawUrl = requireEnvironmentValue(value, name)
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new AdminMcpSyntheticConfigurationError(
      `${name}는 유효한 HTTPS URL이어야 합니다.`
    )
  }
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new AdminMcpSyntheticConfigurationError(
      `${name}는 credential, query, fragment가 없는 HTTPS URL이어야 합니다.`
    )
  }
  return url
}

if (import.meta.main) {
  try {
    const configuration = parseAdminMcpSyntheticEnvironment(process.env)
    const result = await runAdminMcpSyntheticCheck(configuration)
    process.stdout.write(
      `관리자 MCP staging synthetic check를 통과했습니다. protocol=${result.protocolEra} tools=${result.toolNames.join(",")} call=${result.readToolName}\n`
    )
  } catch (error) {
    const message =
      error instanceof AdminMcpSyntheticConfigurationError ||
      error instanceof AdminMcpSyntheticCheckError
        ? error.message
        : "관리자 MCP staging synthetic check가 실패했습니다."
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  }
}
