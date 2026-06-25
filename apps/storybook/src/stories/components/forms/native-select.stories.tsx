import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  NativeSelect,
} from "@workspace/ui"

const meta = {
  title: "Components/Forms/NativeSelect",
  component: NativeSelect,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof NativeSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: () => (
    <NativeSelect aria-label="상태" defaultValue="draft">
      <option value="draft">초안</option>
      <option value="published">공개</option>
      <option value="archived">보관</option>
    </NativeSelect>
  ),
}

export const OptionsAndGroups: Story = {
  render: () => (
    <NativeSelect
      aria-label="코스 분류"
      className="w-[min(24rem,calc(100vw-2rem))]"
    >
      <optgroup label="기초">
        <option>문장의 중심 찾기</option>
        <option>근거 문장 만들기</option>
      </optgroup>
      <optgroup label="심화">
        <option>반론 다루기</option>
        <option>긴 글 구조화</option>
      </optgroup>
    </NativeSelect>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid w-[min(24rem,calc(100vw-2rem))] gap-4">
      <NativeSelect aria-label="default select" defaultValue="all">
        <option value="all">전체</option>
        <option value="active">활성</option>
      </NativeSelect>
      <NativeSelect disabled aria-label="disabled select" defaultValue="locked">
        <option value="locked">잠김</option>
      </NativeSelect>
      <NativeSelect
        aria-invalid="true"
        aria-label="invalid select"
        defaultValue=""
      >
        <option value="">선택 필요</option>
        <option value="ready">준비됨</option>
      </NativeSelect>
    </div>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Field className="w-[min(30rem,calc(100vw-2rem))]">
      <FieldLabel htmlFor="native-select-long">검토 기준</FieldLabel>
      <NativeSelect id="native-select-long" defaultValue="long">
        <option value="long">
          사용자가 제출한 긴 글의 도입, 근거, 결론 흐름을 모두 확인
        </option>
        <option value="short">짧은 문장 피드백</option>
      </NativeSelect>
      <FieldDescription>
        긴 option 문구도 기본 레이아웃을 유지한다.
      </FieldDescription>
    </Field>
  ),
}

export const FormInteraction: Story = {
  render: () => (
    <Field invalid className="w-[min(24rem,calc(100vw-2rem))]">
      <FieldLabel htmlFor="native-select-interaction">상태</FieldLabel>
      <NativeSelect
        aria-describedby="native-select-interaction-error"
        aria-invalid="true"
        defaultValue=""
        id="native-select-interaction"
      >
        <option value="">선택하세요</option>
        <option value="draft">초안</option>
        <option value="published">공개</option>
      </NativeSelect>
      <FieldError id="native-select-interaction-error">
        상태를 선택해야 한다.
      </FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const select = canvas.getByLabelText("상태")
    await userEvent.selectOptions(select, "published")
    await expect(select).toHaveValue("published")
  },
}
