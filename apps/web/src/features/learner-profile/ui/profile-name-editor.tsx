"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "@workspace/http-client/learner"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/ui/dialog"
import { Input } from "@workspace/ui/components/ui/input"
import { Label } from "@workspace/ui/components/ui/label"
import { PencilIcon } from "lucide-react"

import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"

type ProfileNameEditorMessage = Readonly<{ kind: "error"; text: string }>

export function ProfileNameEditor({
  currentName,
}: {
  readonly currentName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<ProfileNameEditorMessage | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setMessage(null)
    }
  }

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

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label="표시 이름 수정"
            className="text-muted-foreground hover:text-foreground"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <PencilIcon aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>표시 이름 수정</DialogTitle>
        </DialogHeader>
        <form
          aria-label="프로필 이름 수정"
          className="flex flex-col gap-3"
          key={`${currentName}-${open}`}
          onSubmit={submitName}
        >
          <div>
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
          <Alert role="alert" tone="danger">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
