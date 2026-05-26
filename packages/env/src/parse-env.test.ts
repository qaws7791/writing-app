import { describe, expect, it } from "vitest"
import { z } from "zod"

import { EnvParseError, formatEnvIssues, parseEnv } from "@/parse-env"

describe("parseEnv", () => {
  it("returns typed parsed values from a Zod schema", () => {
    const env = parseEnv({
      schema: z.object({
        DATABASE_URL: z.string().min(1),
        PORT: z.coerce.number().int().positive().default(4000),
      }),
      runtimeEnv: {
        DATABASE_URL: "file:data/api.sqlite",
        PORT: "4100",
      },
    })

    expect(env).toEqual({
      DATABASE_URL: "file:data/api.sqlite",
      PORT: 4100,
    })
  })

  it("normalizes empty strings to undefined by default", () => {
    const env = parseEnv({
      schema: z.object({
        PORT: z.coerce.number().int().positive().default(4000),
      }),
      runtimeEnv: {
        PORT: "",
      },
    })

    expect(env.PORT).toBe(4000)
  })

  it("keeps empty strings when emptyStringAsUndefined is false", () => {
    const env = parseEnv({
      schema: z.object({
        OPTIONAL_LABEL: z.string(),
      }),
      runtimeEnv: {
        OPTIONAL_LABEL: "",
      },
      emptyStringAsUndefined: false,
    })

    expect(env.OPTIONAL_LABEL).toBe("")
  })

  it("accepts strict runtime env values", () => {
    const env = parseEnv({
      schema: z.object({
        NEXT_PUBLIC_API_URL: z.string().url(),
      }),
      runtimeEnvStrict: {
        NEXT_PUBLIC_API_URL: "https://example.com",
      },
    })

    expect(env.NEXT_PUBLIC_API_URL).toBe("https://example.com")
  })

  it("throws EnvParseError when validation fails", () => {
    expect(() =>
      parseEnv({
        schema: z.object({
          DATABASE_URL: z.string().min(1),
        }),
        runtimeEnv: {},
      })
    ).toThrow(EnvParseError)
  })

  it("formats issues without adding environment variable values", () => {
    try {
      parseEnv({
        schema: z.object({
          OPENAI_API_KEY: z.string().min(20),
        }),
        runtimeEnv: {
          OPENAI_API_KEY: "secret-short-value",
        },
      })
    } catch (error) {
      expect(error).toBeInstanceOf(EnvParseError)

      const envError = error as EnvParseError

      expect(envError.message).toContain("OPENAI_API_KEY")
      expect(envError.message).not.toContain("secret-short-value")
      expect(formatEnvIssues(envError.issues)).not.toContain(
        "secret-short-value"
      )
    }
  })

  it("allows callers to replace validation error handling", () => {
    class ApiEnvError extends Error {}

    expect(() =>
      parseEnv({
        schema: z.object({
          DATABASE_URL: z.string().min(1),
        }),
        runtimeEnv: {},
        onValidationError: (error) => {
          throw new ApiEnvError(error.message)
        },
      })
    ).toThrow(ApiEnvError)
  })

  it("freezes the returned env object", () => {
    const env = parseEnv({
      schema: z.object({
        PORT: z.coerce.number().default(4000),
      }),
      runtimeEnv: {},
    })

    expect(Object.isFrozen(env)).toBe(true)
  })
})
