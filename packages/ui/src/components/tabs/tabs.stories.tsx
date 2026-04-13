import type { Meta, StoryObj } from "@storybook/react"

import { Tabs } from "./index"

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default tabs
 */
export const Default: Story = {
  render: () => (
    <Tabs.Root defaultSelectedKey="tab1">
      <Tabs.ListContainer>
        <Tabs.List>
          <Tabs.Tab id="tab1">
            Tab 1<Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="tab2">
            Tab 2<Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="tab3">
            Tab 3<Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="tab1">Content for Tab 1</Tabs.Panel>
      <Tabs.Panel id="tab2">Content for Tab 2</Tabs.Panel>
      <Tabs.Panel id="tab3">Content for Tab 3</Tabs.Panel>
    </Tabs.Root>
  ),
}

/**
 * Vertical tabs
 */
export const Vertical: Story = {
  render: () => (
    <Tabs.Root defaultSelectedKey="a" orientation="vertical">
      <div className="flex">
        <Tabs.ListContainer>
          <Tabs.List>
            <Tabs.Tab id="a">
              Profile
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="b">
              Settings
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="c">
              Security
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <div className="flex-1 pl-4">
          <Tabs.Panel id="a">Profile content here</Tabs.Panel>
          <Tabs.Panel id="b">Settings content here</Tabs.Panel>
          <Tabs.Panel id="c">Security content here</Tabs.Panel>
        </div>
      </div>
    </Tabs.Root>
  ),
}

/**
 * Tabs with icons and content
 */
export const WithContent: Story = {
  render: () => (
    <Tabs.Root defaultSelectedKey="overview">
      <Tabs.ListContainer>
        <Tabs.List>
          <Tabs.Tab id="overview">
            Overview
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="details">
            Details
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="feedback">
            Feedback
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <div className="mt-4 p-4">
        <Tabs.Panel id="overview">
          <h3>Overview Tab</h3>
          <p>This is the overview content</p>
        </Tabs.Panel>
        <Tabs.Panel id="details">
          <h3>Details Tab</h3>
          <p>This is the details content</p>
        </Tabs.Panel>
        <Tabs.Panel id="feedback">
          <h3>Feedback Tab</h3>
          <p>This is the feedback content</p>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  ),
}
