import { z } from "zod"
import { err, ok } from "@workspace/kernel/result"
import type { WritingCheckProvider } from "#writing/application/ports/writing-ports"
import { parseWritingCheckResult } from "#writing/domain/writing-check"

const writingCheckJsonSchema = {
  additionalProperties: false,
  properties: {
    revisions: {
      items: {
        additionalProperties: false,
        properties: {
          example: { minLength: 1, type: "string" },
          location: { minLength: 1, type: "string" },
          quote: { minLength: 1, type: "string" },
          reason: { minLength: 1, type: "string" },
        },
        required: ["example", "location", "quote", "reason"],
        type: "object",
      },
      maxItems: 3,
      type: "array",
    },
    strengths: {
      items: { minLength: 1, type: "string" },
      maxItems: 2,
      minItems: 1,
      type: "array",
    },
    unmetRequirements: {
      items: { minLength: 1, type: "string" },
      type: "array",
    },
  },
  required: ["revisions", "strengths", "unmetRequirements"],
  type: "object",
} as const

const completionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().min(1) }) }))
    .min(1),
})
export function createWorkersAiWritingCheckProvider(
  ai: Ai
): WritingCheckProvider {
  return {
    async check(command) {
      try {
        const completion = completionSchema.parse(
          await ai.run(
            "@cf/qwen/qwen3-30b-a3b-fp8",
            {
              messages: [
                {
                  content: [
                    "당신은 한국어 쓰기 과제 점검자입니다.",
                    "과제 필수 요소를 중심으로 현재 본문만 평가합니다.",
                    "글을 통째로 다시 쓰지 않습니다.",
                    "잘된 점은 1–2개, 과제 미충족이 있으면 적고, 고칠 일은 최대 3개입니다.",
                    "각 고칠 일은 짧은 위치 이름, 본문 인용 quote, 이유, 부분 수정 예문을 가집니다.",
                    "quote는 본문에 있는 대상 구절을 한 글자도 바꾸지 않고 그대로 복사합니다.",
                    "quote에는 줄바꿈을 넣지 않습니다.",
                  ].join(" "),
                  role: "system",
                },
                {
                  content: JSON.stringify({
                    audience: command.brief.audience,
                    body: command.body,
                    difficulty: command.brief.difficulty,
                    goalChars: command.brief.goalChars,
                    minChars: command.brief.minChars,
                    requiredElements: command.brief.requiredElements,
                    situation: command.brief.situation,
                    title: command.brief.title,
                    typeName: command.brief.typeName,
                  }),
                  role: "user",
                },
              ],
              max_tokens: 2000,
              response_format: {
                type: "json_schema",
                json_schema: writingCheckJsonSchema,
              },
            },
            { signal: AbortSignal.timeout(30_000) }
          )
        )
        const parsed = parseWritingCheckResult(
          JSON.parse(completion.choices[0]?.message.content ?? "") as unknown
        )
        return parsed === null ? err({ kind: "unavailable" }) : ok(parsed)
      } catch (cause) {
        return err({ cause, kind: "unavailable" })
      }
    },
  }
}
