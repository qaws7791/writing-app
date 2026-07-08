"use client"

import { useState, useTransition } from "react"
import { FileText, KeyRound, Megaphone, Check } from "lucide-react"

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
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { cn } from "@workspace/ui/lib/utils"

type SettingsTab = "access" | "legal" | "notice"

type StatusMessage = {
  readonly message: string
  readonly tone: "danger" | "success"
}

const tabs = [
  { icon: Megaphone, id: "notice" as const, label: "공지·배너" },
  { icon: FileText, id: "legal" as const, label: "약관·개인정보" },
  { icon: KeyRound, id: "access" as const, label: "접근·콘텐츠" },
]

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
  const [tab, setTab] = useState<SettingsTab>("notice")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<StatusMessage | null>(null)
  const [savedNotice, setSavedNotice] = useState(false)
  const [savedLegal, setSavedLegal] = useState(false)
  const [resetRevision, setResetRevision] = useState<number | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  if (settingsResult.status === "error") {
    return (
      <>
        <SettingsHeading />
        <Alert role="alert" tone="danger">
          <AlertDescription>{settingsResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const { legal, notice } = settingsResult.value

  return (
    <>
      <SettingsHeading />
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
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(({ icon: Icon, id, label }) => (
          <button
            className={cn(
              "btn-squish inline-flex items-center gap-2 rounded-3xl px-4 py-2.5 text-[0.875rem] font-bold transition-colors",
              tab === id
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-foreground"
            )}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            <Icon aria-hidden="true" size={16} />
            {label}
          </button>
        ))}
      </div>
      {tab === "notice" ? (
        <form
          className="max-w-2xl rounded-4xl bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await saveNoticeSettings({
                announce: String(formData.get("announce") ?? ""),
                banner: String(formData.get("banner") ?? ""),
              })

              if (result.status === "ok") {
                flashSaved(setSavedNotice)
                setMessage({
                  message: "운영 설정을 저장했습니다.",
                  tone: "success",
                })
                return
              }

              setMessage({
                message: result.error.message,
                tone: "danger",
              })
            })
          }}
        >
          <Field>
            <FieldLabel htmlFor="settings-banner">상단 배너 문구</FieldLabel>
            <Input
              defaultValue={notice.banner}
              id="settings-banner"
              name="banner"
              placeholder="예: 새 강의가 추가되었어요!"
            />
          </Field>
          <Field className="mt-4">
            <FieldLabel htmlFor="settings-announce">공지 내용</FieldLabel>
            <Textarea
              defaultValue={notice.announce}
              id="settings-announce"
              name="announce"
              rows={5}
            />
          </Field>
          <div className="mt-4 flex items-center gap-2">
            <Button disabled={isPending} type="submit">
              저장
            </Button>
            <SavedHint show={savedNotice} />
          </div>
        </form>
      ) : null}
      {tab === "legal" ? (
        <form
          className="max-w-2xl rounded-4xl bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            startTransition(async () => {
              const result = await saveLegalSettings({
                privacy: String(formData.get("privacy") ?? ""),
                terms: String(formData.get("terms") ?? ""),
              })

              if (result.status === "ok") {
                flashSaved(setSavedLegal)
                setMessage({
                  message: "운영 설정을 저장했습니다.",
                  tone: "success",
                })
                return
              }

              setMessage({
                message: result.error.message,
                tone: "danger",
              })
            })
          }}
        >
          <Field>
            <FieldLabel htmlFor="settings-terms">이용약관</FieldLabel>
            <Textarea
              defaultValue={legal.terms}
              id="settings-terms"
              name="terms"
              rows={6}
            />
          </Field>
          <Field className="mt-4">
            <FieldLabel htmlFor="settings-privacy">개인정보처리방침</FieldLabel>
            <Textarea
              defaultValue={legal.privacy}
              id="settings-privacy"
              name="privacy"
              rows={6}
            />
          </Field>
          <div className="mt-4 flex items-center gap-2">
            <Button disabled={isPending} type="submit">
              저장
            </Button>
            <SavedHint show={savedLegal} />
          </div>
        </form>
      ) : null}
      {tab === "access" ? (
        <div className="flex max-w-2xl flex-col gap-5">
          <article className="rounded-4xl bg-surface p-6">
            <h2 className="m-0 mb-2 text-[1.125rem] font-bold text-foreground">
              콘텐츠 초기화
            </h2>
            <p className="m-0 mb-4 text-[0.875rem] font-medium text-muted-foreground">
              기준 콘텐츠 seed로 콘텐츠 baseline을 재시드합니다.
            </p>
            <Button
              onClick={() => setShowResetDialog(true)}
              type="button"
              variant="destructive"
            >
              콘텐츠 초기화
            </Button>
          </article>
        </div>
      ) : null}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>콘텐츠 초기화 확인</AlertDialogTitle>
          <AlertDialogDescription>
            현재 active 콘텐츠를 기준 콘텐츠 seed에 맞춰 다시 정렬합니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <Button
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
              variant="destructive"
            >
              초기화 실행
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SettingsHeading() {
  return (
    <header className="mb-6">
      <h1 className="m-0 text-[2rem] font-bold text-foreground">운영 설정</h1>
      <p className="mt-1 text-[1.0625rem] font-medium text-muted-foreground">
        서비스 운영에 필요한 설정을 관리합니다.
      </p>
    </header>
  )
}

function SavedHint({ show }: { readonly show: boolean }) {
  if (!show) {
    return null
  }

  return (
    <span className="ml-2 inline-flex items-center gap-1 text-[0.8125rem] font-bold text-mint-dark">
      <Check aria-hidden="true" size={14} />
      저장됨
    </span>
  )
}

function flashSaved(setSaved: (value: boolean) => void) {
  setSaved(true)
  window.setTimeout(() => setSaved(false), 2000)
}
