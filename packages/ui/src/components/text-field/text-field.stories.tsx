import type { Meta, StoryObj } from "@storybook/react"

import { Label } from "@workspace/ui/components/label"
import { TextField } from "./index"

const meta = {
  title: "Components/TextField",
  component: TextField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default text field
 */
export const Default: Story = {
  render: () => (
    <TextField.Root>
      <Label>Name</Label>
      <input type="text" placeholder="Enter your name" />
    </TextField.Root>
  ),
}

/**
 * Text field with value
 */
export const WithValue: Story = {
  render: () => (
    <TextField.Root>
      <Label>Email</Label>
      <input
        type="email"
        placeholder="user@example.com"
        defaultValue="john@example.com"
      />
    </TextField.Root>
  ),
}

/**
 * Disabled text field
 */
export const Disabled: Story = {
  render: () => (
    <TextField.Root isDisabled>
      <Label>Readonly</Label>
      <input type="text" placeholder="Disabled field" disabled />
    </TextField.Root>
  ),
}

/**
 * Text field with error
 */
export const WithError: Story = {
  render: () => (
    <TextField.Root isInvalid>
      <Label isInvalid>Invalid Field</Label>
      <input
        type="text"
        placeholder="This field has an error"
        aria-invalid="true"
      />
      <p className="text-sm text-red-600">This field is required</p>
    </TextField.Root>
  ),
}

/**
 * Multiple text fields
 */
export const Multiple: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <TextField.Root>
        <Label isRequired>First Name</Label>
        <input type="text" placeholder="John" />
      </TextField.Root>
      <TextField.Root>
        <Label isRequired>Last Name</Label>
        <input type="text" placeholder="Doe" />
      </TextField.Root>
      <TextField.Root>
        <Label isRequired>Email</Label>
        <input type="email" placeholder="john@example.com" />
      </TextField.Root>
    </div>
  ),
}
