import type { Meta, StoryObj } from "@storybook/react"
import { IconButton } from "./icon-button"

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  args: {
    "aria-label": "icon button",
    variant: "standard",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["standard", "filled", "tonal", "outlined"],
    },
    size: { control: "radio", options: ["sm", "md", "lg"] },
  },
}

export default meta
type Story = StoryObj<typeof IconButton>

const Icon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

export const Standard: Story = {
  args: { variant: "standard", children: <Icon /> },
}
export const Filled: Story = {
  args: { variant: "filled", children: <Icon /> },
}
export const Tonal: Story = {
  args: { variant: "tonal", children: <Icon /> },
}
export const Outlined: Story = {
  args: { variant: "outlined", children: <Icon /> },
}
export const Toggle: Story = {
  args: { variant: "standard", toggle: true, children: <Icon /> },
}
