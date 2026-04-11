import type { Meta, StoryObj } from "@storybook/react"
import { MarkdownRenderer } from "./markdown-renderer"

const meta = {
  title: "Components/MarkdownRenderer",
  component: MarkdownRenderer,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof MarkdownRenderer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: `## 제목입니다

이것은 본문 텍스트입니다. **굵은 글씨**도 지원합니다.

### 소제목

- 첫 번째 항목
- 두 번째 항목
- **강조된** 항목

일반 텍스트 단락이 이어집니다.`,
  },
  render: (args) => (
    <div className="max-w-md">
      <MarkdownRenderer {...args} />
    </div>
  ),
}
