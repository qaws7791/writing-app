import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Dialog, DialogClose } from "./dialog"

const meta: Meta<typeof Dialog> = {
  title: "Components/Dialog",
  component: Dialog,
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Basic: Story = {
  render: function DialogStory() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
          onClick={() => setOpen(true)}
        >
          Open Dialog
        </button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="확인"
          description="이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          actions={
            <>
              <DialogClose className="rounded-full px-6 py-2 text-label-large text-primary">
                취소
              </DialogClose>
              <button
                type="button"
                className="rounded-full bg-primary px-6 py-2 text-label-large text-on-primary"
                onClick={() => setOpen(false)}
              >
                삭제
              </button>
            </>
          }
        >
          <p className="text-body-medium text-on-surface-low">
            삭제된 글은 복구할 수 없습니다.
          </p>
        </Dialog>
      </>
    )
  },
}

export const FullScreen: Story = {
  render: function FullScreenDialogStory() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
          onClick={() => setOpen(true)}
        >
          Open Full Screen
        </button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          variant="full-screen"
          title="전체 화면 다이얼로그"
          actions={
            <DialogClose className="rounded-full bg-primary px-6 py-2 text-label-large text-on-primary">
              닫기
            </DialogClose>
          }
        >
          <p className="text-body-large text-on-surface">
            전체 화면 콘텐츠 영역입니다.
          </p>
        </Dialog>
      </>
    )
  },
}
