import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import { LogInIcon } from "@workspace/ui/components/icons"
import { createGoogleLoginPath } from "@/lib/auth/auth-navigation"

type AuthPageProps = {
  readonly nextPath: string
}

export function AuthPage({ nextPath }: AuthPageProps) {
  const googleLoginPath = createGoogleLoginPath(nextPath)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle as="h1" className="text-2xl font-semibold">
            글결에 로그인
          </CardTitle>
          <CardDescription>
            Google 계정으로 학습 기록과 AI 코칭 이력을 안전하게 이어갑니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link
            className={buttonVariants({
              className: "w-full",
              size: "lg",
            })}
            href={googleLoginPath}
          >
            <LogInIcon data-icon="inline-start" />
            Google로 계속하기
          </Link>
          <Link
            className={buttonVariants({
              className: "w-full",
              variant: "outline",
            })}
            href="/"
          >
            랜딩으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
