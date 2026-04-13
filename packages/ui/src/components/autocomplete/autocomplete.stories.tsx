import type { Meta, StoryObj } from "@storybook/react"

import { useFilter } from "react-aria-components"
import { Autocomplete } from "./index"
import { ListBox } from "@workspace/ui/components/list-box"
import { SearchField } from "@workspace/ui/components/search-field"

const meta = {
  title: "Components/Autocomplete",
  component: Autocomplete,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Autocomplete>

export default meta
type Story = StoryObj<typeof meta>

function DefaultAutocomplete() {
  const { contains } = useFilter({ sensitivity: "base" })

  return (
    <Autocomplete.Root className="w-64">
      <Autocomplete.Trigger>
        <Autocomplete.Value />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains}>
          <SearchField autoFocus name="search" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox>
            <ListBox.Item id="apple" textValue="Apple">
              Apple
            </ListBox.Item>
            <ListBox.Item id="banana" textValue="Banana">
              Banana
            </ListBox.Item>
            <ListBox.Item id="cherry" textValue="Cherry">
              Cherry
            </ListBox.Item>
            <ListBox.Item id="date" textValue="Date">
              Date
            </ListBox.Item>
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete.Root>
  )
}

/**
 * Default autocomplete
 */
export const Default: Story = {
  render: () => <DefaultAutocomplete />,
}

function WithClearButtonAutocomplete() {
  const { contains } = useFilter({ sensitivity: "base" })

  return (
    <Autocomplete.Root className="w-64">
      <Autocomplete.Trigger>
        <Autocomplete.Value />
        <Autocomplete.Indicator />
        <Autocomplete.ClearButton />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains}>
          <SearchField autoFocus name="search" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox>
            <ListBox.Item id="opt1" textValue="Option 1">
              Option 1
            </ListBox.Item>
            <ListBox.Item id="opt2" textValue="Option 2">
              Option 2
            </ListBox.Item>
            <ListBox.Item id="opt3" textValue="Option 3">
              Option 3
            </ListBox.Item>
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete.Root>
  )
}

/**
 * Autocomplete with clear button
 */
export const WithClearButton: Story = {
  render: () => <WithClearButtonAutocomplete />,
}

function WithValueAutocomplete() {
  const { contains } = useFilter({ sensitivity: "base" })

  return (
    <Autocomplete.Root className="w-64" defaultSelectedKey="search">
      <Autocomplete.Trigger>
        <Autocomplete.Value />
        <Autocomplete.Indicator />
        <Autocomplete.ClearButton />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains}>
          <SearchField autoFocus name="search" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox>
            <ListBox.Item id="search" textValue="Search">
              Search
            </ListBox.Item>
            <ListBox.Item id="select" textValue="Select">
              Select
            </ListBox.Item>
            <ListBox.Item id="settings" textValue="Settings">
              Settings
            </ListBox.Item>
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete.Root>
  )
}

/**
 * Autocomplete with initial value
 */
export const WithValue: Story = {
  render: () => <WithValueAutocomplete />,
}
