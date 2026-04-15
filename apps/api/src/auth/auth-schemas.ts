import { z } from "@hono/zod-openapi"

export const authenticatedSessionSchema = z.object({
  createdAt: z.union([z.string(), z.date()]),
  expiresAt: z.union([z.string(), z.date()]),
  id: z.string(),
  ipAddress: z.string().nullable().optional(),
  token: z.string(),
  updatedAt: z.union([z.string(), z.date()]),
  userAgent: z.string().nullable().optional(),
  userId: z.string(),
})

export const authenticatedUserSchema = z.object({
  email: z.string(),
  emailVerified: z.boolean(),
  id: z.string(),
  image: z.string().nullable().optional(),
  name: z.string(),
})
