import { resolve } from "node:path"

import { mergeAuthoringIntoSeed } from "@workspace/content/authoring"

const repositoryRoot = resolve(import.meta.dir, "..")
const defaultSeedPath = resolve(
  repositoryRoot,
  "packages/modules/content/src/infrastructure/persistence/content-seed-data.json"
)

async function main(): Promise<void> {
  const [courseId, lessonsDirectory, ...rest] = Bun.argv.slice(2)
  if (courseId === undefined || lessonsDirectory === undefined) {
    printUsage()
    process.exit(1)
  }

  let seedPath = defaultSeedPath
  let dryRun = false

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]
    if (arg === "--dry-run") {
      dryRun = true
      continue
    }
    if (arg === "--seed-path") {
      const value = rest[index + 1]
      if (value === undefined) {
        console.error("--seed-path 값이 없습니다.")
        process.exit(1)
      }
      seedPath = resolve(repositoryRoot, value)
      index += 1
      continue
    }
    console.error(`알 수 없는 인자: ${arg}`)
    process.exit(1)
  }

  const result = await mergeAuthoringIntoSeed({
    courseId,
    dryRun,
    lessonsDirectory: resolve(repositoryRoot, lessonsDirectory),
    seedPath,
  })

  if (!result.ok) {
    for (const issue of result.issues) {
      console.error(`${issue.path}: ${issue.message}`)
    }
    console.error(`\n실패 ${result.issues.length}건`)
    process.exit(1)
  }

  console.log(
    `병합한 레슨 ${result.result.mergedLessonIds.length}개, 스텝 ${result.result.mergedStepCount}개`
  )
  console.log(`건너뛴 레슨 ${result.result.skippedLessonCount}개`)
  if (!dryRun) {
    console.log(
      "시드 파일을 저장했습니다. 필요하면 `bun oxfmt packages/modules/content/src/infrastructure/persistence/content-seed-data.json`을 실행하세요."
    )
  }
}

function printUsage(): void {
  console.error(`사용법:
  bun run content:merge -- <코스-id> <레슨-디렉터리> [--seed-path <시드-경로>] [--dry-run]

예:
  bun run content:merge -- course-01-spelling content-authoring/lead-magnet/courses/course-01-spelling --dry-run`)
}

await main()
