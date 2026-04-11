import type { Meta, StoryObj } from "@storybook/react"
import { Card, CardContent, CardFooter, CardHeader } from "./card"

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  args: {
    variant: "elevated",
    interactive: false,
    style: { width: 280 },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["elevated", "filled", "outlined"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Elevated: Story = {
  args: { variant: "elevated" },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <p className="text-title-medium">Card Title</p>
      </CardHeader>
      <CardContent>
        <p className="text-body-medium text-on-surface-low">
          Supporting text for the card.
        </p>
      </CardContent>
    </Card>
  ),
}

export const Filled: Story = {
  args: { variant: "filled" },
  render: (args) => (
    <Card {...args}>
      <CardContent>
        <p className="text-title-medium">Filled Card</p>
        <p className="mt-1 text-body-medium text-on-surface-low">Content</p>
      </CardContent>
    </Card>
  ),
}

export const Outlined: Story = {
  args: { variant: "outlined" },
  render: (args) => (
    <Card {...args}>
      <CardContent>
        <p className="text-title-medium">Outlined Card</p>
        <p className="mt-1 text-body-medium text-on-surface-low">Content</p>
      </CardContent>
    </Card>
  ),
}

export const Interactive: Story = {
  args: { variant: "elevated", interactive: true },
  render: (args) => (
    <Card {...args} onClick={() => alert("clicked")}>
      <CardContent>
        <p className="text-title-medium">Interactive Card</p>
        <p className="mt-1 text-body-medium text-on-surface-low">Click me</p>
      </CardContent>
      <CardFooter>
        <span className="text-label-small text-on-surface-lowest">Action</span>
      </CardFooter>
    </Card>
  ),
}
