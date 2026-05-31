import { describe, expect, it, vi } from "vitest"
import { APIConnectionTimeoutError } from "openai/core/error"

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

    expect(result).toMatchObject({
      status: "ok",
      value: {
        score: 4,
      },
    })
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

  it("classifies invalid structured output as a provider response error", async () => {
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          parse: vi.fn(async () => ({
            output_parsed: {
              summary: "",
            },
          })),
        },
      },
      model: "gpt-5-mini",
    })

    const result = await provider.createFeedback({
      answer: "문장의 기준을 먼저 세운다.",
      criteria: "명확성",
      focusAreas: ["clarity"],
      prompt: "답변을 평가합니다.",
      scoreRange: [0, 5],
    })

    expect(result).toEqual({
      kind: "provider-invalid-response",
      status: "error",
    })
  })

  it("classifies provider rate limits without throwing", async () => {
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          parse: vi.fn(async () => {
            throw { status: 429 }
          }),
        },
      },
      model: "gpt-5-mini",
    })

    const result = await provider.createFeedback({
      answer: "문장의 기준을 먼저 세운다.",
      criteria: "명확성",
      focusAreas: ["clarity"],
      prompt: "답변을 평가합니다.",
      scoreRange: [0, 5],
    })

    expect(result).toEqual({
      kind: "rate-limited",
      status: "error",
    })
  })

  it("classifies provider request errors without throwing", async () => {
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          parse: vi.fn(async () => {
            throw { status: 400 }
          }),
        },
      },
      model: "gpt-5-mini",
    })

    const result = await provider.createFeedback({
      answer: "문장의 기준을 먼저 세운다.",
      criteria: "명확성",
      focusAreas: ["clarity"],
      prompt: "답변을 평가합니다.",
      scoreRange: [0, 5],
    })

    expect(result).toEqual({
      kind: "provider-invalid-request",
      status: "error",
    })
  })

  it("classifies provider timeouts without throwing", async () => {
    const provider = createOpenAiFeedbackProvider({
      client: {
        responses: {
          parse: vi.fn(async () => {
            throw new APIConnectionTimeoutError()
          }),
        },
      },
      model: "gpt-5-mini",
    })

    const result = await provider.createFeedback({
      answer: "문장의 기준을 먼저 세운다.",
      criteria: "명확성",
      focusAreas: ["clarity"],
      prompt: "답변을 평가합니다.",
      scoreRange: [0, 5],
    })

    expect(result).toEqual({
      kind: "timeout",
      status: "error",
    })
  })
})
