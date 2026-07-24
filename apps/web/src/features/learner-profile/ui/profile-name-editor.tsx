"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "@workspace/http-client/learner"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Label } from "@workspace/ui/components/ui/label"

import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"

type ProfileNameEditorMessage =
  | Readonly<{ kind: "error"; text: string }>
  | Readonly<{ kind: "success"; text: string }>

export function ProfileNameEditor({
  currentName,
}: {
  readonly currentName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<ProfileNameEditorMessage | null>(null)

  const submitName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const name = new FormData(form).get("name")
    if (typeof name !== "string") return

    setMessage(null)
    startTransition(async () => {
      const result = await settleLearnerApiRequest(updateProfile({ name }))
      if (result.status === "error") {
        if (isLearnerApiAuthenticationError(result.error)) {
          router.push(createLoginPagePath("/app/profile"))
          return
        }

        setMessage({ kind: "error", text: result.error.message })
        return
      }

      setMessage({
        kind: "success",
        text: "표시 이름을 저장했습니다.",
      })
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="profile-name-heading" className="mb-12">
      <h3 className="mb-6 text-heading-sm font-bold" id="profile-name-heading">
        프로필 이름
      </h3>
      <form
        aria-label="프로필 이름 수정"
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={submitName}
      >
        <div className="flex-1">
          <Label htmlFor="profile-display-name">표시 이름</Label>
          <Input
            autoComplete="name"
            className="mt-2"
            defaultValue={currentName}
            disabled={isPending}
            id="profile-display-name"
            maxLength={200}
            name="name"
            required
          />
        </div>
        <Button disabled={isPending} type="submit">
          {isPending ? "저장 중…" : "이름 저장"}
        </Button>
      </form>
      {message === null ? null : (
        <Alert
          className="mt-3"
          role={message.kind === "error" ? "alert" : "status"}
          tone={message.kind === "error" ? "danger" : "success"}
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </section>
  )
}
