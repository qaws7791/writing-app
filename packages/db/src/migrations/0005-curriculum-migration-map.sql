pragma foreign_keys = on;

create table if not exists curriculum_version_migrations (
  id text primary key,
  from_version_id text not null references curriculum_versions(id),
  to_version_id text not null references curriculum_versions(id),
  status text not null,
  created_at integer not null
);

create unique index if not exists curriculum_version_migrations_version_pair_idx
  on curriculum_version_migrations(from_version_id, to_version_id);

create table if not exists lesson_migration_mappings (
  id text primary key,
  migration_id text not null references curriculum_version_migrations(id),
  from_lesson_id text not null references lessons(id),
  to_lesson_id text references lessons(id),
  mapping_type text not null
);

create unique index if not exists lesson_migration_mappings_migration_pair_idx
  on lesson_migration_mappings(
    migration_id,
    from_lesson_id,
    to_lesson_id,
    mapping_type
  );

create table if not exists curriculum_migration_applications (
  id text primary key,
  migration_id text not null references curriculum_version_migrations(id),
  user_id text not null references user(id) on delete cascade,
  course_id text not null references courses(id),
  from_version_id text not null references curriculum_versions(id),
  to_version_id text not null references curriculum_versions(id),
  status text not null,
  completed_lesson_count integer not null,
  result_json text not null,
  error_message text,
  created_at integer not null,
  updated_at integer not null
);

create unique index if not exists curriculum_migration_applications_migration_user_idx
  on curriculum_migration_applications(migration_id, user_id);
