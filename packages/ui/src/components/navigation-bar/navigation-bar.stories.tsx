import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { NavigationBar, NavItem } from "./navigation-bar"

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

const meta: Meta<typeof NavigationBar> = {
  title: "Components/NavigationBar",
  component: NavigationBar,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: 300, position: "relative" }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof NavigationBar>

export const Default: Story = {
  render: function NavigationBarDemo() {
    const [active, setActive] = React.useState(0)
    return (
      <NavigationBar>
        <NavItem
          icon={<HomeIcon />}
          label="홈"
          active={active === 0}
          onClick={() => setActive(0)}
        />
        <NavItem
          icon={<StarIcon />}
          label="즐겨찾기"
          active={active === 1}
          badge={3}
          onClick={() => setActive(1)}
        />
        <NavItem
          icon={<PersonIcon />}
          label="프로필"
          active={active === 2}
          onClick={() => setActive(2)}
        />
      </NavigationBar>
    )
  },
}
