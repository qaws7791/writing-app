import Image from "next/image"
import Link from "next/link"

import type { LearnerProfile } from "@/features/profile/profile-types"
import { createLogoutPath } from "@/lib/auth/auth-navigation"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { Progress } from "@workspace/ui/components/ui/progress"

type ProfilePageProps = {
  readonly profile: LearnerProfile
}

export function ProfilePage({ profile }: ProfilePageProps) {
  const joinedDate = formatKoreanDate(profile.user.joinedAt)
  const initial = profile.user.name.trim().slice(0, 1) || "학"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="flex items-start gap-5">
            {profile.user.image === null ? (
              <div
                aria-label="프로필 이미지 없음"
                className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-3xl font-semibold text-primary"
              >
                {initial}
              </div>
            ) : (
              <Image
                alt={`${profile.user.name} 프로필 이미지`}
                className="size-20 rounded-lg object-cover"
                height={80}
                src={profile.user.image}
                width={80}
              />
            )}
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-medium text-primary">프로필</p>
              <h1 className="text-3xl font-semibold">
                {profile.user.name}님의 프로필
              </h1>
              <p className="text-muted-foreground">{profile.user.email}</p>
              <p className="text-sm text-muted-foreground">{joinedDate} 가입</p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle as="h2">전체 진도</CardTitle>
              <CardDescription>
                전체 {profile.stats.totalLessons}개 중{" "}
                {profile.stats.completedLessons}개 완료
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Progress
                aria-label="전체 진도"
                value={profile.stats.progressPercent}
              />
              <p className="text-sm text-muted-foreground">
                {profile.stats.progressPercent}% 완료
              </p>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={createLogoutPath("/")}
              >
                로그아웃
              </Link>
            </CardContent>
          </Card>
        </section>

        <section
          aria-labelledby="profile-stats-heading"
          className="grid gap-4 md:grid-cols-3"
        >
          <h2 className="sr-only" id="profile-stats-heading">
            학습 통계
          </h2>
          <Card>
            <CardHeader>
              <CardTitle as="h3">
                {profile.stats.currentStreakDays}일 연속 학습
              </CardTitle>
              <CardDescription>오늘의 학습 루틴 상태입니다.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h3">
                완료 레슨 {profile.stats.completedLessons}개
              </CardTitle>
              <CardDescription>지금까지 완료한 레슨입니다.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h3">
                최근 학습 {profile.stats.lastActiveDate ?? "없음"}
              </CardTitle>
              <CardDescription>
                서버에 기록된 마지막 학습일입니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>
    </main>
  )
}

function formatKoreanDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-")

  return `${Number(year)}년 ${Number(month)}월 ${Number(day)}일`
}
