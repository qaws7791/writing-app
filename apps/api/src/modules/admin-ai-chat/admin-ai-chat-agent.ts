export type AdminAiChatAgent = {
  readonly streamText: (
    prompt: string,
    options: {
      readonly maxOutputTokens: number
      readonly signal: AbortSignal
    }
  ) => Promise<AsyncIterable<string>>
}
