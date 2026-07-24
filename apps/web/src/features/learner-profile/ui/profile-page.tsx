import type { ReactNode } from "react"

import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"

import { ProfileAvatar } from "@/features/learner-profile/ui/profile-avatar"
import { ProfileNameEditor } from "@/features/learner-profile/ui/profile-name-editor"
import { ThemeToggle } from "@/features/learner-profile/ui/theme-toggle"
import type { LearnerProfileDto } from "@/shared/http/learner-api-client"

type ProfilePageProps = {
  readonly logoutAction: ReactNode
  readonly profile: LearnerProfileDto
}

export function ProfilePage({ logoutAction, profile }: ProfilePageProps) {
  const joinedDate = formatJoinedDate(profile.user.joinedAt)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-16 mt-8">
        <ProfileAvatar image={profile.user.image} name={profile.user.name} />
        <div className="mb-2 flex items-center justify-center gap-1">
          <h1 className="text-[1.75rem] font-black">{profile.user.name}</h1>
          <ProfileNameEditor currentName={profile.user.name} />
        </div>
        <p className="font-bold text-muted-foreground">가입일: {joinedDate}</p>
      </div>
      <h3 className="mb-6 text-heading-sm font-bold">나의 학습 요약</h3>
      <StatGrid aria-label="나의 학습 요약" className="mb-12 grid-cols-2 gap-4">
        <StatCard
          label="완료한 레슨"
          layout="profile"
          value={`📚 ${profile.stats.completedLessons}`}
        />
        <StatCard
          label="연속 학습일"
          layout="profile"
          value={`🔥 ${profile.stats.currentStreakDays}`}
        />
      </StatGrid>
      <h3 className="mb-6 text-heading-sm font-bold">화면 테마</h3>
      <div className="mb-12">
        <ThemeToggle />
      </div>
      {logoutAction}
    </div>
  )
}

function formatJoinedDate(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".")
}
