import { Buffer } from "node:buffer"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  adminTargetContractProtocolVersion,
  adminTargetContractResultMarker,
  type AdminTargetContractCase,
  type AdminTargetContractJson,
  type AdminTargetContractOpenApiProjection,
  type AdminTargetContractRawObservation,
  type AdminTargetContractRunInput,
  type AdminTargetContractRunnerOutput,
  type AdminTargetContractSemanticBody,
  type AdminTargetContractSemanticObservation,
  type AdminTargetContractSseEvent,
  type AdminTargetContractWorkspace,
} from "@/test-support/admin-target-contract"

const defaultRunnerTimeoutMs = 10_000
const httpMethods = new Set([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
])
const openApiComponentSections = new Set([
  "callbacks",
  "examples",
  "headers",
  "links",
  "parameters",
  "requestBodies",
  "responses",
  "schemas",
  "securitySchemes",
])

type RunnerSpecification = {
  readonly entrypoint: string
  readonly workspace: AdminTargetContractWorkspace
  readonly workspaceRoot: string
}

export type AdminTargetContractRun = {
  readonly target: AdminTargetContractRuntimeObservation
}

export type AdminTargetContractRuntimeObservation = {
  readonly observations: readonly AdminTargetContractSemanticObservation[]
  readonly rawObservations: readonly AdminTargetContractRawObservation[]
  readonly runtime: AdminTargetContractRunnerOutput["runtime"]
}

export type AdminTargetContractEvidence = AdminTargetContractRun & {
  readonly caseCount: number
}

export type AdminTargetContractHarnessOptions = {
  readonly runnerTimeoutMs?: number
}

export async function assertAdminTargetContract(
  input: AdminTargetContractRunInput,
  options: AdminTargetContractHarnessOptions = {}
): Promise<AdminTargetContractEvidence> {
  const run = await runAdminTargetContract(input, options)

  return {
    ...run,
    caseCount: input.cases.length,
  }
}

export async function runAdminTargetContract(
  input: AdminTargetContractRunInput,
  options: AdminTargetContractHarnessOptions = {}
): Promise<AdminTargetContractRun> {
  assertRunInput(input)
  const runnerTimeoutMs = options.runnerTimeoutMs ?? defaultRunnerTimeoutMs
  assertRunnerTimeout(runnerTimeoutMs)

  const targetResult = await runWorkspaceRunner(
    createTargetRunnerSpecification(),
    input,
    runnerTimeoutMs
  )

  return {
    target: createRuntimeObservation(input.cases, targetResult),
  }
}

function createRuntimeObservation(
  cases: readonly AdminTargetContractCase[],
  output: AdminTargetContractRunnerOutput
): AdminTargetContractRuntimeObservation {
  if (output.observations.length !== cases.length) {
    throw new Error(
      `${output.runtime.workspace} target contract runner가 ${cases.length}개 중 ${output.observations.length}개 관찰값만 반환했습니다.`
    )
  }

  const rawById = new Map(
    output.observations.map((observation) => [observation.id, observation])
  )
  const observations = cases.map((contractCase) => {
    const rawObservation = rawById.get(contractCase.id)

    if (rawObservation === undefined) {
      throw new Error(
        `${output.runtime.workspace} target contract runner에 ${contractCase.id} 관찰값이 없습니다.`
      )
    }

    return createSemanticObservation(contractCase, rawObservation)
  })

  if (rawById.size !== output.observations.length) {
    throw new Error(
      `${output.runtime.workspace} target contract runner가 중복된 case ID를 반환했습니다.`
    )
  }

  return {
    observations,
    rawObservations: output.observations,
    runtime: output.runtime,
  }
}

