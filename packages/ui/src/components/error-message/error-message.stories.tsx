import type { Meta, StoryObj } from "@storybook/react"

import { ErrorMessage } from "./index"

const meta = {
  title: "Components/ErrorMessage",
  component: ErrorMessage,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorMessage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default error message
 */
export const Default: Story = {
  render: () => (
    <ErrorMessage>
      This is an error message indicating something went wrong.
    </ErrorMessage>
  ),
}

/**
 * Error message with specific error
 */
export const WithSpecificError: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <ErrorMessage>Email is required</ErrorMessage>
      <ErrorMessage>Password must be at least 8 characters</ErrorMessage>
    </div>
  ),
}
