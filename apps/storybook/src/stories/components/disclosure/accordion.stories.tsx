import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@workspace/ui"

const meta = {
  title: "Components/Disclosure/Accordion",
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
        <AccordionHeader>
          <AccordionTrigger>1강. 문장의 중심 찾기</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>
          핵심 문장과 보조 문장을 구분하고 문단 흐름을 정리한다.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="lesson-2">
        <AccordionHeader>
          <AccordionTrigger>2강. 근거 쌓기</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>
          주장과 근거를 연결해 설득력 있는 단락을 구성한다.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion className="max-w-2xl" defaultValue={["lesson-1"]} multiple>
      <AccordionItem value="lesson-1">
        <AccordionHeader>
          <AccordionTrigger>도입</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>문제 상황과 글의 목적을 짧게 설명한다.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="lesson-2">
        <AccordionHeader>
          <AccordionTrigger>근거</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>독자가 납득할 수 있는 사례를 배치한다.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
}

export const Interaction: Story = {
  render: () => (
    <Accordion className="max-w-2xl">
      <AccordionItem value="lesson-1">
        <AccordionHeader>
          <AccordionTrigger>확인할 항목</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>클릭하면 표시되는 내용이다.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "확인할 항목" }))
    await expect(canvas.getByText("클릭하면 표시되는 내용이다.")).toBeVisible()
  },
}
