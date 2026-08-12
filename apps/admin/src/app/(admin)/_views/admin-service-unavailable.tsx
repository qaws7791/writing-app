import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/primitives/button"
import { Card, CardContent } from "@workspace/ui/components/primitives/card"

export function AdminServiceUnavailable({
  retryHref,
}: {
  readonly retryHref: string
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <Card className="max-w-md text-center">
        <CardContent>
          <h1 className="font-heading text-xl font-semibold">
            관리자 서비스를 불러올 수 없습니다.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            잠시 후 다시 시도해 주세요. 로그인 상태는 그대로 유지됩니다.
          </p>
          <Link
            className={buttonVariants({ className: "mt-6" })}
            href={retryHref}
          >
            다시 시도
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
