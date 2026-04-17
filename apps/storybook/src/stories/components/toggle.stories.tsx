import type { Meta, StoryObj } from "@storybook/react-vite"
import { Bold, Italic, Underline } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Toggle>

export const Default: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <Bold />
    </Toggle>
  ),
}

export const Outline: Story = {
  render: () => (
    <Toggle variant="outline" aria-label="Toggle italic">
      <Italic />
    </Toggle>
  ),
}

export const WithText: Story = {
  render: () => (
    <Toggle aria-label="Toggle italic">
      <Italic />
      Italic
    </Toggle>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold" disabled>
      <Bold />
    </Toggle>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toggle aria-label="Toggle bold">
        <Bold />
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle italic">
        <Italic />
      </Toggle>
    </div>
  ),
}
