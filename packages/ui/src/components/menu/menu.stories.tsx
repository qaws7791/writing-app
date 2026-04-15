import type { Meta, StoryObj } from "@storybook/react"

import { MenuTrigger, Popover } from "react-aria-components"

import { Button } from "@workspace/ui/components/button"

import { Menu } from "./index"

const meta = {
  title: "Components/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default menu with a trigger button
 */
export const Default: Story = {
  render: () => (
    <MenuTrigger>
      <Button>Open Menu</Button>
      <Popover>
        <Menu>
          <Menu.Item>Edit</Menu.Item>
          <Menu.Item>Duplicate</Menu.Item>
          <Menu.Item>Delete</Menu.Item>
        </Menu>
      </Popover>
    </MenuTrigger>
  ),
}

/**
 * Menu with item indicators (checkmarks)
 */
export const WithIndicators: Story = {
  render: () => (
    <MenuTrigger>
      <Button>View options</Button>
      <Popover>
        <Menu selectionMode="multiple" defaultSelectedKeys={["grid"]}>
          <Menu.Item id="grid" textValue="Grid view">
            <Menu.ItemIndicator />
            Grid view
          </Menu.Item>
          <Menu.Item id="list" textValue="List view">
            <Menu.ItemIndicator />
            List view
          </Menu.Item>
          <Menu.Item id="compact" textValue="Compact view">
            <Menu.ItemIndicator />
            Compact view
          </Menu.Item>
        </Menu>
      </Popover>
    </MenuTrigger>
  ),
}

/**
 * Menu with sections
 */
export const WithSections: Story = {
  render: () => (
    <MenuTrigger>
      <Button>Actions</Button>
      <Popover>
        <Menu>
          <Menu.Section>
            <Menu.Item>Edit</Menu.Item>
            <Menu.Item>Duplicate</Menu.Item>
          </Menu.Section>
          <Menu.Section>
            <Menu.Item>Archive</Menu.Item>
            <Menu.Item>Delete</Menu.Item>
          </Menu.Section>
        </Menu>
      </Popover>
    </MenuTrigger>
  ),
}

/**
 * Menu with disabled items
 */
export const WithDisabledItems: Story = {
  render: () => (
    <MenuTrigger>
      <Button>File</Button>
      <Popover>
        <Menu disabledKeys={["export"]}>
          <Menu.Item id="new">New</Menu.Item>
          <Menu.Item id="open">Open</Menu.Item>
          <Menu.Item id="save">Save</Menu.Item>
          <Menu.Item id="export">Export (unavailable)</Menu.Item>
        </Menu>
      </Popover>
    </MenuTrigger>
  ),
}

/**
 * Menu with single selection mode
 */
export const SingleSelection: Story = {
  render: () => (
    <MenuTrigger>
      <Button>Sort by</Button>
      <Popover>
        <Menu selectionMode="single" defaultSelectedKeys={["name"]}>
          <Menu.Item id="name" textValue="Name">
            <Menu.ItemIndicator type="dot" />
            Name
          </Menu.Item>
          <Menu.Item id="date" textValue="Date">
            <Menu.ItemIndicator type="dot" />
            Date modified
          </Menu.Item>
          <Menu.Item id="size" textValue="Size">
            <Menu.ItemIndicator type="dot" />
            File size
          </Menu.Item>
        </Menu>
      </Popover>
    </MenuTrigger>
  ),
}
