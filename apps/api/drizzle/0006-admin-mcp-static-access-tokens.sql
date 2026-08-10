CREATE TABLE `admin_mcp_access_tokens` (
	`created_at` integer NOT NULL,
	`credential_id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`owner_admin_id` text NOT NULL,
	`revoked_at` integer,
	`scopes_json` text NOT NULL,
	`secret_digest` text NOT NULL,
	CONSTRAINT `admin_mcp_access_tokens_owner_admin_id_admin_user_id_fk` FOREIGN KEY (`owner_admin_id`) REFERENCES `admin_user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `admin_mcp_access_tokens_credential_id_check` CHECK(length(`credential_id`) = 37 AND substr(`credential_id`, 1, 5) = 'wmcp_' AND substr(`credential_id`, 6) NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT `admin_mcp_access_tokens_digest_check` CHECK(length(`secret_digest`) = 64 AND `secret_digest` NOT GLOB '*[^a-f0-9]*'),
	CONSTRAINT `admin_mcp_access_tokens_scopes_check` CHECK(json_valid(`scopes_json`) AND json_type(`scopes_json`) = 'array' AND json_array_length(`scopes_json`) BETWEEN 1 AND 32),
	CONSTRAINT `admin_mcp_access_tokens_time_check` CHECK(`expires_at` > `created_at` AND (`revoked_at` IS NULL OR `revoked_at` >= `created_at`))
);
CREATE INDEX `admin_mcp_access_tokens_owner_idx` ON `admin_mcp_access_tokens` (`owner_admin_id`, `created_at`, `credential_id`);
CREATE INDEX `admin_mcp_access_tokens_expiry_idx` ON `admin_mcp_access_tokens` (`expires_at`, `credential_id`);

CREATE TRIGGER `admin_mcp_access_tokens_validate_scopes`
BEFORE INSERT ON `admin_mcp_access_tokens`
WHEN NOT EXISTS (
	SELECT 1 FROM json_each(NEW.`scopes_json`)
	WHERE type = 'text' AND value = 'admin:mcp:read'
)
OR EXISTS (
	SELECT 1 FROM json_each(NEW.`scopes_json`)
	WHERE type <> 'text'
		OR value NOT IN (
			'admin:mcp:read',
			'admin:mcp:draft',
			'admin:mcp:lifecycle',
			'admin:mcp:publish',
			'admin:mcp:user-status',
			'admin:mcp:user-delete'
		)
)
OR (
	SELECT COUNT(*) <> COUNT(DISTINCT value)
	FROM json_each(NEW.`scopes_json`)
)
BEGIN
	SELECT RAISE(ABORT, 'admin MCP access token scopes are invalid');
END;

CREATE TABLE `admin_mcp_access_token_events` (
	`action` text NOT NULL,
	`actor_admin_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`credential_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	CONSTRAINT `admin_mcp_access_token_events_actor_admin_id_admin_user_id_fk` FOREIGN KEY (`actor_admin_id`) REFERENCES `admin_user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `admin_mcp_access_token_events_credential_id_admin_mcp_access_tokens_credential_id_fk` FOREIGN KEY (`credential_id`) REFERENCES `admin_mcp_access_tokens`(`credential_id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT `admin_mcp_access_token_events_action_check` CHECK(`action` IN ('issued', 'revoked')),
	CONSTRAINT `admin_mcp_access_token_events_id_check` CHECK(length(`id`) = 36 AND substr(`id`, 1, 4) = 'evt_' AND substr(`id`, 5) NOT GLOB '*[^a-f0-9]*')
);
CREATE INDEX `admin_mcp_access_token_events_credential_idx` ON `admin_mcp_access_token_events` (`credential_id`, `created_at`, `id`);

CREATE TRIGGER `admin_mcp_access_tokens_immutable_fields`
BEFORE UPDATE ON `admin_mcp_access_tokens`
WHEN NEW.`credential_id` <> OLD.`credential_id`
  OR NEW.`owner_admin_id` <> OLD.`owner_admin_id`
  OR NEW.`secret_digest` <> OLD.`secret_digest`
  OR NEW.`scopes_json` <> OLD.`scopes_json`
  OR NEW.`created_at` <> OLD.`created_at`
  OR NEW.`expires_at` <> OLD.`expires_at`
  OR OLD.`revoked_at` IS NOT NULL
  OR NEW.`revoked_at` IS NULL
BEGIN
	SELECT RAISE(ABORT, 'admin MCP access token records are immutable except first revocation');
END;

CREATE TRIGGER `admin_mcp_access_tokens_no_delete`
BEFORE DELETE ON `admin_mcp_access_tokens`
BEGIN
	SELECT RAISE(ABORT, 'admin MCP access token records cannot be deleted');
END;

CREATE TRIGGER `admin_mcp_access_token_events_no_update`
BEFORE UPDATE ON `admin_mcp_access_token_events`
BEGIN
	SELECT RAISE(ABORT, 'admin MCP access token events are append-only');
END;

CREATE TRIGGER `admin_mcp_access_token_events_no_delete`
BEFORE DELETE ON `admin_mcp_access_token_events`
BEGIN
	SELECT RAISE(ABORT, 'admin MCP access token events are append-only');
END;
