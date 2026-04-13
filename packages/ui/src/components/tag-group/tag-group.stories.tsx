import type { Meta, StoryObj } from "@storybook/react"

import { Tag } from "@workspace/ui/components/tag"
import { TagGroup } from "./index"

const meta = {
  title: "Components/TagGroup",
  component: TagGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TagGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default tag group
 */
export const Default: Story = {
  render: () => (
    <TagGroup.Root>
      <TagGroup.List>
        <Tag.Root>Tag 1</Tag.Root>
        <Tag.Root>Tag 2</Tag.Root>
        <Tag.Root>Tag 3</Tag.Root>
      </TagGroup.List>
    </TagGroup.Root>
  ),
}

/**
 * Tag group with removable tags
 */
export const Removable: Story = {
  render: () => (
    <TagGroup.Root>
      <TagGroup.List>
        <Tag.Root>
          React
          <Tag.RemoveButton />
        </Tag.Root>
        <Tag.Root>
          TypeScript
          <Tag.RemoveButton />
        </Tag.Root>
        <Tag.Root>
          Storybook
          <Tag.RemoveButton />
        </Tag.Root>
      </TagGroup.List>
    </TagGroup.Root>
  ),
}

/**
 * Tag group with different colors
 */
export const MultiColor: Story = {
  render: () => (
    <TagGroup.Root>
      <TagGroup.List>
        <Tag.Root color="accent">News</Tag.Root>
        <Tag.Root color="success">Verified</Tag.Root>
        <Tag.Root color="warning">Beta</Tag.Root>
        <Tag.Root color="danger">Critical</Tag.Root>
      </TagGroup.List>
    </TagGroup.Root>
  ),
}
