export const k6StagingOptions = {
  scenarios: {
    lessonTransitions: {
      exec: "lessonTransitions",
      executor: "per-vu-iterations",
      iterations: 10,
      maxDuration: "30s",
      startTime: "5s",
      vus: 1,
    },
    readRoutes: {
      duration: "30s",
      exec: "readRoutes",
      executor: "constant-vus",
      vus: 2,
    },
  },
  thresholds: {
    checks: [{ abortOnFail: true, threshold: "rate==1" }],
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:course-list}": ["p(95)<1000"],
    "http_req_duration{name:health}": ["p(95)<750"],
    "http_req_duration{name:lesson-start}": ["p(95)<1500"],
    "http_req_duration{name:lesson-submit}": ["p(95)<1500"],
  },
}

export function isCourseListResponse(body) {
  return Array.isArray(body?.items)
}

export function isIncorrectLessonSubmission(body) {
  return body?.evaluation?.correct === false
}

export function isLessonInProgress(body) {
  return body?.status === "in_progress"
}

export function isReadyHealthResponse(body) {
  return body?.ok === true
}

export function isRetryableLessonSubmission(body) {
  return body?.status === "retry"
}

export function createK6StagingConfiguration(environment) {
  if (
    readRequiredEnvironment(environment, "K6_ALLOW_STAGING_LOAD") !== "true"
  ) {
    throw new Error("K6_ALLOW_STAGING_LOAD=true 승인이 필요합니다.")
  }

  const stagingOrigin = readHttpsOrigin(environment, "K6_STAGING_ORIGIN")
  const productionOrigin = readHttpsOrigin(environment, "K6_PRODUCTION_ORIGIN")
  if (stagingOrigin === productionOrigin) {
    throw new Error("k6 staging origin은 production origin과 달라야 합니다.")
  }

  const learnerCookie = readRequiredEnvironment(
    environment,
    "K6_LEARNER_COOKIE"
  )
  if (/[\r\n]/u.test(learnerCookie) || !learnerCookie.includes("=")) {
    throw new Error("K6_LEARNER_COOKIE 형식이 올바르지 않습니다.")
  }

  const curriculumVersionId = readRequiredEnvironment(
    environment,
    "K6_CURRICULUM_VERSION_ID"
  )
  const lessonId = readRequiredEnvironment(environment, "K6_LESSON_ID")
  const stepId = readRequiredEnvironment(environment, "K6_STEP_ID")
  const wrongOptionId = readRequiredEnvironment(
    environment,
    "K6_WRONG_OPTION_ID"
  )
  const lessonPath = `/api/learning/lessons/${encodeURIComponent(lessonId)}`

  return {
    learnerCookie,
    requests: {
      courseList: {
        method: "GET",
        name: "course-list",
        url: `${stagingOrigin}/api/courses`,
      },
      health: {
        method: "GET",
        name: "health",
        url: `${stagingOrigin}/api/health`,
      },
      lessonStart: {
        body: { expectedCurriculumVersionId: curriculumVersionId },
        method: "POST",
        name: "lesson-start",
        url: `${stagingOrigin}${lessonPath}/start`,
      },
      lessonSubmit: {
        body: {
          answer: {
            selectedOptionId: wrongOptionId,
            type: "MULTIPLE_CHOICE",
          },
          kind: "answer",
        },
        method: "POST",
        name: "lesson-submit",
        url: `${stagingOrigin}${lessonPath}/steps/${encodeURIComponent(stepId)}/complete`,
      },
    },
  }
}

function readHttpsOrigin(environment, name) {
  const value = readRequiredEnvironment(environment, name)
  if (
    !/^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::[1-9][0-9]{0,4})?$/u.test(
      value
    )
  ) {
    throw new Error(`${name}은 경로가 없는 HTTPS origin이어야 합니다.`)
  }

  return value
}

function readRequiredEnvironment(environment, name) {
  const value = environment[name]?.trim()

  if (value === undefined || value.length === 0) {
    throw new Error(`${name} 환경 변수가 필요합니다.`)
  }

  return value
}