function createSemanticObservation(
  contractCase: AdminTargetContractCase,
  raw: AdminTargetContractRawObservation
): AdminTargetContractSemanticObservation {
  if (raw.id !== contractCase.id) {
    throw new Error(
      `${contractCase.id} 요청과 ${raw.id} 관찰값을 연결할 수 없습니다.`
    )
  }
  if (!Number.isInteger(raw.status) || raw.status < 100 || raw.status > 599) {
    throw new Error(`${raw.id} 응답 status가 유효하지 않습니다.`)
  }

  const bytes = decodeCanonicalBase64(raw.bodyBase64, raw.id)

  return {
    body: createSemanticBody(contractCase, bytes),
    effectJournal: canonicalizeEffectJournal(raw.effectJournal, raw.id),
    headers: canonicalizeHeaders(raw.headers, raw.id),
    id: raw.id,
    status: raw.status,
  }
}

function createSemanticBody(
  contractCase: AdminTargetContractCase,
  bytes: Uint8Array
): AdminTargetContractSemanticBody {
  const mode = contractCase.responseBody
  const caseId = contractCase.id

  if (mode === "bytes") {
    return { base64: Buffer.from(bytes).toString("base64"), kind: "bytes" }
  }
  if (mode === "none") {
    if (bytes.byteLength !== 0) {
      throw new Error(
        `${caseId}의 body 없음 계약에 ${bytes.byteLength} byte가 반환되었습니다.`
      )
    }
    return { kind: "none" }
  }

  const text = decodeUtf8(bytes, caseId)

  if (mode === "text") return { kind: "text", value: text }
  if (mode === "sse")
    return { events: parseSseEvents(text, caseId), kind: "sse" }

  const json = parseJson(text, caseId)

  if (mode === "openapi") {
    assertOpenApiDocument(json, caseId)
    return {
      kind: "openapi",
      projection: projectOpenApiDocument(
        json,
        contractCase.openApiProjection,
        caseId
      ),
    }
  }

  return { kind: "json", value: json }
}

function projectOpenApiDocument(
  document: { readonly [key: string]: AdminTargetContractJson },
  projection: AdminTargetContractOpenApiProjection,
  caseId: string
): AdminTargetContractJson {
  const paths = readRequiredJsonObject(document, "paths", caseId)
  const selectedPaths = Object.fromEntries(
    projection.paths.map((path) => [
      path,
      readRequiredJsonValue(paths, path, `${caseId} OpenAPI paths`),
    ])
  )
  const selectedComponents = projection.components?.map(
    ({ names, section }) => {
      const components = readRequiredJsonObject(document, "components", caseId)
      const componentSection = readRequiredJsonObject(
        components,
        section,
        `${caseId} OpenAPI components`
      )

      return [
        section,
        Object.fromEntries(
          names.map((name) => [
            name,
            readRequiredJsonValue(
              componentSection,
              name,
              `${caseId} OpenAPI components.${section}`
            ),
          ])
        ),
      ] as const
    }
  )

  return canonicalizeJson({
    ...(selectedComponents === undefined
      ? {}
      : { components: Object.fromEntries(selectedComponents) }),
    info: readRequiredJsonObject(document, "info", caseId),
    openapi: readRequiredJsonValue(document, "openapi", caseId),
    paths: selectedPaths,
  })
}

function readRequiredJsonObject(
  source: { readonly [key: string]: AdminTargetContractJson },
  key: string,
  location: string
): { readonly [key: string]: AdminTargetContractJson } {
  const value = readRequiredJsonValue(source, key, location)

  if (!isJsonObject(value)) {
    throw new Error(`${location}.${key}가 JSON object가 아닙니다.`)
  }

  return value
}

function readRequiredJsonValue(
  source: { readonly [key: string]: AdminTargetContractJson },
  key: string,
  location: string
): AdminTargetContractJson {
  const value = source[key]

  if (value === undefined) {
    throw new Error(`${location}에 요청한 ${key} 항목이 없습니다.`)
  }

  return value
}

