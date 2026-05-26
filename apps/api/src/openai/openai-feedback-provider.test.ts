import { describe, expect, it, vi } from "vitest"

import { createOpenAiFeedbackProvider } from "@/openai/openai-feedback-provider"

describe("createOpenAiFeedbackProvider", () => {
  it("requests structured AI feedback from OpenAI", async () => {
    const parse = vi.fn(async (_input: unknown) => ({
      output_parsed: {
        improvements: ["근거를 더 구체화하세요."],
        nextAction: "첫 문장에 기준을 추가하세요.",
        score: 4,
        scoreRange: [0, 5] as [number, number],
        strengths: ["핵심 문장이 분명합니다."],
        summary: "문장의 목적은 잘 드러납니다.",
      },
    }))

    const provider = createOpenAiFeedbackProvider({
      client: { responses: { parse } },
      model: "gpt-5-mini",
    })

    const result = await provider.createFeedback({
      answer: "문장의 기준을 먼저 세운다.",
      criteria: "명확성",
      focusAreas: ["clarity"],
      prompt: "답변을 평가합니다.",
      scoreRange: [0, 5],
    })

    expect(result.score).toBe(4)
    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-mini",
      })
    )
    const request = parse.mock.calls[0]?.[0] as {
      text?: {
        format?: {
          schema?: {
            properties?: {
              scoreRange?: {
                items?: unknown
                maxItems?: number
                minItems?: number
              }
            }
          }
        }
      }
    }
    const scoreRangeSchema =
      request.text?.format?.schema?.properties?.scoreRange

    expect(Array.isArray(scoreRangeSchema?.items)).toBe(false)
    expect(scoreRangeSchema).toMatchObject({
      maxItems: 2,
      minItems: 2,
    })
  })
})
