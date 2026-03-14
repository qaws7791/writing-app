import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon, Link01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@workspace/ui/components/item"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Item",
  component: Item,
  parameters: shadcnParameters("item"),
} satisfies Meta<typeof Item>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <ItemGroup className="max-w-3xl">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
        </ItemMedia>
        <ItemContent>
          <ItemHeader>
            <ItemTitle>Reading queue</ItemTitle>
            <Badge variant="secondary">6 min</Badge>
          </ItemHeader>
          <ItemDescription>
            A compact summary row that keeps supporting metadata easy to scan.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </ItemActions>
      </Item>

      <ItemSeparator />

      <Item variant="muted" size="sm">
        <ItemMedia variant="icon">
          <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Reference note</ItemTitle>
          <ItemDescription>
            Use `Item` when the layout needs media, content, and actions without
            custom markup.
          </ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
}
