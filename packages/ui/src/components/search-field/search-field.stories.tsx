import type { Meta, StoryObj } from "@storybook/react"

import { SearchField } from "./index"

const meta = {
  title: "Components/SearchField",
  component: SearchField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default search field
 */
export const Default: Story = {
  render: () => (
    <SearchField.Root>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search..." />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField.Root>
  ),
}

/**
 * Search field with value
 */
export const WithValue: Story = {
  render: () => (
    <SearchField.Root defaultValue="search term">
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search..." />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField.Root>
  ),
}

/**
 * Disabled search field
 */
export const Disabled: Story = {
  render: () => (
    <SearchField.Root isDisabled>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search..." />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField.Root>
  ),
}
