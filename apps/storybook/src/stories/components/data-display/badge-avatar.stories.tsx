import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Separator,
} from "@workspace/ui"

const badgeTones = ["neutral", "success", "danger", "info", "selected"] as const

const meta = {
  title: "Components/Data Display/Badge Avatar",
  parameters: {
    layout: "centered",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Badges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {badgeTones.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
      {badgeTones.map((tone) => (
        <Badge key={`${tone}-outline`} tone={tone} variant="outline">
          {tone} outline
        </Badge>
      ))}
    </div>
  ),
}

export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarFallback>ㄱㄱ</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarImage
          alt="글결 사용자"
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80"
        />
        <AvatarFallback>사용자</AvatarFallback>
      </Avatar>
      <Avatar className="size-14">
        <AvatarFallback>관리</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const SeparatorUsage: Story = {
  render: () => (
    <div className="grid w-[min(28rem,calc(100vw-2rem))] gap-4 rounded-panel border border-border-subtle bg-bg-surface p-surface-padding-md">
      <div>
        <h2 className="text-title-lg font-black">섹션 제목</h2>
        <p className="text-body-sm font-semibold text-fg-muted">
          장식 구분선은 role을 노출하지 않는다.
        </p>
      </div>
      <Separator />
      <div className="flex h-12 items-center gap-4">
        <span className="text-body-sm font-bold">왼쪽</span>
        <Separator decorative={false} orientation="vertical" />
        <span className="text-body-sm font-bold">오른쪽</span>
      </div>
    </div>
  ),
}
