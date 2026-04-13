import type { Meta, StoryObj } from "@storybook/react"

import { Description } from "./index"

const meta = {
  title: "Components/Description",
  component: Description,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Description>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default description
 */
export const Default: Story = {
  render: () => (
    <Description>
      This is a description that provides additional context or information.
    </Description>
  ),
}

/**
 * Description with longer text
 */
export const LongText: Story = {
  render: () => (
    <Description>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </Description>
  ),
}
