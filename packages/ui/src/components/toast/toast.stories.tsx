import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { Toast, ToastProvider, toast } from "./index"

const meta = {
  title: "Components/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default toast
 */
export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <ToastProvider placement="bottom" />
      <Button
        variant="secondary"
        onPress={() =>
          toast("알림", {
            description: "토스트 알림이 표시됩니다",
          })
        }
      >
        기본 토스트 표시
      </Button>
    </div>
  ),
}

/**
 * Toast with action
 */
export const WithAction: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <ToastProvider placement="bottom" />
      <Button
        variant="secondary"
        onPress={() =>
          toast.success("저장 완료", {
            description: "변경사항이 저장되었습니다",
            actionProps: {
              children: "실행 취소",
              onPress: () => toast.clear(),
            },
          })
        }
      >
        액션 포함 토스트 표시
      </Button>
    </div>
  ),
}

/**
 * Toast variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <ToastProvider placement="bottom" />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onPress={() => toast("기본 알림")}>
          기본
        </Button>
        <Button variant="secondary" onPress={() => toast.success("성공 알림")}>
          성공
        </Button>
        <Button variant="secondary" onPress={() => toast.error("오류 알림")}>
          오류
        </Button>
        <Button variant="secondary" onPress={() => toast.warning("경고 알림")}>
          경고
        </Button>
        <Button variant="secondary" onPress={() => toast.info("정보 알림")}>
          정보
        </Button>
      </div>
    </div>
  ),
}
