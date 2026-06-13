import Link from "next/link"

import { ProfilePage } from "@/features/profile/profile-page"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"
import { buttonVariants } from "@workspace/ui/components/ui/button"

export default async function ProfileRoute() {
  const api = getServerWritingAppApi({
    tokenProvider: () => null,
  })
  const profileResult = await api.getProfile()

  if (profileResult.status === "error") {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h1 className="text-3xl font-semibold">
            프로필을 불러올 수 없습니다.
          </h1>
          <p className="text-muted-foreground">{profileResult.error.message}</p>
          <Link className={buttonVariants()} href="/login?next=/app/profile">
            로그인하기
          </Link>
        </div>
      </main>
    )
  }

  return <ProfilePage profile={profileResult.value} />
}
