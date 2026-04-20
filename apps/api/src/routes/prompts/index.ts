import bookmarkPrompt from "./bookmark-prompt"
import getPrompt from "./get-prompt"
import listCategories from "./list-categories"
import listPromptWritings from "./list-prompt-writings"
import listPrompts from "./list-prompts"
import unbookmarkPrompt from "./unbookmark-prompt"

export function promptRoutes() {
  return [
    listPrompts,
    listCategories,
    getPrompt,
    listPromptWritings,
    bookmarkPrompt,
    unbookmarkPrompt,
  ] as const
}
