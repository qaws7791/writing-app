"use client"

import { useState, useTransition, type FormEvent, type ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"
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
import { useIsHydrated } from "@/shared/hooks/use-is-hydrated"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/ui/tabs"
import { cn } from "@workspace/ui/lib/utils"

type AuthPageProps = {
  readonly authenticationStatus?: "provider-failed" | undefined
  readonly nextPath: string
  readonly verificationStatus?: "failed" | "verified" | undefined
}

type AuthMode = "login" | "reset-request" | "signup"

type AuthFieldName = "email" | "form" | "password"

type AuthFeedback = Readonly<{
  field: AuthFieldName
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
  const isHydrated = useIsHydrated()
  const [isPending, startTransition] = useTransition()
  const authActionsDisabled = !isHydrated || isPending
  const tabValue = mode === "signup" ? "signup" : "login"
  const emailError =
    feedback?.tone === "danger" && feedback.field === "email"
      ? feedback.message
      : null
  const passwordError =
    feedback?.tone === "danger" && feedback.field === "password"
      ? feedback.message
      : null
  const formFeedback =
    feedback?.field === "form" || feedback?.tone === "success" ? feedback : null

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
            field: "form",
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
        field: "password",
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
            field: "form",
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
          field: "form",
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
      <header className="mb-8 text-center">
        <h1 className="text-heading-lg font-black text-fg-default">글결.</h1>
        <p className="mt-2 text-body-lg font-medium text-muted-foreground">
          매일 한 단락씩, 글의 결을 다듬는 한국어 글쓰기 학습
        </p>
      </header>

      <div className="w-full max-w-sm">
        <div className="space-y-5">
          {mode === "reset-request" ? (
            <h2 className="text-title-md font-bold text-fg-default">
              비밀번호 재설정
            </h2>
          ) : (
            <Tabs
              onValueChange={(value) => {
                selectMode(value === "signup" ? "signup" : "login")
              }}
              value={tabValue}
            >
              <TabsList className="w-full">
                <TabsTrigger disabled={authActionsDisabled} value="login">
                  로그인
                </TabsTrigger>
                <TabsTrigger disabled={authActionsDisabled} value="signup">
                  가입
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <form className="grid gap-4" onSubmit={submitCredentials}>
            <div
              aria-hidden={mode === "signup" ? undefined : true}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                mode === "signup" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <AuthInput
                  autoComplete="name"
                  label="이름"
                  maxLength={100}
                  name="name"
                  {...(mode === "signup" ? {} : { tabIndex: -1 })}
                  type="text"
                />
              </div>
            </div>
            <AuthInput
              autoComplete="email"
              error={emailError}
              label="이메일"
              maxLength={320}
              name="email"
              type="email"
            />
            {mode === "reset-request" ? null : (
              <AuthPasswordInput
                actionsDisabled={authActionsDisabled}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                description={
                  mode === "signup"
                    ? "비밀번호는 12자 이상이어야 합니다."
                    : null
                }
                error={passwordError}
                label="비밀번호"
                labelAction={
                  mode === "login" ? (
                    <AuthTextLink
                      disabled={authActionsDisabled}
                      onClick={() => selectMode("reset-request")}
                    >
                      비밀번호를 잊으셨나요?
                    </AuthTextLink>
                  ) : null
                }
                maxLength={128}
                name="password"
              />
            )}
            {formFeedback === null ? null : formFeedback.tone === "danger" ? (
              <Field>
                <FieldError>{formFeedback.message}</FieldError>
              </Field>
            ) : (
              <Field>
                <FieldDescription role="status">
                  {formFeedback.message}
                </FieldDescription>
              </Field>
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

          {mode === "reset-request" ? (
            <div className="text-center">
              <AuthTextLink
                disabled={authActionsDisabled}
                onClick={() => selectMode("login")}
              >
                로그인으로 돌아가기
              </AuthTextLink>
            </div>
          ) : null}

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
                <span className="text-label-md text-muted-foreground">
                  또는
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <GoogleSignInButton
                disabled={authActionsDisabled}
                onClick={loginWithGoogle}
              />
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function AuthTextLink({
  children,
  disabled,
  onClick,
}: {
  readonly children: ReactNode
  readonly disabled: boolean
  readonly onClick: () => void
}) {
  return (
    <button
      className="text-label-md text-muted-foreground hover:text-foreground underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function AuthInput({
  autoComplete,
  description,
  error,
  label,
  maxLength,
  name,
  tabIndex,
  type,
}: {
  readonly autoComplete: string
  readonly description?: string | null
  readonly error?: string | null
  readonly label: string
  readonly maxLength: number
  readonly name: string
  readonly tabIndex?: number
  readonly type: string
}) {
  const inputId = `learner-auth-${name}`
  const descriptionId =
    description === null || description === undefined
      ? undefined
      : `${inputId}-description`
  const errorId =
    error === null || error === undefined ? undefined : `${inputId}-error`
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        id={inputId}
        maxLength={maxLength}
        name={name}
        required={tabIndex !== -1}
        tabIndex={tabIndex}
        type={type}
      />
      {descriptionId === undefined ? null : (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {errorId === undefined ? null : (
        <FieldError id={errorId}>{error}</FieldError>
      )}
    </Field>
  )
}

function AuthPasswordInput({
  actionsDisabled,
  autoComplete,
  description,
  error,
  label,
  labelAction,
  maxLength,
  name,
}: {
  readonly actionsDisabled: boolean
  readonly autoComplete: string
  readonly description?: string | null
  readonly error?: string | null
  readonly label: string
  readonly labelAction?: ReactNode
  readonly maxLength: number
  readonly name: string
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = `learner-auth-${name}`
  const descriptionId =
    description === null || description === undefined
      ? undefined
      : `${inputId}-description`
  const errorId =
    error === null || error === undefined ? undefined : `${inputId}-error`
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex w-full items-end justify-between gap-3">
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {labelAction}
      </div>
      <div className="relative w-full">
        <Input
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          className="pr-11"
          id={inputId}
          maxLength={maxLength}
          name={name}
          required
          type={showPassword ? "text" : "password"}
        />
        <button
          aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
          aria-pressed={showPassword}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={actionsDisabled}
          onClick={() => setShowPassword((current) => !current)}
          type="button"
        >
          {showPassword ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {descriptionId === undefined ? null : (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {errorId === undefined ? null : (
        <FieldError id={errorId}>{error}</FieldError>
      )}
    </Field>
  )
}

function GoogleSignInButton({
  disabled,
  onClick,
}: {
  readonly disabled: boolean
  readonly onClick: () => void
}) {
  return (
    <button
      className="inline-flex h-16 w-full shrink-0 items-center justify-center gap-3 rounded-4xl border border-[#747775] bg-[#ffffff] px-8 text-sm leading-5 font-medium text-[#1f1f1f] outline-none transition-[transform,opacity] duration-(--motion-duration-normal) ease-(--motion-ease-press) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&:active:not(:disabled)]:transform-[scale(var(--motion-press-scale))]"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <GoogleGLogo aria-hidden="true" className="size-5 shrink-0" />
      Google로 계속하기
    </button>
  )
}

function GoogleGLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function readInitialFeedback(
  input: Pick<AuthPageProps, "authenticationStatus" | "verificationStatus">
): AuthFeedback | null {
  if (input.authenticationStatus === "provider-failed") {
    return {
      field: "form",
      message:
        "Google 계정을 연결하지 못했습니다. 잠시 후 다시 시도하거나 이메일로 로그인해 주세요.",
      tone: "danger",
    }
  }
  if (input.verificationStatus === "verified") {
    return {
      field: "form",
      message: "이메일 확인이 완료되었습니다. 이제 로그인해 주세요.",
      tone: "success",
    }
  }
  if (input.verificationStatus === "failed") {
    return {
      field: "form",
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
      field: "form",
      message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      tone: "danger",
    }
  }

  return {
    field: readAuthenticationFailureField(error.code),
    message: readAuthenticationFailureMessage(error.code),
    tone: "danger",
  }
}

function readAuthenticationFailureField(
  code: LearnerAuthClientErrorCode
): AuthFieldName {
  switch (code) {
    case "duplicate-email":
    case "invalid-email":
      return "email"
    case "weak-password":
      return "password"
    case "email-delivery-failed":
    case "email-not-verified":
    case "invalid-credentials":
    case "invalid-reset-token":
    case "rate-limited":
    case "unknown":
      return "form"
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
