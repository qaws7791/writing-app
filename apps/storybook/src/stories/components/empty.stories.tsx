import type { Meta, StoryObj } from "@storybook/react-vite"
import { SearchX, FolderOpen } from "lucide-react"

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Empty> = {
  title: "Components/Empty",
  component: Empty,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Empty>

export const Default: Story = {
  render: () => (
    <Empty className="w-[400px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filter to find what you&apos;re looking
          for.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Empty className="w-[400px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No documents found</EmptyTitle>
        <EmptyDescription>
          Get started by creating a new document.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Create document</Button>
      </EmptyContent>
    </Empty>
  ),
}
