import { readFileSync, writeFileSync } from "fs"
import { globSync } from "glob"

const srcDir = "packages/backend-core/src"
const pattern = /from\s+(["'](\.\.?\/[^"']*?)\.js\2)/g

let filesModified = 0
let totalImportsFixed = 0
const changesByFile = new Map<string, number>()

const files = globSync(`${srcDir}/**/*.ts`)
console.log(`총 파일 수: ${files.length}`)

for (const file of files) {
  try {
    const content = readFileSync(file, "utf-8")
    const matches = [...content.matchAll(pattern)]

    if (matches.length > 0) {
      const newContent = content.replace(pattern, `from $2`)
      writeFileSync(file, newContent, "utf-8")

      filesModified++
      totalImportsFixed += matches.length
      changesByFile.set(file, matches.length)
    }
  } catch (error) {
    console.error(`오류 ${file}: ${(error as Error).message}`)
  }
}

console.log(`\n✅ 작업 완료:`)
console.log(`- 수정된 파일: ${filesModified}개`)
console.log(`- 제거된 .js 확장자: ${totalImportsFixed}개`)

if (changesByFile.size > 0) {
  console.log(`\n수정된 파일 목록:`)
  for (const [file, count] of changesByFile) {
    console.log(`  ${file}: ${count}개 import 수정`)
  }
}
