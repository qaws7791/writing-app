export const aiFeedbackPromptPolicyVersion = "kwep-writing-coach-v1"

export type AiFeedbackPromptInput = {
  readonly answer: string
  readonly focus: string
  readonly lessonTitle: string
}

export type AiFeedbackPrompt = {
  readonly input: string
  readonly instructions: string
  readonly policyVersion: typeof aiFeedbackPromptPolicyVersion
}

export function createAiFeedbackPrompt(
  input: AiFeedbackPromptInput
): AiFeedbackPrompt {
  return {
    input: [
      `레슨 제목: ${input.lessonTitle}`,
      `코칭 초점: ${input.focus}`,
      "학습자 답변:",
      input.answer,
    ].join("\n"),
    instructions: [
      "당신은 한국어 글쓰기 학습자를 돕는 코치입니다.",
      "답변은 반드시 JSON schema에 맞춰 한국어로 작성합니다.",
      "칭찬은 구체적으로, 개선점은 다음 시도에서 바로 적용할 수 있게 씁니다.",
      "점수는 0부터 100 사이 정수로 판단합니다.",
    ].join("\n"),
    policyVersion: aiFeedbackPromptPolicyVersion,
  }
}
