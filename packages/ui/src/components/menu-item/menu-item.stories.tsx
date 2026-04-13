import type { Meta, StoryObj } from "@storybook/react"

import { Dropdown } from "@workspace/ui/components/dropdown"

import { MenuItem } from "./index"

const meta = {
  title: "Components/MenuItem",
  component: MenuItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MenuItem>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default menu item — shown inside a Dropdown menu
 */
export const Default: Story = {
  render: () => (
    <Dropdown.Root>
      <Dropdown.Trigger>Open Menu</Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <MenuItem.Root>Edit</MenuItem.Root>
          <MenuItem.Root>Duplicate</MenuItem.Root>
          <MenuItem.Root>Delete</MenuItem.Root>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  ),
}

/**
 * Menu item with indicator (selection state)
 */
export const WithIndicator: Story = {
  render: () => (
    <Dropdown.Root>
      <Dropdown.Trigger>Open Menu</Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu selectionMode="single" defaultSelectedKeys={["save"]}>
          <MenuItem.Root id="save">
            <MenuItem.Indicator />
            Save
          </MenuItem.Root>
          <MenuItem.Root id="saveAs">
            <MenuItem.Indicator />
            Save As
          </MenuItem.Root>
          <MenuItem.Root id="export">
            <MenuItem.Indicator />
            Export
          </MenuItem.Root>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  ),
}

/**
 * Menu item variants — danger variant
 */
export const Variants: Story = {
  render: () => (
    <Dropdown.Root>
      <Dropdown.Trigger>Open Menu</Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu>
          <MenuItem.Root>Edit</MenuItem.Root>
          <MenuItem.Root>Duplicate</MenuItem.Root>
          <MenuItem.Root variant="danger">Delete</MenuItem.Root>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  ),
}
