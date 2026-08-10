import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server"
import { z, type ZodType } from "zod"

export function createAdminMcpSchema<TSchema extends ZodType>(
  schema: TSchema
): StandardSchemaWithJSON<z.input<TSchema>, z.output<TSchema>> {
  // Branded ID transform의 입력 스키마가 실제 JSON wire 계약이다.
  const jsonSchema = z.toJSONSchema(schema, {
    io: "input",
    target: "draft-2020-12",
  })

  return {
    "~standard": {
      ...schema["~standard"],
      jsonSchema: {
        input: () => jsonSchema,
        output: () => jsonSchema,
      },
      vendor: "writing-app-zod",
    },
  }
}
