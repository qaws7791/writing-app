import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"

const meta = {
  title: "Recipes/Course Management",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const CardRecipe: Story = {
  tags: ["ci-test"],
  render: () => (
    <section className="grid gap-4 rounded-panel border border-border/50 bg-background p-surface-padding-md">
      <h3 className="text-title-lg font-black">Course Card</h3>
      <Card>
        <CardHeader>
          <CardTitle as="h2">문장의 중심 찾기</CardTitle>
          <CardDescription>12분 학습 · 입문 코스</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={62}>
            <ProgressLabel>진행률</ProgressLabel>
            <ProgressValue />
          </Progress>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline">검토</Button>
          <Button>이어 하기</Button>
        </CardFooter>
      </Card>
    </section>
  ),
}

export const ResponsiveForm: Story = {
  tags: ["ci-test"],
  render: () => (
    <form
      className="grid max-w-4xl gap-4 rounded-panel border border-border/50 bg-background p-surface-padding-md md:grid-cols-[1fr_12rem_auto] md:items-end"
      onSubmit={(event) => event.preventDefault()}
    >
      <Field>
        <FieldLabel htmlFor="recipe-title">코스 제목</FieldLabel>
        <Input id="recipe-title" placeholder="제목" />
        <FieldDescription>작은 viewport에서는 한 열로 쌓인다.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="recipe-status">상태</FieldLabel>
        <Select defaultValue="draft">
          <SelectTrigger id="recipe-status" variant="outlined">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">초안</SelectItem>
            <SelectItem value="published">공개</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit">저장</Button>
    </form>
  ),
}
