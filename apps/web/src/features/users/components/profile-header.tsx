import { Avatar } from "@workspace/ui/components/avatar"

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
      <Avatar
        src={data?.image}
        alt={data?.name ?? "사용자"}
        fallback={data?.name?.[0]}
        size="lg"
        className="mb-3 size-24 text-title-large"
      />
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
