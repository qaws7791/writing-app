"use client"

import { useState, useTransition } from "react"

import { AdminHeader } from "@/components/admin-header"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminContentResetResult,
  AdminLegalSettingsRequest,
  AdminNoticeSettingsRequest,
  AdminSettings,
} from "@/lib/api/admin-api"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"

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
  const [message, setMessage] = useState<string | null>(null)
  const [resetRevision, setResetRevision] = useState<number | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  if (settingsResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="공지, 약관, 콘텐츠 초기화를 관리합니다."
          title="운영 설정"
        />
        <section className="admin-alert" role="alert">
          {settingsResult.error.message}
        </section>
      </>
    )
  }

  const { legal, notice } = settingsResult.value

  return (
    <>
      <AdminHeader
        description="공지, 약관, 콘텐츠 초기화를 관리합니다."
        title="운영 설정"
      />
      {message === null ? null : (
        <p className="admin-inline-status" role="status">
          <span>{message}</span>
          {resetRevision === null ? null : (
            <span>revision {resetRevision}</span>
          )}
        </p>
      )}
      <section className="settings-grid">
        <form
          className="admin-panel"
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
                  ? "운영 설정을 저장했습니다."
                  : result.error.message
              )
            })
          }}
        >
          <div className="admin-section-heading">
            <h2>공지와 배너</h2>
            <p>학습자에게 노출할 운영 메시지입니다.</p>
          </div>
          <label className="admin-form-field">
            <span>배너</span>
            <Input
              aria-label="배너"
              defaultValue={notice.banner}
              name="banner"
            />
          </label>
          <label className="admin-form-field">
            <span>공지</span>
            <Textarea
              aria-label="공지"
              defaultValue={notice.announce}
              name="announce"
            />
          </label>
          <Button disabled={isPending} type="submit">
            공지 저장
          </Button>
        </form>
        <form
          className="admin-panel"
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
                  ? "운영 설정을 저장했습니다."
                  : result.error.message
              )
            })
          }}
        >
          <div className="admin-section-heading">
            <h2>법적 문서</h2>
            <p>이용약관과 개인정보처리방침 본문입니다.</p>
          </div>
          <label className="admin-form-field">
            <span>이용약관</span>
            <Textarea
              aria-label="이용약관"
              defaultValue={legal.terms}
              name="terms"
            />
          </label>
          <label className="admin-form-field">
            <span>개인정보처리방침</span>
            <Textarea
              aria-label="개인정보처리방침"
              defaultValue={legal.privacy}
              name="privacy"
            />
          </label>
          <Button disabled={isPending} type="submit">
            약관 저장
          </Button>
        </form>
        <section className="admin-panel">
          <div className="admin-section-heading">
            <h2>콘텐츠 초기화</h2>
            <p>기준 콘텐츠 seed로 콘텐츠 baseline을 재시드합니다.</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            type="button"
          >
            콘텐츠 초기화
          </Button>
        </section>
      </section>
      {showResetDialog ? (
        <div
          aria-labelledby="reset-content-title"
          className="admin-dialog-backdrop"
          role="dialog"
        >
          <div className="admin-dialog">
            <h2 id="reset-content-title">콘텐츠 초기화 확인</h2>
            <p>현재 active 콘텐츠를 기준 콘텐츠 seed에 맞춰 다시 정렬합니다.</p>
            <div className="admin-dialog__actions">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                type="button"
              >
                취소
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await resetContent()

                    if (result.status === "ok") {
                      setMessage("콘텐츠를 초기화했습니다.")
                      setResetRevision(result.value.revision)
                    } else {
                      setMessage(result.error.message)
                    }
                    setShowResetDialog(false)
                  })
                }}
                type="button"
              >
                초기화 실행
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
