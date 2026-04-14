import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    ADMIN_JWT_SECRET: z.string().min(32),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,
  },
})
