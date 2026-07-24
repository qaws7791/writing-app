"use client"

import {
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react"
import {
  isLearnerAuthClientError,
  type LearnerAuthClientErrorCode,
} from "@workspace/auth/learner/client"

import {
  requestEmailLogin,
  requestEmailSignUp,
  requestGoogleLogin,
  requestPasswordReset,
  requestVerificationEmail,
} from "@/features/authentication/api/auth-client"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

type AuthPageProps = {
  readonly authenticationStatus?: "provider-failed" | undefined
  readonly nextPath: string
  readonly verificationStatus?: "failed" | "verified" | undefined
}

type AuthMode = "login" | "reset-request" | "signup"

type AuthFeedback = Readonly<{
  message: string
  tone: "danger" | "success"
}>

export function AuthPage({
  authenticationStatus,
  nextPath,
  verificationStatus,
}: AuthPageProps) {
  const [feedback, setFeedback] = useState<AuthFeedback | null>(() =>
    readInitialFeedback({ authenticationStatus, verificationStatus })
  )
  const [mode, setMode] = useState<AuthMode>("login")
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null
  )
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    readHydrated,
    readNotHydrated
  )
  const [isPending, startTransition] = useTransition()
  const authActionsDisabled = !isHydrated || isPending

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode)
    setFeedback(null)
  }

  function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const name = String(formData.get("name") ?? "").trim()

    setFeedback(null)
    if (mode === "reset-request") {
      startTransition(async () => {
        try {
          await requestPasswordReset(email)
          setFeedback({
            message:
              "가입된 주소라면 비밀번호 재설정 메일을 보냈습니다. 받은편지함을 확인해 주세요.",
            tone: "success",
          })
        } catch (error) {
          setFeedback(readAuthenticationFailure(error))
        }
      })
      return
    }

    if (mode === "signup" && password.length < 12) {
      setFeedback({
        message: readAuthenticationFailureMessage("weak-password"),
        tone: "danger",
      })
      return
    }

    startTransition(async () => {
      try {
        if (mode === "signup") {
          await requestEmailSignUp({ email, name, nextPath, password })
          setVerificationEmail(email)
          setFeedback({
            message:
              "입력한 주소로 확인 메일을 보냈습니다. 이미 가입한 주소라면 로그인해 주세요.",
            tone: "success",
          })
          return
        }

        await requestEmailLogin({ email, nextPath, password })
      } catch (error) {
        if (
          isLearnerAuthClientError(error) &&
          error.code === "email-not-verified"
        ) {
          setVerificationEmail(email)
        }
        setFeedback(readAuthenticationFailure(error))
      }
    })
  }

  function resendVerification() {
    if (verificationEmail === null) return

    setFeedback(null)
    startTransition(async () => {
      try {
        await requestVerificationEmail({
          email: verificationEmail,
          nextPath,
        })
        setFeedback({
          message:
            "확인 메일을 다시 보냈습니다. 받은편지함과 스팸함을 확인해 주세요.",
          tone: "success",
        })
      } catch (error) {
        setFeedback(readAuthenticationFailure(error))
      }
    })
  }

  const loginWithGoogle = () => {
    void requestGoogleLogin(nextPath)
  }
  return (
    <main className="an-fi flex min-h-[80vh] flex-col items-center justify-center px-6 py-10">
      <div aria-hidden="true" className="mb-6 text-display-md">
        ✍️
      </div>
      <h1 className="mb-3 text-center text-display-md font-black">글결.</h1>
      <p className="mb-8 text-center text-body-lg font-medium text-muted-foreground">
        매일 한 단락씩, 글의 결을 다듬는 한국어 글쓰기 학습
      </p>
      <div className="w-full max-w-sm space-y-5">
        <div
          aria-label="인증 방식 선택"
          className="grid grid-cols-2 gap-2"
          role="group"
        >
          <Button
            aria-pressed={mode === "login"}
            disabled={authActionsDisabled}
            onClick={() => selectMode("login")}
            type="button"
            variant={mode === "login" ? "default" : "secondary"}
          >
            로그인
          </Button>
          <Button
            aria-pressed={mode === "signup"}
            disabled={authActionsDisabled}
            onClick={() => selectMode("signup")}
            type="button"
            variant={mode === "signup" ? "default" : "secondary"}
          >
            가입
          </Button>
        </div>

        <form className="grid gap-4" onSubmit={submitCredentials}>
          {mode === "signup" ? (
            <AuthInput
              autoComplete="name"
              label="이름"
              maxLength={100}
              name="name"
              type="text"
            />
          ) : null}
          <AuthInput
            autoComplete="email"
            label="이메일"
            maxLength={320}
            name="email"
            type="email"
          />
          {mode === "reset-request" ? null : (
            <AuthInput
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              description={
                mode === "signup" ? "비밀번호는 12자 이상이어야 합니다." : null
              }
              label="비밀번호"
              maxLength={128}
              name="password"
              type="password"
            />
          )}
          <Button
            className="w-full"
            disabled={authActionsDisabled}
            size="extra"
            type="submit"
            variant="ink"
          >
            {isPending
              ? "처리 중…"
              : mode === "signup"
                ? "이메일로 가입하기"
                : mode === "reset-request"
                  ? "재설정 링크 받기"
                  : "이메일로 로그인하기"}
          </Button>
        </form>

        {mode === "login" ? (
          <Button
            className="w-full"
            disabled={authActionsDisabled}
            onClick={() => selectMode("reset-request")}
            type="button"
            variant="ghost"
          >
            비밀번호를 잊으셨나요?
          </Button>
        ) : mode === "reset-request" ? (
          <Button
            className="w-full"
            disabled={authActionsDisabled}
            onClick={() => selectMode("login")}
            type="button"
            variant="ghost"
          >
            로그인으로 돌아가기
          </Button>
        ) : null}

        {feedback === null ? null : (
          <Alert
            role={feedback.tone === "success" ? "status" : "alert"}
            tone={feedback.tone}
          >
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}

        {verificationEmail === null ? null : (
          <Button
            className="w-full"
            disabled={authActionsDisabled}
            onClick={resendVerification}
            type="button"
            variant="secondary"
          >
            확인 메일 다시 보내기
          </Button>
        )}

        {mode === "reset-request" ? null : (
          <>
            <div className="flex items-center gap-3" role="separator">
              <span className="h-px flex-1 bg-border" />
              <span className="text-label-md text-muted-foreground">또는</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              className="w-full"
              disabled={authActionsDisabled}
              onClick={loginWithGoogle}
              size="extra"
              type="button"
              variant="ink"
            >
              <GoogleIcon className="h-6 w-6" />
              Google로 계속하기
            </Button>
          </>
        )}
      </div>
    </main>
  )
}

