import Link from "next/link"

import { Button } from "@workspace/ui/components/ui/button"

export default function LessonNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="m-0 text-2xl font-bold">레슨을 찾을 수 없습니다</h1>
      <p className="m-0 max-w-sm text-sm/6 text-muted-foreground">
        요청한 레슨이 없거나 아직 준비되지 않았습니다.
      </p>
      <Button nativeButton={false} render={<Link href="/app/courses" />}>
        코스 목록으로 돌아가기
      </Button>
    </main>
  )
}
