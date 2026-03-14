import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@workspace/ui/components/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Button Group",
  component: ButtonGroup,
  parameters: shadcnParameters("button-group"),
} satisfies Meta<typeof ButtonGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <ButtonGroup>
        <Button variant="outline">Preview</Button>
        <Button variant="outline">Share</Button>
        <Button variant="outline">
          Publish
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            data-icon="inline-end"
          />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        <ButtonGroupText>https://</ButtonGroupText>
        <Input defaultValue="writing.app/essay" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon" />}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
            <span className="sr-only">Open more actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <ButtonGroup orientation="vertical" className="h-fit">
        <Button variant="outline">Paragraph</Button>
        <ButtonGroupSeparator orientation="horizontal" />
        <Button variant="outline">Heading</Button>
        <Button variant="outline">Quote</Button>
      </ButtonGroup>
    </div>
  ),
}
