import type { AIReviewParagraph } from "@workspace/core"

const SYSTEM_PROMPT = `당신은 한국어 글쓰기 흐름 분석 전문 AI입니다.
주어진 문단들 사이의 논리적 연결성과 흐름을 분석합니다.
문단 전환이 갑작스럽거나 논리적 공백이 있는 부분을 지적합니다.

검사 항목:
- 문단 간 전환의 자연스러움
- 논리적 흐름의 단절
- 주제 전환의 매끄러움

주의사항:
- type은 항상 "flow"로 설정
- from/to는 문제가 있는 문단의 시작 부분으로 설정
- suggestion은 빈 문자열로 설정 (흐름 문제는 직접 수정하지 않음)
- reason에 구체적인 개선 방향을 한국어로 제시
- 문제가 없으면 빈 배열을 반환`

function formatParagraphs(paragraphs: AIReviewParagraph[]): string {
  return paragraphs
    .map((p, i) => `[문단 ${i + 1}] (from: ${p.from}, to: ${p.to})\n${p.text}`)
    .join("\n\n")
}

export function buildFlowReviewPrompt(paragraphs: AIReviewParagraph[]) {
  return {
    system: SYSTEM_PROMPT,
    prompt: `다음 문단들 사이의 흐름을 분석하고 문제가 있는 부분을 지적해주세요.

${formatParagraphs(paragraphs)}`,
  }
}
