import type { Meta, StoryObj } from "@storybook/react"
import { Skeleton } from "./skeleton"

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "rectangular", "circular"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Text: Story = {
  args: { variant: "text", width: 200, height: 16 },
}
export const Rectangular: Story = {
  args: { variant: "rectangular", width: 200, height: 100 },
}
export const Circular: Story = {
  args: { variant: "circular", size: 48 },
}

export const CardSkeleton: Story = {
  render: () => (
    <div className="flex items-start gap-3 p-4">
      <Skeleton variant="circular" size={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="80%" height={14} />
        <Skeleton variant="text" width="40%" height={14} />
      </div>
    </div>
  ),
}
