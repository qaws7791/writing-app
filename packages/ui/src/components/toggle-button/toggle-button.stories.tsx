import type { Meta, StoryObj } from "@storybook/react"

import { ToggleButton } from "./index"

const meta = {
  title: "Components/ToggleButton",
  component: ToggleButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: { type: "radio" },
      options: ["primary", "secondary", "outline"],
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ToggleButton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default toggle button
 */
export const Default: Story = {
  render: () => <ToggleButton.Root>Toggle</ToggleButton.Root>,
}

/**
 * Toggle button selected
 */
export const Selected: Story = {
  render: () => <ToggleButton.Root defaultSelected>Selected</ToggleButton.Root>,
}

/**
 * Toggle button variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <ToggleButton.Root variant="primary">Primary</ToggleButton.Root>
      <ToggleButton.Root variant="secondary">Secondary</ToggleButton.Root>
      <ToggleButton.Root variant="outline">Outline</ToggleButton.Root>
    </div>
  ),
}

/**
 * Toggle button sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-2">
      <ToggleButton.Root size="sm">Small</ToggleButton.Root>
      <ToggleButton.Root size="md">Medium</ToggleButton.Root>
      <ToggleButton.Root size="lg">Large</ToggleButton.Root>
    </div>
  ),
}

/**
 * Disabled toggle button
 */
export const Disabled: Story = {
  render: () => <ToggleButton.Root isDisabled>Disabled</ToggleButton.Root>,
}
