import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui"

import { RecipeFrame } from "../../blocks/recipe-frame"
import { ViewportFrame } from "../../blocks/viewport-frame"

const meta = {
  title: "Recipes/Course Management",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function CourseCard() {
  return (
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
  )
}

export const DensityRecipe: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <RecipeFrame density="comfortable" label="Comfortable">
        <CourseCard />
      </RecipeFrame>
      <RecipeFrame density="compact" label="Compact">
        <CourseCard />
      </RecipeFrame>
    </div>
  ),
}

export const ResponsiveForm: Story = {
  render: () => (
    <div className="grid gap-6 xl:grid-cols-[auto_1fr]">
      <ViewportFrame label="mobile-sm" width="360px">
        <div className="grid gap-4 p-surface-padding-md">
          <Field>
            <FieldLabel htmlFor="recipe-mobile-title">코스 제목</FieldLabel>
            <Input id="recipe-mobile-title" placeholder="제목" />
            <FieldDescription>모바일에서는 한 열로 쌓인다.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="recipe-mobile-status">상태</FieldLabel>
            <NativeSelect id="recipe-mobile-status" defaultValue="draft">
              <option value="draft">초안</option>
              <option value="published">공개</option>
            </NativeSelect>
          </Field>
          <Button>저장</Button>
        </div>
      </ViewportFrame>
      <ViewportFrame label="desktop" width="720px">
        <div className="grid grid-cols-[1fr_12rem_auto] items-end gap-3 p-surface-padding-md">
          <Field>
            <FieldLabel htmlFor="recipe-desktop-title">코스 제목</FieldLabel>
            <Input id="recipe-desktop-title" placeholder="제목" />
          </Field>
          <Field>
            <FieldLabel htmlFor="recipe-desktop-status">상태</FieldLabel>
            <NativeSelect id="recipe-desktop-status" defaultValue="draft">
              <option value="draft">초안</option>
              <option value="published">공개</option>
            </NativeSelect>
          </Field>
          <Button>저장</Button>
        </div>
      </ViewportFrame>
    </div>
  ),
}
