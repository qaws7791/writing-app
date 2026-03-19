import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const apiEnv = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    API_DATABASE_PATH: z.string().min(1),
    API_DEV_USER_ID: z.string().min(1),
    API_DEV_USER_NICKNAME: z.string().min(1),
    API_PORT: z.coerce.number().int().min(1).max(65535),
  },
})