function canonicalizeHeaders(
  headers: AdminTargetContractRawObservation["headers"],
  caseId: string
): Readonly<Record<string, readonly string[]>> {
  const valuesByName = new Map<string, string[]>()

  for (const header of headers) {
    const name = header.name.toLowerCase()

    if (
      name.length === 0 ||
      name.trim() !== name ||
      /[^!#$%&'*+.^_`|~0-9a-z-]/u.test(name)
    ) {
      throw new Error(`${caseId} 응답에 유효하지 않은 header 이름이 있습니다.`)
    }
    const values = valuesByName.get(name) ?? []
    values.push(header.value)
    valuesByName.set(name, values)
  }

  return Object.fromEntries(
    [...valuesByName.entries()].sort(([left], [right]) =>
      left.localeCompare(right)
    )
  )
}

function canonicalizeEffectJournal(
  effectJournal: readonly AdminTargetContractJson[],
  caseId: string
): readonly AdminTargetContractJson[] {
  return effectJournal.map((entry, index) => {
    const canonical = canonicalizeJson(entry)

    if (!isJsonObject(canonical)) {
      throw new Error(
        `${caseId} effect journal ${index + 1}번 항목이 객체가 아닙니다.`
      )
    }
    if (
      canonical.sequence !== index + 1 ||
      typeof canonical.effect !== "string"
    ) {
      throw new Error(
        `${caseId} effect journal은 1부터 연속된 sequence와 effect 문자열이 필요합니다.`
      )
    }

    return canonical
  })
}

function parseSseEvents(
  text: string,
  caseId: string
): readonly AdminTargetContractSseEvent[] {
  const source = text
    .replace(/^\uFEFF/u, "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
  const events: AdminTargetContractSseEvent[] = []
  let dataLines: string[] = []
  let event = ""
  let id: string | undefined
  let retry: number | undefined

  const dispatch = () => {
    if (dataLines.length === 0) {
      event = ""
      id = undefined
      retry = undefined
      return
    }

    const data = dataLines.join("\n")
    const eventValue: AdminTargetContractSseEvent = {
      data: parseSseData(data),
      event: event.length === 0 ? "message" : event,
      ...(id === undefined ? {} : { id }),
      ...(retry === undefined ? {} : { retry }),
    }
    events.push(eventValue)
    dataLines = []
    event = ""
    id = undefined
    retry = undefined
  }

  for (const line of `${source}\n`.split("\n")) {
    if (line.length === 0) {
      dispatch()
      continue
    }
    if (line.startsWith(":")) continue

    const separatorIndex = line.indexOf(":")
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const rawValue = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1)
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue

    if (field === "data") dataLines.push(value)
    else if (field === "event") event = value
    else if (field === "id" && !value.includes("\0")) id = value
    else if (field === "retry" && /^\d+$/u.test(value)) retry = Number(value)
  }

  if (events.length === 0 && text.length > 0) {
    throw new Error(`${caseId} SSE body에 dispatch 가능한 event가 없습니다.`)
  }

  return events
}

function parseSseData(data: string): AdminTargetContractSseEvent["data"] {
  try {
    return { kind: "json", value: canonicalizeJson(JSON.parse(data)) }
  } catch {
    return { kind: "text", value: data }
  }
}

function parseJson(text: string, caseId: string): AdminTargetContractJson {
  try {
    return canonicalizeJson(JSON.parse(text))
  } catch (error) {
    throw new Error(`${caseId} 응답이 유효한 JSON이 아닙니다.`, {
      cause: error,
    })
  }
}

function canonicalizeJson(value: unknown): AdminTargetContractJson {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return value
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("JSON number는 유한해야 합니다.")
    return value
  }
  if (Array.isArray(value)) return value.map(canonicalizeJson)
  if (typeof value === "object") {
    const entries: [string, unknown][] = Object.entries(value)

    return Object.fromEntries(
      entries
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalizeJson(entry)])
    )
  }

  throw new Error("JSON 계약에 포함할 수 없는 값입니다.")
}

function assertOpenApiDocument(
  document: AdminTargetContractJson,
  caseId: string
): asserts document is { readonly [key: string]: AdminTargetContractJson } {
  if (
    !isJsonObject(document) ||
    typeof document.openapi !== "string" ||
    !isJsonObject(document.info) ||
    !isJsonObject(document.paths)
  ) {
    throw new Error(
      `${caseId} 응답이 OpenAPI document 최소 계약을 충족하지 않습니다.`
    )
  }
}

