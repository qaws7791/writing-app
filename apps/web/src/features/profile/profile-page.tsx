"use client"

/* eslint-disable react/button-has-type */

import type { ReactNode, SVGProps } from "react"
import { useSyncExternalStore } from "react"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import type { LearnerProfile } from "@/features/profile/profile-types"
import { requestLogout } from "@/lib/auth/auth-client"

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
  const joinedDate = formatKwepJoinedDate(profile.user.joinedAt)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-16 mt-8">
        <div
          className="w-32 h-32 bg-primary rounded-[3rem] flex justify-center items-center mb-6"
          style={{ fontSize: "3rem" }}
        >
          ✍️
        </div>
        <h1 className="font-black mb-2" style={{ fontSize: "1.75rem" }}>
          {profile.user.name}
        </h1>
        <p className="text-muted font-bold">가입일: {joinedDate}</p>
      </div>
      <h3 className="font-bold mb-6" style={{ fontSize: "1.5rem" }}>
        나의 학습 요약
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-surface p-8 rounded-4xl flex flex-col items-center text-center">
          <span className="text-muted font-bold mb-2">완료한 레슨</span>
          <span className="font-black" style={{ fontSize: "2.25rem" }}>
            {profile.stats.completedLessons}
          </span>
        </div>
        <div className="bg-surface p-8 rounded-4xl flex flex-col items-center text-center">
          <span className="text-muted font-bold mb-2">연속 학습일</span>
          <span className="font-black" style={{ fontSize: "2.25rem" }}>
            🔥 {profile.stats.currentStreakDays}
          </span>
        </div>
      </div>
      <h3 className="font-bold mb-6" style={{ fontSize: "1.5rem" }}>
        화면 테마
      </h3>
      <div className="mb-12">
        <ThemeToggle />
      </div>
      <ProfileButton
        onClick={() => {
          void requestLogout("/").then((path) => {
            router.push(path)
          })
        }}
        variant="wrong"
      >
        로그아웃
      </ProfileButton>
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
    <div className="grid grid-cols-3 gap-2 bg-surface p-2 rounded-4xl">
      {THEME_OPTIONS.map(({ Icon, label, value }) => {
        const on = active === value

        return (
          <button
            aria-pressed={on}
            className={cx(
              "btn-squish flex flex-col items-center gap-2 py-4 rounded-[1.75rem] font-bold transition-colors",
              on ? "bg-primary" : "text-muted hover:bg-surface-hover"
            )}
            key={value}
            onClick={() => setTheme(value)}
            style={on ? { color: "#2A2621" } : undefined}
          >
            <Icon size={22} strokeWidth={2.5} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function ProfileButton({
  children,
  disabled,
  onClick,
  variant = "primary",
}: {
  readonly children: ReactNode
  readonly disabled?: boolean
  readonly onClick?: () => void
  readonly variant?: "primary" | "wrong"
}) {
  const variantClassName = {
    primary: "bg-charcoal text-cream",
    wrong: "bg-coral-light text-charcoal",
  }[variant]

  return (
    <button
      className={cx(
        "w-full font-bold py-5 rounded-4xl btn-squish",
        variantClassName,
        disabled ? "opacity-50 cursor-not-allowed" : undefined
      )}
      disabled={disabled}
      onClick={onClick}
      style={{ fontSize: "1.125rem" }}
      type="button"
    >
      {children}
    </button>
  )
}

function formatKwepJoinedDate(isoDate: string): string {
  return isoDate.slice(0, 10).replaceAll("-", ".")
}

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}

type KwepIconProps = Omit<SVGProps<SVGSVGElement>, "height" | "width"> & {
  readonly size?: number
}

function SunIcon({ className, size = 24, ...props }: KwepIconProps) {
  return (
    <KwepSvg className={className} iconName="sun" size={size} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </KwepSvg>
  )
}

function MoonIcon({ className, size = 24, ...props }: KwepIconProps) {
  return (
    <KwepSvg className={className} iconName="moon" size={size} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </KwepSvg>
  )
}

function MonitorIcon({ className, size = 24, ...props }: KwepIconProps) {
  return (
    <KwepSvg className={className} iconName="monitor" size={size} {...props}>
      <rect height="14" rx="2" width="20" x="2" y="3" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </KwepSvg>
  )
}

function KwepSvg({
  children,
  className,
  iconName,
  size = 24,
  ...props
}: KwepIconProps & {
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
