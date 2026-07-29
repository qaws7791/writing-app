import { z } from "zod"

/**
 * 브랜드 식별자 wire 스키마의 정본. 저장된 값의 형식과 길이를 경계에서 한 번만 정의한다.
 */
const identifierSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)

export function createIdentifierSchema<TId extends string>() {
  return identifierSchema.transform((value): TId => value as TId)
}
