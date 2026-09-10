import { z } from "zod"

export function createIndexedSubstringQuerySchema(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .refine((value) => value.length === 0 || [...value].length >= 3, {
      message: "검색어는 비어 있거나 3자 이상이어야 합니다.",
    })
}
