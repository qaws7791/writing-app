import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/ui/avatar"

const meta = {
  title: "Components/UI/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn Avatar" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarImage src="https://github.com/shadcn.png" alt="Small" />
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarImage src="https://github.com/shadcn.png" alt="Default" />
        <AvatarFallback>DF</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Large" />
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const Fallback: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage src="https://invalid-url.png" alt="Fallback User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          UI
        </AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {/* Default Green Badge (Online status) */}
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Online User" />
        <AvatarFallback>ON</AvatarFallback>
        <AvatarBadge className="bg-emerald-500" aria-label="온라인" />
      </Avatar>

      <Avatar size="default">
        <AvatarImage src="https://github.com/shadcn.png" alt="Away User" />
        <AvatarFallback>AW</AvatarFallback>
        <AvatarBadge className="bg-amber-500" aria-label="자리 비움" />
      </Avatar>

      <Avatar size="sm">
        <AvatarImage src="https://github.com/shadcn.png" alt="Offline User" />
        <AvatarFallback>OF</AvatarFallback>
        <AvatarBadge className="bg-slate-400" aria-label="오프라인" />
      </Avatar>
    </div>
  ),
}

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt="User 1"
        />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt="User 2"
        />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt="User 3"
        />
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  ),
}

export const GroupWithCount: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt="User 1"
        />
        <AvatarFallback>U1</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt="User 2"
        />
        <AvatarFallback>U2</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt="User 3"
        />
        <AvatarFallback>U3</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
}
