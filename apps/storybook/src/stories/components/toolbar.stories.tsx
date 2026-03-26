import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
} from "@workspace/ui/components/toolbar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  parameters: {
    docs: {
      description: {
        component: [
          "Official docs: [toolbar](https://base-ui.com/react/components/toolbar)",
          "This story follows the Base UI composition guidance for toolbar anatomy, popup integration with `render`, and keeping a single input as the last item in a horizontal toolbar.",
        ].join("\n\n"),
      },
    },
  },
} satisfies Meta<typeof Toolbar>

export default meta

type Story = StoryObj<typeof meta>

function FormattingToolbar() {
  return (
    <TooltipProvider delay={150}>
      <Toolbar aria-label="Formatting toolbar">
        <ToolbarGroup aria-label="Inline styles">
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Bold"
                />
              }
            >
              <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Italic"
                />
              }
            >
              <HugeiconsIcon icon={TextItalicIcon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Underline"
                />
              }
            >
              <HugeiconsIcon icon={TextUnderlineIcon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarLink
          href="https://writing.app/preview/editorial-writing"
          target="_blank"
          rel="noreferrer"
          variant="outline"
        >
          Preview
        </ToolbarLink>

        <DropdownMenu>
          <ToolbarButton
            render={<DropdownMenuTrigger />}
            variant="ghost"
            size="icon-sm"
            aria-label="More text options"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
          </ToolbarButton>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem>Convert to quote</DropdownMenuItem>
            <DropdownMenuItem>Turn into callout</DropdownMenuItem>
            <DropdownMenuItem>Duplicate block</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarSeparator />

        <ToolbarInput
          aria-label="Search commands"
          placeholder="Find command"
          className="w-40"
        />
      </Toolbar>
    </TooltipProvider>
  )
}

export const Showcase: Story = {
  render: () => <FormattingToolbar />,
}

export const Vertical: Story = {
  render: () => (
    <Toolbar
      orientation="vertical"
      aria-label="Block actions toolbar"
      className="h-fit"
    >
      <ToolbarGroup orientation="vertical" aria-label="Insert blocks">
        <ToolbarButton variant="ghost">Paragraph</ToolbarButton>
        <ToolbarButton variant="ghost">Heading</ToolbarButton>
        <ToolbarButton variant="ghost">Quote</ToolbarButton>
      </ToolbarGroup>

      <ToolbarSeparator orientation="horizontal" />

      <ToolbarGroup orientation="vertical" aria-label="Document actions">
        <ToolbarButton variant="ghost">Summarize</ToolbarButton>
        <ToolbarLink href="#preview" variant="ghost">
          Jump to preview
        </ToolbarLink>
      </ToolbarGroup>
    </Toolbar>
  ),
}
