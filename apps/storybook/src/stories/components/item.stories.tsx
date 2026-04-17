import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileText, Settings, ChevronRight } from "lucide-react"

import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemMedia,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const meta: Meta = {
  title: "Components/Item",
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Item className="w-[400px]">
      <ItemContent>
        <ItemTitle>Item Title</ItemTitle>
        <ItemDescription>A brief description of this item.</ItemDescription>
      </ItemContent>
    </Item>
  ),
}

export const WithMedia: Story = {
  render: () => (
    <Item className="w-[400px]">
      <ItemMedia variant="icon">
        <FileText />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Document</ItemTitle>
        <ItemDescription>
          A text document with important information.
        </ItemDescription>
      </ItemContent>
    </Item>
  ),
}

export const WithActions: Story = {
  render: () => (
    <Item className="w-[400px]">
      <ItemMedia variant="icon">
        <Settings />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Settings</ItemTitle>
        <ItemDescription>
          Manage your account settings and preferences.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <ChevronRight className="size-4 text-muted-foreground" />
      </ItemActions>
    </Item>
  ),
}

export const Group: Story = {
  render: () => (
    <ItemGroup className="w-[400px]">
      <Item>
        <ItemMedia variant="icon">
          <FileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Document 1</ItemTitle>
          <ItemDescription>Created 2 hours ago</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge variant="secondary">Draft</Badge>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <FileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Document 2</ItemTitle>
          <ItemDescription>Created 1 day ago</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge>Published</Badge>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="flex w-[400px] flex-col gap-2">
      <Item variant="default">
        <ItemContent>
          <ItemTitle>Default variant</ItemTitle>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Outline variant</ItemTitle>
        </ItemContent>
      </Item>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted variant</ItemTitle>
        </ItemContent>
      </Item>
    </div>
  ),
}
