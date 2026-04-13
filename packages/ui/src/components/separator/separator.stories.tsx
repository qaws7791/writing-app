import type { Meta, StoryObj } from "@storybook/react"

import { Separator } from "./index"

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default horizontal separator
 */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <p>Content above separator</p>
      <Separator className="my-4" />
      <p>Content below separator</p>
    </div>
  ),
}

/**
 * Vertical separator
 */
export const Vertical: Story = {
  render: () => (
    <div className="flex h-32 gap-4">
      <div>Left content</div>
      <Separator orientation="vertical" />
      <div>Right content</div>
    </div>
  ),
}

/**
 * Separator in list
 */
export const InList: Story = {
  render: () => (
    <div className="w-80">
      <div className="p-2">Item 1</div>
      <Separator />
      <div className="p-2">Item 2</div>
      <Separator />
      <div className="p-2">Item 3</div>
    </div>
  ),
}
