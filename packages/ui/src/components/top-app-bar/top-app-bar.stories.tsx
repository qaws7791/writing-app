import type { Meta, StoryObj } from "@storybook/react"
import { TopAppBar } from "./top-app-bar"

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="size-6"
  >
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

const meta: Meta<typeof TopAppBar> = {
  title: "Components/TopAppBar",
  component: TopAppBar,
  args: {
    title: "Page Title",
  },
  parameters: { layout: "fullscreen" },
}

export default meta
type Story = StoryObj<typeof TopAppBar>

export const CenterAligned: Story = {
  args: {
    variant: "center-aligned",
    navigationIcon: <BackIcon />,
    actions: [<MoreIcon key="more" />],
  },
}
export const Small: Story = {
  args: {
    variant: "small",
    navigationIcon: <BackIcon />,
    actions: [<MoreIcon key="more" />],
  },
}
export const Medium: Story = {
  args: {
    variant: "medium",
    title: "Medium App Bar",
    navigationIcon: <BackIcon />,
    actions: [<MoreIcon key="more" />],
  },
}
export const Large: Story = {
  args: {
    variant: "large",
    title: "Large App Bar",
    navigationIcon: <BackIcon />,
    actions: [<MoreIcon key="more" />],
  },
}
export const Scrolled: Story = {
  args: {
    variant: "small",
    scrolled: true,
    navigationIcon: <BackIcon />,
    actions: [<MoreIcon key="more" />],
  },
}
