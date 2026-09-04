import { resolve } from "node:path"

import {
  hasAuthoringErrors,
  validateAuthoringLessonSteps,
  validateAuthoringWorkOrdersFromFiles,
  type AuthoringValidationIssue,
} from "@workspace/content/authoring"
import { validateSeed } from "@workspace/content/seed-data"

const repositoryRoot = resolve(import.meta.dir, "..")

async function main(): Promise<void> {
  const [command, ...rest] = Bun.argv.slice(2)

  if (command === "lesson") {
    await validateLessonCommand(rest)
    return
  }

  if (command === "work-orders") {
    await validateWorkOrdersCommand(rest)
    return
  }

  if (command === "seed") {
    await validateSeedCommand(rest)
    return
  }

  printUsage()
  process.exit(1)
}

async function validateLessonCommand(args: readonly string[]): Promise<void> {
  const [targetPath] = args
  if (targetPath === undefined) {
    printUsage()
    process.exit(1)
  }
  if (args.length > 1) {
    console.error(`알 수 없는 인자: ${args.slice(1).join(" ")}`)
    process.exit(1)
  }

  const { lessonId, steps } = await readLessonFile(targetPath)
  const issues = validateAuthoringLessonSteps({ lessonId, steps })
  reportIssues(lessonId, issues)
}

async function validateWorkOrdersCommand(
  args: readonly string[]
): Promise<void> {
  const [workOrdersPath, ...rest] = args
  if (workOrdersPath === undefined) {
    printUsage()
    process.exit(1)
  }

  let lessonsRoot = resolve(repositoryRoot, dirname(workOrdersPath))
  const lessonIds: string[] = []

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]
    if (arg === "--lessons-root") {
      const value = rest[index + 1]
      if (value === undefined) {
        console.error("--lessons-root 값이 없습니다.")
        process.exit(1)
      }
      lessonsRoot = resolve(repositoryRoot, value)
      index += 1
      continue
    }
    lessonIds.push(arg)
  }

  const absoluteWorkOrdersPath = resolve(repositoryRoot, workOrdersPath)
  const issues = await validateAuthoringWorkOrdersFromFiles({
    lessonIds: lessonIds.length > 0 ? lessonIds : undefined,
    lessonsRoot,
    workOrdersPath: absoluteWorkOrdersPath,
  })
  reportIssues(workOrdersPath, issues)
}

async function validateSeedCommand(args: readonly string[]): Promise<void> {
  const authoringCourseIds: string[] = []

  for (const arg of args) {
    if (arg.startsWith("--course=")) {
      authoringCourseIds.push(arg.slice("--course=".length))
      continue
    }
    console.error(`알 수 없는 인자: ${arg}`)
    process.exit(1)
  }

  try {
    await validateSeed(
      authoringCourseIds.length > 0 ? { authoringCourseIds } : undefined
    )
  } catch (cause) {
    console.error(String(cause))
    process.exit(1)
  }

  console.log("통과 content-seed-data.json")
}

async function readLessonFile(
  targetPath: string
): Promise<{ lessonId: string; steps: unknown }> {
  const absolutePath = resolve(repositoryRoot, targetPath)
  const file = Bun.file(absolutePath)
  if (!(await file.exists())) {
    console.error(`파일이 없습니다: ${absolutePath}`)
    process.exit(1)
  }

  let steps: unknown
  try {
    steps = await file.json()
  } catch (cause) {
    console.error(`JSON 파싱 실패: ${String(cause)}`)
    process.exit(1)
  }

  const lessonId = absolutePath
    .split(/[/\\]/u)
    .at(-1)
    ?.replace(/\.json$/u, "")
  if (lessonId === undefined || lessonId.length === 0) {
    console.error("레슨 ID를 파일 이름에서 찾을 수 없습니다.")
    process.exit(1)
  }

  return { lessonId, steps }
}

function dirname(path: string): string {
  const segments = path.split(/[/\\]/u)
  segments.pop()
  return segments.join("/")
}

function reportIssues(
  label: string,
  issues: readonly AuthoringValidationIssue[]
): void {
  const warnings = issues.filter((issue) => issue.severity === "warning")
  const errors = issues.filter((issue) => issue.severity === "error")

  for (const issue of warnings) {
    console.warn(`경고 ${issue.path}: ${issue.message}`)
  }

  if (hasAuthoringErrors(issues)) {
    for (const issue of errors) {
      console.error(`${issue.path}: ${issue.message}`)
    }
    console.error(`\n실패 ${errors.length}건, 경고 ${warnings.length}건`)
    process.exit(1)
  }

  console.log(`통과 ${label} (경고 ${warnings.length}건)`)
}

function printUsage(): void {
  console.error(`사용법:
  bun run content:validate -- lesson <레슨-json-경로>
  bun run content:validate -- work-orders <work-orders-json-경로> [--lessons-root <디렉터리>] [<레슨-id>...]
  bun run content:validate -- seed [--course=<코스-id>...]

오류는 병합을 막고, 경고는 리뷰어가 판정한다.
시드 교체 코스는 --course로 집필 검사를 통과해야 한다.

예:
  bun run content:validate -- lesson content-authoring/lead-magnet/courses/course-01-spelling/lesson-spelling-roseo.json
  bun run content:validate -- work-orders content-authoring/lead-magnet/work-orders.json
  bun run content:validate -- seed`)
}

await main()
