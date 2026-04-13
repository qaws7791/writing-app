import type { Meta, StoryObj } from "@storybook/react"

import { Label } from "./index"

const meta = {
  title: "Components/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isDisabled: {
      control: "boolean",
    },
    isRequired: {
      control: "boolean",
    },
    isInvalid: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default label
 */
export const Default: Story = {
  render: () => <Label>Email Address</Label>,
}

/**
 * Required label
 */
export const Required: Story = {
  render: () => <Label isRequired>Password</Label>,
}

/**
 * Disabled label
 */
export const Disabled: Story = {
  render: () => <Label isDisabled>Disabled Field</Label>,
}

/**
 * Invalid label
 */
export const Invalid: Story = {
  render: () => <Label isInvalid>Invalid Input</Label>,
}

/**
 * Label variations
 */
export const Variations: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Label>Normal Label</Label>
      <Label isRequired>Required Label</Label>
      <Label isDisabled>Disabled Label</Label>
      <Label isInvalid>Invalid Label</Label>
    </div>
  ),
}
