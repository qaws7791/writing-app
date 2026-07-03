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
  title: "Components/UI/Select",
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

export const Scrollable: Story = {
  render: () => (
    <Select defaultValue="utc">
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="시간대 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <UISelectLabel>북아메리카</UISelectLabel>
          <SelectItem value="est">동부 표준시 (EST)</SelectItem>
          <SelectItem value="cst">중부 표준시 (CST)</SelectItem>
          <SelectItem value="mst">산악 표준시 (MST)</SelectItem>
          <SelectItem value="pst">태평양 표준시 (PST)</SelectItem>
          <SelectItem value="akst">알래스카 표준시 (AKST)</SelectItem>
          <SelectItem value="hst">하와이 표준시 (HST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <UISelectLabel>유럽 & 아프리카</UISelectLabel>
          <SelectItem value="gmt">그리니치 표준시 (GMT)</SelectItem>
          <SelectItem value="cet">중앙유럽 표준시 (CET)</SelectItem>
          <SelectItem value="eet">동유럽 표준시 (EET)</SelectItem>
          <SelectItem value="west">서유럽 여름 시간 (WEST)</SelectItem>
          <SelectItem value="cat">중앙아프리카 시간 (CAT)</SelectItem>
          <SelectItem value="eat">동아프리카 시간 (EAT)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <UISelectLabel>아시아 & 오세아니아</UISelectLabel>
          <SelectItem value="kst">한국 표준시 (KST)</SelectItem>
          <SelectItem value="jst">일본 표준시 (JST)</SelectItem>
          <SelectItem value="cst-china">중국 표준시 (CST)</SelectItem>
          <SelectItem value="ist">인도 표준시 (IST)</SelectItem>
          <SelectItem value="aest">호주 동부 표준시 (AEST)</SelectItem>
          <SelectItem value="nzst">뉴질랜드 표준시 (NZST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <UISelectLabel>기타</UISelectLabel>
          <SelectItem value="utc">협정 세계시 (UTC)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const DisabledItems: Story = {
  render: () => (
    <Select defaultValue="apple">
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="과일 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">사과</SelectItem>
        <SelectItem value="banana">바나나</SelectItem>
        <SelectItem value="blueberry" disabled>
          블루베리 (품절)
        </SelectItem>
        <SelectItem value="strawberry">딸기</SelectItem>
        <SelectItem value="watermelon" disabled>
          수박 (시즌 종료)
        </SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          Default 크기 (h-9)
        </span>
        <Select defaultValue="default">
          <SelectTrigger size="default" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">기본 트리거</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Small 크기 (h-8)</span>
        <Select defaultValue="sm">
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">작은 트리거</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
}
