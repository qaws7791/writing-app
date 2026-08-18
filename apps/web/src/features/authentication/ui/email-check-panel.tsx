"use client"

import { useEffect, useRef, type ReactNode } from "react"

import { CheckCircleIcon } from "@workspace/ui/components/icons/authentication-icons"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Field,
  FieldDescription,
  FieldError,
} from "@workspace/ui/components/primitives/field"

type EmailCheckPanelProps = {
  readonly actionsDisabled: boolean
  readonly email: string
  readonly feedback: ReactNode
  readonly isPending: boolean
  readonly onBackToLogin: () => void
  readonly onResend: () => void
}

export function EmailCheckPanel({
  actionsDisabled,
  email,
  feedback,
  isPending,
  onBackToLogin,
  onResend,
}: EmailCheckPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="animate-drift-in flex flex-col">
      <div
        aria-hidden="true"
        className="mb-8 grid size-11 place-items-center rounded-2xl bg-foreground text-sm font-semibold text-background"
      >
        글
      </div>
      <div
        aria-hidden="true"
        className="mb-8 grid size-16 place-items-center rounded-3xl bg-success/12 text-success"
      >
        <CheckCircleIcon className="size-8" strokeWidth={1.75} />
      </div>
      <h1
        className="font-heading text-2xl font-semibold tracking-[-0.03em] text-balance outline-none"
        ref={headingRef}
        tabIndex={-1}
      >
        가입을 마쳤습니다
      </h1>
      <p className="mt-4 font-medium break-all text-foreground">{email}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        이 주소로 확인 메일을 보냈습니다. 받은편지함의 링크를 열면 시작할 수
        있습니다.
      </p>
      {feedback}
      <div className="mt-8 flex flex-col gap-3">
        <Button
          className="w-full"
          disabled={actionsDisabled}
          onClick={onBackToLogin}
          size="lg"
          type="button"
        >
          로그인으로 돌아가기
        </Button>
        <Button
          className="w-full"
          disabled={actionsDisabled}
          onClick={onResend}
          size="lg"
          type="button"
          variant="secondary"
        >
          {isPending ? "처리 중…" : "확인 메일 다시 보내기"}
        </Button>
      </div>
    </div>
  )
}

export function EmailCheckFeedback({
  message,
  tone,
}: {
  readonly message: string
  readonly tone: "danger" | "success"
}) {
  if (tone === "danger") {
    return (
      <Field className="mt-5">
        <FieldError>{message}</FieldError>
      </Field>
    )
  }

  return (
    <Field className="mt-5">
      <FieldDescription role="status">{message}</FieldDescription>
    </Field>
  )
}
