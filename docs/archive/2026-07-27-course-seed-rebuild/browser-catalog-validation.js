;async (page) => {
  const courseIds = [
    "course-word-sentence-meaning",
    "course-reading-structure-main-ideas",
    "course-clear-accurate-expression",
    "course-grammar-orthography",
    "course-idea-topic-development",
    "course-organization-coherence",
    "course-audience-purpose-genre",
    "course-reader-centered-explanation",
    "course-evidence-based-inference",
    "course-information-search-credibility",
    "course-critical-analysis-integration",
    "course-evidence-based-argumentation",
    "course-revision-feedback",
    "course-responsible-source-ai-use",
  ]
  const result = []
  const postCompletion = async (lessonId, step, body) => {
    const response = await page.request.post(
      `http://localhost:3100/api/learning/lessons/${lessonId}/steps/${step.id}/complete`,
      { data: body, headers: { origin: "http://localhost:3100" } }
    )
    if (!response.ok()) {
      throw new Error(
        `${lessonId}/${step.id} 완료 실패: ${response.status()} ${await response.text()}`
      )
    }
  }
  const answerFor = (step) => {
    switch (step.type) {
      case "MULTIPLE_CHOICE":
        return {
          selectedOptionId: "evidence-aligned",
          type: "MULTIPLE_CHOICE",
        }
      case "FILL_BLANK":
        return {
          selectedChoiceIds: [
            "target-condition",
            "checked-evidence",
            "remaining-limit",
          ],
          type: "FILL_BLANK",
        }
      case "SELECT":
        return {
          selectedItemIds: [
            "case-information",
            "checked-conditions",
            "excluded-unknown-intent",
          ],
          type: "SELECT",
        }
      case "ORDER":
        return {
          orderedItemIds: [
            "define-question",
            "mark-scope",
            "compare-evidence",
            "record-judgment",
          ],
          type: "ORDER",
        }
      case "WRITE":
        return {
          text: "판단 대상과 적용 범위를 먼저 정했습니다. 사례에서 직접 확인한 대상, 시점과 조건을 근거로 삼아 목표에 맞는 결론을 제시합니다. 다만 자료에 나오지 않은 의도와 다른 상황의 결과는 확인되지 않았으므로 추가 확인이 필요합니다.",
          type: "WRITE",
        }
      case "MATCH":
        return {
          pairs: [
            { leftItemId: "target", rightItemId: "target-record" },
            { leftItemId: "evidence", rightItemId: "evidence-record" },
            { leftItemId: "limit", rightItemId: "limit-record" },
          ],
          type: "MATCH",
        }
      case "CATEGORIZE":
        return {
          assignments: [
            { categoryId: "observed", itemId: "stated-target" },
            { categoryId: "interpreted", itemId: "criterion-result" },
            { categoryId: "unknown", itemId: "missing-context" },
          ],
          type: "CATEGORIZE",
        }
      default:
        throw new Error(`지원하지 않는 답변 타입: ${step.type}`)
    }
  }

  for (const courseId of courseIds) {
    await page.goto(`http://localhost:3100/app/courses/${courseId}`, {
      waitUntil: "domcontentloaded",
    })
    const courseHeading = await page.locator("main h1").textContent()
    if (courseHeading === null || courseHeading.trim() === "") {
      throw new Error(`${courseId} 상세 화면 제목이 없습니다.`)
    }

    const courseResponse = await page.request.get(
      `http://localhost:3100/api/courses/${courseId}`
    )
    if (!courseResponse.ok()) {
      throw new Error(`${courseId} 조회 실패: ${courseResponse.status()}`)
    }
    let course = await courseResponse.json()
    const lessons = course.units.flatMap((unit) => unit.lessons)
    const firstLesson = lessons[0]
    await page.goto(
      `http://localhost:3100/app/lesson?lesson_id=${firstLesson.id}`,
      { waitUntil: "domcontentloaded" }
    )
    if (!(await page.locator("body").innerText()).includes(firstLesson.title)) {
      throw new Error(`${courseId} 첫 레슨 화면 제목이 일치하지 않습니다.`)
    }

    let completedStepCount = 0
    for (const lessonReference of lessons) {
      const startResponse = await page.request.post(
        `http://localhost:3100/api/learning/lessons/${lessonReference.id}/start`,
        {
          data: {
            expectedCurriculumVersionId: course.version.curriculumVersionId,
          },
          headers: { origin: "http://localhost:3100" },
        }
      )
      if (!startResponse.ok() && startResponse.status() !== 409) {
        throw new Error(
          `${lessonReference.id} 시작 실패: ${startResponse.status()} ${await startResponse.text()}`
        )
      }
      const lessonResponse = await page.request.get(
        `http://localhost:3100/api/lessons/${lessonReference.id}`
      )
      if (!lessonResponse.ok()) {
        throw new Error(
          `${lessonReference.id} 조회 실패: ${lessonResponse.status()}`
        )
      }
      const lesson = await lessonResponse.json()
      if (lesson.learning.status === "completed") {
        completedStepCount += lesson.steps.length
        continue
      }

      const firstIncompleteIndex =
        lesson.learning.status === "in_progress"
          ? lesson.learning.completedSteps
          : 0
      for (
        let stepIndex = firstIncompleteIndex;
        stepIndex < lesson.steps.length;
        stepIndex += 1
      ) {
        const step = lesson.steps[stepIndex]
        if (step.type === "READING" || step.type === "COMPARE") {
          await postCompletion(lesson.id, step, { kind: "acknowledge" })
        } else if (step.type === "AI_FEEDBACK") {
          await postCompletion(lesson.id, step, {
            kind: "skip-ai-feedback",
          })
        } else {
          await postCompletion(lesson.id, step, {
            answer: answerFor(step),
            kind: "answer",
          })
        }
        completedStepCount += 1
      }
    }

    const completedCourseResponse = await page.request.get(
      `http://localhost:3100/api/courses/${courseId}`
    )
    course = await completedCourseResponse.json()
    if (
      course.learning.status !== "completed" ||
      course.learning.completedLessons !== lessons.length
    ) {
      throw new Error(`${courseId} 완료 상태가 일치하지 않습니다.`)
    }
    result.push({
      courseId,
      lessons: lessons.length,
      renderedFirstLesson: firstLesson.id,
      steps: completedStepCount,
    })
  }

  return result
}
