import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"
import { Lock, HelpCircle, BookOpen } from "lucide-react"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/ui/components/ui/accordion"

const meta = {
  title: "Components/UI/Accordion",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => (
    <Accordion className="max-w-2xl" defaultValue={["lesson-1"]}>
      <AccordionItem value="lesson-1">
        <AccordionTrigger>1강. 문장의 중심 찾기</AccordionTrigger>

        <AccordionContent>
          핵심 문장과 보조 문장을 구분하고 문단 흐름을 정리한다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lesson-2">
        <AccordionTrigger>2강. 근거 쌓기</AccordionTrigger>

        <AccordionContent>
          주장과 근거를 연결해 설득력 있는 단락을 구성한다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion className="max-w-2xl" defaultValue={["lesson-1"]} multiple>
      <AccordionItem value="lesson-1">
        <AccordionTrigger>도입</AccordionTrigger>

        <AccordionContent>
          문제 상황과 글의 목적을 짧게 설명한다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lesson-2">
        <AccordionTrigger>근거</AccordionTrigger>

        <AccordionContent>
          독자가 납득할 수 있는 사례를 배치한다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const WithDisabledItem: Story = {
  tags: ["ci-test"],
  render: () => (
    <Accordion className="max-w-2xl" defaultValue={["lesson-1"]}>
      <AccordionItem value="lesson-1">
        <AccordionTrigger>1강. 문장의 중심 찾기</AccordionTrigger>
        <AccordionContent>
          핵심 문장과 보조 문장을 구분하고 문단 흐름을 정리한다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lesson-2" disabled>
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            2강. 근거 쌓기 (비활성화됨)
            <Lock className="size-3.5 text-muted-foreground-foreground" />
          </span>
        </AccordionTrigger>
        <AccordionContent>
          주장과 근거를 연결해 설득력 있는 단락을 구성한다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const CustomLayout: Story = {
  render: () => (
    <Accordion className="max-w-2xl">
      <AccordionItem value="faq-1">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex items-center gap-2">
            <HelpCircle className="size-4 text-primary" />
            환불 규정은 어떻게 되나요?
          </span>
        </AccordionTrigger>
        <AccordionContent>
          수강 시작 후 7일 이내에 진도율 10% 미만인 경우 100% 환불이 가능합니다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-2">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            수강 기간은 얼마 동안 유지되나요?
          </span>
        </AccordionTrigger>
        <AccordionContent>
          기본 수강 기간은 90일이며, 이후 30일 단위로 무료 연장 신청을 하실 수
          있습니다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Interaction: Story = {
  tags: ["ci-test"],
  render: () => (
    <Accordion className="max-w-2xl">
      <AccordionItem value="lesson-1">
        <AccordionTrigger>확인할 항목</AccordionTrigger>

        <AccordionContent>클릭하면 표시되는 내용이다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "확인할 항목" }))
    await expect(canvas.getByText("클릭하면 표시되는 내용이다.")).toBeVisible()
  },
}
