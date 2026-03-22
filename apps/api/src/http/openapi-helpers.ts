import { errorResponseSchema } from "./error-schema"

export const defaultErrorResponse = {
  content: {
    "application/json": {
      schema: errorResponseSchema,
    },
  },
  description: "에러 응답",
} as const

export const jsonContent = <TSchema>(schema: TSchema) =>
  ({
    content: {
      "application/json": {
        schema,
      },
    },
  }) as const

export const bearerSecurity = [{ cookieAuth: [] }] as const
