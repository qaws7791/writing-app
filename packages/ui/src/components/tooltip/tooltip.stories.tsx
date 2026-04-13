import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { Tooltip } from "./index"

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placement: {
      control: { type: "radio" },
      options: [
        "top",
        "bottom",
        "left",
        "right",
        "top start",
        "top end",
        "bottom start",
        "bottom end",
      ],
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default tooltip
 */
export const Default: Story = {
  render: () => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button variant="outline">Hover me</Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        This is a tooltip
      </Tooltip.Content>
    </Tooltip.Root>
  ),
}

/**
 * Tooltip positions
 */
export const Positions: Story = {
  render: () => (
    <div className="flex items-center justify-center gap-4">
      <Tooltip.Root placement="top">
        <Tooltip.Trigger asChild>
          <Button size="sm">Top</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Top tooltip</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root placement="bottom">
        <Tooltip.Trigger asChild>
          <Button size="sm">Bottom</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Bottom tooltip</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root placement="left">
        <Tooltip.Trigger asChild>
          <Button size="sm">Left</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Left tooltip</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root placement="right">
        <Tooltip.Trigger asChild>
          <Button size="sm">Right</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Right tooltip</Tooltip.Content>
      </Tooltip.Root>
    </div>
  ),
}

/**
 * Tooltip with detailed content
 */
export const Detailed: Story = {
  render: () => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button variant="outline">Info</Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <div className="max-w-xs">
          <p className="font-semibold">Tooltip Title</p>
          <p className="text-sm">
            This is a longer tooltip with more detailed information
          </p>
        </div>
      </Tooltip.Content>
    </Tooltip.Root>
  ),
}
