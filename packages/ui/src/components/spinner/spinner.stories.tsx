import type { Meta, StoryObj } from "@storybook/react"

import { Spinner } from "./index"

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
    color: {
      control: { type: "radio" },
      options: ["default", "accent", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default spinner
 */
export const Default: Story = {
  render: () => <Spinner />,
}

/**
 * Spinner sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-8">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
}

/**
 * Spinner colors
 */
export const Colors: Story = {
  render: () => (
    <div className="flex gap-8">
      <Spinner color="default" />
      <Spinner color="accent" />
      <Spinner color="success" />
      <Spinner color="warning" />
      <Spinner color="danger" />
    </div>
  ),
}

/**
 * Spinner with text
 */
export const WithText: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-2">
      <Spinner />
      <p className="text-sm">Loading...</p>
    </div>
  ),
}
