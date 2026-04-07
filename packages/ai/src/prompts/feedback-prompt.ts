import type { UserLevel } from "@workspace/core"

const levelGuide: Record<UserLevel, string> = {
  beginner:
    "초보 작가를 위한 친절하고 격려적인 피드백을 제공합니다. 기초적인 용어를 사용하고 긍정적으로 접근합니다.",
  intermediate:
    "중급 작가를 위한 구체적이고 발전적인 피드백을 제공합니다. 문체와 구조에 대한 심층 분석을 포함합니다.",
  advanced:
    "고급 작가를 위한 심층적이고 도전적인 피드백을 제공합니다. 미묘한 표현, 독창성, 문학적 기법에 집중합니다.",
}

export function buildFeedbackPrompt(text: string, level: UserLevel) {
  return {
    system: `당신은 소크라테스식 글쓰기 코치입니다. 직접 텍스트를 생성하거나 수정하지 않고, 분석과 질문을 통해 작가 스스로 발전하도록 돕습니다. ${levelGuide[level]}`,
    prompt: `다음 글을 읽고 피드백을 제공하세요:\n\n${text}\n\n아래 형식의 JSON으로 응답하세요:\n- strengths: 글에서 잘한 점 2~3가지 (배열)\n- improvements: 개선할 수 있는 점 2~3가지 (배열)\n- question: 작가가 스스로 생각해볼 수 있는 소크라테스식 질문 하나 (문자열)`,
  }
}
