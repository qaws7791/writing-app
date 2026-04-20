export const aiQueryKeys = {
  feedback: (text: string) => ["ai-feedback", text] as const,
} as const
