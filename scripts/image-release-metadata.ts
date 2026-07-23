import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"

type JsonObject = Record<string, unknown>

export const imageReleaseServices = ["web", "api", "admin"] as const

export type ImageReleaseService = (typeof imageReleaseServices)[number]

export interface ImageReleasePublicOrigins {
  readonly admin: string
  readonly web: string
}

export interface ImageReleaseRecord {
  readonly configurationDigest: string
  readonly image: {
    readonly digest: string
    readonly name: string
    readonly reference: string
  }
  readonly publicOrigins: ImageReleasePublicOrigins
  readonly revision: string
  readonly schemaVersion: 1
  readonly service: ImageReleaseService
  readonly vulnerabilityPolicyDigest: string
}

export interface ImageReleaseManifest {
  readonly configurationDigest: string
  readonly images: {
    readonly admin: ImageReleaseRecord["image"]
    readonly api: ImageReleaseRecord["image"]
    readonly web: ImageReleaseRecord["image"]
  }
  readonly publicOrigins: ImageReleasePublicOrigins
  readonly revision: string
  readonly schemaVersion: 1
  readonly vulnerabilityPolicyDigest: string
}

interface ImageReleaseRecordInput {
  readonly digest: string
  readonly imageName: string
  readonly publicOrigins: ImageReleasePublicOrigins
  readonly repository: string
  readonly revision: string
  readonly service: ImageReleaseService
  readonly vulnerabilityPolicyDigest: string
}

export function validateImageReleaseInputs(input: {
  readonly publicOrigins: ImageReleasePublicOrigins
  readonly repository: string
  readonly revision: string
}): readonly string[] {
  const errors = [
    ...validateRevision(input.revision),
    ...validateRepository(input.repository),
  ]
  for (const [name, value] of Object.entries(input.publicOrigins)) {
    errors.push(...validatePublicOrigin(name, value))
  }
  return errors
}

export function createImageReleaseConfigurationDigest(
  publicOrigins: ImageReleasePublicOrigins
): string {
  return createHash("sha256")
    .update(JSON.stringify(publicOrigins))
    .digest("hex")
}

export function createImageReleaseRecord(
  input: ImageReleaseRecordInput
): ImageReleaseRecord {
  const inputErrors = validateImageReleaseInputs(input)
  if (inputErrors.length > 0) throw new Error(inputErrors.join("\n"))
  if (!imageReleaseServices.includes(input.service)) {
    throw new Error(`지원하지 않는 image service입니다: ${input.service}`)
  }
  if (!/^sha256:[0-9a-f]{64}$/u.test(input.digest)) {
    throw new Error(
      "image digest는 sha256:<64 lowercase hex> 형식이어야 합니다."
    )
  }
  if (!/^[0-9a-f]{64}$/u.test(input.vulnerabilityPolicyDigest)) {
    throw new Error("취약점 정책 digest는 64자리 lowercase hex여야 합니다.")
  }

  const expectedImageName = `${createImagePrefix(input.repository)}-${input.service}`
  if (input.imageName !== expectedImageName) {
    throw new Error(`image name은 ${expectedImageName}이어야 합니다.`)
  }

  return {
    configurationDigest: createImageReleaseConfigurationDigest(
      input.publicOrigins
    ),
    image: {
      digest: input.digest,
      name: input.imageName,
      reference: `${input.imageName}@${input.digest}`,
    },
    publicOrigins: input.publicOrigins,
    revision: input.revision,
    schemaVersion: 1,
    service: input.service,
    vulnerabilityPolicyDigest: input.vulnerabilityPolicyDigest,
  }
}

export function createImageReleaseManifest(
  records: readonly ImageReleaseRecord[]
): ImageReleaseManifest {
  if (records.length !== imageReleaseServices.length) {
    throw new Error("release manifest에는 세 image record가 모두 필요합니다.")
  }

  const byService = new Map<ImageReleaseService, ImageReleaseRecord>()
  const first = records[0]
  if (first === undefined) {
    throw new Error("release manifest에 image record가 없습니다.")
  }

  for (const record of records) {
    validateImageReleaseRecord(record)
    if (byService.has(record.service)) {
      throw new Error(`${record.service} image record가 중복됐습니다.`)
    }
    if (record.revision !== first.revision) {
      throw new Error("모든 image record의 revision이 같아야 합니다.")
    }
    if (record.configurationDigest !== first.configurationDigest) {
      throw new Error("모든 image record의 공개 설정 digest가 같아야 합니다.")
    }
    if (record.vulnerabilityPolicyDigest !== first.vulnerabilityPolicyDigest) {
      throw new Error("모든 image record의 취약점 정책 digest가 같아야 합니다.")
    }
    if (
      JSON.stringify(record.publicOrigins) !==
      JSON.stringify(first.publicOrigins)
    ) {
      throw new Error("모든 image record의 공개 origin이 같아야 합니다.")
    }
    byService.set(record.service, record)
  }

  for (const service of imageReleaseServices) {
    if (!byService.has(service)) {
      throw new Error(`${service} image record가 없습니다.`)
    }
  }

  return {
    configurationDigest: first.configurationDigest,
    images: {
      admin: requireRecord(byService, "admin").image,
      api: requireRecord(byService, "api").image,
      web: requireRecord(byService, "web").image,
    },
    publicOrigins: first.publicOrigins,
    revision: first.revision,
    schemaVersion: 1,
    vulnerabilityPolicyDigest: first.vulnerabilityPolicyDigest,
  }
}

