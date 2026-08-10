import type { ReactNode } from "react"

import { Card, CardContent } from "@workspace/ui/components/ui/card"

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
    <div className="mx-auto max-w-3xl space-y-12">
      <Card size="lg" variant="muted">
        <CardContent className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <ProfileAvatar image={profile.user.image} name={profile.user.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              <h1 className="truncate font-heading text-3xl font-semibold tracking-[-0.035em]">
                {profile.user.name}
              </h1>
              <ProfileNameEditor currentName={profile.user.name} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              가입일: {joinedDate}
            </p>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="profile-theme-title">
        <h2
          className="mb-5 font-heading text-xl font-semibold tracking-[-0.02em]"
          id="profile-theme-title"
        >
          화면 테마
        </h2>
        <ThemeToggle />
      </section>

      {logoutAction}
    </div>
  )
}

function formatJoinedDate(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".")
}
