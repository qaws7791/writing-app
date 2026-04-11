import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "./button"

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "filled",
    size: "md",
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["filled", "tonal", "outlined", "text", "elevated"],
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Filled: Story = { args: { variant: "filled" } }
export const Tonal: Story = { args: { variant: "tonal" } }
export const Outlined: Story = { args: { variant: "outlined" } }
export const Text: Story = { args: { variant: "text" } }
export const Elevated: Story = { args: { variant: "elevated" } }
export const Loading: Story = { args: { loading: true } }
export const Disabled: Story = { args: { disabled: true } }

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="filled">Filled</Button>
      <Button variant="tonal">Tonal</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="text">Text</Button>
      <Button variant="elevated">Elevated</Button>
    </div>
  ),
}
