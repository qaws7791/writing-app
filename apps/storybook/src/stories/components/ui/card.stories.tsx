import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/ui/progress"

const meta = {
  title: "Components/UI/Card",
  component: Card,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Anatomy: Story = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle as="h2">문장의 중심 찾기</CardTitle>
        <CardDescription>입문자를 위한 12분 학습</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            편집
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Progress value={62}>
          <ProgressLabel>진행률</ProgressLabel>
          <ProgressValue />
        </Progress>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">나중에</Button>
        <Button>이어 하기</Button>
      </CardFooter>
    </Card>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {(["default", "sm"] as const).map((size) => (
        <Card key={size} size={size}>
          <CardHeader>
            <CardTitle as="h2">{size}</CardTitle>
            <CardDescription>card spacing token 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm font-medium text-muted-foreground">
              같은 내용이라도 size 속성으로 내부 간격만 조정한다.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}

export const MediaAndActions: Story = {
  render: () => (
    <Card className="max-w-xl">
      <div className="flex aspect-video items-center justify-center bg-surface-hover">
        <span className="text-label-md font-black text-muted-foreground">
          media placeholder
        </span>
      </div>
      <CardHeader>
        <CardTitle as="h2">초안 다듬기</CardTitle>
        <CardDescription>
          미디어, 제목, 액션이 같은 card anatomy 안에 들어간다.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">건너뛰기</Button>
        <Button>시작</Button>
      </CardFooter>
    </Card>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle as="h2">
          긴 제목이 들어와도 액션 영역과 본문 영역을 침범하지 않는 카드
        </CardTitle>
        <CardDescription>
          관리자가 작성한 상세 설명이 길어도 카드의 padding과 간격은 안정적으로
          유지된다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm font-medium">
          본문은 줄바꿈을 허용하고, 버튼과 footer는 내용 높이에 맞춰 자연스럽게
          아래로 이동한다.
        </p>
      </CardContent>
    </Card>
  ),
}

export const HeadingSemantics: Story = {
  tags: ["ci-test"],
  render: () => (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle as="h1">페이지 단독 카드 제목</CardTitle>
        <CardDescription>
          CardTitle은 `as` 속성으로 문서 구조에 맞는 heading을 선택한다.
        </CardDescription>
      </CardHeader>
    </Card>
  ),
}
