import authHandler from "./auth/auth-handler"
import getHealth from "./health/get-health"
import getSession from "./session/get-session"
import getHome from "./home/get-home"
import listPrompts from "./prompts/list-prompts"
import getPrompt from "./prompts/get-prompt"
import bookmarkPrompt from "./prompts/bookmark-prompt"
import unbookmarkPrompt from "./prompts/unbookmark-prompt"
import listJourneys from "./journeys/list-journeys"
import getJourney from "./journeys/get-journey"
import enrollJourney from "./journeys/enroll-journey"
import getSessionDetail from "./sessions/get-session"
import startSession from "./sessions/start-session"
import submitStep from "./sessions/submit-step"
import completeSession from "./sessions/complete-session"
import listWritings from "./writings/list-writings"
import createWriting from "./writings/create-writing"
import getWriting from "./writings/get-writing"
import autosaveWriting from "./writings/autosave-writing"
import deleteWriting from "./writings/delete-writing"
import generateFeedback from "./ai/generate-feedback"
import compareRevisions from "./ai/compare-revisions"

export const allRoutes = [
  getHealth,
  authHandler,
  getSession,
  getHome,
  listPrompts,
  getPrompt,
  bookmarkPrompt,
  unbookmarkPrompt,
  listJourneys,
  getJourney,
  enrollJourney,
  getSessionDetail,
  startSession,
  submitStep,
  completeSession,
  listWritings,
  createWriting,
  getWriting,
  autosaveWriting,
  deleteWriting,
  generateFeedback,
  compareRevisions,
] as const
