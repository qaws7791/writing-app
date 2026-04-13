import type { Meta, StoryObj } from "@storybook/react"

import { Input } from "./index"

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "radio" },
      options: ["primary", "secondary"],
    },
    fullWidth: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default input
 */
export const Default: Story = {
  render: () => <Input placeholder="Enter text..." />,
}

/**
 * Input variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Input variant="primary" placeholder="Primary variant" />
      <Input variant="secondary" placeholder="Secondary variant" />
    </div>
  ),
}

/**
 * Full width input
 */
export const FullWidth: Story = {
  render: () => <Input fullWidth placeholder="Full width input" />,
}

/**
 * Disabled input
 */
export const Disabled: Story = {
  render: () => <Input disabled placeholder="Disabled input" />,
}

/**
 * Different input types
 */
export const Types: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
    </div>
  ),
}
