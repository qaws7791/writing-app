export type {
  AIFeatureType,
  AISuggestion,
  ReviewItem,
  ReviewItemType,
} from "@workspace/core/modules/ai-assistant"

export {
  getAISuggestions,
  getDocumentReview,
  getFlowReview,
} from "@/features/ai-assistant/repositories/api-ai"

export {
  type AIFeatureOption,
  type FeatureButtonData,
  type Layer2Option,
  FeatureButton,
  layer1Features,
  layer2Options,
} from "@/features/ai-assistant/components/ai-features"

export { AIReviewCard } from "@/features/ai-assistant/components/ai-review-card"

export {
  AIReviewExtension,
  aiReviewPluginKey,
  clearReviewItems,
  getReviewItems,
  removeReviewItem,
  setReviewItems,
} from "@/features/ai-assistant/components/ai-review-extension"

export { AISuggestionPanel } from "@/features/ai-assistant/components/ai-suggestion-panel"