function subscribeToHydration(): () => void {
  return () => {}
}

function readHydrated(): true {
  return true
}

function readNotHydrated(): false {
  return false
}

function AuthInput({
  autoComplete,
  description,
  label,
  maxLength,
  name,
  type,
}: {
  readonly autoComplete: string
  readonly description?: string | null
  readonly label: string
  readonly maxLength: number
  readonly name: string
  readonly type: string
}) {
  const descriptionId =
    description === null || description === undefined
      ? undefined
      : `learner-auth-${name}-description`

  return (
    <Field>
      <FieldLabel htmlFor={`learner-auth-${name}`}>{label}</FieldLabel>
      <Input
        aria-describedby={descriptionId}
        autoComplete={autoComplete}
        id={`learner-auth-${name}`}
        maxLength={maxLength}
        name={name}
        required
        type={type}
      />
      {descriptionId === undefined ? null : (
        <p className="text-label-md text-muted-foreground" id={descriptionId}>
          {description}
        </p>
      )}
    </Field>
  )
}

function readInitialFeedback(
  input: Pick<AuthPageProps, "authenticationStatus" | "verificationStatus">
): AuthFeedback | null {
  if (input.authenticationStatus === "provider-failed") {
    return {
      message:
        "Google 계정을 연결하지 못했습니다. 잠시 후 다시 시도하거나 이메일로 로그인해 주세요.",
      tone: "danger",
    }
  }
  if (input.verificationStatus === "verified") {
    return {
      message: "이메일 확인이 완료되었습니다. 이제 로그인해 주세요.",
      tone: "success",
    }
  }
  if (input.verificationStatus === "failed") {
    return {
      message:
        "확인 링크가 만료되었거나 올바르지 않습니다. 다시 요청해 주세요.",
      tone: "danger",
    }
  }
  return null
}

function readAuthenticationFailure(error: unknown): AuthFeedback {
  if (!isLearnerAuthClientError(error)) {
    return {
      message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      tone: "danger",
    }
  }

  return {
    message: readAuthenticationFailureMessage(error.code),
    tone: "danger",
  }
}

function readAuthenticationFailureMessage(
  code: LearnerAuthClientErrorCode
): string {
  switch (code) {
    case "duplicate-email":
      return "이미 가입된 이메일입니다. 로그인해 주세요."
    case "email-delivery-failed":
      return "확인 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요."
    case "email-not-verified":
      return "이메일 확인을 먼저 완료해 주세요."
    case "invalid-credentials":
      return "이메일 또는 비밀번호를 확인해 주세요."
    case "invalid-email":
      return "올바른 이메일 주소를 입력해 주세요."
    case "invalid-reset-token":
      return "재설정 링크가 만료되었거나 이미 사용되었습니다."
    case "rate-limited":
      return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
    case "weak-password":
      return "비밀번호는 12자 이상으로 입력해 주세요."
    case "unknown":
      return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
  }
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="white"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="white"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="white"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="white"
      />
    </svg>
  )
}
