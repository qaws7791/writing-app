import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: {},
} satisfies Meta<typeof Drawer>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Drawer>
        <DrawerTrigger asChild>
          <button>Bottom drawer</button>
        </DrawerTrigger>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh]">
          <DrawerHeader>
            <DrawerTitle>Quick publish</DrawerTitle>
            <DrawerDescription>
              Review the final settings before this piece goes live.
            </DrawerDescription>
          </DrawerHeader>
          <div className="text-sm px-4 pb-2 text-muted-foreground">
            Slug, excerpt, and schedule are already synced from the writing.
          </div>
          <DrawerFooter>
            <button>Publish now</button>
            <DrawerClose asChild>
              <button>Cancel</button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer direction="right">
        <DrawerTrigger asChild>
          <button>Side drawer</button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Reading stats</DrawerTitle>
            <DrawerDescription>
              High-level performance data for the current story.
            </DrawerDescription>
          </DrawerHeader>
          <div className="text-sm flex flex-col gap-3 px-4 pb-2 text-muted-foreground">
            <p>Average reading time: 6m 20s</p>
            <p>Completion rate: 78%</p>
            <p>Saved for later: 214 readers</p>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <button>Close</button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
}
