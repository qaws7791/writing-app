"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"

import {
  requestAdminMfaEnrollment,
  requestAdminPasswordChange,
  requestAdminRecoveryCodes,
  requestAdminTotpVerification,
} from "@/lib/auth/admin-auth-client"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

type Enrollment = {
  readonly secret: string
  readonly totpURI: string
}

export function AdminMfaPage({
  enrollmentRequired,
  nextPath,
}: {
  readonly enrollmentRequired: boolean
  readonly nextPath: string
}) {
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(
    null
  )
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function startEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const password = String(
      new FormData(event.currentTarget).get("password") ?? ""
    )
    setMessage(null)
    startTransition(async () => {
      try {
        const result = await requestAdminMfaEnrollment(password)
        const url = new URL(result.totpURI)
        setEnrollment({
          secret: url.searchParams.get("secret") ?? "",
          totpURI: result.totpURI,
        })
      } catch {
        setMessage("현재 비밀번호를 확인하세요.")
      }
    })
  }

  function finishEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get("code") ?? "")
    setMessage(null)
    startTransition(async () => {
      try {
        await requestAdminTotpVerification(code)
        const result = await requestAdminRecoveryCodes()
        setRecoveryCodes(result.recoveryCodes)
      } catch {
        setMessage("인증 앱의 코드를 확인하세요.")
      }
    })
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMessage(null)
    startTransition(async () => {
      try {
        await requestAdminPasswordChange({
          currentPassword: String(form.get("currentPassword") ?? ""),
          newPassword: String(form.get("newPassword") ?? ""),
        })
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`)
      } catch {
        setMessage("비밀번호를 변경하지 못했습니다.")
      }
    })
  }

  if (recoveryCodes !== null) {
    return (
      <MfaCard title="복구 코드를 안전하게 보관하세요">
        <p>각 코드는 한 번만 사용할 수 있으며 서버에는 해시만 저장됩니다.</p>
        <ol className="grid grid-cols-2 gap-2 font-mono">
          {recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ol>
        <Button className="w-full" onClick={() => router.replace(nextPath)}>
          저장을 완료했어요
        </Button>
      </MfaCard>
    )
  }

  return (
    <MfaCard title={enrollmentRequired ? "MFA 등록이 필요합니다" : "보안 설정"}>
      {message === null ? null : (
        <Alert role="status">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {enrollmentRequired ? (
        enrollment === null ? (
          <form className="grid gap-4" onSubmit={startEnrollment}>
            <PasswordField label="현재 비밀번호" name="password" />
            <Button disabled={isPending} type="submit">
              인증 앱 등록 시작
            </Button>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={finishEnrollment}>
            <p>인증 앱에 다음 키를 등록한 뒤 6자리 코드를 입력하세요.</p>
            <code className="break-all rounded-2xl bg-background p-3">
              {enrollment.secret}
            </code>
            <details>
              <summary>전체 등록 URI 보기</summary>
              <code className="break-all">{enrollment.totpURI}</code>
            </details>
            <Field>
              <FieldLabel htmlFor="admin-mfa-code">인증 코드</FieldLabel>
              <Input
                autoComplete="one-time-code"
                id="admin-mfa-code"
                name="code"
                required
              />
            </Field>
            <Button disabled={isPending} type="submit">
              MFA 등록 완료
            </Button>
          </form>
        )
      ) : (
        <form className="grid gap-4" onSubmit={changePassword}>
          <p>비밀번호를 변경하면 현재 세션을 포함한 모든 세션을 폐기합니다.</p>
          <PasswordField label="현재 비밀번호" name="currentPassword" />
          <PasswordField label="새 비밀번호" name="newPassword" />
          <Button disabled={isPending} type="submit">
            비밀번호 변경
          </Button>
        </form>
      )}
    </MfaCard>
  )
}

function MfaCard({
  children,
  title,
}: {
  readonly children: React.ReactNode
  readonly title: string
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="w-full max-w-xl space-y-5 rounded-4xl bg-surface p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </section>
    </main>
  )
}

function PasswordField({
  label,
  name,
}: {
  readonly label: string
  readonly name: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`admin-mfa-${name}`}>{label}</FieldLabel>
      <Input
        autoComplete="current-password"
        id={`admin-mfa-${name}`}
        name={name}
        required
        type="password"
      />
    </Field>
  )
}
