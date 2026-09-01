import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const markdownPath = resolve(
  import.meta.dir,
  "../docs/product/lesson-step-templates.md"
)
const outputPath = resolve(
  import.meta.dir,
  "../packages/shared/contracts/src/content/authoring/lesson-templates.ts"
)

const markdown = await Bun.file(markdownPath).text()
const rowPattern =
  /\|\s*`([A-I]\d+)`\s*\|[^|]+\|\s*(\d+)\s*\|[^|]+\|\s*`([^`]+)`\s*\|/g

const entries: Array<{
  closing: string
  id: string
  layout: string[]
  stepCount: number
}> = []

for (const match of markdown.matchAll(rowPattern)) {
  const id = match[1]
  const stepCount = Number(match[2])
  const layout = match[3]?.trim().split(/\s+/) ?? []
  if (id === undefined || layout.length === 0) continue
  entries.push({
    closing: layout.at(-1) ?? "",
    id,
    layout,
    stepCount,
  })
}

if (entries.length !== 60) {
  throw new Error(`템플릿 60종을 찾지 못했습니다: ${entries.length}건`)
}

const body = entries
  .map(
    (entry) =>
      `  ${entry.id}: {\n    closing: "${entry.closing}",\n    layout: [${entry.layout.map((kind) => `"${kind}"`).join(", ")}],\n    stepCount: ${entry.stepCount},\n  }`
  )
  .join(",\n")

const source = `/** docs/product/lesson-step-templates.md에서 생성. 수동 편집하지 마세요. */
import { z } from "zod"

export const lessonTemplateKindValues = [
  "Cg",
  "Cp",
  "EC",
  "FB",
  "MC",
  "Mt",
  "Or",
  "Rd",
  "SB",
  "Sl",
  "TF",
] as const

export const lessonTemplateIdValues = [
${entries.map((entry) => `  "${entry.id}"`).join(",\n")},
] as const

export const lessonTemplateKindSchema = z.enum(lessonTemplateKindValues)
export const lessonTemplateIdSchema = z.enum(lessonTemplateIdValues)

export type LessonTemplateKind = z.infer<typeof lessonTemplateKindSchema>
export type LessonTemplateId = z.infer<typeof lessonTemplateIdSchema>

export type LessonTemplate = Readonly<{
  closing: LessonTemplateKind
  layout: readonly LessonTemplateKind[]
  stepCount: number
}>

export const lessonTemplates = {
${body},
} as const satisfies Record<LessonTemplateId, LessonTemplate>

export function getLessonTemplate(templateId: LessonTemplateId): LessonTemplate {
  return lessonTemplates[templateId]
}
`

writeFileSync(outputPath, source)
console.log(`Wrote ${entries.length} templates to ${outputPath}`)
