"use client"

import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"

export default function AdminAnalyticsError({
  reset,
}: {
  readonly error: Error & { readonly digest?: string }
  readonly reset: () => void
}) {
  return (
    <Card
      aria-labelledby="analytics-error-title"
      className="max-w-2xl"
      role="alert"
    >
      <CardContent>
        <h1
          className="font-heading text-xl font-semibold"
          id="analytics-error-title"
        >
          분석 화면을 불러오지 못했습니다.
        </h1>
        <p className="mt-3 text-base font-medium text-muted-foreground">
          조회 조건은 유지됩니다. 잠시 후 다시 시도해 주세요.
        </p>
        <Button className="mt-6" onClick={reset} type="button">
          다시 시도
        </Button>
      </CardContent>
    </Card>
  )
}
