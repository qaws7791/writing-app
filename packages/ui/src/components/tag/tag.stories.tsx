import type { Meta, StoryObj } from "@storybook/react"

import { TagGroup } from "@workspace/ui/components/tag-group"

import { Tag } from "./index"

const meta = {
  title: "Components/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: { type: "radio" },
      options: ["default", "accent", "success", "warning", "danger"],
    },
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default tag
 */
export const Default: Story = {
  render: () => (
    <TagGroup.Root>
      <TagGroup.List>
        <Tag.Root>Tag</Tag.Root>
      </TagGroup.List>
    </TagGroup.Root>
  ),
}

/**
 * Tag with remove button
 */
export const WithRemoveButton: Story = {
  render: () => (
    <TagGroup.Root onRemove={() => {}}>
      <TagGroup.List>
        <Tag.Root>
          Tag Name
          <Tag.RemoveButton />
        </Tag.Root>
      </TagGroup.List>
    </TagGroup.Root>
  ),
}

/**
 * Tag colors
 */
export const Colors: Story = {
  render: () => (
    <TagGroup.Root>
      <TagGroup.List className="flex gap-2">
        <Tag.Root color="default">Default</Tag.Root>
        <Tag.Root color="accent">Accent</Tag.Root>
        <Tag.Root color="success">Success</Tag.Root>
        <Tag.Root color="warning">Warning</Tag.Root>
        <Tag.Root color="danger">Danger</Tag.Root>
      </TagGroup.List>
    </TagGroup.Root>
  ),
}

/**
 * Tag sizes
 */
export const Sizes: Story = {
  render: () => (
    <TagGroup.Root>
      <TagGroup.List className="flex items-center gap-2">
        <Tag.Root size="sm">Small</Tag.Root>
        <Tag.Root size="md">Medium</Tag.Root>
        <Tag.Root size="lg">Large</Tag.Root>
      </TagGroup.List>
    </TagGroup.Root>
  ),
}
