import { z } from "@hono/zod-openapi"

export { z } from "@hono/zod-openapi"

export function jsonResponse(description: string, schema: z.ZodType) {
  return {
    content: { "application/json": { schema } },
    description,
  }
}

export function eventStreamResponse(description: string) {
  return {
    content: { "text/event-stream": { schema: z.string() } },
    description,
  }
}

export function markdownResponse(description: string) {
  return {
    content: { "text/markdown": { schema: z.string() } },
    description,
  }
}

export function multipartRequestBody<const TSchema extends z.ZodType>(
  schema: TSchema
) {
  return { content: { "multipart/form-data": { schema } } }
}
