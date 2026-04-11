import type { Meta, StoryObj } from "@storybook/react"
import { FAB, ExtendedFAB } from "./fab"

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-full">
    <path
      d="M12 5v14m-7-7h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const meta: Meta<typeof FAB> = {
  title: "Components/FAB",
  component: FAB,
  args: {
    "aria-label": "새로 만들기",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["surface", "primary", "secondary", "tertiary"],
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
  },
}

export default meta
type Story = StoryObj<typeof FAB>

export const Primary: Story = {
  args: { variant: "primary" },
  render: (args) => (
    <FAB {...args}>
      <PlusIcon />
    </FAB>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <FAB variant="surface" aria-label="Surface">
        <PlusIcon />
      </FAB>
      <FAB variant="primary" aria-label="Primary">
        <PlusIcon />
      </FAB>
      <FAB variant="secondary" aria-label="Secondary">
        <PlusIcon />
      </FAB>
      <FAB variant="tertiary" aria-label="Tertiary">
        <PlusIcon />
      </FAB>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <FAB size="sm" aria-label="Small">
        <PlusIcon />
      </FAB>
      <FAB size="md" aria-label="Medium">
        <PlusIcon />
      </FAB>
      <FAB size="lg" aria-label="Large">
        <PlusIcon />
      </FAB>
    </div>
  ),
}

export const Extended: StoryObj<typeof ExtendedFAB> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ExtendedFAB icon={<PlusIcon />}>새 글쓰기</ExtendedFAB>
      <ExtendedFAB variant="secondary" icon={<PlusIcon />}>
        새 여정
      </ExtendedFAB>
      <ExtendedFAB variant="surface">텍스트만</ExtendedFAB>
    </div>
  ),
}
