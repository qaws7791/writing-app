pragma foreign_keys = on;

create table if not exists admin_user (
  id text primary key,
  name text not null,
  email text not null unique,
  emailVerified integer not null,
  image text,
  createdAt integer not null,
  updatedAt integer not null
);

create table if not exists admin_session (
  id text primary key,
  expiresAt integer not null,
  token text not null unique,
  createdAt integer not null,
  updatedAt integer not null,
  ipAddress text,
  userAgent text,
  userId text not null references admin_user(id) on delete cascade
);

create table if not exists admin_account (
  id text primary key,
  accountId text not null,
  providerId text not null,
  userId text not null references admin_user(id) on delete cascade,
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

create table if not exists admin_verification (
  id text primary key,
  identifier text not null,
  value text not null,
  expiresAt integer not null,
  createdAt integer,
  updatedAt integer
);
