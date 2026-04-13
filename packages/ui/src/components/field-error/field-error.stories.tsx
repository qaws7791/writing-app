import type { Meta, StoryObj } from "@storybook/react"

import { FieldError } from "./index"

const meta = {
  title: "Components/FieldError",
  component: FieldError,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FieldError>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default field error
 */
export const Default: Story = {
  render: () => <FieldError>This field is required</FieldError>,
}

/**
 * Field error with validation message
 */
export const ValidationError: Story = {
  render: () => <FieldError>Please enter a valid email address</FieldError>,
}

/**
 * Multiple field errors
 */
export const Multiple: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <FieldError>Username is required</FieldError>
      <FieldError>Username must be at least 3 characters</FieldError>
    </div>
  ),
}
