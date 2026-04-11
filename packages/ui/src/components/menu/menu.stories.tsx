import type { Meta, StoryObj } from "@storybook/react"
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuDivider } from "./menu"

const meta: Meta = {
  title: "Components/Menu",
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        >
          메뉴 열기
        </button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem>수정하기</MenuItem>
        <MenuItem>복사하기</MenuItem>
        <MenuDivider />
        <MenuItem destructive>삭제하기</MenuItem>
      </MenuContent>
    </Menu>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        >
          옵션
        </button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem
          leadingIcon={
            <svg viewBox="0 0 24 24" fill="none" className="size-6">
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        >
          수정하기
        </MenuItem>
        <MenuItem trailingText="⌘C">복사하기</MenuItem>
        <MenuDivider />
        <MenuItem destructive>삭제하기</MenuItem>
      </MenuContent>
    </Menu>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Menu>
      <MenuTrigger>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        >
          메뉴
        </button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem>활성 항목</MenuItem>
        <MenuItem disabled>비활성 항목</MenuItem>
        <MenuItem>활성 항목</MenuItem>
      </MenuContent>
    </Menu>
  ),
}
