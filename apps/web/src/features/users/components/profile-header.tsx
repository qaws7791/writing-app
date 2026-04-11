import { HugeiconsIcon } from "@hugeicons/react"
import { User02Icon } from "@hugeicons/core-free-icons"

export interface ProfileData {
  name: string
  email?: string
  image?: string | null
}

export function ProfileHeader({
  data,
  isPending,
  isError,
}: {
  data?: ProfileData | null
  isPending: boolean
  isError: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 pt-8 pb-10">
      <div className="mb-3 flex size-24 items-center justify-center overflow-hidden rounded-full bg-secondary-container">
        {data?.image ? (
          <img
            src={data.image}
            alt={data.name}
            className="size-full object-cover"
          />
        ) : (
          <HugeiconsIcon
            icon={User02Icon}
            size={48}
            color="currentColor"
            strokeWidth={1}
            className="text-on-secondary-container"
          />
        )}
      </div>
      <h2 className="text-headline-medium-em text-on-surface">
        {isPending ? "불러오는 중..." : (data?.name ?? "사용자")}
      </h2>
      <p className="text-body-medium-em text-on-surface-low">
        {data?.email ?? ""}
      </p>
      {isError ? (
        <p className="pt-2 text-label-medium text-on-surface-low">
          프로필 정보를 불러오지 못했어요.
        </p>
      ) : null}
    </div>
  )
}