export function parseImageReleaseRecord(input: unknown): ImageReleaseRecord {
  if (!isJsonObject(input)) throw new Error("image record는 객체여야 합니다.")
  if (!isJsonObject(input.image) || !isJsonObject(input.publicOrigins)) {
    throw new Error("image record의 image와 publicOrigins가 필요합니다.")
  }

  const service = input.service
  if (
    typeof service !== "string" ||
    !imageReleaseServices.includes(service as ImageReleaseService)
  ) {
    throw new Error("image record의 service가 올바르지 않습니다.")
  }

  const record: ImageReleaseRecord = {
    configurationDigest: readString(
      input.configurationDigest,
      "configurationDigest"
    ),
    image: {
      digest: readString(input.image.digest, "image.digest"),
      name: readString(input.image.name, "image.name"),
      reference: readString(input.image.reference, "image.reference"),
    },
    publicOrigins: {
      admin: readString(input.publicOrigins.admin, "publicOrigins.admin"),
      web: readString(input.publicOrigins.web, "publicOrigins.web"),
    },
    revision: readString(input.revision, "revision"),
    schemaVersion: input.schemaVersion === 1 ? 1 : invalidSchemaVersion(),
    service: service as ImageReleaseService,
    vulnerabilityPolicyDigest: readString(
      input.vulnerabilityPolicyDigest,
      "vulnerabilityPolicyDigest"
    ),
  }
  validateImageReleaseRecord(record)
  return record
}

function validateImageReleaseRecord(record: ImageReleaseRecord): void {
  if (!/^[0-9a-f]{64}$/u.test(record.configurationDigest)) {
    throw new Error("configurationDigest는 64자리 lowercase hex여야 합니다.")
  }
  if (!/^[0-9a-f]{40}$/u.test(record.revision)) {
    throw new Error("revision은 40자리 lowercase Git SHA여야 합니다.")
  }
  if (!/^[0-9a-f]{64}$/u.test(record.vulnerabilityPolicyDigest)) {
    throw new Error(
      "vulnerabilityPolicyDigest는 64자리 lowercase hex여야 합니다."
    )
  }
  if (!/^sha256:[0-9a-f]{64}$/u.test(record.image.digest)) {
    throw new Error("image digest 형식이 올바르지 않습니다.")
  }
  const expectedImageNamePattern = new RegExp(
    `^ghcr\\.io/[a-z0-9._-]+/[a-z0-9._-]+-${record.service}$`,
    "u"
  )
  if (!expectedImageNamePattern.test(record.image.name)) {
    throw new Error(
      `image name은 lowercase GHCR repository의 ${record.service} image여야 합니다.`
    )
  }
  if (
    record.image.reference !== `${record.image.name}@${record.image.digest}`
  ) {
    throw new Error("image reference는 name@digest 형식이어야 합니다.")
  }
  const expectedConfigurationDigest = createImageReleaseConfigurationDigest(
    record.publicOrigins
  )
  if (record.configurationDigest !== expectedConfigurationDigest) {
    throw new Error("공개 origin과 configurationDigest가 일치하지 않습니다.")
  }
  for (const [name, value] of Object.entries(record.publicOrigins)) {
    const errors = validatePublicOrigin(name, value)
    if (errors.length > 0) throw new Error(errors.join("\n"))
  }
}

function validateRevision(revision: string): readonly string[] {
  return /^[0-9a-f]{40}$/u.test(revision)
    ? []
    : ["release revision은 40자리 lowercase Git SHA여야 합니다."]
}

function validateRepository(repository: string): readonly string[] {
  return /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/u.test(repository)
    ? []
    : ["GITHUB_REPOSITORY는 owner/repository 형식이어야 합니다."]
}

function validatePublicOrigin(name: string, value: string): readonly string[] {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return [`${name}은(는) 유효한 URL이어야 합니다.`]
  }

  const errors: string[] = []
  if (url.protocol !== "https:") {
    errors.push(`${name}은(는) HTTPS origin이어야 합니다.`)
  }
  if (url.origin !== value || url.username !== "" || url.password !== "") {
    errors.push(
      `${name}은(는) path, query, fragment, credential 없는 canonical origin이어야 합니다.`
    )
  }
  const hostname = url.hostname.toLowerCase()
  const reservedSuffixes = [".example", ".invalid", ".localhost", ".test"]
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    reservedSuffixes.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix)
    )
  ) {
    errors.push(`${name}은(는) 실제 production hostname이어야 합니다.`)
  }
  return errors
}

