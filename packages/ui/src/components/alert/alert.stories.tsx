import type { Meta, StoryObj } from "@storybook/react"

import { Alert } from "./index"

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: { type: "radio" },
      options: ["default", "accent", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default alert with info status
 */
export const Default: Story = {
  render: () => (
    <Alert status="default">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Information</Alert.Title>
        <Alert.Description>This is a default alert message</Alert.Description>
      </Alert.Content>
    </Alert>
  ),
}

/**
 * Alert with accent status
 */
export const Accent: Story = {
  render: () => (
    <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Notice</Alert.Title>
        <Alert.Description>This is an accent alert message</Alert.Description>
      </Alert.Content>
    </Alert>
  ),
}

/**
 * Alert with success status
 */
export const Success: Story = {
  render: () => (
    <Alert status="success">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Success</Alert.Title>
        <Alert.Description>
          Your operation completed successfully
        </Alert.Description>
      </Alert.Content>
    </Alert>
  ),
}

/**
 * Alert with warning status
 */
export const Warning: Story = {
  render: () => (
    <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Warning</Alert.Title>
        <Alert.Description>
          Please review this warning message
        </Alert.Description>
      </Alert.Content>
    </Alert>
  ),
}

/**
 * Alert with danger status
 */
export const Danger: Story = {
  render: () => (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>An error has occurred</Alert.Description>
      </Alert.Content>
    </Alert>
  ),
}

/**
 * All alert status variants in a grid layout
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert status="default">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Default</Alert.Title>
          <Alert.Description>Default alert message</Alert.Description>
        </Alert.Content>
      </Alert>
      <Alert status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Accent</Alert.Title>
          <Alert.Description>Accent alert message</Alert.Description>
        </Alert.Content>
      </Alert>
      <Alert status="success">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Success</Alert.Title>
          <Alert.Description>Success alert message</Alert.Description>
        </Alert.Content>
      </Alert>
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Warning</Alert.Title>
          <Alert.Description>Warning alert message</Alert.Description>
        </Alert.Content>
      </Alert>
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Danger</Alert.Title>
          <Alert.Description>Danger alert message</Alert.Description>
        </Alert.Content>
      </Alert>
    </div>
  ),
}
