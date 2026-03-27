import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const webRuntimeEnv = z
  .object({
    NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_CLIENT_MODE: z.enum(["api", "local"]),
  })
  .superRefine((value, context) => {
    if (
      value.NEXT_PUBLIC_CLIENT_MODE === "api" &&
      !value.NEXT_PUBLIC_API_BASE_URL
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "NEXT_PUBLIC_API_BASE_URL is required when NEXT_PUBLIC_CLIENT_MODE=api.",
        path: ["NEXT_PUBLIC_API_BASE_URL"],
      })
    }
  })
  .parse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_CLIENT_MODE: process.env.NEXT_PUBLIC_CLIENT_MODE,
  })

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.url({
      error: "Invalid URL format for NEXT_PUBLIC_API_BASE_URL",
    }),
    NEXT_PUBLIC_CLIENT_MODE: z.enum(["api", "local"]),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: webRuntimeEnv.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_CLIENT_MODE: webRuntimeEnv.NEXT_PUBLIC_CLIENT_MODE,
  },
})
