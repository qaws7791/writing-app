import Link from "next/link"

import { Button } from "@workspace/ui/components/ui/button"

export default function CourseNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="m-0 text-2xl font-bold">코스를 찾을 수 없습니다</h1>
      <p className="m-0 max-w-sm text-sm/6 text-muted-foreground">
        요청한 코스가 없거나 더 이상 제공되지 않습니다.
      </p>
      <Button nativeButton={false} render={<Link href="/app/courses" />}>
        코스 목록으로 돌아가기
      </Button>
    </main>
  )
}
