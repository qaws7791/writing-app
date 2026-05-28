"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/ui/button"
import { SparklesIcon } from "@workspace/ui/components/icons"

import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { CurriculumUpgradeNotice } from "@/lib/api/writing-app-api"

type AvailableCurriculumUpgradeNotice = Extract<
  CurriculumUpgradeNotice,
  { status: "available" }
>

interface CourseUpgradeNoticeProps {
  upgrade: AvailableCurriculumUpgradeNotice
}

export function CourseUpgradeNotice({ upgrade }: CourseUpgradeNoticeProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = React.useState<
    "apply" | "dismiss" | null
  >(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isHidden, setIsHidden] = React.useState(false)
  const isPending = pendingAction !== null

  React.useEffect(() => {
    setIsHidden(false)
  }, [upgrade.migrationId])

  async function runUpgradeAction(action: "apply" | "dismiss") {
    setPendingAction(action)
    setErrorMessage(null)

    const api = getBrowserWritingAppApi()
    const result =
      action === "apply"
        ? await api.applyCurriculumUpgrade(upgrade.courseId)
        : await api.dismissCurriculumUpgrade(upgrade.courseId)

    setPendingAction(null)

    if (result.status === "error") {
      setErrorMessage(result.error.message)
      return
    }

    setIsHidden(true)
    router.refresh()
  }

  if (isHidden) {
    return null
  }

  return (
    <section
      className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-foreground"
      aria-labelledby="curriculum-upgrade-title"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <SparklesIcon className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2
              id="curriculum-upgrade-title"
              className="m-0 text-base/6 font-semibold tracking-normal"
            >
              새 커리큘럼이 도착했습니다
            </h2>
            <p className="m-0 text-sm/6 text-muted-foreground">
              {upgrade.message}
            </p>
            <p className="m-0 text-xs/5 font-medium text-muted-foreground">
              v{upgrade.fromVersion.versionNumber}에서 v
              {upgrade.toVersion.versionNumber}로 이동할 수 있습니다.
            </p>
          </div>

          {errorMessage ? (
            <p className="m-0 text-sm/6 font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={() => void runUpgradeAction("apply")}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {pendingAction === "apply"
                ? "업그레이드 중"
                : "새 버전으로 업그레이드"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void runUpgradeAction("dismiss")}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {pendingAction === "dismiss" ? "저장 중" : "나중에 결정"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
