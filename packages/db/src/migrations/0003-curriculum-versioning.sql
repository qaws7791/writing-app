pragma foreign_keys = on;

create table if not exists curriculum_versions (
  id text primary key,
  course_id text not null references courses(id),
  version_number integer not null,
  status text not null,
  title text not null,
  changelog text not null,
  published_at integer,
  created_at integer not null
);

create unique index if not exists curriculum_versions_course_version_idx
  on curriculum_versions(course_id, version_number);

create table if not exists curriculum_version_chapters (
  id text primary key,
  curriculum_version_id text not null references curriculum_versions(id),
  source_chapter_id text references course_chapters(id),
  label text not null,
  title text not null,
  sort_order integer not null,
  status text not null
);

create unique index if not exists curriculum_version_chapters_version_sort_idx
  on curriculum_version_chapters(curriculum_version_id, sort_order);

create table if not exists curriculum_version_lessons (
  id text primary key,
  curriculum_version_id text not null references curriculum_versions(id),
  chapter_id text not null references curriculum_version_chapters(id),
  lesson_id text not null references lessons(id),
  title text not null,
  description text not null,
  sort_order integer not null,
  status text not null
);

create unique index if not exists curriculum_version_lessons_chapter_sort_idx
  on curriculum_version_lessons(chapter_id, sort_order);
