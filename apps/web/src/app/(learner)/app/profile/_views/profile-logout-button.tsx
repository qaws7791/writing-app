"use client"

import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/ui/button"

import { requestLogout } from "@/features/authentication/api/auth-client"

export function ProfileLogoutButton() {
  const router = useRouter()

  return (
    <Button
      className="w-full"
      onClick={() => {
        void requestLogout("/").then((path) => {
          router.push(path)
        })
      }}
      size="lg"
      type="button"
      variant="destructive"
    >
      로그아웃
    </Button>
  )
}
