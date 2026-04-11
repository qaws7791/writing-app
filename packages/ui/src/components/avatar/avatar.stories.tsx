import type { Meta, StoryObj } from "@storybook/react"
import { Avatar } from "./avatar"

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  args: {
    size: "md",
    alt: "홍길동",
  },
  argTypes: {
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const WithFallback: Story = {
  args: { alt: "홍길동" },
}

export const WithImage: Story = {
  args: {
    src: "https://api.dicebear.com/9.x/initials/svg?seed=HG",
    alt: "홍길동",
  },
}

export const CustomFallback: Story = {
  args: { fallback: "A" },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm" alt="Small" />
      <Avatar size="md" alt="Medium" />
      <Avatar size="lg" alt="Large" />
    </div>
  ),
}

export const BrokenImage: Story = {
  args: {
    src: "https://broken-url.invalid/image.jpg",
    alt: "Fallback 테스트",
  },
}
