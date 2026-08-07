import type { Meta, StoryObj } from "@storybook/react-vite"

import { CompareStepView } from "@workspace/ui/components/lesson/compare-step-view"

import { compareDefaults } from "#storybook/stories/components/lesson/mock-data"
import {
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "#storybook/stories/components/lesson/lesson-story-shared"

const meta = {
  title: "Components/Lesson/CompareStepView",
  component: CompareStepView,
  tags: ["autodocs"],
  args: {
    ...compareDefaults,
  },
  argTypes: {
    title: {
      control: "text",
      description: "비교 스텝 제목입니다.",
    },
    versions: {
      ...objectArgType,
      description: "탭으로 전환할 버전 목록입니다.",
    },
    analysis: {
      control: "text",
      description: "비교 후 생각해볼 내용입니다.",
    },
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof CompareStepView>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 제목·버전·분석 문구를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {
  tags: ["ci-test"],
}

/**
 * 두 개 이상의 버전 탭을 확인하는 예시입니다.
 */
export const ThreeVersions: Story = {
  args: {
    versions: [
      ...compareDefaults.versions,
      {
        label: "질문형 도입",
        text: "당신은 하루에 몇 분이나 글을 씁니까?",
      },
    ],
  },
}
