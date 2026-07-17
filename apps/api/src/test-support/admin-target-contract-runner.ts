import { Buffer } from "node:buffer"

import { adminTargetContractFixtureFactories } from "@/test-support/admin-target-contract-fixtures"

const protocolVersion = 1 as const
const resultMarker = "ADMIN_TARGET_CONTRACT_RESULT:"
const requestOrigin = "http://admin-api.target-contract.test"

type RunnerInput = {
  readonly cases: readonly RunnerCase[]
  readonly protocolVersion: typeof protocolVersion
  readonly suite: string
}

type RunnerCase = {
  readonly id: string
  readonly request: {
    readonly body?:
      | { readonly encoding: "base64"; readonly value: string }
      | { readonly encoding: "utf8"; readonly value: string }
    readonly headers?: readonly (readonly [string, string])[]
    readonly method: string
    readonly path: string
  }
  readonly scenario: string
}

if (import.meta.main) {
  await main().catch((error: unknown) => {
    process.stderr.write(`${formatError(error)}\n`)
    process.exitCode = 1
  })
}

async function main(): Promise<void> {
  const input = await readInput()
  const factory = adminTargetContractFixtureFactories[input.suite]

  if (factory === undefined) {
    throw new Error(
      `지원하지 않는 관리자 target contract suite입니다: ${input.suite}`
    )
  }

  const observations = []
  for (const contractCase of input.cases) {
    const fixture = factory(contractCase.scenario)
    const response = await fixture.fetch(createRequest(contractCase))

    observations.push({
      bodyBase64: Buffer.from(await response.arrayBuffer()).toString("base64"),
      effectJournal: fixture.readEffectJournal(),
      headers: readResponseHeaders(response.headers),
      id: contractCase.id,
      status: response.status,
    })
  }

  const output = {
    observations,
    protocolVersion,
    runtime: {
      cwd: process.cwd(),
      pid: process.pid,
      workspace: "target",
    },
  } as const
  process.stdout.write(`${resultMarker}${JSON.stringify(output)}\n`)
}

async function readInput(): Promise<RunnerInput> {
  const input: unknown = JSON.parse(
    await new Response(Bun.stdin.stream()).text()
  )

  if (input === null || typeof input !== "object") {
    throw new Error("관리자 target contract runner input이 객체가 아닙니다.")
  }
  const candidate = input as Partial<RunnerInput>

  if (
    candidate.protocolVersion !== protocolVersion ||
    typeof candidate.suite !== "string" ||
    !Array.isArray(candidate.cases)
  ) {
    throw new Error(
      "관리자 target contract runner input 계약이 유효하지 않습니다."
    )
  }

  return candidate as RunnerInput
}

function createRequest(contractCase: RunnerCase): Request {
  return new Request(new URL(contractCase.request.path, requestOrigin), {
    body: readRequestBody(contractCase.request.body),
    headers: contractCase.request.headers?.map(([name, value]) => [
      name,
      value,
    ]),
    method: contractCase.request.method,
  })
}

function readRequestBody(
  body: RunnerCase["request"]["body"]
): Blob | string | undefined {
  if (body === undefined) return undefined
  return body.encoding === "base64"
    ? new Blob([Uint8Array.from(Buffer.from(body.value, "base64"))])
    : body.value
}

function readResponseHeaders(
  headers: Headers
): readonly { readonly name: string; readonly value: string }[] {
  const values = [...headers.entries()]
    .filter(([name]) => name !== "set-cookie")
    .map(([name, value]) => ({ name, value }))

  return [
    ...values,
    ...headers.getSetCookie().map((value) => ({ name: "set-cookie", value })),
  ]
}

function formatError(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error)
}
