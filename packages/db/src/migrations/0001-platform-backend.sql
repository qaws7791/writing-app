pragma foreign_keys = on;

create table if not exists user (
  id text primary key,
  name text not null,
  email text not null unique,
  emailVerified integer not null,
  image text,
  createdAt integer not null,
  updatedAt integer not null
);

create table if not exists session (
  id text primary key,
  expiresAt integer not null,
  token text not null unique,
  createdAt integer not null,
  updatedAt integer not null,
  ipAddress text,
  userAgent text,
  userId text not null references user(id) on delete cascade
);

create table if not exists account (
  id text primary key,
  accountId text not null,
  providerId text not null,
  userId text not null references user(id) on delete cascade,
  accessToken text,
  refreshToken text,
  idToken text,
  accessTokenExpiresAt integer,
  refreshTokenExpiresAt integer,
  scope text,
  password text,
  createdAt integer not null,
  updatedAt integer not null
);

create table if not exists verification (
  id text primary key,
  identifier text not null,
  value text not null,
  expiresAt integer not null,
  createdAt integer,
  updatedAt integer
);

create table if not exists course_progress (
  user_id text not null references user(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  started_at integer not null,
  last_lesson_id text references lessons(id),
  completed_count integer not null default 0,
  updated_at integer not null
);

create unique index if not exists course_progress_user_course_idx
  on course_progress(user_id, course_id);

create table if not exists lesson_progress (
  user_id text not null references user(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  current_step_id text not null references lesson_steps(id) on delete cascade,
  step_order integer not null,
  status text not null,
  completed_at integer,
  updated_at integer not null
);

create unique index if not exists lesson_progress_user_lesson_idx
  on lesson_progress(user_id, lesson_id);

create table if not exists lesson_answers (
  user_id text not null references user(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  step_id text not null references lesson_steps(id) on delete cascade,
  answer text not null,
  updated_at integer not null
);

create unique index if not exists lesson_answers_user_lesson_step_idx
  on lesson_answers(user_id, lesson_id, step_id);

create table if not exists feedback_attempts (
  user_id text not null references user(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  feedback_step_id text not null references lesson_steps(id) on delete cascade,
  source_step_id text not null references lesson_steps(id) on delete cascade,
  attempt_number integer not null,
  answer_snapshot text not null,
  result_json text not null,
  status text not null,
  created_at integer not null
);

create unique index if not exists feedback_attempts_user_lesson_step_attempt_idx
  on feedback_attempts(user_id, lesson_id, feedback_step_id, attempt_number);
