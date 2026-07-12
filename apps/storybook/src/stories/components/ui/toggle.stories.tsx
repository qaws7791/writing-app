import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Bold, Italic, Underline } from "lucide-react"

import { Toggle } from "@workspace/ui/components/ui/toggle"

const meta = {
  title: "Components/UI/Toggle",
  component: Toggle,
  args: {
    children: "토글",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    variant: "default",
    size: "default",
    children: "토글 버튼",
  },
}

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "아웃라인 토글",
  },
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toggle aria-label="Toggle bold">
        <Bold className="size-4" />
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle italic">
        <Italic className="size-4" />
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle underline">
        <Underline className="size-4" />
        <span>밑줄</span>
      </Toggle>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle size="sm">Small</Toggle>
      <Toggle size="default">Default</Toggle>
      <Toggle size="lg">Large</Toggle>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toggle disabled>비활성 토글</Toggle>
      <Toggle disabled variant="outline">
        비활성 아웃라인
      </Toggle>
    </div>
  ),
}

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [pressed, setPressed] = useState(false)
    return (
      <div className="flex flex-col items-center gap-4">
        <Toggle
          pressed={pressed}
          onPressedChange={setPressed}
          variant="outline"
        >
          {pressed ? "활성화됨" : "비활성화됨"}
        </Toggle>
        <span className="text-sm text-muted-foreground">
          현재 상태: {pressed ? "ON" : "OFF"}
        </span>
      </div>
    )
  },
}
