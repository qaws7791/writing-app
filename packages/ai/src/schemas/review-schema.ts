import { z } from "zod"

export const reviewItemOutputSchema = z.object({
  items: z.array(
    z.object({
      type: z.enum(["spelling", "duplicate", "flow"]).describe("오류 유형"),
      from: z.number().int().describe("오류 시작 위치 (문단 기준 절대 위치)"),
      to: z.number().int().describe("오류 끝 위치 (문단 기준 절대 위치)"),
      original: z.string().describe("원본 텍스트"),
      suggestion: z.string().describe("교정된 텍스트 (flow는 빈 문자열)"),
      reason: z.string().describe("교정 이유를 간결한 한국어로"),
    })
  ),
})

export type ReviewItemOutput = z.infer<typeof reviewItemOutputSchema>
