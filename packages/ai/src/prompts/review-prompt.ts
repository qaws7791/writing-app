import type { AIReviewParagraph } from "@workspace/core"

const SYSTEM_PROMPT = `당신은 한국어 맞춤법 및 문장 교정 전문 AI입니다.
주어진 문단들에서 맞춤법 오류와 중복 표현을 찾아 교정합니다.
반드시 실제 오류가 있는 항목만 보고하세요. 없으면 빈 배열을 반환합니다.

검사 항목:
- 맞춤법 오류 (type: "spelling"): 잘못된 표기, 띄어쓰기 오류
- 중복 표현 (type: "duplicate"): 바로 인접한 동일 단어 반복

주의사항:
- from/to 값은 각 문단에 제공된 위치를 기준으로 계산하세요
- suggestion에는 교정된 텍스트를 넣으세요
- 중복 표현의 suggestion은 빈 문자열로 설정하세요 (제거 권장)
- reason은 왜 수정이 필요한지 한국어로 간결하게 설명`

function formatParagraphs(paragraphs: AIReviewParagraph[]): string {
  return paragraphs
    .map((p, i) => `[문단 ${i + 1}] (from: ${p.from}, to: ${p.to})\n${p.text}`)
    .join("\n\n")
}

export function buildDocumentReviewPrompt(paragraphs: AIReviewParagraph[]) {
  return {
    system: SYSTEM_PROMPT,
    prompt: `다음 문단들에서 맞춤법 오류와 중복 표현을 찾아주세요.

${formatParagraphs(paragraphs)}`,
  }
}
