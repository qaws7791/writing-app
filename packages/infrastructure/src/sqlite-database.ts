import { mkdirSync, rmSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { Database } from "bun:sqlite"

export function openSqliteDatabase(path: string): Database {
  const resolvedPath = resolve(path)
  mkdirSync(dirname(resolvedPath), { recursive: true })

  return new Database(resolvedPath, {
    create: true,
    strict: true,
  })
}

export function closeSqliteDatabase(database: Database): void {
  database.close(false)
}

export function ensureSqliteJsonbSupport(database: Database): {
  sqliteVersion: string
} {
  const row = database
    .query(
      "select sqlite_version() as version, typeof(jsonb('{\"ok\":true}')) as jsonb_type"
    )
    .get() as { jsonb_type: string; version: string } | null

  if (!row || row.jsonb_type !== "blob") {
    throw new Error("현재 SQLite 런타임은 jsonb() 함수를 지원하지 않습니다.")
  }

  return {
    sqliteVersion: row.version,
  }
}

export function createSchema(database: Database): void {
  database.exec(`
    pragma foreign_keys = on;

    create table if not exists prompts (
      id integer primary key,
      slug text not null unique,
      text text not null,
      description text not null,
      topic text not null,
      level integer not null,
      suggested_length_label text not null,
      tags_json text not null,
      outline_json text not null,
      tips_json text not null,
      is_today_recommended integer not null default 0,
      today_recommendation_order integer,
      created_at text not null,
      updated_at text not null
    ) strict;

    create index if not exists prompts_today_idx
      on prompts (is_today_recommended, today_recommendation_order);

    create table if not exists saved_prompts (
      user_id text not null,
      prompt_id integer not null,
      saved_at text not null,
      primary key (user_id, prompt_id),
      foreign key (user_id) references "user"(id) on delete cascade,
      foreign key (prompt_id) references prompts(id) on delete cascade
    ) strict;

    create index if not exists saved_prompts_saved_at_idx
      on saved_prompts (user_id, saved_at desc);

    create table if not exists drafts (
      id integer primary key autoincrement,
      user_id text not null,
      title text not null,
      body_jsonb blob not null,
      body_plain_text text not null,
      character_count integer not null,
      word_count integer not null,
      source_prompt_id integer,
      last_saved_at text not null,
      created_at text not null,
      updated_at text not null,
      foreign key (user_id) references "user"(id) on delete cascade,
      foreign key (source_prompt_id) references prompts(id) on delete set null
    ) strict;

    create index if not exists drafts_user_updated_idx
      on drafts (user_id, updated_at desc);
  `)
}

export function resetDatabaseFile(path: string): void {
  rmSync(resolve(path), {
    force: true,
  })
}
