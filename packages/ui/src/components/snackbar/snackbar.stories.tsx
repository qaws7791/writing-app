"use client"

import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { SnackbarProvider, useSnackbar } from "./snackbar"

function SnackbarDemo() {
  const { toast } = useSnackbar()

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        onClick={() => toast({ message: "저장되었습니다" })}
      >
        기본 스낵바
      </button>
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        onClick={() =>
          toast({
            message: "항목이 삭제되었습니다",
            action: { label: "되돌리기", onClick: () => {} },
          })
        }
      >
        액션 포함
      </button>
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        onClick={() => toast.error("오류가 발생했습니다")}
      >
        에러
      </button>
      <button
        type="button"
        className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        onClick={() => toast.success("성공적으로 완료되었습니다")}
      >
        성공
      </button>
    </div>
  )
}

const meta: Meta = {
  title: "Components/Snackbar",
  decorators: [
    (Story) => (
      <SnackbarProvider>
        <Story />
      </SnackbarProvider>
    ),
  ],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => <SnackbarDemo />,
}
