import type {
  WritingMode,
  WritingStatus,
} from "@workspace/contracts/writing/writing"

export type WritingModeOption = Readonly<{
  description: string
  label: string
  mode: WritingMode
  selfCheckQuestions: readonly [string, string, string]
}>

export const writingModeOptions = [
  {
    description: "지금 떠오르는 장면이나 생각 한 가지에서 시작합니다.",
    label: "자유롭게 쓰기",
    mode: "free",
    selfCheckQuestions: [
      "한 가지 중심이 보이는가?",
      "문단마다 한 내용만 담았는가?",
      "없어도 의미가 같은 문장을 덜어낼 수 있는가?",
    ],
  },
  {
    description: "처음 읽는 사람에게 무엇을 어떤 순서로 알려줄지 정합니다.",
    label: "설명하기",
    mode: "explain",
    selfCheckQuestions: [
      "처음 읽는 사람이 대상을 알 수 있는가?",
      "정보 순서가 자연스러운가?",
      "이해를 돕는 예시가 있는가?",
    ],
  },
  {
    description: "전하고 싶은 주장과 그 주장을 받치는 이유를 먼저 정합니다.",
    label: "주장하기",
    mode: "argue",
    selfCheckQuestions: [
      "주장이 한 문장으로 드러나는가?",
      "주장을 받치는 이유가 있는가?",
      "다른 관점에서 생길 질문을 고려했는가?",
    ],
  },
] as const satisfies readonly WritingModeOption[]

const writingModeOptionByMode = Object.fromEntries(
  writingModeOptions.map((option) => [option.mode, option])
) as Readonly<Record<WritingMode, WritingModeOption>>

export function readWritingModeOption(mode: WritingMode): WritingModeOption {
  return writingModeOptionByMode[mode]
}

export function readWritingStatusLabel(status: WritingStatus): string {
  return status === "checked" ? "점검 완료" : "작성 중"
}

export function readWritingTitle(title: string): string {
  const normalizedTitle = title.trim()
  return normalizedTitle.length === 0 ? "제목 없는 글" : normalizedTitle
}
