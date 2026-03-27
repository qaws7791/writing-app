import type { AIFeatureType } from "@workspace/core"

const SYSTEM_PROMPT = `당신은 한국어 글쓰기 전문 AI 어시스턴트입니다.
사용자가 선택한 텍스트에 대해 정확히 3개의 대안을 제시합니다.
각 대안은 원본의 의미를 유지하면서도 표현을 개선해야 합니다.
이유는 한국어로 간결하게 작성하세요.`

const FEATURE_INSTRUCTIONS: Record<AIFeatureType, string> = {
  vocabulary: `어휘와 표현을 개선하세요.
- 더 정확하고 구체적인 단어로 교체
- 문맥에 맞는 격식 수준 조정
- 동의어나 유의어를 활용한 다양한 표현 제안`,

  clarity: `문장의 명료성을 개선하세요.
- 모호한 표현을 명확하게 수정
- 복잡한 문장을 간결하게 분리
- 주어-서술어 관계를 명확히`,

  rhythm: `문장의 호흡과 리듬을 개선하세요.
- 문장 길이의 완급 조절
- 읽는 흐름이 자연스러운 구조로 수정
- 단조로운 리듬 패턴 변화`,
}

export function buildSuggestionPrompt(text: string, type: AIFeatureType) {
  return {
    system: SYSTEM_PROMPT,
    prompt: `[기능: ${type}]
${FEATURE_INSTRUCTIONS[type]}

[원본 텍스트]
${text}

위 텍스트에 대해 정확히 3개의 대안을 제시하세요.`,
  }
}
