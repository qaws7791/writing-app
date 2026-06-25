import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  SegmentedControl,
  SegmentedControlItem,
  Surface,
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui"

const meta = {
  title: "Components/Disclosure Selection",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AccordionExample: Story = {
  render: () => (
    <Surface variant="panel" className="grid max-w-2xl gap-4">
      <div>
        <h2 className="text-title-lg font-black">강의 커리큘럼</h2>
        <p className="text-body-sm font-medium text-fg-muted">
          Base UI accordion 상태와 제품 토큰을 함께 사용한다.
        </p>
      </div>
      <Accordion defaultValue={["unit-1"]} multiple>
        <AccordionItem value="unit-1">
          <AccordionHeader>
            <AccordionTrigger>1강. 문장의 중심 찾기</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            핵심 문장과 보조 문장을 구분하고 문단 흐름을 정리한다.
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="unit-2">
          <AccordionHeader>
            <AccordionTrigger>2강. 근거를 쌓는 방식</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            주장과 근거를 연결해 설득력 있는 단락을 구성한다.
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Surface>
  ),
}

export const SegmentedControls: Story = {
  render: () => (
    <div className="grid gap-5">
      <Surface variant="panel" className="grid w-fit gap-3">
        <h2 className="text-label-lg font-black">테마</h2>
        <SegmentedControl defaultValue="system" aria-label="테마 선택">
          <SegmentedControlItem value="light">밝게</SegmentedControlItem>
          <SegmentedControlItem value="dark">어둡게</SegmentedControlItem>
          <SegmentedControlItem value="system">시스템</SegmentedControlItem>
        </SegmentedControl>
      </Surface>

      <Surface variant="panel" className="grid w-fit gap-3">
        <h2 className="text-label-lg font-black">검토 범위</h2>
        <ToggleGroup
          defaultValue={["grammar", "style"]}
          multiple
          aria-label="검토 범위"
        >
          <ToggleGroupItem value="grammar">문법</ToggleGroupItem>
          <ToggleGroupItem value="style">문체</ToggleGroupItem>
          <ToggleGroupItem value="structure">구조</ToggleGroupItem>
        </ToggleGroup>
      </Surface>
    </div>
  ),
}
