"use client"

import { useState, useTransition } from "react"

import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminContentResetResult,
  AdminLegalSettingsRequest,
  AdminNoticeSettingsRequest,
  AdminSettings,
} from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"
import { Textarea } from "@workspace/ui/components/ui/textarea"

type StatusMessage = {
  readonly message: string
  readonly tone: "danger" | "success"
}

export function AdminSettingsPage({
  resetContent,
  saveLegalSettings,
  saveNoticeSettings,
  settingsResult,
}: {
  readonly resetContent: () => Promise<AdminApiResult<AdminContentResetResult>>
  readonly saveLegalSettings: (
    input: AdminLegalSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly saveNoticeSettings: (
    input: AdminNoticeSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly settingsResult: AdminApiResult<AdminSettings>
}) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [resetRevision, setResetRevision] = useState<number | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  if (settingsResult.status === "error") {
    return (
      <>
        <PageHeader
          description="공지, 약관, 콘텐츠 초기화를 관리합니다."
          title="운영 설정"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{settingsResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const { legal, notice } = settingsResult.value

  return (
    <>
      <PageHeader
        description="공지, 약관, 콘텐츠 초기화를 관리합니다."
        title="운영 설정"
      />
      {message === null ? null : (
        <Alert className="mb-4" role="status" tone={message.tone}>
          <AlertDescription className="flex flex-wrap gap-2">
            <span>{message.message}</span>
            {resetRevision === null ? null : (
              <span>revision {resetRevision}</span>
            )}
          </AlertDescription>
        </Alert>
      )}
      <section className="grid gap-4 lg:grid-cols-2">
        <form
          className="grid gap-4 rounded-panel border border-border/50 bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await saveNoticeSettings({
                announce: String(formData.get("announce") ?? ""),
                banner: String(formData.get("banner") ?? ""),
              })

              setMessage(
                result.status === "ok"
                  ? { message: "운영 설정을 저장했습니다.", tone: "success" }
                  : { message: result.error.message, tone: "danger" }
              )
            })
          }}
        >
          <SectionHeader
            title="공지와 배너"
            description="학습자에게 노출할 운영 메시지입니다."
          />
          <Field>
            <FieldLabel htmlFor="settings-banner">배너</FieldLabel>
            <Input
              aria-label="배너"
              defaultValue={notice.banner}
              id="settings-banner"
              name="banner"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-announce">공지</FieldLabel>
            <Textarea
              aria-label="공지"
              defaultValue={notice.announce}
              id="settings-announce"
              name="announce"
            />
          </Field>
          <Button disabled={isPending} type="submit">
            공지 저장
          </Button>
        </form>
        <form
          className="grid gap-4 rounded-panel border border-border/50 bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await saveLegalSettings({
                privacy: String(formData.get("privacy") ?? ""),
                terms: String(formData.get("terms") ?? ""),
              })

              setMessage(
                result.status === "ok"
                  ? { message: "운영 설정을 저장했습니다.", tone: "success" }
                  : { message: result.error.message, tone: "danger" }
              )
            })
          }}
        >
          <SectionHeader
            title="법적 문서"
            description="이용약관과 개인정보처리방침 본문입니다."
          />
          <Field>
            <FieldLabel htmlFor="settings-terms">이용약관</FieldLabel>
            <Textarea
              aria-label="이용약관"
              defaultValue={legal.terms}
              id="settings-terms"
              name="terms"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-privacy">개인정보처리방침</FieldLabel>
            <Textarea
              aria-label="개인정보처리방침"
              defaultValue={legal.privacy}
              id="settings-privacy"
              name="privacy"
            />
          </Field>
          <Button disabled={isPending} type="submit">
            약관 저장
          </Button>
        </form>
        <Surface className="lg:col-span-2" variant="panel">
          <SectionHeader
            title="콘텐츠 초기화"
            description="기준 콘텐츠 seed로 콘텐츠 baseline을 재시드합니다."
          />
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            type="button"
          >
            콘텐츠 초기화
          </Button>
        </Surface>
      </section>
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>콘텐츠 초기화 확인</AlertDialogTitle>
          <AlertDialogDescription>
            현재 active 콘텐츠를 기준 콘텐츠 seed에 맞춰 다시 정렬합니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await resetContent()

                  if (result.status === "ok") {
                    setMessage({
                      message: "콘텐츠를 초기화했습니다.",
                      tone: "success",
                    })
                    setResetRevision(result.value.revision)
                  } else {
                    setMessage({
                      message: result.error.message,
                      tone: "danger",
                    })
                  }
                  setShowResetDialog(false)
                })
              }}
              type="button"
            >
              초기화 실행
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
