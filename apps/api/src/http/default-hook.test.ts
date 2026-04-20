import { describe, expect, test } from "vitest"
import { ValidationError } from "@workspace/core"
import { z } from "zod"

import { createDefaultHook } from "./default-hook"

describe("createDefaultHook", () => {
  test("zod 검증 실패를 ValidationError로 변환한다", () => {
    const result = z
      .object({
        items: z.array(
          z.object({
            title: z.string().min(1, "제목은 비어 있을 수 없습니다."),
          })
        ),
      })
      .safeParse({
        items: [{ title: "" }],
      })

    if (result.success) {
      throw new Error("검증 실패 결과가 필요합니다.")
    }

    const hook = createDefaultHook()

    let thrownError: unknown

    try {
      hook(
        {
          error: result.error,
          success: false,
          target: "json",
        },
        undefined as never
      )
    } catch (error) {
      thrownError = error
    }

    expect(thrownError).toBeInstanceOf(ValidationError)
    expect(thrownError).toMatchObject({
      details: [
        {
          message: "제목은 비어 있을 수 없습니다.",
          path: "items.0.title",
        },
      ],
      message: "유효하지 않은 요청입니다.",
    })
  })
})
