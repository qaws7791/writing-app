import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  args: {
    count: 5,
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Small: Story = {
  args: { variant: "small" },
}

export const Large: Story = {
  args: { variant: "large", count: 5 },
}

export const Max: Story = {
  args: { variant: "large", count: 150, max: 99 },
}

export const Zero: Story = {
  args: { variant: "large", count: 0, showZero: true },
}
