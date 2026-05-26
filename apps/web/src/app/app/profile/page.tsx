import { redirect } from "next/navigation"

import { getAppUser } from "@/lib/auth/get-app-user"
import { getAuthRedirectPath } from "@/lib/auth/auth-navigation"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export default async function Page() {
  const api = await getServerWritingAppApi()
  const currentUser = await getAppUser(api)
  const profile = await api.getProfile()

  if (!currentUser) {
    redirect(getAuthRedirectPath("/app/profile"))
  }

  if (profile.status === "error") {
    throw new Error(profile.error.message)
  }

  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pt-6 pb-12 sm:px-6 sm:pt-9 md:px-8 md:pt-12 md:pb-20">
        <header className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl/9 font-bold tracking-normal md:text-4xl/10">
            프로필
          </h1>
          <p className="m-0 text-base/7 text-muted-foreground">
            {currentUser.name}님의 학습 현황입니다.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="학습 현황">
          <ProfileStat
            label="완료한 레슨"
            value={profile.value.completedLessonCount}
          />
          <ProfileStat
            label="진행 중인 코스"
            value={profile.value.courseCount}
          />
        </section>
      </div>
    </div>
  )
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="m-0 text-sm/6 font-medium text-muted-foreground">{label}</p>
      <p className="m-0 mt-2 text-3xl/10 font-bold text-card-foreground">
        {value}
      </p>
    </div>
  )
}
