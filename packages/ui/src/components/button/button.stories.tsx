import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "./index"

const meta = {
  title: "Components/Button",
  component: Button,
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
      options: [
        "primary",
        "secondary",
        "tertiary",
        "outline",
        "ghost",
        "danger",
        "danger-soft",
      ],
    },
    fullWidth: {
      control: "boolean",
    },
    isIconOnly: {
      control: "boolean",
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default button story shows the primary variant with medium size
 */
export const Default: Story = {
  args: {
    children: "Button",
  },
}

/**
 * Size variations
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button size="sm">Small Button</Button>
      <Button size="md">Medium Button</Button>
      <Button size="lg">Large Button</Button>
    </div>
  ),
}

/**
 * Variant variations
 */
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="danger-soft">Danger Soft</Button>
    </div>
  ),
}

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    children: "Full Width Button",
    fullWidth: true,
  },
}

/**
 * Icon-only button
 */
export const IconOnly: Story = {
  args: {
    children: "×",
    isIconOnly: true,
    size: "md",
  },
}

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    isDisabled: true,
  },
}

/**
 * Playground with all props controllable
 */
export const Playground: Story = {
  args: {
    children: "Interactive Button",
    size: "md",
    variant: "primary",
    fullWidth: false,
    isIconOnly: false,
    isDisabled: false,
  },
}
