import Link from "next/link"

import { Button } from "@workspace/ui/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-[720px] flex-col items-start justify-center gap-5 px-5 py-16 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-2xl/8 font-bold tracking-normal">
          코스를 찾을 수 없습니다
        </h1>
        <p className="m-0 max-w-md text-base/7 text-muted-foreground">
          요청한 코스가 없거나 아직 공개되지 않았습니다. 전체 코스 목록에서 다시
          선택해 주세요.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/app/courses" />}>
        코스 목록으로 돌아가기
      </Button>
    </div>
  )
}
