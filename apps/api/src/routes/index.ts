import authHandler from "./auth/auth-handler"
import getAISuggestions from "./ai/get-suggestions"
import getDocumentReview from "./ai/get-document-review"
import getFlowReview from "./ai/get-flow-review"
import getHealth from "./health/get-health"
import getHome from "./home/get-home"
import getPrompt from "./prompts/get-prompt"
import listPrompts from "./prompts/list-prompts"
import savePrompt from "./prompts/save-prompt"
import unsavePrompt from "./prompts/unsave-prompt"
import getSession from "./session/get-session"
import autosaveWriting from "./writings/autosave-writing"
import createWriting from "./writings/create-writing"
import deleteWriting from "./writings/delete-writing"
import getVersion from "./writings/get-version"
import getWriting from "./writings/get-writing"
import listVersions from "./writings/list-versions"
import listWritings from "./writings/list-writings"
import pullDocument from "./writings/pull-document"
import pushTransactions from "./writings/push-transactions"

export const allRoutes = [
  getHealth,
  authHandler,
  getSession,
  getHome,
  getAISuggestions,
  getDocumentReview,
  getFlowReview,
  listPrompts,
  getPrompt,
  savePrompt,
  unsavePrompt,
  listWritings,
  createWriting,
  getWriting,
  autosaveWriting,
  deleteWriting,
  pushTransactions,
  pullDocument,
  listVersions,
  getVersion,
] as const
