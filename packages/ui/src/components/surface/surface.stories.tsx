import type { Meta, StoryObj } from "@storybook/react"

import { Surface } from "./index"

const meta = {
  title: "Components/Surface",
  component: Surface,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "radio" },
      options: ["default", "secondary", "tertiary"],
    },
  },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default surface
 */
export const Default: Story = {
  render: () => (
    <Surface className="w-80 p-6">
      <h3 className="mb-2 text-lg font-semibold">Surface</h3>
      <p>This is content on a default surface component.</p>
    </Surface>
  ),
}

/**
 * Surface variants
 */
export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Surface variant="default" className="w-80 p-4">
        <p>Default Surface</p>
      </Surface>
      <Surface variant="secondary" className="w-80 p-4">
        <p>Secondary Surface</p>
      </Surface>
      <Surface variant="tertiary" className="w-80 p-4">
        <p>Tertiary Surface</p>
      </Surface>
    </div>
  ),
}

/**
 * Surface with content
 */
export const WithContent: Story = {
  render: () => (
    <Surface className="w-96 p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Card Title</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <button className="rounded bg-blue-500 px-4 py-2 text-white">
          Action
        </button>
      </div>
    </Surface>
  ),
}
