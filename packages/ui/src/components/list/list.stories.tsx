import type { Meta, StoryObj } from "@storybook/react"
import { List, ListItem } from "./list"

const meta: Meta = {
  title: "Components/List",
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <List className="w-80">
      <ListItem headlineText="항목 1" />
      <ListItem headlineText="항목 2" />
      <ListItem headlineText="항목 3" />
    </List>
  ),
}

export const WithSupportingText: Story = {
  render: () => (
    <List className="w-80">
      <ListItem headlineText="제목" supportingText="보조 텍스트" />
      <ListItem headlineText="제목" supportingText="보조 텍스트" />
    </List>
  ),
}

export const WithLeadingAndTrailing: Story = {
  render: () => (
    <List className="w-80">
      <ListItem
        leadingContent={
          <div className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            A
          </div>
        }
        headlineText="홍길동"
        supportingText="test@example.com"
        trailingContent={<span className="text-label-small">3분 전</span>}
      />
      <ListItem
        leadingContent={
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            B
          </div>
        }
        headlineText="김철수"
        supportingText="kim@example.com"
        trailingContent={<span className="text-label-small">1시간 전</span>}
      />
    </List>
  ),
}

export const Interactive: Story = {
  render: () => (
    <List className="w-80">
      <ListItem
        headlineText="클릭 가능한 항목 1"
        interactive
        onClick={() => {}}
      />
      <ListItem
        headlineText="클릭 가능한 항목 2"
        interactive
        onClick={() => {}}
      />
      <ListItem
        headlineText="클릭 가능한 항목 3"
        interactive
        onClick={() => {}}
      />
    </List>
  ),
}
