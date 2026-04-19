"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { appendReturnTo } from "@/foundation/navigation"

export function WritingSuggestionCard() {
  const router = useRouter()

  return (
    <div className="mt-8 px-4">
      <Card
        className="cursor-pointer transition-colors hover:opacity-90"
        onClick={() => router.push(appendReturnTo("/writings/new", "/home"))}
      >
        <CardContent className="flex flex-col gap-2 p-6">
          <p className="text-lg leading-7 font-semibold text-foreground">
            오늘 자유롭게 글을 써보세요
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            여정 밖에서도 자유롭게 생각을 기록할 수 있어요
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
