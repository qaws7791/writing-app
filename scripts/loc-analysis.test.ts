import { describe, expect, test } from "vitest"

import {
  aggregateLocDirectories,
  aggregateLocMetrics,
  aggregateLocOwners,
  assignLocOwners,
  classifyLocFile,
  medianAbsoluteDeviation,
  normalizeLocPath,
  parseSccCsv,
  quantile,
  serializeCsv,
  type SccFileRecord,
} from "#scripts/loc-analysis"

describe("scc CSV 해석", () => {
  test("Windows 경로와 quoted field를 정규화한다", () => {
    const records = parseSccCsv(
      [
        "Language,Provider,Filename,Lines,Code,Comments,Blanks,Complexity,Bytes,ULOC",
        'TypeScript,"apps\\web\\src\\comma,file.ts","comma,file.ts",10,7,1,2,3,100,0',
      ].join("\r\n")
    )

    expect(records).toEqual([
      {
        blanks: 2,
        bytes: 100,
        code: 7,
        comments: 1,
        complexity: 3,
        files: 1,
        language: "TypeScript",
        lines: 10,
        path: "apps/web/src/comma,file.ts",
      },
    ])
  })

  test("중복 경로와 잘못된 정수는 거부한다", () => {
    const header =
      "Language,Provider,Filename,Lines,Code,Comments,Blanks,Complexity,Bytes,ULOC"

    expect(() =>
      parseSccCsv(
        [
          header,
          "TypeScript,a.ts,a.ts,1,1,0,0,0,1,0",
          "TypeScript,a.ts,a.ts,1,1,0,0,0,1,0",
        ].join("\n")
      )
    ).toThrow("중복 경로")
    expect(() =>
      parseSccCsv(
        [header, "TypeScript,a.ts,a.ts,1,not-a-number,0,0,0,1,0"].join("\n")
      )
    ).toThrow("Code 값이 정수가 아닙니다")
  })
})

describe("LOC 파일 분류", () => {
  test("generated, fixture와 test 우선순위를 보존한다", () => {
    expect(
      classifyLocFile(
        "scripts/fixtures/dependency-cruiser/example.test.ts",
        "TypeScript"
      )
    ).toBe("fixture/test-support")
    expect(classifyLocFile("apps/api/drizzle/0001.test.sql", "SQL")).toBe(
      "migration/generated"
    )
    expect(
      classifyLocFile(
        "apps/api/src/db/legacy-curriculum-migration.ts",
        "TypeScript"
      )
    ).toBe("migration/generated")
    expect(
      classifyLocFile(
        "apps/api/src/db/legacy-curriculum-migration.test.ts",
        "TypeScript"
      )
    ).toBe("test/typecheck")
    expect(
      classifyLocFile(
        "packages/shared/types/src/ids.typecheck.ts",
        "TypeScript"
      )
    ).toBe("test/typecheck")
    expect(
      classifyLocFile("apps/storybook/src/a.stories.tsx", "TypeScript")
    ).toBe("story")
  })

  test("문서, 설정과 source를 분리한다", () => {
    expect(classifyLocFile("docs/engineering/testing.md", "Markdown")).toBe(
      "docs"
    )
    expect(classifyLocFile("apps/web/next.config.ts", "TypeScript")).toBe(
      "config/operations"
    )
    expect(
      classifyLocFile(
        "packages/modules/learning/src/domain/lesson.ts",
        "TypeScript"
      )
    ).toBe("source")
  })
})

describe("LOC 소유권과 계층 집계", () => {
  const records: readonly SccFileRecord[] = [
    file("apps/web/src/page.tsx", 100, 10),
    file("apps/web/src/page.test.tsx", 50, 5),
    file("packages/modules/learning/src/domain/lesson.ts", 80, 8),
    file("scripts/check.ts", 40, 4),
  ]
  const files = assignLocOwners(records, [
    { directory: "apps/web", name: "@workspace/web" },
    {
      directory: "packages/modules/learning",
      name: "@workspace/learning",
    },
  ])

  test("workspace와 비-workspace 경계를 정확히 한 번 지정한다", () => {
    expect(
      files.map(({ category, ownerDirectory, ownerKind }) => ({
        category,
        ownerDirectory,
        ownerKind,
      }))
    ).toEqual([
      {
        category: "source",
        ownerDirectory: "apps/web",
        ownerKind: "app",
      },
      {
        category: "test/typecheck",
        ownerDirectory: "apps/web",
        ownerKind: "app",
      },
      {
        category: "source",
        ownerDirectory: "packages/modules/learning",
        ownerKind: "module",
      },
      {
        category: "source",
        ownerDirectory: "scripts",
        ownerKind: "repository",
      },
    ])
  })

  test("file, directory와 owner 합계를 보존한다", () => {
    const total = aggregateLocMetrics(files)
    const directories = aggregateLocDirectories(files)
    const owners = aggregateLocOwners(files)

    expect(total.code).toBe(270)
    expect(
      directories.find((directory) => directory.path === ".")?.metrics
    ).toEqual(total)
    expect(owners.reduce((sum, owner) => sum + owner.metrics.code, 0)).toBe(
      total.code
    )
    expect(
      owners.find((owner) => owner.ownerDirectory === "apps/web")?.categories
    ).toMatchObject({
      source: { code: 100 },
      "test/typecheck": { code: 50 },
    })
  })
})

describe("비교군 통계", () => {
  test("선형 quantile과 MAD를 결정적으로 계산한다", () => {
    expect(quantile([10, 20, 30, 40, 50], 0.9)).toBe(46)
    expect(medianAbsoluteDeviation([10, 20, 30, 40, 100])).toBe(10)
    expect(() => quantile([1], 1.1)).toThrow("0 이상 1 이하")
  })

  test("5개 이상 비교군에서 큰 owner만 peer outlier로 표시한다", () => {
    const records = [10, 10, 10, 10, 100].map((code, index) =>
      file(`packages/infra/p${index}/src/index.ts`, code, code / 10)
    )
    const owners = aggregateLocOwners(
      assignLocOwners(
        records,
        records.map((_, index) => ({
          directory: `packages/infra/p${index}`,
          name: `@workspace/p${index}`,
        }))
      )
    )

    expect(owners[0]?.reviewPriority).toBe("peer-outlier")
    expect(owners[0]?.cohortMedian).toBe(10)
    expect(owners[0]?.peerMedianRatio).toBe(10)
  })
})

test("CSV serializer는 구분자와 따옴표를 escape한다", () => {
  expect(
    serializeCsv([
      ["path", "value"],
      ["a,b.ts", 'say "hello"'],
    ])
  ).toBe('path,value\n"a,b.ts","say ""hello"""\n')
})

test("POSIX와 Windows 상대 경로를 같은 값으로 정규화한다", () => {
  expect(normalizeLocPath(".\\apps\\\\web\\src\\page.tsx")).toBe(
    "apps/web/src/page.tsx"
  )
})

function file(path: string, code: number, complexity: number): SccFileRecord {
  return {
    blanks: 0,
    bytes: code * 10,
    code,
    comments: 0,
    complexity,
    files: 1,
    language: "TypeScript",
    lines: code,
    path,
  }
}
