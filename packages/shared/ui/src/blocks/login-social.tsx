"use client"

import * as React from "react"

import { cn } from "#ui/lib/utils"
import { Button } from "#ui/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "#ui/components/ui/field"
import { Input } from "#ui/components/ui/input"

function ProviderMark({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <span
      className="inline-flex size-4 items-center justify-center"
      aria-hidden="true"
    >
      <span className="sr-only">{label}</span>
      {children}
    </span>
  )
}

/**
 * Social-first login: identity providers lead, email is secondary.
 * Use for consumer apps where OAuth is the expected path.
 */
export function LoginSocial({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showEmail, setShowEmail] = React.useState(false)

  return (
    <div
      data-slot="login-social"
      className={cn("flex min-h-svh w-full bg-background", className)}
      {...props}
    >
      <main className="mx-auto flex w-full max-w-[24rem] flex-col justify-center px-6 py-16">
        <header className="mb-10">
          <div className="mb-8 grid size-11 place-items-center rounded-2xl bg-foreground text-sm font-semibold tracking-[-0.02em] text-background">
            L
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-balance">
            Luma에 로그인
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            소셜 계정으로 빠르게 시작하거나 이메일로 이어가세요.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-3"
          >
            <ProviderMark label="Google">
              <svg viewBox="0 0 24 24" className="size-4" fill="none">
                <path
                  d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.3Z"
                  fill="currentColor"
                  opacity="0.9"
                />
                <path
                  d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.5 7.5 23 12 23Z"
                  fill="currentColor"
                  opacity="0.7"
                />
                <path
                  d="M5.6 13.8c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6.5H1.8C1.1 8.1.7 9.9.7 11.8c0 1.9.4 3.7 1.1 5.3l3.8-3.3Z"
                  fill="currentColor"
                  opacity="0.55"
                />
                <path
                  d="M12 5.3c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.8 15.1.7 12 .7 7.5.7 3.7 3.2 1.8 6.5l3.8 3.1C6.5 7.3 9 5.3 12 5.3Z"
                  fill="currentColor"
                  opacity="0.8"
                />
              </svg>
            </ProviderMark>
            Google로 계속
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-3"
          >
            <ProviderMark label="Apple">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4-.02-.01-2.2-.8-2.5-3.7ZM14.8 6.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 1.9-.5 2.5-1.2Z" />
              </svg>
            </ProviderMark>
            Apple로 계속
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-3"
          >
            <ProviderMark label="GitHub">
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.6.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.4-3.4-1.4-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2Z"
                />
              </svg>
            </ProviderMark>
            GitHub로 계속
          </Button>
        </div>

        <FieldSeparator className="my-7">또는</FieldSeparator>

        {!showEmail ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => setShowEmail(true)}
          >
            이메일로 계속
          </Button>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => event.preventDefault()}
          >
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="login-social-email">이메일</FieldLabel>
                <Input
                  id="login-social-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@studio.kr"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="login-social-password">
                  비밀번호
                </FieldLabel>
                <Input
                  id="login-social-password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit" size="lg" className="w-full">
              이메일로 로그인
            </Button>
          </form>
        )}

        <FieldDescription className="mt-8 text-center">
          계정이 없나요?{" "}
          <a href="#signup" className="text-foreground">
            무료로 시작
          </a>
        </FieldDescription>
      </main>
    </div>
  )
}

export default LoginSocial
