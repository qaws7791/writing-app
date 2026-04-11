import type { Meta, StoryObj } from "@storybook/react"
import { LoadingIndicator } from "./loading-indicator"

const meta = {
  title: "Components/LoadingIndicator",
  component: LoadingIndicator,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LoadingIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: { size: "sm" },
}

export const Medium: Story = {
  args: { size: "md" },
}

export const Large: Story = {
  args: { size: "lg" },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <LoadingIndicator size="sm" />
      <LoadingIndicator size="md" />
      <LoadingIndicator size="lg" />
    </div>
  ),
}
