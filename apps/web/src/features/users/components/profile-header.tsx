import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@workspace/ui/components/avatar"

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
      <Avatar size="lg" className="mb-3 size-24 text-xl leading-8 font-medium">
        <AvatarImage
          src={data?.image ?? undefined}
          alt={data?.name ?? "사용자"}
        />
        <AvatarFallback>{data?.name?.[0]}</AvatarFallback>
      </Avatar>
      <h2 className="text-2xl leading-tight font-semibold text-foreground">
        {isPending ? "불러오는 중..." : (data?.name ?? "사용자")}
      </h2>
      <p className="text-sm leading-6 font-medium text-muted">
        {data?.email ?? ""}
      </p>
      {isError ? (
        <p className="pt-2 text-xs leading-5 font-medium text-muted">
          프로필 정보를 불러오지 못했어요.
        </p>
      ) : null}
    </div>
  )
}
