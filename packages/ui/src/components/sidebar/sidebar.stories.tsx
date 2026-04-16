import type { Meta, StoryObj } from "@storybook/react"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  ShoppingCart01Icon,
  Task01Icon,
  AnalyticsUpIcon,
  Settings01Icon,
  HelpCircleIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"

import { Sidebar } from "./index"
import { Avatar } from "../avatar"

const meta = {
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
  args: {},
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div>
      <Sidebar {...args}>
        <Sidebar.Header>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <Avatar.Image
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                alt="Kate Moore"
              />
              <Avatar.Fallback>KM</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                Kate Moore
              </span>
              <span className="text-muted-foreground text-xs">Admin</span>
            </div>
          </div>
        </Sidebar.Header>

        <Sidebar.Body>
          <Sidebar.Item id="dashboard" textValue="Dashboard">
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon
                icon={Home01Icon}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
          </Sidebar.Item>
          <Sidebar.Item id="orders" textValue="Orders">
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon
                icon={ShoppingCart01Icon}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm font-medium">Orders</span>
            </div>
          </Sidebar.Item>
          <Sidebar.Item id="tracker" textValue="Tracker">
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon
                icon={Task01Icon}
                size={20}
                className="text-muted-foreground"
              />
              <span className="flex-1 text-sm font-medium">Tracker</span>
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold">
                New
              </span>
            </div>
          </Sidebar.Item>
          <Sidebar.Item id="analytics" textValue="Analytics">
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon
                icon={AnalyticsUpIcon}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm font-medium">Analytics</span>
            </div>
          </Sidebar.Item>
          <Sidebar.Item id="settings" textValue="Settings">
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon
                icon={Settings01Icon}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm font-medium">Settings</span>
            </div>
          </Sidebar.Item>
        </Sidebar.Body>

        <Sidebar.Footer>
          <Sidebar.Item id="help" textValue="Help & Information">
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon
                icon={HelpCircleIcon}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm font-medium">Help & Information</span>
            </div>
          </Sidebar.Item>
          <Sidebar.Item id="logout" textValue="Log out">
            <div className="flex w-full items-center gap-3">
              <HugeiconsIcon
                icon={Logout01Icon}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm font-medium">Log out</span>
            </div>
          </Sidebar.Item>
        </Sidebar.Footer>
      </Sidebar>
    </div>
  ),
}
