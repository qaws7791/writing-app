import type { Meta, StoryObj } from "@storybook/react"

import { TextArea } from "./index"

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    rows: {
      control: { type: "number" },
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof TextArea>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default textarea
 */
export const Default: Story = {
  render: () => <TextArea placeholder="Enter your message..." />,
}

/**
 * Textarea with value
 */
export const WithValue: Story = {
  render: () => (
    <TextArea defaultValue="This is some default text..." rows={3} />
  ),
}

/**
 * Disabled textarea
 */
export const Disabled: Story = {
  render: () => <TextArea disabled placeholder="Disabled textarea" rows={3} />,
}

/**
 * Textarea with different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <TextArea rows={2} placeholder="Small textarea" />
      <TextArea rows={4} placeholder="Medium textarea" />
      <TextArea rows={6} placeholder="Large textarea" />
    </div>
  ),
}
