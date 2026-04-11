import type { Meta, StoryObj } from "@storybook/react"
import { Tooltip } from "./tooltip"

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: {
    content: "도움말 텍스트",
    side: "top",
  },
  argTypes: {
    side: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center justify-center p-20">
      <Tooltip {...args}>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        >
          마우스를 올려보세요
        </button>
      </Tooltip>
    </div>
  ),
}

export const AllSides: Story = {
  render: () => (
    <div className="flex items-center justify-center gap-8 p-20">
      <Tooltip content="위쪽" side="top">
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
        >
          Top
        </button>
      </Tooltip>
      <Tooltip content="아래쪽" side="bottom">
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
        >
          Bottom
        </button>
      </Tooltip>
      <Tooltip content="왼쪽" side="left">
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
        >
          Left
        </button>
      </Tooltip>
      <Tooltip content="오른쪽" side="right">
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-on-primary"
        >
          Right
        </button>
      </Tooltip>
    </div>
  ),
}
