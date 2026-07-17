import { createHash } from "node:crypto"
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

import { courseVisualKeyValues } from "@workspace/contracts/content"

const expectedFileNames = courseVisualKeyValues
  .map((visualKey) => `${visualKey}.png`)
  .toSorted()

export async function validateCourseThumbnailAssets(
  repositoryRoot: string
): Promise<readonly string[]> {
  const canonicalDirectory = path.join(
    repositoryRoot,
    "apps",
    "web",
    "public",
    "course-thumbnails"
  )
  const adminDirectory = path.join(
    repositoryRoot,
    "apps",
    "admin",
    "public",
    "course-thumbnails"
  )
  const errors: string[] = []

  let adminFileNames: readonly string[] = []
  try {
    adminFileNames = (await readdir(adminDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .toSorted()
  } catch (error) {
    errors.push(
      `Admin 썸네일 디렉터리를 읽지 못했습니다: ${formatError(error)}`
    )
    return errors
  }

  if (!sameValues(adminFileNames, expectedFileNames)) {
    errors.push(
      `Admin 썸네일 파일은 CourseVisualKey 5개와 정확히 같아야 합니다. expected=${expectedFileNames.join(",")} actual=${adminFileNames.join(",")}`
    )
  }

  for (const fileName of expectedFileNames) {
    const canonicalPath = path.join(canonicalDirectory, fileName)
    const adminPath = path.join(adminDirectory, fileName)

    try {
      const canonicalStat = await stat(canonicalPath)
      if (!canonicalStat.isFile()) {
        errors.push(`Canonical 썸네일이 파일이 아닙니다: ${fileName}`)
        continue
      }

      const [canonicalBytes, adminBytes] = await Promise.all([
        readFile(canonicalPath),
        readFile(adminPath),
      ])
      if (digest(canonicalBytes) !== digest(adminBytes)) {
        errors.push(`Canonical/Admin 썸네일 hash가 다릅니다: ${fileName}`)
      }
    } catch (error) {
      errors.push(`${fileName} 검증에 실패했습니다: ${formatError(error)}`)
    }
  }

  return errors
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex")
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sameValues(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  )
}

if (import.meta.main) {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const errors = await validateCourseThumbnailAssets(repositoryRoot)

  if (errors.length > 0) {
    console.error(errors.map((error) => `- ${error}`).join("\n"))
    process.exitCode = 1
  } else {
    console.log(
      "Admin 코스 썸네일 5개의 파일 집합과 SHA-256 동기화를 확인했습니다."
    )
  }
}
