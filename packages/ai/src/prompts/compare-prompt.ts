export function buildComparePrompt(original: string, revised: string) {
  return {
    system: `당신은 글쓰기 코치입니다. 원문과 수정본을 비교하여 작가가 이룬 발전을 분석합니다.`,
    prompt: `원문:\n${original}\n\n수정본:\n${revised}\n\n아래 형식의 JSON으로 응답하세요:\n- improvements: 수정을 통해 개선된 구체적인 점들 (배열)\n- summary: 전체적인 변화에 대한 한 문장 요약 (문자열)`,
  }
}
