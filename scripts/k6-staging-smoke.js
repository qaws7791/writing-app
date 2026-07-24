import http from "k6/http"
import { check, sleep } from "k6"

import {
  createK6StagingConfiguration,
  isCourseListResponse,
  isIncorrectLessonSubmission,
  isLessonInProgress,
  isReadyHealthResponse,
  isRetryableLessonSubmission,
  k6StagingOptions,
} from "./k6-staging-config.js"

const configuration = createK6StagingConfiguration(globalThis.__ENV)

export const options = k6StagingOptions

export function readRoutes() {
  const healthResponse = http.request(
    configuration.requests.health.method,
    configuration.requests.health.url,
    null,
    requestParameters(configuration.requests.health.name)
  )
  const healthBody = readJson(healthResponse)
  check(healthResponse, {
    "health body is ready": () => isReadyHealthResponse(healthBody),
    "health returns 200": (response) => response.status === 200,
  })

  const courseResponse = http.request(
    configuration.requests.courseList.method,
    configuration.requests.courseList.url,
    null,
    authenticatedRequestParameters(configuration.requests.courseList.name)
  )
  const courseBody = readJson(courseResponse)
  check(courseResponse, {
    "course list returns 200": (response) => response.status === 200,
    "course list returns items": () => isCourseListResponse(courseBody),
  })

  sleep(1)
}

export function lessonTransitions() {
  const startResponse = http.request(
    configuration.requests.lessonStart.method,
    configuration.requests.lessonStart.url,
    JSON.stringify(configuration.requests.lessonStart.body),
    authenticatedRequestParameters(configuration.requests.lessonStart.name)
  )
  const startBody = readJson(startResponse)
  check(startResponse, {
    "lesson start returns 200": (response) => response.status === 200,
    "lesson start stays in progress": () => isLessonInProgress(startBody),
  })

  const submitResponse = http.request(
    configuration.requests.lessonSubmit.method,
    configuration.requests.lessonSubmit.url,
    JSON.stringify(configuration.requests.lessonSubmit.body),
    authenticatedRequestParameters(configuration.requests.lessonSubmit.name)
  )
  const submitBody = readJson(submitResponse)
  check(submitResponse, {
    "lesson submit is an incorrect answer": () =>
      isIncorrectLessonSubmission(submitBody),
    "lesson submit returns 200": (response) => response.status === 200,
    "lesson submit stays retryable": () =>
      isRetryableLessonSubmission(submitBody),
  })

  sleep(1)
}

function authenticatedRequestParameters(name) {
  return {
    ...requestParameters(name),
    headers: {
      Accept: "application/json",
      Cookie: configuration.learnerCookie,
      "Content-Type": "application/json",
    },
  }
}

function requestParameters(name) {
  return {
    redirects: 0,
    tags: { name },
    timeout: "10s",
  }
}

function readJson(response) {
  try {
    return response.json()
  } catch {
    return undefined
  }
}
