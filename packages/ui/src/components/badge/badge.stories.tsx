import type { Meta, StoryObj } from "@storybook/react"

import { Badge } from "./index"

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: { type: "radio" },
      options: ["default", "accent", "success", "warning", "danger"],
    },
    placement: {
      control: { type: "radio" },
      options: ["top-right", "top-left", "bottom-right", "bottom-left"],
    },
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: { type: "radio" },
      options: ["primary", "secondary"],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default badge
 */
export const Default: Story = {
  render: () => (
    <Badge.Anchor>
      <div className="h-12 w-12 rounded bg-gray-200" />
      <Badge>5</Badge>
    </Badge.Anchor>
  ),
}

/**
 * Badge with color variants
 */
export const Colors: Story = {
  render: () => (
    <div className="flex gap-8">
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge color="default">3</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge color="accent">5</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge color="success">7</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge color="warning">2</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge color="danger">1</Badge>
      </Badge.Anchor>
    </div>
  ),
}

/**
 * Badge with placement variants
 */
export const Placements: Story = {
  render: () => (
    <div className="flex gap-16">
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge placement="top-right">1</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge placement="top-left">2</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge placement="bottom-right">3</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge placement="bottom-left">4</Badge>
      </Badge.Anchor>
    </div>
  ),
}

/**
 * Badge sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-8">
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge size="sm">5</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge size="md">10</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <div className="h-12 w-12 rounded bg-gray-200" />
        <Badge size="lg">99+</Badge>
      </Badge.Anchor>
    </div>
  ),
}
