import type { Meta, StoryObj } from "@storybook/react"
import { Divider } from "./divider"

const meta: Meta<typeof Divider> = {
  title: "Components/Divider",
  component: Divider,
  argTypes: {
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    variant: {
      control: "select",
      options: ["full-width", "inset", "middle-inset"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Divider>

export const Horizontal: Story = {
  args: { orientation: "horizontal", variant: "full-width" },
  render: (args) => (
    <div className="w-64">
      <p className="p-2">Above</p>
      <Divider {...args} />
      <p className="p-2">Below</p>
    </div>
  ),
}

export const Inset: Story = {
  args: { orientation: "horizontal", variant: "inset" },
  render: (args) => (
    <div className="w-64">
      <p className="p-2">Above</p>
      <Divider {...args} />
      <p className="p-2">Below</p>
    </div>
  ),
}

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-16 items-center gap-4">
      <span>Left</span>
      <Divider {...args} />
      <span>Right</span>
    </div>
  ),
}
