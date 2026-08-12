"use client"

import * as React from "react"

import { cn } from "#ui/lib/utils"
import { Button } from "#ui/components/primitives/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "#ui/components/primitives/field"
import { Input } from "#ui/components/primitives/input"

/**
 * Quiet centered login: brand-led, low chrome, soft canvas.
 * Use for editorial products that prefer calm focus over panel drama.
 */
export function LoginQuiet({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="login-quiet"
      className={cn(
        "relative flex min-h-svh w-full items-center justify-center",
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_0%,oklch(0.92_0.02_85)_0%,transparent_62%),radial-gradient(50%_40%_at_80%_100%,oklch(0.88_0.025_145_/_0.35)_0%,transparent_55%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.45_0.02_70_/_0.08)_0.6px, transparent_0.6px)",
          backgroundSize: "18px 18px",
        }}
      />

      <main className="relative w-full max-w-[22rem] px-6 py-16">
        <header className="mb-12 text-center">
          <p className="font-heading text-[2.75rem] leading-none font-semibold tracking-[-0.06em]">
            Luma
          </p>
          <h1 className="sr-only">로그인</h1>
          <p className="mt-5 text-sm leading-6 text-pretty text-muted-foreground">
            다시 오신 것을 환영합니다. 이메일로 계속하세요.
          </p>
        </header>

        <form
          className="flex flex-col gap-7"
          onSubmit={(event) => event.preventDefault()}
        >
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="login-quiet-email">이메일</FieldLabel>
              <Input
                id="login-quiet-email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.kr"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="login-quiet-password">비밀번호</FieldLabel>
              <Input
                id="login-quiet-password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
          </FieldGroup>

          <Button type="submit" size="lg" className="w-full">
            계속하기
          </Button>

          <div className="flex items-center justify-between gap-4 text-sm">
            <a
              href="#forgot"
              className="text-muted-foreground underline decoration-foreground/20 underline-offset-[0.3em] hover:text-foreground"
            >
              비밀번호 찾기
            </a>
            <a
              href="#signup"
              className="text-muted-foreground underline decoration-foreground/20 underline-offset-[0.3em] hover:text-foreground"
            >
              계정 만들기
            </a>
          </div>

          <FieldDescription className="text-center text-xs">
            계속하면{" "}
            <a href="#terms" className="text-foreground">
              이용약관
            </a>
            과{" "}
            <a href="#privacy" className="text-foreground">
              개인정보 처리방침
            </a>
            에 동의합니다.
          </FieldDescription>
        </form>
      </main>
    </div>
  )
}

export default LoginQuiet
