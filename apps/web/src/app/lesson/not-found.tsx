import Link from "next/link"

import { Button } from "@workspace/ui/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="m-0 text-2xl/8 font-bold tracking-normal">
          레슨을 찾을 수 없습니다
        </h1>
        <p className="m-0 text-sm/6 text-muted-foreground">
          요청한 레슨이 없거나 아직 연결되지 않았습니다. 코스 목록에서 다시
          선택해주세요.
        </p>
        <Button nativeButton={false} render={<Link href="/app/courses" />}>
          코스 목록으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
