"use client"

import type { ReactNode, SVGProps } from "react"
import { useSyncExternalStore } from "react"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import type { LearnerProfile } from "@/features/profile/profile-types"
import { requestLogout } from "@/lib/auth/auth-client"
import { Button } from "@workspace/ui/components/ui/button"
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@workspace/ui/components/ui/segmented-control"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"

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
        <div className="mb-6 flex size-32 items-center justify-center rounded-panel bg-accent-soft text-display-lg text-accent">
          ✍️
        </div>
        <h1 className="mb-2 text-heading-md font-black">{profile.user.name}</h1>
        <p className="font-bold text-muted-foreground">가입일: {joinedDate}</p>
      </div>
      <h2 className="mb-6 text-heading-sm font-bold">나의 학습 요약</h2>
      <StatGrid aria-label="나의 학습 요약" className="mb-12 grid-cols-2">
        <StatCard label="완료한 레슨" value={profile.stats.completedLessons} />
        <StatCard
          label="연속 학습일"
          value={`🔥 ${profile.stats.currentStreakDays}`}
        />
      </StatGrid>
      <h2 className="mb-6 text-heading-sm font-bold">화면 테마</h2>
      <div className="mb-12">
        <ThemeToggle />
      </div>
      <Button
        className="w-full"
        onClick={() => {
          void requestLogout("/").then((path) => {
            router.push(path)
          })
        }}
        size="lg"
        type="button"
        variant="destructive"
      >
        로그아웃
      </Button>
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
    <SegmentedControl
      aria-label="화면 테마"
      className="grid w-full grid-cols-3"
      onValueChange={setTheme}
      value={active}
    >
      {THEME_OPTIONS.map(({ Icon, label, value }) => {
        return (
          <SegmentedControlItem className="w-full" key={value} value={value}>
            <Icon className="mr-2" size={16} strokeWidth={2.5} />
            {label}
          </SegmentedControlItem>
        )
      })}
    </SegmentedControl>
  )
}

function formatJoinedDate(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".")
}

type IconProps = Omit<SVGProps<SVGSVGElement>, "height" | "width"> & {
  readonly size?: number
}

function SunIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="sun" size={size} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </SvgIcon>
  )
}

function MoonIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="moon" size={size} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </SvgIcon>
  )
}

function MonitorIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="monitor" size={size} {...props}>
      <rect height="14" rx="2" width="20" x="2" y="3" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </SvgIcon>
  )
}

function SvgIcon({
  children,
  className,
  iconName,
  size = 24,
  ...props
}: IconProps & {
  readonly children: ReactNode
  readonly iconName: string
}) {
  const mergedClassName = `lucide lucide-${iconName}${className ? ` ${className}` : ""}`

  return (
    <svg
      className={mergedClassName}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  )
}
