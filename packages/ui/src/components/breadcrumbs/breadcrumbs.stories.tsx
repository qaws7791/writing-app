import type { Meta, StoryObj } from "@storybook/react"

import { Breadcrumbs } from "./index"

const meta = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default breadcrumbs with 4 levels
 */
export const Default: Story = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#">Products</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#">Electronics</Breadcrumbs.Item>
      <Breadcrumbs.Item>Laptop</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
}

/**
 * 3-level breadcrumbs
 */
export const ThreeLevels: Story = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#">Category</Breadcrumbs.Item>
      <Breadcrumbs.Item>Current Page</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
}

/**
 * 2-level breadcrumbs
 */
export const TwoLevels: Story = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item>Current Page</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
}

/**
 * Disabled breadcrumbs — all links are non-interactive
 */
export const Disabled: Story = {
  render: () => (
    <Breadcrumbs isDisabled>
      <Breadcrumbs.Item href="#">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#">Products</Breadcrumbs.Item>
      <Breadcrumbs.Item>Laptop</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
}

/**
 * Breadcrumbs used in a page header context
 */
export const PageHeader: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Breadcrumbs>
        <Breadcrumbs.Item href="#">Dashboard</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#">Settings</Breadcrumbs.Item>
        <Breadcrumbs.Item>Profile</Breadcrumbs.Item>
      </Breadcrumbs>
      <h1 className="text-2xl font-semibold">Profile Settings</h1>
    </div>
  ),
}
