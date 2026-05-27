pragma foreign_keys = on;

update course_progress
set curriculum_version_id = (
  select curriculum_versions.id
  from curriculum_versions
  where curriculum_versions.course_id = course_progress.course_id
    and curriculum_versions.version_number = 1
)
where curriculum_version_id is null;

update lesson_progress
set curriculum_version_id = (
  select course_progress.curriculum_version_id
  from course_progress
  where course_progress.user_id = lesson_progress.user_id
    and course_progress.course_id = lesson_progress.course_id
)
where curriculum_version_id is null;
