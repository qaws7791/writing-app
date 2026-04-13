import authHandler from "./auth/auth-handler"
import getHealth from "./health/get-health"
import getSession from "./session/get-session"
import getHome from "./home/get-home"
import listCategories from "./prompts/list-categories"
import listPrompts from "./prompts/list-prompts"
import getPrompt from "./prompts/get-prompt"
import listPromptWritings from "./prompts/list-prompt-writings"
import bookmarkPrompt from "./prompts/bookmark-prompt"
import unbookmarkPrompt from "./prompts/unbookmark-prompt"
import listJourneys from "./journeys/list-journeys"
import getJourney from "./journeys/get-journey"
import enrollJourney from "./journeys/enroll-journey"
import getSessionDetail from "./sessions/get-session"
import startSession from "./sessions/start-session"
import submitStep from "./sessions/submit-step"
import retrySessionStepAi from "./sessions/retry-step-ai"
import completeSession from "./sessions/complete-session"
import getUserProfile from "./users/get-user-profile"
import listWritings from "./writings/list-writings"
import createWriting from "./writings/create-writing"
import getWriting from "./writings/get-writing"
import autosaveWriting from "./writings/autosave-writing"
import deleteWriting from "./writings/delete-writing"
import generateTextFeedback from "./ai/generate-text-feedback"
import compareTexts from "./ai/compare-texts"

export const allRoutes = [
  getHealth,
  authHandler,
  getSession,
  getHome,
  listPrompts,
  listCategories,
  getPrompt,
  listPromptWritings,
  bookmarkPrompt,
  unbookmarkPrompt,
  listJourneys,
  getJourney,
  enrollJourney,
  getSessionDetail,
  startSession,
  submitStep,
  retrySessionStepAi,
  completeSession,
  getUserProfile,
  listWritings,
  createWriting,
  getWriting,
  autosaveWriting,
  deleteWriting,
  generateTextFeedback,
  compareTexts,
] as const
