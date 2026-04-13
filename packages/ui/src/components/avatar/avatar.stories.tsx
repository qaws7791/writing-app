import type { Meta, StoryObj } from "@storybook/react"

import { Avatar } from "./index"

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
    color: {
      control: { type: "radio" },
      options: ["default", "accent", "success", "warning", "danger"],
    },
    variant: {
      control: { type: "radio" },
      options: ["default", "soft"],
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

const AVATAR_URL =
  "https://images.unsplash.com/photo-1491528323168-611cf4850d7d?w=400&h=400&fit=crop"

/**
 * Avatar with image
 */
export const Default: Story = {
  render: () => (
    <Avatar>
      <Avatar.Image src={AVATAR_URL} alt="User avatar" />
      <Avatar.Fallback>JD</Avatar.Fallback>
    </Avatar>
  ),
}

/**
 * Avatar with fallback text
 */
export const Fallback: Story = {
  render: () => (
    <Avatar>
      <Avatar.Image src="" alt="User avatar" />
      <Avatar.Fallback>JD</Avatar.Fallback>
    </Avatar>
  ),
}

/**
 * Avatar size variants
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <Avatar.Image src={AVATAR_URL} alt="Small avatar" />
        <Avatar.Fallback>SM</Avatar.Fallback>
      </Avatar>
      <Avatar size="md">
        <Avatar.Image src={AVATAR_URL} alt="Medium avatar" />
        <Avatar.Fallback>MD</Avatar.Fallback>
      </Avatar>
      <Avatar size="lg">
        <Avatar.Image src={AVATAR_URL} alt="Large avatar" />
        <Avatar.Fallback>LG</Avatar.Fallback>
      </Avatar>
    </div>
  ),
}

/**
 * Avatar color variants
 */
export const Colors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar color="default">
        <Avatar.Image src="" alt="Default" />
        <Avatar.Fallback>D1</Avatar.Fallback>
      </Avatar>
      <Avatar color="accent">
        <Avatar.Image src="" alt="Accent" />
        <Avatar.Fallback>AC</Avatar.Fallback>
      </Avatar>
      <Avatar color="success">
        <Avatar.Image src="" alt="Success" />
        <Avatar.Fallback>SU</Avatar.Fallback>
      </Avatar>
      <Avatar color="warning">
        <Avatar.Image src="" alt="Warning" />
        <Avatar.Fallback>WR</Avatar.Fallback>
      </Avatar>
      <Avatar color="danger">
        <Avatar.Image src="" alt="Danger" />
        <Avatar.Fallback>DN</Avatar.Fallback>
      </Avatar>
    </div>
  ),
}

/**
 * Avatar variants
 */
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar variant="default">
        <Avatar.Image src={AVATAR_URL} alt="Default" />
        <Avatar.Fallback>DF</Avatar.Fallback>
      </Avatar>
      <Avatar variant="soft">
        <Avatar.Image src={AVATAR_URL} alt="Soft" />
        <Avatar.Fallback>ST</Avatar.Fallback>
      </Avatar>
    </div>
  ),
}
