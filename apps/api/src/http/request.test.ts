import { z } from "zod"
import { ValidationError } from "@workspace/application"

import { parseJsonBody, parseValue } from "./request.js"

describe("parseJsonBody", () => {
  test("returns parsed json when body matches schema", async () => {
    const result = await parseJsonBody(
      {
        req: {
          json: async () => ({ title: "초안" }),
        },
      } as never,
      z.object({
        title: z.string(),
      })
    )

    expect(result).toEqual({
      title: "초안",
    })
  })

  test("throws validation error when body shape is invalid", async () => {
    await expect(
      parseJsonBody(
        {
          req: {
            json: async () => ({ title: 123 }),
          },
        } as never,
        z.object({
          title: z.string(),
        })
      )
    ).rejects.toBeInstanceOf(ValidationError)
  })
})

describe("parseValue", () => {
  test("returns parsed query or path values", () => {
    const result = parseValue(z.coerce.number().int().positive(), "3")

    expect(result).toBe(3)
  })

  test("throws validation error for invalid scalar values", () => {
    expect(() =>
      parseValue(z.coerce.number().int().positive(), "zero")
    ).toThrow(ValidationError)
  })
})
