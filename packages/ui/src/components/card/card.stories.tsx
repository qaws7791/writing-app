import type { Meta, StoryObj } from "@storybook/react"

import { Card } from "./index"

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "radio" },
      options: ["default", "secondary", "tertiary", "transparent"],
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default card
 */
export const Default: Story = {
  render: () => (
    <Card styling={{ width: "400px" }}>
      <Card.Header>
        <Card.Title>Card Title</Card.Title>
        <Card.Description>Card description goes here</Card.Description>
      </Card.Header>
      <Card.Content>
        <p>This is the card content area with some example text.</p>
      </Card.Content>
      <Card.Footer>
        <button className="px-4 py-2 text-sm">Cancel</button>
        <button className="px-4 py-2 text-sm">Action</button>
      </Card.Footer>
    </Card>
  ),
}

/**
 * Card variant - secondary
 */
export const Secondary: Story = {
  render: () => (
    <Card variant="secondary" styling={{ width: "400px" }}>
      <Card.Header>
        <Card.Title>Secondary Card</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>This is a secondary variant card.</p>
      </Card.Content>
    </Card>
  ),
}

/**
 * Card variant - tertiary
 */
export const Tertiary: Story = {
  render: () => (
    <Card variant="tertiary" styling={{ width: "400px" }}>
      <Card.Header>
        <Card.Title>Tertiary Card</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>This is a tertiary variant card.</p>
      </Card.Content>
    </Card>
  ),
}

/**
 * Card variant - transparent
 */
export const Transparent: Story = {
  render: () => (
    <Card variant="transparent" styling={{ width: "400px" }}>
      <Card.Header>
        <Card.Title>Transparent Card</Card.Title>
      </Card.Header>
      <Card.Content>
        <p>This is a transparent variant card.</p>
      </Card.Content>
    </Card>
  ),
}

/**
 * All card variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card variant="default" styling={{ width: "300px" }}>
        <Card.Header>
          <Card.Title>Default</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>Default variant</p>
        </Card.Content>
      </Card>
      <Card variant="secondary" styling={{ width: "300px" }}>
        <Card.Header>
          <Card.Title>Secondary</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>Secondary variant</p>
        </Card.Content>
      </Card>
      <Card variant="tertiary" styling={{ width: "300px" }}>
        <Card.Header>
          <Card.Title>Tertiary</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>Tertiary variant</p>
        </Card.Content>
      </Card>
      <Card variant="transparent" styling={{ width: "300px" }}>
        <Card.Header>
          <Card.Title>Transparent</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>Transparent variant</p>
        </Card.Content>
      </Card>
    </div>
  ),
}
