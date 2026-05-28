create table if not exists curriculum_version_steps (
  id text primary key,
  curriculum_version_id text not null references curriculum_versions(id),
  lesson_id text not null references lessons(id),
  source_step_id text references lesson_steps(id),
  type text not null,
  sort_order integer not null,
  points integer not null,
  required integer not null,
  status text not null,
  content_json text not null
);

create unique index if not exists curriculum_version_steps_version_lesson_sort_idx
  on curriculum_version_steps(curriculum_version_id, lesson_id, sort_order);

insert or ignore into curriculum_version_steps (
  id,
  curriculum_version_id,
  lesson_id,
  source_step_id,
  type,
  sort_order,
  points,
  required,
  status,
  content_json
)
select
  curriculum_versions.id || '-' || lesson_steps.id,
  curriculum_versions.id,
  lesson_steps.lesson_id,
  lesson_steps.id,
  lesson_steps.type,
  lesson_steps.sort_order,
  lesson_steps.points,
  lesson_steps.required,
  lesson_steps.status,
  lesson_steps.content_json
from curriculum_versions
inner join curriculum_version_lessons
  on curriculum_version_lessons.curriculum_version_id = curriculum_versions.id
inner join lesson_steps
  on lesson_steps.lesson_id = curriculum_version_lessons.lesson_id;
