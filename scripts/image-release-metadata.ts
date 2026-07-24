import fs from "node:fs"
import path from "node:path"

type JsonObject = Record<string, unknown>

export const imageReleaseServices = ["web", "api", "admin"] as const

export type ImageReleaseService = (typeof imageReleaseServices)[number]

export interface ImageReleasePublicOrigins {
  readonly admin: string
  readonly productionAssets: string
  readonly stagingAssets: string
  readonly web: string
}

export interface ImageReleaseRecord {
  readonly image: string
  readonly sourceRevision: string
  readonly service: ImageReleaseService
}

export interface ImageReleaseManifest {
  readonly images: {
    readonly admin: string
    readonly api: string
    readonly web: string
  }
  readonly sourceRevision: string
}

export interface AnsibleImageVariables {
  readonly writing_app_admin_image: string
  readonly writing_app_api_image: string
  readonly writing_app_source_revision: string
  readonly writing_app_web_image: string
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
  if (
    input.publicOrigins.productionAssets === input.publicOrigins.stagingAssets
  ) {
    errors.push("production과 staging asset origin은 달라야 합니다.")
  }
  return errors
}

export function createImageReleaseRecord(input: {
  readonly digest: string
  readonly repository: string
  readonly revision: string
  readonly service: ImageReleaseService
}): ImageReleaseRecord {
  const errors = [
    ...validateRevision(input.revision),
    ...validateRepository(input.repository),
  ]
  if (errors.length > 0) throw new Error(errors.join("\n"))
  if (!imageReleaseServices.includes(input.service)) {
    throw new Error(`지원하지 않는 image service입니다: ${input.service}`)
  }
  if (!isImageDigest(input.digest)) {
    throw new Error(
      "image digest는 sha256:<64 lowercase hex> 형식이어야 합니다."
    )
  }

  return {
    image: `${createImagePrefix(input.repository)}-${input.service}@${input.digest}`,
    sourceRevision: input.revision,
    service: input.service,
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
  const expectedImagePrefix = readImagePrefix(first.image, first.service)

  for (const record of records) {
    validateImageReleaseRecord(record)
    if (byService.has(record.service)) {
      throw new Error(`${record.service} image record가 중복됐습니다.`)
    }
    if (record.sourceRevision !== first.sourceRevision) {
      throw new Error("모든 image record의 source revision이 같아야 합니다.")
    }
    if (readImagePrefix(record.image, record.service) !== expectedImagePrefix) {
      throw new Error("모든 image record는 같은 GHCR repository여야 합니다.")
    }
    byService.set(record.service, record)
  }

  for (const service of imageReleaseServices) {
    if (!byService.has(service)) {
      throw new Error(`${service} image record가 없습니다.`)
    }
  }

  return {
    images: {
      admin: requireRecord(byService, "admin").image,
      api: requireRecord(byService, "api").image,
      web: requireRecord(byService, "web").image,
    },
    sourceRevision: first.sourceRevision,
  }
}

export function parseImageReleaseRecord(input: unknown): ImageReleaseRecord {
  if (!isJsonObject(input)) throw new Error("image record는 객체여야 합니다.")
  assertExactKeys(input, ["image", "sourceRevision", "service"])

  const service = readService(input.service, "image record의 service")
  const record = {
    image: readString(input.image, "image"),
    sourceRevision: readString(input.sourceRevision, "sourceRevision"),
    service,
  }
  validateImageReleaseRecord(record)
  return record
}

export function parseImageReleaseManifest(
  input: unknown
): ImageReleaseManifest {
  if (!isJsonObject(input) || !isJsonObject(input.images)) {
    throw new Error("release manifest의 images 객체가 필요합니다.")
  }
  assertExactKeys(input, ["images", "sourceRevision"])
  assertExactKeys(input.images, imageReleaseServices)

  const manifest = {
    images: {
      admin: readString(input.images.admin, "images.admin"),
      api: readString(input.images.api, "images.api"),
      web: readString(input.images.web, "images.web"),
    },
    sourceRevision: readString(input.sourceRevision, "sourceRevision"),
  }
  const records = imageReleaseServices.map((service) => ({
    image: manifest.images[service],
    sourceRevision: manifest.sourceRevision,
    service,
  }))
  createImageReleaseManifest(records)
  return manifest
}

export function readImageReleaseManifest(
  manifestPath: string
): ImageReleaseManifest {
  return parseImageReleaseManifest(
    JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown
  )
}

export function createAnsibleImageVariables(
  manifest: ImageReleaseManifest
): AnsibleImageVariables {
  const validated = parseImageReleaseManifest(manifest)
  return {
    writing_app_admin_image: validated.images.admin,
    writing_app_api_image: validated.images.api,
    writing_app_source_revision: validated.sourceRevision,
    writing_app_web_image: validated.images.web,
  }
}

function validateImageReleaseRecord(record: ImageReleaseRecord): void {
  const revisionErrors = validateRevision(record.sourceRevision)
  if (revisionErrors.length > 0) throw new Error(revisionErrors.join("\n"))
  readImagePrefix(record.image, record.service)
}

function readImagePrefix(
  imageReference: string,
  service: ImageReleaseService
): string {
  const match =
    /^(ghcr\.io\/[a-z0-9._-]+\/[a-z0-9._-]+)-(web|api|admin)@(sha256:[0-9a-f]{64})$/u.exec(
      imageReference
    )
  if (match === null || match[2] !== service) {
    throw new Error(
      `image reference는 ${service} service의 lowercase GHCR name@sha256 digest여야 합니다.`
    )
  }
  return match[1] ?? ""
}

function validateRevision(revision: string): readonly string[] {
  return /^[0-9a-f]{40}$/u.test(revision)
    ? []
    : ["source revision은 40자리 lowercase Git SHA여야 합니다."]
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

function isImageDigest(value: string): boolean {
  return /^sha256:[0-9a-f]{64}$/u.test(value)
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

function readService(value: unknown, label: string): ImageReleaseService {
  if (
    typeof value !== "string" ||
    !imageReleaseServices.includes(value as ImageReleaseService)
  ) {
    throw new Error(`${label}가 올바르지 않습니다.`)
  }
  return value as ImageReleaseService
}

function assertExactKeys(
  input: JsonObject,
  expectedKeys: readonly string[]
): void {
  const actual = Object.keys(input).sort()
  const expected = [...expectedKeys].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`허용된 필드만 사용할 수 있습니다: ${expected.join(", ")}`)
  }
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

function readPublicOriginsFromEnvironment(): ImageReleasePublicOrigins {
  return {
    admin: requireEnvironment("PRODUCTION_ADMIN_ORIGIN"),
    productionAssets: requireEnvironment(
      "PRODUCTION_CONTENT_ASSET_PUBLIC_BASE_URL"
    ),
    stagingAssets: requireEnvironment("STAGING_CONTENT_ASSET_PUBLIC_BASE_URL"),
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

function writeJson(outputPath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`)
}

function runPreflight(): void {
  const repository = requireEnvironment("GITHUB_REPOSITORY")
  const revision = requireEnvironment("IMAGE_RELEASE_REVISION")
  const errors = validateImageReleaseInputs({
    publicOrigins: readPublicOriginsFromEnvironment(),
    repository,
    revision,
  })
  if (errors.length > 0) throw new Error(errors.join("\n"))

  appendGitHubOutput("image-prefix", createImagePrefix(repository))
  appendGitHubOutput("release-tag", `sha-${revision}`)
  console.log(
    `Image release 입력과 source revision ${revision}을 확인했습니다.`
  )
}

function runWriteRecord(): void {
  const record = createImageReleaseRecord({
    digest: requireEnvironment("IMAGE_RELEASE_DIGEST"),
    repository: requireEnvironment("GITHUB_REPOSITORY"),
    revision: requireEnvironment("IMAGE_RELEASE_REVISION"),
    service: requireEnvironment("IMAGE_RELEASE_SERVICE") as ImageReleaseService,
  })
  const outputPath = requireEnvironment("IMAGE_RELEASE_OUTPUT")
  writeJson(outputPath, record)
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
  writeJson(outputPath, manifest)
  console.log(`세 image digest manifest를 생성했습니다: ${outputPath}`)
}

function runWriteAnsibleVariables(
  manifestPath: string,
  outputPath: string
): void {
  writeJson(
    outputPath,
    createAnsibleImageVariables(readImageReleaseManifest(manifestPath))
  )
  console.log(
    `검증된 release digest를 Ansible 변수로 변환했습니다: ${outputPath}`
  )
}

function runImageReleaseMetadataCommand(): void {
  switch (process.argv[2]) {
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
    case "write-ansible-vars":
      runWriteAnsibleVariables(
        process.argv[3] ?? "output/image-release-manifest.json",
        process.argv[4] ?? "infra/ansible/release-vars.json"
      )
      return
    default:
      throw new Error(
        "preflight, write-record, aggregate 또는 write-ansible-vars 명령을 사용해야 합니다."
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