function isJsonObject(
  value: AdminTargetContractJson | undefined
): value is { readonly [key: string]: AdminTargetContractJson } {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function decodeCanonicalBase64(value: string, caseId: string): Uint8Array {
  const bytes = Buffer.from(value, "base64")

  if (bytes.toString("base64") !== value) {
    throw new Error(`${caseId} 응답 body가 canonical base64가 아닙니다.`)
  }

  return bytes
}

function decodeUtf8(bytes: Uint8Array, caseId: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch (error) {
    throw new Error(`${caseId} 응답 body가 유효한 UTF-8이 아닙니다.`, {
      cause: error,
    })
  }
}

async function runWorkspaceRunner(
  specification: RunnerSpecification,
  input: AdminTargetContractRunInput,
  timeoutMs: number
): Promise<AdminTargetContractRunnerOutput> {
  const subprocess = Bun.spawn({
    cmd: [process.execPath, specification.entrypoint],
    cwd: specification.workspaceRoot,
    env: { ...process.env, NO_COLOR: "1" },
    stderr: "pipe",
    stdin: "pipe",
    stdout: "pipe",
  })
  const stdoutPromise = new Response(subprocess.stdout).text()
  const stderrPromise = new Response(subprocess.stderr).text()
  let processExited = false
  const exitedPromise = subprocess.exited.then((exitCode) => {
    processExited = true
    return exitCode
  })
  const timeout = createProcessTimeout(specification.workspace, timeoutMs)

  try {
    subprocess.stdin.write(JSON.stringify(input))
    subprocess.stdin.end()

    const [exitCode, stdout, stderr] = await Promise.race([
      Promise.all([exitedPromise, stdoutPromise, stderrPromise]),
      timeout.promise,
    ])

    if (exitCode !== 0) {
      throw new Error(
        `${specification.workspace} target contract runner가 code ${exitCode}로 종료했습니다.\n${stderr.trim()}`
      )
    }

    return parseRunnerOutput(stdout, specification)
  } finally {
    timeout.cancel()
    if (!processExited) subprocess.kill()
    await Promise.allSettled([exitedPromise, stdoutPromise, stderrPromise])
  }
}

function createProcessTimeout(
  workspace: AdminTargetContractWorkspace,
  timeoutMs: number
): {
  readonly cancel: () => void
  readonly promise: Promise<never>
} {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const promise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${workspace} target contract runner가 ${timeoutMs}ms 안에 종료하지 않았습니다.`
        )
      )
    }, timeoutMs)
  })

  return {
    cancel() {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    },
    promise,
  }
}

function assertRunnerTimeout(timeoutMs: number): void {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new Error(
      "target contract runner timeout은 1~60000ms 정수여야 합니다."
    )
  }
}

function parseRunnerOutput(
  stdout: string,
  specification: RunnerSpecification
): AdminTargetContractRunnerOutput {
  const resultLines = stdout
    .split(/\r?\n/u)
    .filter((line) => line.startsWith(adminTargetContractResultMarker))

  if (resultLines.length !== 1) {
    throw new Error(
      `${specification.workspace} target contract runner가 결과 frame을 정확히 하나 반환하지 않았습니다.`
    )
  }

  const output: unknown = JSON.parse(
    resultLines[0]?.slice(adminTargetContractResultMarker.length) ?? ""
  )
  assertRunnerOutput(output, specification)
  return output
}

function assertRunnerOutput(
  output: unknown,
  specification: RunnerSpecification
): asserts output is AdminTargetContractRunnerOutput {
  if (output === null || typeof output !== "object") {
    throw new Error(
      `${specification.workspace} target contract runner 결과가 객체가 아닙니다.`
    )
  }

  const candidate = output as Partial<AdminTargetContractRunnerOutput>
  if (
    candidate.protocolVersion !== adminTargetContractProtocolVersion ||
    candidate.runtime?.workspace !== specification.workspace ||
    candidate.runtime.cwd !== specification.workspaceRoot ||
    !Number.isInteger(candidate.runtime.pid) ||
    !Array.isArray(candidate.observations)
  ) {
    throw new Error(
      `${specification.workspace} target contract runner 결과 계약이 유효하지 않습니다.`
    )
  }
}

function assertRunInput(input: AdminTargetContractRunInput): void {
  if (input.protocolVersion !== adminTargetContractProtocolVersion) {
    throw new Error("지원하지 않는 관리자 API target contract protocol입니다.")
  }
  if (input.suite.trim().length === 0) {
    throw new Error("관리자 API target contract suite 이름이 필요합니다.")
  }

  const caseIds = new Set<string>()
  for (const contractCase of input.cases) {
    if (contractCase.id.trim().length === 0 || caseIds.has(contractCase.id)) {
      throw new Error(
        "관리자 API target contract case ID는 비어 있지 않고 고유해야 합니다."
      )
    }
    caseIds.add(contractCase.id)

    if (!httpMethods.has(contractCase.request.method)) {
      throw new Error(`${contractCase.id} 요청 method가 허용 목록에 없습니다.`)
    }
    if (
      !contractCase.request.path.startsWith("/") ||
      contractCase.request.path.startsWith("//")
    ) {
      throw new Error(
        `${contractCase.id} 요청 path는 origin 없는 절대 경로여야 합니다.`
      )
    }
    if (
      (contractCase.request.method === "GET" ||
        contractCase.request.method === "HEAD") &&
      contractCase.request.body !== undefined
    ) {
      throw new Error(
        `${contractCase.id} ${contractCase.request.method} 요청에는 body를 넣을 수 없습니다.`
      )
    }
    if (contractCase.responseBody === "openapi") {
      assertOpenApiProjection(contractCase.openApiProjection, contractCase.id)
    }
  }
}

function assertOpenApiProjection(
  projection: AdminTargetContractOpenApiProjection,
  caseId: string
): void {
  if (
    projection === null ||
    typeof projection !== "object" ||
    !Array.isArray(projection.paths) ||
    projection.paths.length === 0
  ) {
    throw new Error(`${caseId} OpenAPI projection에는 exact path가 필요합니다.`)
  }

  assertUniqueExactSelectors(projection.paths, `${caseId} OpenAPI path`, "/")

  if (projection.components === undefined) return
  if (!Array.isArray(projection.components)) {
    throw new Error(`${caseId} OpenAPI component projection이 배열이 아닙니다.`)
  }

  const sections = projection.components.map((component) => {
    if (
      component === null ||
      typeof component !== "object" ||
      typeof component.section !== "string" ||
      !openApiComponentSections.has(component.section) ||
      !Array.isArray(component.names) ||
      component.names.length === 0
    ) {
      throw new Error(
        `${caseId} OpenAPI component selector가 유효하지 않습니다.`
      )
    }
    assertUniqueExactSelectors(
      component.names,
      `${caseId} OpenAPI ${component.section}`
    )
    return component.section
  })
  assertUniqueExactSelectors(sections, `${caseId} OpenAPI component section`)
}

function assertUniqueExactSelectors(
  selectors: readonly string[],
  label: string,
  requiredPrefix = ""
): void {
  const seen = new Set<string>()

  for (const selector of selectors) {
    if (
      typeof selector !== "string" ||
      selector.length === 0 ||
      selector.includes("*") ||
      !selector.startsWith(requiredPrefix) ||
      seen.has(selector)
    ) {
      throw new Error(
        `${label} selector는 wildcard 없는 고유한 exact 값이어야 합니다.`
      )
    }
    seen.add(selector)
  }
}

function createTargetRunnerSpecification(): RunnerSpecification {
  const workspaceRoot = resolve(
    fileURLToPath(new URL("../../", import.meta.url))
  )

  return {
    entrypoint: fileURLToPath(
      new URL("./admin-target-contract-runner.ts", import.meta.url)
    ),
    workspace: "target",
    workspaceRoot,
  }
}
