import type { Meta, StoryObj } from "@storybook/react"
import { ScrollArea } from "./scroll-area"

const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-2xl border border-outline/20 p-4">
      <div className="space-y-4">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-body-medium text-on-surface">
            항목 {i + 1}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea
      orientation="horizontal"
      className="w-64 rounded-2xl border border-outline/20 p-4"
    >
      <div className="flex w-max gap-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-surface-container text-body-medium text-on-surface"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}
