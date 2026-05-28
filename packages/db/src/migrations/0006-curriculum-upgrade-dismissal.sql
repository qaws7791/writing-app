pragma foreign_keys = on;

create table if not exists curriculum_upgrade_dismissals (
  id text primary key,
  user_id text not null references user(id) on delete cascade,
  course_id text not null references courses(id),
  from_version_id text not null references curriculum_versions(id),
  to_version_id text not null references curriculum_versions(id),
  created_at integer not null,
  updated_at integer not null
);

create unique index if not exists curriculum_upgrade_dismissals_pair_idx
  on curriculum_upgrade_dismissals(
    user_id,
    course_id,
    from_version_id,
    to_version_id
  );
