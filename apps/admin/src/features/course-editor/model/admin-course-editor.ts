import { adminCourseEditorSaveDocumentSchema } from "@workspace/contracts/content/admin-courses"
import type {
  getAdminCourseAssets,
  getAdminCourseEditor,
  uploadAdminContentAsset,
} from "@workspace/http-client/admin"
import type { AdminRequestError } from "@/shared/http/admin-api-client"

export type AdminCourseDetail = Awaited<ReturnType<typeof getAdminCourseEditor>>
export type AdminContentAsset = Awaited<
  ReturnType<typeof uploadAdminContentAsset>
>
export type AdminCourseAssets = Awaited<ReturnType<typeof getAdminCourseAssets>>
export type AdminCourseAsset = AdminCourseAssets["items"][number]
export type AdminContentAssetKind = NonNullable<
  Parameters<typeof uploadAdminContentAsset>[1]
>["kind"]
export type AdminCourseEditorCommandResult =
  | Readonly<{
      latest: AdminCourseDetail
      status: "conflict"
    }>
  | Readonly<{
      error: AdminRequestError
      status: "error"
    }>
  | Readonly<{
      status: "ok"
      value: AdminCourseDetail
    }>

/**
 * 저장 직전 draft는 쓰기 규칙으로 검증한다. 카테고리 값 집합이 좁혀진 채로 남아야
 * 전송 계약의 body 타입과 그대로 맞는다.
 */
export const adminCourseEditorSchema =
  adminCourseEditorSaveDocumentSchema.transform((document) =>
    omitUndefinedProperties(document)
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
