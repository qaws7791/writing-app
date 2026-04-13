import type { Meta, StoryObj } from "@storybook/react"

import { Link } from "./index"

const meta = {
  title: "Components/Link",
  component: Link,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "radio" },
      options: ["primary", "secondary", "tertiary"],
    },
    isDisabled: {
      control: "boolean",
    },
    isExternal: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default link
 */
export const Default: Story = {
  render: () => <Link href="#">Click here</Link>,
}

/**
 * Link variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Link href="#" variant="primary">
        Primary Link
      </Link>
      <Link href="#" variant="secondary">
        Secondary Link
      </Link>
      <Link href="#" variant="tertiary">
        Tertiary Link
      </Link>
    </div>
  ),
}

/**
 * External link
 */
export const External: Story = {
  render: () => (
    <Link href="https://example.com" isExternal>
      External Link
    </Link>
  ),
}

/**
 * Disabled link
 */
export const Disabled: Story = {
  render: () => <Link isDisabled>Disabled Link</Link>,
}

/**
 * Link with icon
 */
export const WithIcon: Story = {
  render: () => (
    <Link href="#">
      Read More
      <Link.Icon />
    </Link>
  ),
}
