import type {
  AdminContentAsset,
  AdminCourseAssets,
  AdminCourseDetail,
} from "@/features/course-editor/model/admin-course-editor"
import {
  createContentAssetUpload,
  type UploadAdminContentAsset,
} from "@/features/course-editor/model/content-asset-upload"
import type { CourseEditorAction } from "@/features/course-editor/model/course-editor-reducer"
import { ContentAssetUploadField } from "@/features/course-editor/ui/content-asset-upload-field"
import { CourseAssetInventory } from "@/features/course-editor/ui/course-asset-inventory"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import { courseCategoryValues } from "@workspace/contracts/content/category"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { Textarea } from "@workspace/ui/components/ui/textarea"

const courseCategoryItems = courseCategoryValues.map((category) => ({
  label: category,
  value: category,
}))

export function CourseInfoTab({
  assetsResult,
  coverAsset,
  dispatch,
  draft,
  uploadAdminContentAsset,
}: {
  readonly assetsResult: AdminRequestResult<AdminCourseAssets>
  readonly coverAsset: AdminContentAsset | undefined
  readonly dispatch: (action: CourseEditorAction) => void
  readonly draft: AdminCourseDetail
  readonly uploadAdminContentAsset: UploadAdminContentAsset
}) {
  const uploadAsset = createContentAssetUpload({
    dispatch,
    draft,
    uploadAdminContentAsset,
  })

  return (
    <div className="max-w-xl">
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="course-editor-title">제목</FieldLabel>
          <Input
            id="course-editor-title"
            onChange={(event) =>
              dispatch({
                field: "title",
                type: "course-changed",
                value: event.target.value,
              })
            }
            value={draft.title}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="course-editor-description">설명</FieldLabel>
          <Textarea
            id="course-editor-description"
            onChange={(event) =>
              dispatch({
                field: "description",
                type: "course-changed",
                value: event.target.value,
              })
            }
            value={draft.description}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="course-editor-category">카테고리</FieldLabel>
          <Select
            items={courseCategoryItems}
            onValueChange={(value) => {
              if (value === null) return
              dispatch({
                field: "category",
                type: "course-changed",
                value,
              })
            }}
            value={draft.category}
          >
            <SelectTrigger id="course-editor-category">
              <SelectValue placeholder="카테고리를 선택하세요." />
            </SelectTrigger>
            <SelectContent>
              {courseCategoryItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <div className="mt-6">
        <ContentAssetUploadField
          asset={coverAsset}
          kind="course-cover"
          label="코스 표지"
          onRemove={() =>
            dispatch({ assetId: null, type: "cover-asset-changed" })
          }
          onUploaded={(asset) =>
            dispatch({
              assetId: asset.id,
              type: "cover-asset-changed",
            })
          }
          upload={uploadAsset}
        />
      </div>
      <div className="mt-6">
        <CourseAssetInventory assetsResult={assetsResult} />
      </div>
    </div>
  )
}
