"use client"

import Link from "next/link"
import { Controller } from "react-hook-form"

import { useResetPassword } from "@/features/auth/hooks/use-reset-password"
import { AuthPageShell } from "@/foundation/ui/auth-page-shell"
import { Button } from "@workspace/ui/components/button"
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

type ResetPasswordViewProps = {
  errorCode?: string
  token?: string
}

export default function ResetPasswordView({
  errorCode,
  token,
}: ResetPasswordViewProps) {
  const { form, state, isPending, tokenError, onSubmit } = useResetPassword({
    errorCode,
    token,
  })

  return (
    <AuthPageShell
      title="새 비밀번호 설정"
      description="재설정 링크의 토큰을 사용해 새로운 비밀번호를 저장합니다."
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span>로그인 화면으로 돌아가려면</span>
          <Link
            className="font-medium text-foreground underline"
            href="/sign-in"
          >
            로그인
          </Link>
        </div>
      }
    >
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">비밀번호 변경</CardTitle>
        <CardDescription>
          완료 후에는 새 비밀번호로 다시 로그인해야 합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {state.status === "completed" ? (
          <div className="space-y-3 rounded-[1.5rem] border border-foreground/10 bg-muted/60 p-5">
            <p className="text-lg font-semibold">변경이 완료되었습니다.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              새 비밀번호로 다시 로그인해 주세요.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex text-sm font-medium text-foreground underline"
            >
              로그인 화면으로 이동
            </Link>
          </div>
        ) : tokenError ? (
          <div className="space-y-3 rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            <p className="font-semibold">{tokenError}</p>
            <p className="leading-7">
              새 링크가 필요하면 비밀번호 재설정 요청을 다시 진행해 주세요.
            </p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={onSubmit}>
            <FieldGroup>
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>새 비밀번호</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="8자 이상"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      새 비밀번호 확인
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="한 번 더 입력"
                    />
                    <FieldDescription>
                      두 입력값이 같아야 재설정이 완료됩니다.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldError>
              {state.status === "error" ? state.message : null}
            </FieldError>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "변경 중..." : "새 비밀번호 저장"}
            </Button>
          </form>
        )}
      </CardContent>
    </AuthPageShell>
  )
}