function createImagePrefix(repository: string): string {
  return `ghcr.io/${repository.toLowerCase()}`
}

function requireRecord(
  records: ReadonlyMap<ImageReleaseService, ImageReleaseRecord>,
  service: ImageReleaseService
): ImageReleaseRecord {
  const record = records.get(service)
  if (record === undefined) throw new Error(`${service} record가 없습니다.`)
  return record
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name}은(는) 비어 있지 않은 문자열이어야 합니다.`)
  }
  return value
}

function invalidSchemaVersion(): never {
  throw new Error("지원하는 image release schemaVersion은 1입니다.")
}

function readPublicOriginsFromEnvironment(): ImageReleasePublicOrigins {
  return {
    admin: requireEnvironment("PRODUCTION_ADMIN_ORIGIN"),
    web: requireEnvironment("PRODUCTION_WEB_ORIGIN"),
  }
}

function requireEnvironment(name: string): string {
  const value = process.env[name]
  if (value === undefined || value.length === 0) {
    throw new Error(`${name} 환경 변수가 필요합니다.`)
  }
  return value
}

function appendGitHubOutput(name: string, value: string): void {
  const outputPath = requireEnvironment("GITHUB_OUTPUT")
  fs.appendFileSync(outputPath, `${name}=${value}\n`)
}

function runPreflight(): void {
  const publicOrigins = readPublicOriginsFromEnvironment()
  const repository = requireEnvironment("GITHUB_REPOSITORY")
  const revision = requireEnvironment("IMAGE_RELEASE_REVISION")
  const errors = validateImageReleaseInputs({
    publicOrigins,
    repository,
    revision,
  })
  if (errors.length > 0) throw new Error(errors.join("\n"))

  const configurationDigest =
    createImageReleaseConfigurationDigest(publicOrigins)
  appendGitHubOutput("configuration-digest", configurationDigest)
  appendGitHubOutput("image-prefix", createImagePrefix(repository))
  appendGitHubOutput("release-tag", `sha-${revision}-${configurationDigest}`)
  console.log(
    `Image release 입력을 확인했습니다. configuration digest: ${configurationDigest}`
  )
}

function runWriteRecord(): void {
  const outputPath = requireEnvironment("IMAGE_RELEASE_OUTPUT")
  const record = createImageReleaseRecord({
    digest: requireEnvironment("IMAGE_RELEASE_DIGEST"),
    imageName: requireEnvironment("IMAGE_RELEASE_NAME"),
    publicOrigins: readPublicOriginsFromEnvironment(),
    repository: requireEnvironment("GITHUB_REPOSITORY"),
    revision: requireEnvironment("IMAGE_RELEASE_REVISION"),
    service: requireEnvironment("IMAGE_RELEASE_SERVICE") as ImageReleaseService,
    vulnerabilityPolicyDigest: requireEnvironment(
      "IMAGE_RELEASE_VULNERABILITY_POLICY_DIGEST"
    ),
  })
  const expectedConfigurationDigest = requireEnvironment(
    "IMAGE_RELEASE_CONFIGURATION_DIGEST"
  )
  if (record.configurationDigest !== expectedConfigurationDigest) {
    throw new Error("preflight와 image record의 공개 설정 digest가 다릅니다.")
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`)
  console.log(`${record.service} image digest record를 생성했습니다.`)
}

function runAggregateRecords(inputDirectory: string, outputPath: string): void {
  const recordPaths = fs
    .readdirSync(inputDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(inputDirectory, entry.name))
    .sort()
  const records = recordPaths.map((recordPath) =>
    parseImageReleaseRecord(
      JSON.parse(fs.readFileSync(recordPath, "utf8")) as unknown
    )
  )
  const manifest = createImageReleaseManifest(records)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`세 image digest manifest를 생성했습니다: ${outputPath}`)
}

function runImageReleaseMetadataCommand(): void {
  const command = process.argv[2]
  switch (command) {
    case "preflight":
      runPreflight()
      return
    case "write-record":
      runWriteRecord()
      return
    case "aggregate":
      runAggregateRecords(
        process.argv[3] ?? "output/image-release-records",
        process.argv[4] ?? "output/image-release-manifest.json"
      )
      return
    default:
      throw new Error(
        "preflight, write-record 또는 aggregate 명령을 사용해야 합니다."
      )
  }
}

if (import.meta.main) {
  try {
    runImageReleaseMetadataCommand()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
