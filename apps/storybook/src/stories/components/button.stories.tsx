import type { Meta, StoryObj } from "@storybook/react-vite"
import { Loader2, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: [
        "default",
        "xs",
        "sm",
        "lg",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: { children: "Button" },
}

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
}

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
}

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
}

export const Destructive: Story = {
  args: { variant: "destructive", children: "Destructive" },
}

export const Link: Story = {
  args: { variant: "link", children: "Link" },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <Button>
      <Mail data-icon="inline-start" />
      Login with Email
    </Button>
  ),
}

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <Spinner data-icon="inline-start" />
      Please wait
    </Button>
  ),
}

export const Icon: Story = {
  render: () => (
    <Button size="icon" variant="outline">
      <Loader2 className="animate-spin" />
    </Button>
  ),
}

export const Rounded: Story = {
  args: { className: "rounded-full", children: "Rounded" },
}
