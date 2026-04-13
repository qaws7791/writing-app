import type { Meta, StoryObj } from "@storybook/react"

import { Chip } from "./index"

const meta = {
  title: "Components/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: { type: "radio" },
      options: ["default", "accent", "success", "warning", "danger"],
    },
    variant: {
      control: { type: "radio" },
      options: ["default", "outlined", "flat"],
    },
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default chip
 */
export const Default: Story = {
  render: () => <Chip>Tag</Chip>,
}

/**
 * Chip variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Chip variant="default">Default</Chip>
      <Chip variant="outlined">Outlined</Chip>
      <Chip variant="flat">Flat</Chip>
    </div>
  ),
}

/**
 * Chip colors
 */
export const Colors: Story = {
  render: () => (
    <div className="flex gap-2">
      <Chip color="default">Default</Chip>
      <Chip color="accent">Accent</Chip>
      <Chip color="success">Success</Chip>
      <Chip color="warning">Warning</Chip>
      <Chip color="danger">Danger</Chip>
    </div>
  ),
}

/**
 * Chip sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
      <Chip size="lg">Large</Chip>
    </div>
  ),
}

/**
 * Disabled chip
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-2">
      <Chip isDisabled>Disabled 1</Chip>
      <Chip isDisabled>Disabled 2</Chip>
    </div>
  ),
}

/**
 * Chip with icon and close button
 */
export const WithClose: Story = {
  render: () => (
    <div className="flex gap-2">
      <Chip>
        Removable
        <button aria-label="Remove chip" className="ml-1">
          ×
        </button>
      </Chip>
    </div>
  ),
}
