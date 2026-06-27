import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel as UISelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui"

const meta = {
  title: "Components/Forms/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <Select defaultValue="draft">
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="상태" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">초안</SelectItem>
        <SelectItem value="published">공개</SelectItem>
        <SelectItem value="archived">보관</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const OptionsAndGroups: Story = {
  render: () => (
    <Select defaultValue="sentence">
      <SelectTrigger className="w-[min(24rem,calc(100vw-2rem))]">
        <SelectValue placeholder="코스 분류" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <UISelectLabel>기초</UISelectLabel>
          <SelectItem value="sentence">문장의 중심 찾기</SelectItem>
          <SelectItem value="making-sentence">근거 문장 만들기</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <UISelectLabel>심화</UISelectLabel>
          <SelectItem value="counterargument">반론 다루기</SelectItem>
          <SelectItem value="structuring">긴 글 구조화</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid w-[min(24rem,calc(100vw-2rem))] gap-4">
      <Field>
        <FieldLabel htmlFor="state-default-select">기본</FieldLabel>
        <Select defaultValue="all">
          <SelectTrigger id="state-default-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="active">활성</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="state-disabled-select">비활성</FieldLabel>
        <Select disabled defaultValue="locked">
          <SelectTrigger id="state-disabled-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="locked">잠김</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field data-invalid>
        <FieldLabel htmlFor="state-invalid-select">오류 상태</FieldLabel>
        <Select defaultValue="">
          <SelectTrigger id="state-invalid-select" aria-invalid>
            <SelectValue placeholder="선택 필요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ready">준비됨</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Field className="w-[min(30rem,calc(100vw-2rem))]">
      <FieldLabel htmlFor="select-long">검토 기준</FieldLabel>
      <Select defaultValue="long">
        <SelectTrigger id="select-long">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="long">
            사용자가 제출한 긴 글의 도입, 근거, 결론 흐름을 모두 확인
          </SelectItem>
          <SelectItem value="short">짧은 문장 피드백</SelectItem>
        </SelectContent>
      </Select>
      <FieldDescription>
        긴 option 문구도 기본 레이아웃을 유지한다.
      </FieldDescription>
    </Field>
  ),
}

export const FormInteraction: Story = {
  render: () => (
    <Field data-invalid className="w-[min(24rem,calc(100vw-2rem))]">
      <FieldLabel htmlFor="select-interaction">상태</FieldLabel>
      <Select defaultValue="">
        <SelectTrigger
          id="select-interaction"
          aria-describedby="select-interaction-error"
          aria-invalid="true"
        >
          <SelectValue placeholder="선택하세요" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">초안</SelectItem>
          <SelectItem value="published">공개</SelectItem>
        </SelectContent>
      </Select>
      <FieldError id="select-interaction-error">
        상태를 선택해야 한다.
      </FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("combobox", { name: "상태" })
    await userEvent.click(trigger)

    const body = within(document.body)
    const option = await body.findByRole("option", { name: "공개" })
    await userEvent.click(option)

    await expect(trigger).toHaveTextContent("공개")
  },
}
