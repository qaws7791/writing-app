"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SecurityLockIcon,
  Notification01Icon,
  TextFontIcon,
  Motion01Icon,
  CrownIcon,
  FileExportIcon,
  ArrowRight01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"

function SettingRow({
  icon,
  label,
  trailing,
  showChevron = true,
  onClick,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  label: string
  trailing?: React.ReactNode
  showChevron?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className="flex w-full items-center gap-4 px-6 py-5 text-left"
      onClick={onClick}
    >
      <HugeiconsIcon
        icon={icon}
        size={20}
        color="currentColor"
        strokeWidth={1.5}
        className="shrink-0 text-on-surface"
      />
      <span className="flex-1 text-base font-medium text-on-surface">
        {label}
      </span>
      {trailing}
      {showChevron && (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.5}
          className="shrink-0 text-on-surface-low"
        />
      )}
    </button>
  )
}

function Divider() {
  return <div className="mx-6 h-px bg-outline/10" />
}

export default function ProfileView() {
  const [reduceMotion, setReduceMotion] = useState(false)

  return (
    <div className="flex min-h-full flex-col bg-surface">
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-semibold text-on-surface">설정</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* 프로필 섹션 */}
        <div className="flex flex-col items-center gap-1 px-4 pt-8 pb-10">
          <div className="mb-3 flex size-24 items-center justify-center overflow-hidden rounded-full bg-secondary-container">
            <HugeiconsIcon
              icon={User02Icon}
              size={48}
              color="currentColor"
              strokeWidth={1}
              className="text-on-secondary-container"
            />
          </div>
          <h2 className="text-[30px] font-medium tracking-[-0.05em] text-on-surface">
            김수필
          </h2>
          <p className="text-sm font-medium text-on-surface-low">
            abcd1234@email.com
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="flex gap-4 px-4 pb-10">
          <div className="flex flex-1 flex-col gap-1 rounded-[2rem] bg-surface p-6 shadow-[0_2px_12px_0_rgba(28,27,27,0.04)]">
            <p className="text-xs font-semibold tracking-[0.5px] text-on-surface-low uppercase">
              완료한 여정
            </p>
            <p className="text-xl font-medium text-on-surface">여정 4개</p>
          </div>
          <div className="flex flex-1 flex-col gap-1 rounded-[2rem] bg-surface p-6 shadow-[0_2px_12px_0_rgba(28,27,27,0.04)]">
            <p className="text-xs font-semibold tracking-[0.5px] text-on-surface-low uppercase">
              작성한 글
            </p>
            <p className="text-xl font-medium text-on-surface">글 10개</p>
          </div>
        </div>

        {/* 설정 그룹 */}
        <div className="flex flex-col gap-10 px-4">
          {/* 계정 관리 */}
          <section className="flex flex-col gap-4">
            <p className="text-sm tracking-[1.2px] text-on-surface-lowest uppercase">
              계정 관리
            </p>
            <div className="overflow-hidden rounded-[2rem] bg-surface-container">
              <SettingRow icon={SecurityLockIcon} label="계정 보안" />
              <Divider />
              <SettingRow
                icon={Notification01Icon}
                label="알림 설정"
                trailing={
                  <span className="mr-2 text-xs font-bold text-on-surface-low">
                    ON
                  </span>
                }
              />
            </div>
          </section>

          {/* 접근성 */}
          <section className="flex flex-col gap-4">
            <p className="text-sm tracking-[1.2px] text-on-surface-lowest uppercase">
              접근성
            </p>
            <div className="overflow-hidden rounded-[2rem] bg-surface-container">
              <SettingRow
                icon={TextFontIcon}
                label="글꼴 크기"
                trailing={
                  <span className="mr-2 text-sm font-medium text-on-surface-low">
                    보통
                  </span>
                }
                showChevron={false}
              />
              <Divider />
              <div className="flex w-full items-center gap-4 px-6 py-5">
                <HugeiconsIcon
                  icon={Motion01Icon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="shrink-0 text-on-surface"
                />
                <div className="flex flex-1 flex-col">
                  <span className="text-base font-medium text-on-surface">
                    동작 줄이기 모드
                  </span>
                  <span className="text-[11px] font-medium text-on-surface-low">
                    화면 움직임을 최소화합니다
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={reduceMotion}
                  onClick={() => setReduceMotion((v) => !v)}
                  className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                    reduceMotion
                      ? "bg-on-surface"
                      : "bg-surface-container-highest"
                  }`}
                >
                  <div
                    className={`absolute top-0.75 size-3.5 rounded-full bg-on-primary shadow-sm transition-transform ${
                      reduceMotion ? "left-0.75 translate-x-5.5" : "left-0.75"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* 서비스 및 데이터 */}
          <section className="flex flex-col gap-4">
            <p className="text-sm tracking-[1.2px] text-on-surface-lowest uppercase">
              서비스 및 데이터
            </p>
            <div className="overflow-hidden rounded-[2rem] bg-surface-container">
              <SettingRow
                icon={CrownIcon}
                label="구독 관리 (Pro)"
                trailing={
                  <span className="mr-3 rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-extrabold text-on-surface">
                    ACTIVE
                  </span>
                }
              />
              <Divider />
              <SettingRow icon={FileExportIcon} label="데이터 내보내기" />
            </div>
          </section>

          {/* 로그아웃 */}
          <button className="flex items-center justify-center py-5 opacity-70">
            <span className="text-sm font-medium text-error">로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  )
}
