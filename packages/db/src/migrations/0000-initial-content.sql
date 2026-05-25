create table if not exists course_categories (
  id text primary key,
  title text not null,
  sort_order integer not null
);

create table if not exists courses (
  id text primary key,
  category_id text not null references course_categories(id),
  title text not null,
  description text not null,
  thumbnail_path text not null,
  sort_order integer not null
);

create table if not exists course_chapters (
  id text primary key,
  course_id text not null references courses(id),
  label text not null,
  title text not null,
  sort_order integer not null
);

create table if not exists course_lessons (
  id text primary key,
  chapter_id text not null references course_chapters(id),
  lesson_id text not null,
  title text not null,
  description text not null,
  sort_order integer not null
);

create table if not exists lessons (
  id text primary key,
  course_id text not null references courses(id),
  title text not null,
  category_id text not null,
  unit_number integer not null,
  next_lesson_id text
);

create table if not exists lesson_steps (
  id text primary key,
  lesson_id text not null references lessons(id),
  type text not null,
  sort_order integer not null,
  points integer not null,
  required integer not null,
  content_json text not null
);
