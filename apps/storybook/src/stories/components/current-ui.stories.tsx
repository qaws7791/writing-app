import type { Meta, StoryObj } from "@storybook/react-vite"
import { Mail } from "lucide-react"

import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui"

const meta = {
  title: "Migration/CurrentBaseline",
  parameters: {
    layout: "centered",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => (
    <div className="grid w-[720px] max-w-[calc(100vw-2rem)] gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Button</CardTitle>
          <CardDescription>현재 UI 패키지의 버튼 변형입니다.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button>
            <Mail data-icon="inline-start" />
            Email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>기본 입력 필드 상태입니다.</CardDescription>
          <CardAction>
            <Button size="sm" variant="outline">
              Save
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input aria-label="Course title" placeholder="Course title" />
          <Input
            aria-invalid="true"
            aria-label="Invalid course title"
            placeholder="Invalid state"
          />
        </CardContent>
        <CardFooter>
          <Button className="w-full">Create</Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-2" size="sm">
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            학습 진행률을 표시하는 기본 패턴입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={62}>
            <ProgressLabel>Course completion</ProgressLabel>
            <ProgressValue />
          </Progress>
        </CardContent>
      </Card>
    </div>
  ),
}
