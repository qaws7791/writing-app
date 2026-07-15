import fs from "node:fs"
import path from "node:path"

interface ContainerImageLockEntry {
  readonly name: string
  readonly reference: string
  readonly uses: readonly string[]
}

export interface ContainerImageLock {
  readonly images: readonly ContainerImageLockEntry[]
  readonly platform: "linux/amd64"
  readonly schemaVersion: 1
  readonly verifiedOn: string
}

type SourceReader = (relativePath: string) => string

export function parseContainerImageLock(input: unknown): ContainerImageLock {
  if (!isObject(input))
    throw new Error("container image lock은 객체여야 합니다.")
  if (input.schemaVersion !== 1 || input.platform !== "linux/amd64") {
    throw new Error(
      "container image lock은 schemaVersion 1과 linux/amd64여야 합니다."
    )
  }
  if (
    typeof input.verifiedOn !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/u.test(input.verifiedOn)
  ) {
    throw new Error("container image lock verifiedOn은 YYYY-MM-DD여야 합니다.")
  }
  if (!Array.isArray(input.images) || input.images.length === 0) {
    throw new Error("container image lock에는 image가 필요합니다.")
  }
  return {
    images: input.images.map((entry, index) => parseEntry(entry, index)),
    platform: "linux/amd64",
    schemaVersion: 1,
    verifiedOn: input.verifiedOn,
  }
}

export function validateContainerImageLock(
  lock: ContainerImageLock,
  readSource: SourceReader
): readonly string[] {
  const errors: string[] = []
  const names = new Set<string>()
  const references = new Set<string>()

  for (const image of lock.images) {
    if (names.has(image.name))
      errors.push(`${image.name}: image 이름이 중복됐습니다.`)
    if (references.has(image.reference)) {
      errors.push(`${image.name}: image reference가 중복됐습니다.`)
    }
    names.add(image.name)
    references.add(image.reference)

    if (
      !/^[^\s:@]+(?:\/[^\s:@]+)*:[^\s@]+@sha256:[0-9a-f]{64}$/u.test(
        image.reference
      )
    ) {
      errors.push(`${image.name}: tag와 sha256 digest가 모두 필요합니다.`)
    }
    if (
      image.uses.length === 0 ||
      new Set(image.uses).size !== image.uses.length
    ) {
      errors.push(`${image.name}: use 경로가 없거나 중복됐습니다.`)
    }

    const tagReference = image.reference.split("@sha256:")[0] ?? ""
    const mutablePattern = new RegExp(
      `${escapeRegExp(tagReference)}(?!@sha256:)`,
      "u"
    )
    for (const usePath of image.uses) {
      let source: string
      try {
        source = readSource(usePath)
      } catch {
        errors.push(`${image.name}: ${usePath}을(를) 읽을 수 없습니다.`)
        continue
      }
      if (!source.includes(image.reference)) {
        errors.push(`${image.name}: ${usePath}에 고정 reference가 없습니다.`)
      }
      if (mutablePattern.test(source)) {
        errors.push(
          `${image.name}: ${usePath}에 tag-only reference가 있습니다.`
        )
      }
    }
  }
  return errors
}

function parseEntry(input: unknown, index: number): ContainerImageLockEntry {
  if (!isObject(input)) throw new Error(`images[${index}]은 객체여야 합니다.`)
  if (
    typeof input.name !== "string" ||
    typeof input.reference !== "string" ||
    !Array.isArray(input.uses) ||
    !input.uses.every((value) => typeof value === "string")
  ) {
    throw new Error(
      `images[${index}]의 name, reference, uses가 올바르지 않습니다.`
    )
  }
  return {
    name: input.name,
    reference: input.reference,
    uses: input.uses as string[],
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
}

function runContainerImageLockCheck(): void {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const lockPath = path.join(
    repositoryRoot,
    "deploy",
    "security",
    "container-image-lock.json"
  )
  const lock = parseContainerImageLock(
    JSON.parse(fs.readFileSync(lockPath, "utf8")) as unknown
  )
  const errors = validateContainerImageLock(lock, (relativePath) =>
    fs.readFileSync(path.join(repositoryRoot, relativePath), "utf8")
  )
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log(
    `${lock.images.length}개 container image가 ${lock.platform} digest로 고정됐습니다.`
  )
}

if (import.meta.main) runContainerImageLockCheck()
