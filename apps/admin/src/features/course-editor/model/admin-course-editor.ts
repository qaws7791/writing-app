import { adminCourseEditorDocumentSchema } from "@workspace/contracts/content/admin-courses"
import type {
  getAdminCourseEditor,
  publishAdminCourse,
  uploadAdminContentAsset,
} from "@workspace/http-client/admin"

export type AdminCourseDetail = Awaited<ReturnType<typeof getAdminCourseEditor>>
export type AdminCoursePublishResult = Awaited<
  ReturnType<typeof publishAdminCourse>
>
export type AdminContentAsset = Awaited<
  ReturnType<typeof uploadAdminContentAsset>
>
export type AdminContentAssetKind = NonNullable<
  Parameters<typeof uploadAdminContentAsset>[1]
>["kind"]

export const adminCourseEditorSchema =
  adminCourseEditorDocumentSchema.transform(
    (document): AdminCourseDetail => omitUndefinedProperties(document)
  )

type WithoutUndefinedProperties<TValue> = TValue extends
  | boolean
  | null
  | number
  | string
  ? TValue
  : TValue extends undefined
    ? never
    : TValue extends readonly (infer TItem)[]
      ? WithoutUndefinedProperties<TItem>[]
      : TValue extends object
        ? {
            [TKey in keyof TValue as undefined extends TValue[TKey]
              ? never
              : TKey]: WithoutUndefinedProperties<TValue[TKey]>
          } & {
            [TKey in keyof TValue as undefined extends TValue[TKey]
              ? TKey
              : never]?: WithoutUndefinedProperties<
              Exclude<TValue[TKey], undefined>
            >
          }
        : TValue

/**
 * Zod optional 필드는 명시적 `undefined`도 허용하지만 generated DTO의
 * exact optional property는 해당 key가 없어야 한다.
 */
function omitUndefinedProperties<TValue>(
  value: TValue
): WithoutUndefinedProperties<TValue> {
  if (Array.isArray(value)) {
    return value.map(
      omitUndefinedProperties
    ) as WithoutUndefinedProperties<TValue>
  }
  if (typeof value !== "object" || value === null) {
    return value as WithoutUndefinedProperties<TValue>
  }

  const entries = Object.entries(value).flatMap(([key, property]) =>
    property === undefined
      ? []
      : [[key, omitUndefinedProperties(property)] as const]
  )
  return Object.fromEntries(entries) as WithoutUndefinedProperties<TValue>
}
