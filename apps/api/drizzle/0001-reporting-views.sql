-- 운영 리포팅이 소비하는 module 공개 읽기 뷰.
-- 각 뷰는 소유 module의 reporting-view.ts가 계약으로 선언하며, 컬럼이 사라지면 이 migration이 실패한다.

CREATE VIEW identity_reporting_learners AS
SELECT
  user.id AS user_id,
  user.created_at AS created_at
FROM user
INNER JOIN learner_profiles
  ON learner_profiles.user_id = user.id
WHERE learner_profiles.status <> 'deleted';

CREATE VIEW learning_reporting_lesson_progress AS
SELECT
  user_id,
  course_id,
  curriculum_version_id,
  lesson_id,
  status,
  started_at,
  completed_at
FROM learner_lesson_progress;

CREATE VIEW learning_reporting_activity_days AS
SELECT
  user_id,
  activity_date
FROM learner_activity_days;

CREATE VIEW content_reporting_current_lessons AS
SELECT
  course.id AS course_id,
  curriculum.id AS curriculum_version_id,
  curriculum.title AS course_title,
  lesson.id AS lesson_id,
  lesson.title AS lesson_title
FROM courses AS course
INNER JOIN course_curriculum_versions AS curriculum
  ON curriculum.course_id = course.id
  AND curriculum.id = course.published_curriculum_version_id
  AND curriculum.status = 'published'
INNER JOIN course_unit_versions AS unit
  ON unit.curriculum_version_id = curriculum.id
  AND unit.status = 'active'
INNER JOIN lesson_versions AS lesson
  ON lesson.curriculum_version_id = curriculum.id
  AND lesson.unit_id = unit.id
  AND lesson.status = 'active'
WHERE course.status = 'active';

CREATE VIEW ai_feedback_reporting_attempts AS
SELECT
  id,
  user_id,
  course_id,
  lesson_id,
  attempt_number,
  status,
  failure_code,
  created_at,
  quota_date,
  input_token_count,
  output_token_count,
  latency_ms
FROM ai_feedback_attempts;
