"use client"

import { useSyncExternalStore } from "react"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import type { LearnerProfile } from "@/features/profile/profile-types"
import { requestLogout } from "@/lib/auth/auth-client"
import { MonitorIcon, MoonIcon, SunIcon } from "@workspace/ui/components/icons"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"
import { cn } from "@workspace/ui/lib/utils"

type ProfilePageProps = {
  readonly profile: LearnerProfile
}

const THEME_OPTIONS = [
  { Icon: SunIcon, label: "라이트", value: "light" },
  { Icon: MoonIcon, label: "다크", value: "dark" },
  { Icon: MonitorIcon, label: "시스템", value: "system" },
] as const
const noopSubscribe = () => () => {}
const clientMountedSnapshot = () => true
const serverMountedSnapshot = () => false

export function ProfilePage({ profile }: ProfilePageProps) {
  const router = useRouter()
  const joinedDate = formatJoinedDate(profile.user.joinedAt)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-16 mt-8">
        <ProfileAvatar image={profile.user.image} name={profile.user.name} />
        <h1 className="mb-2 text-[1.75rem] font-black">{profile.user.name}</h1>
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
      <Button
        className="w-full"
        onClick={() => {
          void requestLogout("/", profile.user.id).then((path) => {
            router.push(path)
          })
        }}
        size="extra"
        type="button"
        variant="destructive"
      >
        로그아웃
      </Button>
    </div>
  )
}

function ProfileAvatar({
  image,
  name,
}: {
  readonly image: string | null
  readonly name: string
}) {
  return (
    <div className="mb-6 flex size-32 items-center justify-center overflow-hidden rounded-[3rem] bg-accent text-display-lg">
      {image === null ? (
        "✍️"
      ) : (
        <Image
          alt={`${name} 프로필`}
          className="size-full object-cover"
          height={128}
          src={image}
          unoptimized
          width={128}
        />
      )}
    </div>
  )
}

function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const mounted = useSyncExternalStore(
    noopSubscribe,
    clientMountedSnapshot,
    serverMountedSnapshot
  )
  const active = mounted ? theme : "system"

  return (
    <div
      aria-label="화면 테마"
      className="grid grid-cols-3 gap-2 rounded-4xl bg-surface p-2"
      role="group"
    >
      {THEME_OPTIONS.map(({ Icon, label, value }) => {
        const isActive = active === value

        return (
          <button
            aria-pressed={isActive}
            className={buttonVariants({
              className: cn(
                "h-auto flex-col gap-2 rounded-[1.75rem] py-4 text-body-sm",
                isActive
                  ? "bg-accent text-charcoal hover:bg-accent"
                  : "text-muted-foreground hover:bg-surface-hover"
              ),
              variant: isActive ? "secondary" : "ghost",
            })}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
          >
            <Icon size={22} strokeWidth={2.5} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function formatJoinedDate(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".")
}
