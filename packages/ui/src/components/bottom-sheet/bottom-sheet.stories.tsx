import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { BottomSheet } from "./bottom-sheet"

const meta: Meta<typeof BottomSheet> = {
  title: "Components/BottomSheet",
  component: BottomSheet,
}

export default meta
type Story = StoryObj<typeof BottomSheet>

export const Default: Story = {
  render: function BottomSheetStory() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
          onClick={() => setOpen(true)}
        >
          Open BottomSheet
        </button>
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title="제목"
          description="설명 텍스트가 여기에 표시됩니다."
        >
          <div className="flex flex-col gap-4">
            <p className="text-body-large text-on-surface">
              Bottom Sheet 내용입니다.
            </p>
            <p className="text-body-medium text-on-surface-low">
              스크롤 가능한 콘텐츠 영역입니다.
            </p>
          </div>
        </BottomSheet>
      </>
    )
  },
}

export const WithoutTitle: Story = {
  render: function BottomSheetNoTitle() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
          onClick={() => setOpen(true)}
        >
          Open
        </button>
        <BottomSheet open={open} onOpenChange={setOpen}>
          <p className="text-body-large text-on-surface">제목 없는 바텀시트</p>
        </BottomSheet>
      </>
    )
  },
}
