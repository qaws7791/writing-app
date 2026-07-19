"use client"

import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/ui/button"

import { requestLogout } from "@/features/authentication/api/auth-client"
import { clearLessonDraftsForUser } from "@/features/lesson-session/api/lesson-draft-storage"

export function ProfileLogoutButton({
  learnerId,
}: {
  readonly learnerId: string
}) {
  const router = useRouter()

  return (
    <Button
      className="w-full"
      onClick={() => {
        void requestLogout("/").then((path) => {
          clearLessonDraftsForUser(learnerId)
          router.push(path)
        })
      }}
      size="extra"
      type="button"
      variant="destructive"
    >
      로그아웃
    </Button>
  )
}
