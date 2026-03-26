import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Edit01Icon,
  EyeIcon,
  FavouriteIcon,
  Share08Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Dropdown Menu",
  component: DropdownMenu,
  parameters: shadcnParameters("dropdown-menu"),
} satisfies Meta<typeof DropdownMenu>

export default meta

type Story = StoryObj<typeof meta>

function DropdownMenuShowcase() {
  const [showSummary, setShowSummary] = React.useState(true)
  const [density, setDensity] = React.useState("comfortable")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Open menu
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Story actions</DropdownMenuLabel>
          <DropdownMenuItem>
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
            Edit writing
            <DropdownMenuShortcut>E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
            Share preview
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              More options
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Move to archive</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={showSummary}
            onCheckedChange={setShowSummary}
          >
            <HugeiconsIcon icon={EyeIcon} strokeWidth={2} />
            Show summary
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>
            <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} />
            Pin to dashboard
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel inset>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
            <DropdownMenuRadioItem inset value="comfortable">
              Comfortable
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem inset value="compact">
              Compact
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const Showcase: Story = {
  render: () => <DropdownMenuShowcase />,
}
