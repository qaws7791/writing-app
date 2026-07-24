"use strict"

const learnerCookie = readRequiredEnvironment("LIGHTHOUSE_AUTH_COOKIE")
const chromePath = readRequiredEnvironment("LIGHTHOUSE_CHROME_PATH")
const chromeDebuggingPort = readPortEnvironment(
  "LIGHTHOUSE_CHROME_DEBUGGING_PORT"
)

module.exports = {
  ci: {
    assert: {
      assertions: {
        "categories:performance": [
          "error",
          { aggregationMethod: "median-run", minScore: 0.75 },
        ],
        "cumulative-layout-shift": [
          "error",
          { aggregationMethod: "median-run", maxNumericValue: 0.1 },
        ],
        "largest-contentful-paint": [
          "error",
          { aggregationMethod: "median-run", maxNumericValue: 4_000 },
        ],
        "total-blocking-time": [
          "error",
          { aggregationMethod: "median-run", maxNumericValue: 400 },
        ],
      },
    },
    collect: {
      chromePath,
      numberOfRuns: 3,
      settings: {
        extraHeaders: JSON.stringify({ Cookie: learnerCookie }),
        onlyCategories: ["performance"],
        port: chromeDebuggingPort,
      },
      url: [
        "http://localhost:3200/",
        "http://localhost:3200/app",
        "http://localhost:3200/app/lesson?lesson_id=e2e-transition-lesson",
      ],
    },
    upload: {
      outputDir: "output/lighthouse",
      target: "filesystem",
    },
  },
}

function readRequiredEnvironment(name) {
  const value = process.env[name]?.trim()

  if (value === undefined || value.length === 0) {
    throw new Error(`${name} 환경 변수가 필요합니다.`)
  }

  return value
}

function readPortEnvironment(name) {
  const value = Number(readRequiredEnvironment(name))

  if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`${name} 환경 변수는 유효한 TCP 포트여야 합니다.`)
  }

  return value
}
