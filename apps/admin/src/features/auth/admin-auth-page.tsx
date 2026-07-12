"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"

import {
  requestAdminMfaRecovery,
  requestAdminPasswordLogin,
  requestAdminTotpVerification,
} from "@/lib/auth/admin-auth-client"
import { readLearnerWebOrigin } from "@/runtime-config"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

const learnerWebOrigin = readLearnerWebOrigin()
type AuthMode = "login" | "recovery" | "totp"

export function AdminAuthPage({ nextPath }: { readonly nextPath: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [verifiedNextPath, setVerifiedNextPath] = useState("/")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const result = await requestAdminPasswordLogin({
          email: String(formData.get("email") ?? ""),
          nextPath,
          password: String(formData.get("password") ?? ""),
        })

        if (result.kind === "mfa-required") {
          setVerifiedNextPath(result.nextPath)
          setMode("totp")
          return
        }
        router.replace(result.nextPath)
      } catch {
        setErrorMessage("이메일 또는 비밀번호를 확인하세요.")
      }
    })
  }

  function submitTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get("code") ?? "")
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await requestAdminTotpVerification(code)
        router.replace(verifiedNextPath)
      } catch {
        setErrorMessage("인증 앱의 6자리 코드를 확인하세요.")
      }
    })
  }

  function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await requestAdminMfaRecovery({
          code: String(formData.get("code") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        })
        setNoticeMessage(
          "복구가 완료되어 기존 세션이 모두 폐기되었습니다. 다시 로그인해 MFA를 등록하세요."
        )
        setMode("login")
      } catch {
        setErrorMessage("계정 정보 또는 사용하지 않은 복구 코드를 확인하세요.")
      }
    })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="an-fi w-full max-w-md rounded-4xl bg-surface p-8">
        <div className="mb-4 text-5xl">🔐</div>
        <h1 className="m-0 mb-2 text-[1.75rem] font-bold text-foreground">
          글결 어드민
        </h1>
        <p className="m-0 mb-6 text-[1rem] font-medium text-muted-foreground">
          {mode === "totp"
            ? "인증 앱의 일회용 코드를 입력하세요."
            : mode === "recovery"
              ? "복구 코드는 한 번만 사용할 수 있습니다."
              : "접근하려면 관리자 계정으로 로그인하세요."}
        </p>
        {noticeMessage === null ? null : (
          <Alert role="status">
            <AlertDescription>{noticeMessage}</AlertDescription>
          </Alert>
        )}
        {mode === "login" ? (
          <CredentialsForm disabled={isSubmitting} onSubmit={submitLogin} />
        ) : mode === "totp" ? (
          <TotpForm disabled={isSubmitting} onSubmit={submitTotp} />
        ) : (
          <RecoveryForm disabled={isSubmitting} onSubmit={submitRecovery} />
        )}
        {errorMessage === null ? null : (
          <Alert className="mt-3" role="alert" tone="danger">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {mode === "totp" ? (
          <Button
            className="mt-3 w-full"
            onClick={() => setMode("recovery")}
            type="button"
            variant="ghost"
          >
            인증 앱을 분실했어요
          </Button>
        ) : mode === "recovery" ? (
          <Button
            className="mt-3 w-full"
            onClick={() => setMode("login")}
            type="button"
            variant="ghost"
          >
            로그인으로 돌아가기
          </Button>
        ) : null}
        <Link
          className="mt-4 block text-center text-[0.875rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
          href={learnerWebOrigin}
        >
          ← 앱으로 돌아가기
        </Link>
      </div>
    </main>
  )
}

function CredentialsForm({
  disabled,
  onSubmit,
}: {
  readonly disabled: boolean
  readonly onSubmit: (_event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      <AuthInput
        autoComplete="email"
        label="이메일"
        name="email"
        type="email"
      />
      <AuthInput
        autoComplete="current-password"
        label="비밀번호"
        name="password"
        type="password"
      />
      <SubmitButton disabled={disabled}>로그인</SubmitButton>
    </form>
  )
}

function TotpForm({ disabled, onSubmit }: FormProps) {
  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      <AuthInput autoComplete="one-time-code" label="인증 코드" name="code" />
      <SubmitButton disabled={disabled}>인증하고 계속</SubmitButton>
    </form>
  )
}

function RecoveryForm({ disabled, onSubmit }: FormProps) {
  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      <AuthInput
        autoComplete="email"
        label="이메일"
        name="email"
        type="email"
      />
      <AuthInput
        autoComplete="current-password"
        label="비밀번호"
        name="password"
        type="password"
      />
      <AuthInput label="복구 코드" name="code" />
      <SubmitButton disabled={disabled}>MFA 복구</SubmitButton>
    </form>
  )
}

type FormProps = {
  readonly disabled: boolean
  readonly onSubmit: (_event: FormEvent<HTMLFormElement>) => void
}

function AuthInput({
  autoComplete,
  label,
  name,
  type = "text",
}: {
  readonly autoComplete?: string
  readonly label: string
  readonly name: string
  readonly type?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`admin-auth-${name}`}>{label}</FieldLabel>
      <Input
        autoComplete={autoComplete}
        className="rounded-3xl border-4 border-transparent bg-background px-5 py-4 font-medium focus:border-foreground"
        id={`admin-auth-${name}`}
        name={name}
        required
        type={type}
      />
    </Field>
  )
}

function SubmitButton({
  children,
  disabled,
}: {
  readonly children: string
  readonly disabled: boolean
}) {
  return (
    <Button
      className="w-full rounded-4xl py-4 text-[1.0625rem] font-bold"
      disabled={disabled}
      type="submit"
    >
      {children}
    </Button>
  )
}
