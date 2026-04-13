import type { Meta, StoryObj } from "@storybook/react"

import { CloseButton } from "./index"

const meta = {
  title: "Components/CloseButton",
  component: CloseButton,
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
      options: ["default", "plain", "faded"],
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof CloseButton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default close button
 */
export const Default: Story = {
  render: () => <CloseButton aria-label="Close" />,
}

/**
 * Close button sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4">
      <CloseButton size="sm" aria-label="Close" />
      <CloseButton size="md" aria-label="Close" />
      <CloseButton size="lg" aria-label="Close" />
    </div>
  ),
}

/**
 * Close button variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <CloseButton variant="default" aria-label="Close" />
      <CloseButton variant="plain" aria-label="Close" />
      <CloseButton variant="faded" aria-label="Close" />
    </div>
  ),
}

/**
 * Disabled close button
 */
export const Disabled: Story = {
  render: () => <CloseButton isDisabled aria-label="Close" />,
}

/**
 * Close button with handler
 */
export const WithHandler: Story = {
  render: () => (
    <CloseButton aria-label="Close" onPress={() => alert("Closed!")} />
  ),
}
