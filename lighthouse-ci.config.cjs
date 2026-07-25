"use strict"

const learnerCookie = readRequiredEnvironment("LIGHTHOUSE_AUTH_COOKIE")
const chromePath = readRequiredEnvironment("LIGHTHOUSE_CHROME_PATH")

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
      },
      url: [
        "http://localhost:3100/",
        "http://localhost:3100/app",
        "http://localhost:3100/app/lesson?lesson_id=e2e-transition-lesson",
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
