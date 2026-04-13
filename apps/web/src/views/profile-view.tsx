"use client"

import { useRouter } from "next/navigation"
import {
  SecurityLockIcon,
  Notification01Icon,
  TextFontIcon,
  CrownIcon,
  FileExportIcon,
} from "@hugeicons/core-free-icons"
import { useUserProfile } from "@/features/users"
import {
  ProfileHeader,
  StatsCards,
  SettingRow,
  SettingSection,
  Divider,
  ThemeSwitcher,
} from "@/features/users/components"

export default function ProfileView() {
  const router = useRouter()
  const { data, isPending, isError } = useUserProfile()

  async function handleLogout() {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    })
    router.push("/login")
  }

  return (
    <div className="flex min-h-full flex-col bg-surface">
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl leading-snug font-semibold text-foreground">
          설정
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <ProfileHeader data={data} isPending={isPending} isError={isError} />
        <StatsCards
          completedJourneyCount={data?.completedJourneyCount ?? 0}
          writingCount={data?.writingCount ?? 0}
        />

        {/* 설정 그룹 */}
        <div className="flex flex-col gap-10 px-4">
          <SettingSection title="계정 관리">
            <SettingRow icon={SecurityLockIcon} label="계정 보안" />
            <Divider />
            <SettingRow
              icon={Notification01Icon}
              label="알림 설정"
              trailing={
                <span className="mr-2 text-xs leading-5 font-semibold tracking-wide text-muted">
                  ON
                </span>
              }
            />
          </SettingSection>

          <SettingSection title="접근성">
            <ThemeSwitcher />
            <Divider />
            <SettingRow
              icon={TextFontIcon}
              label="글꼴 크기"
              trailing={
                <span className="mr-2 text-sm leading-6 font-medium text-muted">
                  보통
                </span>
              }
              showChevron={false}
            />
          </SettingSection>

          <SettingSection title="서비스 및 데이터">
            <SettingRow
              icon={CrownIcon}
              label="구독 관리 (Pro)"
              trailing={
                <span className="mr-3 rounded-full bg-surface-tertiary px-2 py-0.5 text-xs leading-4 font-semibold text-foreground">
                  ACTIVE
                </span>
              }
            />
            <Divider />
            <SettingRow icon={FileExportIcon} label="데이터 내보내기" />
          </SettingSection>

          {/* 로그아웃 */}
          <button
            className="flex items-center justify-center py-5 opacity-70"
            onClick={handleLogout}
          >
            <span className="text-sm leading-6 font-medium text-danger">
              로그아웃
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
