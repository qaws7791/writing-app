import type { Meta, StoryObj } from "@storybook/react"

import { Skeleton } from "./index"

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default skeleton
 */
export const Default: Story = {
  render: () => <Skeleton className="h-12 w-80 rounded" />,
}

/**
 * Text skeleton
 */
export const Text: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
    </div>
  ),
}

/**
 * Card skeleton
 */
export const Card: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Skeleton className="h-48 w-full rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  ),
}

/**
 * Avatar skeleton
 */
export const Avatar: Story = {
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
}
