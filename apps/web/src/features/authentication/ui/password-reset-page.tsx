"use client"

import { useState, useTransition, type FormEvent } from "react"
import Link from "next/link"
import { isLearnerAuthClientError } from "@workspace/auth/learner/client"

import { resetPassword } from "@/features/authentication/api/auth-client"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"

export function PasswordResetPage({
  token,
}: {
  readonly token: string | undefined
}) {
  const [feedback, setFeedback] = useState<string | null>(
    token === undefined
      ? "재설정 링크가 만료되었거나 이미 사용되었습니다."
      : null
  )
  const [isCompleted, setIsCompleted] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (token === undefined) return

    const formData = new FormData(event.currentTarget)
    const newPassword = String(formData.get("new-password") ?? "")
    const passwordConfirmation = String(
      formData.get("password-confirmation") ?? ""
    )

    if (newPassword.length < 12) {
      setFeedback("비밀번호는 12자 이상으로 입력해 주세요.")
      return
    }
    if (newPassword !== passwordConfirmation) {
      setFeedback("새 비밀번호가 서로 일치하지 않습니다.")
      return
    }

    setFeedback(null)
    startTransition(async () => {
      try {
        await resetPassword({ newPassword, token })
        setIsCompleted(true)
      } catch (error) {
        setFeedback(readResetFailure(error))
      }
    })
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em]">
          비밀번호 재설정
        </h1>
        {isCompleted ? (
          <>
            <Alert role="status">
              <AlertDescription>
                비밀번호를 변경했습니다. 모든 기존 로그인은 종료되었습니다.
              </AlertDescription>
            </Alert>
            <Link
              className={buttonVariants({
                className: "w-full",
                size: "lg",
                variant: "default",
              })}
              href="/login"
            >
              새 비밀번호로 로그인하기
            </Link>
          </>
        ) : (
          <form className="grid gap-4" onSubmit={submitReset}>
            <PasswordField label="새 비밀번호" name="new-password" />
            <PasswordField
              label="새 비밀번호 확인"
              name="password-confirmation"
            />
            <Button
              className="w-full"
              disabled={isPending || token === undefined}
              size="lg"
              type="submit"
              variant="default"
            >
              {isPending ? "변경 중…" : "비밀번호 변경하기"}
            </Button>
          </form>
        )}

        {feedback === null ? null : (
          <Alert role="alert" variant="destructive">
            <AlertDescription>{feedback}</AlertDescription>
          </Alert>
        )}
      </div>
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
      <FieldLabel htmlFor={`learner-${name}`}>{label}</FieldLabel>
      <Input
        autoComplete="new-password"
        id={`learner-${name}`}
        maxLength={128}
        name={name}
        required
        type="password"
      />
    </Field>
  )
}

function readResetFailure(error: unknown): string {
  if (isLearnerAuthClientError(error) && error.code === "invalid-reset-token") {
    return "재설정 링크가 만료되었거나 이미 사용되었습니다."
  }
  if (isLearnerAuthClientError(error) && error.code === "weak-password") {
    return "비밀번호는 12자 이상으로 입력해 주세요."
  }

  return "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요."
}
