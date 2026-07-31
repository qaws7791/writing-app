import type { AdminCourseAsset } from "@/features/course-editor/model/admin-course-editor"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import { cn } from "@workspace/ui/lib/utils"

const assetKindLabels = {
  "course-cover": "코스 표지",
  "reading-illustration": "읽기 삽화",
} as const satisfies Record<AdminCourseAsset["kind"], string>

const assetStatusLabels = {
  active: "사용 중",
  orphaned: "정리 대기",
} as const satisfies Record<AdminCourseAsset["status"], string>

/**
 * 업로드한 이미지의 현황만 보여준다. 물리 삭제는 일일 정리 작업이 소유하므로
 * 이 화면은 삭제 경로를 제공하지 않는다.
 */
export function CourseAssetInventory({
  assetsResult,
}: {
  readonly assetsResult: AdminRequestResult<
    Readonly<{ items: readonly AdminCourseAsset[] }>
  >
}) {
  if (assetsResult.status === "error") {
    return (
      <Alert role="alert" tone="danger">
        <AlertDescription>{assetsResult.error.message}</AlertDescription>
      </Alert>
    )
  }

  const { items } = assetsResult.value
  const pendingCleanupCount = items.filter(
    (asset) => asset.status === "orphaned"
  ).length

  return (
    <section>
      <h3 className="m-0 text-body font-bold text-foreground">
        업로드한 이미지
      </h3>
      <p className="mt-1 mb-3 text-body-sm font-medium text-muted-foreground">
        {items.length === 0
          ? "아직 업로드한 이미지가 없습니다."
          : `${items.length}개 · 정리 대기 ${pendingCleanupCount}개는 보존 기간이 지나면 자동 삭제됩니다.`}
      </p>
      {items.length === 0 ? null : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {items.map((asset) => (
            <li
              className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2"
              key={asset.id}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">
                  {asset.altText}
                </span>
                <span className="text-label-sm font-medium text-muted-foreground">
                  {assetKindLabels[asset.kind]} ·{" "}
                  {formatByteSize(asset.byteSize)}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-label-sm font-bold",
                  asset.status === "orphaned"
                    ? "bg-surface text-muted-foreground"
                    : "bg-success text-success-foreground"
                )}
              >
                {assetStatusLabels[asset.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatByteSize(byteSize: number): string {
  return `${Math.max(1, Math.round(byteSize / 1024))}KB`
}
