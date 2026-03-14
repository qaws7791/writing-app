import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: shadcnParameters("popover"),
} satisfies Meta<typeof Popover>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Editorial note
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Reading flow</PopoverTitle>
          <PopoverDescription>
            Short popovers work well for contextual guidance that should not
            interrupt the page.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
}
