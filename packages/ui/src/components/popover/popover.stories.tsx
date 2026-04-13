import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { Popover } from "./index"

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default popover
 */
export const Default: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button>Show Popover</Button>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Arrow />
        <Popover.Dialog>
          <Popover.Heading>Popover Title</Popover.Heading>
          <p>This is popover content</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  ),
}

/**
 * Popover with detailed content
 */
export const Detailed: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button>More Info</Button>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Arrow />
        <Popover.Dialog>
          <Popover.Heading>Information</Popover.Heading>
          <p>Additional details about this feature go here.</p>
          <button className="mt-3">Learn More</button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  ),
}
