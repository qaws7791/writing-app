CREATE INDEX `session_expiry_idx` ON `session` (`expires_at`,`id`);
CREATE INDEX `session_user_idx` ON `session` (`user_id`);
CREATE INDEX `account_provider_idx` ON `account` (`account_id`,`provider_id`);
CREATE INDEX `account_user_idx` ON `account` (`user_id`);
CREATE INDEX `verification_identifier_created_idx` ON `verification` (`identifier`,`created_at`);
CREATE INDEX `verification_expiry_idx` ON `verification` (`expires_at`);

CREATE INDEX `admin_session_expiry_idx` ON `admin_session` (`expires_at`,`id`);
CREATE INDEX `admin_session_user_idx` ON `admin_session` (`user_id`);
CREATE INDEX `admin_account_provider_idx` ON `admin_account` (`account_id`,`provider_id`);
CREATE INDEX `admin_account_user_idx` ON `admin_account` (`user_id`);
CREATE INDEX `admin_verification_identifier_created_idx` ON `admin_verification` (`identifier`,`created_at`);
CREATE INDEX `admin_verification_expiry_idx` ON `admin_verification` (`expires_at`);

CREATE INDEX `learner_profiles_deleted_purge_idx` ON `learner_profiles` (`deleted_at`,`user_id`)
WHERE `status` = 'deleted' AND `deleted_at` IS NOT NULL;

CREATE INDEX `content_assets_orphan_purge_idx` ON `content_assets` (`orphaned_at`,`id`)
WHERE `status` = 'orphaned' AND `orphaned_at` IS NOT NULL;

CREATE INDEX `courses_sort_order_idx` ON `courses` (`sort_order`,`id`);
CREATE INDEX `courses_status_sort_order_idx` ON `courses` (`status`,`sort_order`,`id`);
CREATE INDEX `course_curriculum_versions_draft_category_idx` ON `course_curriculum_versions` (`category`,`course_id`)
WHERE `status` = 'draft';
CREATE INDEX `course_curriculum_versions_published_category_idx` ON `course_curriculum_versions` (`category`,`id`)
WHERE `status` = 'published';
CREATE INDEX `course_unit_versions_active_curriculum_idx` ON `course_unit_versions` (`curriculum_version_id`)
WHERE `status` = 'active';
CREATE INDEX `lesson_versions_active_curriculum_idx` ON `lesson_versions` (`curriculum_version_id`)
WHERE `status` = 'active';

CREATE INDEX `writing_tasks_domain_updated_idx` ON `writing_tasks` (`domain`,`updated_at`,`id`);
CREATE INDEX `writing_tasks_draft_updated_idx` ON `writing_tasks` (`updated_at`,`id`)
WHERE `latest_publication_id` IS NULL;
CREATE INDEX `writing_tasks_published_updated_idx` ON `writing_tasks` (`updated_at`,`id`)
WHERE `latest_publication_id` IS NOT NULL;
CREATE INDEX `writing_tasks_draft_domain_updated_idx` ON `writing_tasks` (`domain`,`updated_at`,`id`)
WHERE `latest_publication_id` IS NULL;
CREATE INDEX `writing_tasks_published_domain_updated_idx` ON `writing_tasks` (`domain`,`updated_at`,`id`)
WHERE `latest_publication_id` IS NOT NULL;
CREATE INDEX `writing_tasks_latest_publication_idx` ON `writing_tasks` (`latest_publication_id`,`id`);
CREATE INDEX `writing_task_publications_published_idx` ON `writing_task_publications` (`published_at`,`task_id`,`id`);
CREATE INDEX `writing_task_publications_domain_published_idx` ON `writing_task_publications` (`domain`,`published_at`,`task_id`,`id`);
CREATE INDEX `writing_task_publications_type_published_idx` ON `writing_task_publications` (`type_name`,`published_at`,`task_id`,`id`);
CREATE INDEX `writing_task_publications_domain_type_published_idx` ON `writing_task_publications` (`domain`,`type_name`,`published_at`,`task_id`,`id`);

DROP INDEX `learner_course_progress_activity_idx`;
CREATE INDEX `learner_course_progress_activity_idx` ON `learner_course_progress` (`user_id`,`last_activity_at` DESC,`course_id` ASC);
CREATE INDEX `learner_course_progress_status_activity_idx` ON `learner_course_progress` (`user_id`,`status`,`last_activity_at` DESC,`course_id` ASC);
CREATE INDEX `learner_lesson_progress_user_lesson_idx` ON `learner_lesson_progress` (`user_id`,`lesson_id`);

CREATE TABLE `learner_reporting_summaries` (
  `completed_lessons` integer DEFAULT 0 NOT NULL,
  `last_active` text,
  `streak_days_at_last_activity` integer DEFAULT 0 NOT NULL,
  `user_id` text PRIMARY KEY NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `learner_reporting_summaries_completed_lessons_check` CHECK (`completed_lessons` >= 0),
  CONSTRAINT `learner_reporting_summaries_streak_days_check` CHECK (`streak_days_at_last_activity` >= 0)
);

CREATE INDEX `learner_reporting_summaries_last_active_idx` ON `learner_reporting_summaries` (`last_active` DESC,`user_id` ASC);
CREATE INDEX `learner_reporting_summaries_completed_lessons_idx` ON `learner_reporting_summaries` (`completed_lessons` DESC,`user_id` ASC);
CREATE INDEX `learner_reporting_summaries_streak_idx` ON `learner_reporting_summaries` (`streak_days_at_last_activity` DESC,`user_id` ASC);

CREATE TRIGGER `learner_reporting_summaries_user_insert`
AFTER INSERT ON `user`
BEGIN
  INSERT INTO `learner_reporting_summaries` (`user_id`)
  VALUES (NEW.`id`)
  ON CONFLICT (`user_id`) DO NOTHING;
END;

INSERT INTO `learner_reporting_summaries` (`user_id`)
SELECT `id`
FROM `user`
WHERE true
ON CONFLICT (`user_id`) DO NOTHING;

UPDATE `learner_reporting_summaries` AS `summary`
SET
  `completed_lessons` = (
    SELECT count(*)
    FROM `learner_lesson_progress` AS `progress`
    WHERE `progress`.`user_id` = `summary`.`user_id`
      AND `progress`.`status` = 'completed'
  ),
  `last_active` = (
    SELECT max(`activity`.`activity_date`)
    FROM `learner_activity_days` AS `activity`
    WHERE `activity`.`user_id` = `summary`.`user_id`
  );

WITH `numbered_activity` AS (
  SELECT
    `user_id`,
    `activity_date`,
    julianday(`activity_date`) - row_number() OVER (
      PARTITION BY `user_id`
      ORDER BY `activity_date`
    ) AS `island_key`
  FROM `learner_activity_days`
),
`activity_islands` AS (
  SELECT
    `user_id`,
    max(`activity_date`) AS `streak_end`,
    count(*) AS `streak_days`
  FROM `numbered_activity`
  GROUP BY `user_id`, `island_key`
),
`latest_streaks` AS (
  SELECT
    `island`.`user_id`,
    `island`.`streak_days`
  FROM `activity_islands` AS `island`
  INNER JOIN `learner_reporting_summaries` AS `summary`
    ON `summary`.`user_id` = `island`.`user_id`
    AND `summary`.`last_active` = `island`.`streak_end`
)
UPDATE `learner_reporting_summaries` AS `summary`
SET `streak_days_at_last_activity` = coalesce((
  SELECT `latest`.`streak_days`
  FROM `latest_streaks` AS `latest`
  WHERE `latest`.`user_id` = `summary`.`user_id`
), 0);

CREATE VIEW `learning_reporting_learner_summaries` AS
SELECT
  `user_id`,
  `completed_lessons`,
  `last_active`,
  `streak_days_at_last_activity`
FROM `learner_reporting_summaries`;

CREATE VIEW `identity_reporting_admin_learners` AS
SELECT
  `user`.`id` AS `user_id`,
  `user`.`email` AS `email`,
  coalesce(`learner_profiles`.`display_name`, `user`.`name`) AS `display_name`,
  coalesce(`learner_profiles`.`status`, 'active') AS `status`,
  `user`.`created_at` AS `created_at`
FROM `user`
LEFT JOIN `learner_profiles`
  ON `learner_profiles`.`user_id` = `user`.`id`;

CREATE TABLE `admin_learner_read_models` (
  `user_id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `display_name` text NOT NULL,
  `status` text NOT NULL,
  `created_at` integer NOT NULL,
  `completed_lessons` integer DEFAULT 0 NOT NULL,
  `last_active` text,
  `streak_days_at_last_activity` integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `admin_learner_read_models_status_check` CHECK (`status` IN ('active','suspended','deleted')),
  CONSTRAINT `admin_learner_read_models_completed_lessons_check` CHECK (`completed_lessons` >= 0),
  CONSTRAINT `admin_learner_read_models_streak_days_check` CHECK (`streak_days_at_last_activity` >= 0)
);

CREATE INDEX `admin_learner_read_models_joined_idx`
ON `admin_learner_read_models` (`created_at` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
CREATE INDEX `admin_learner_read_models_last_active_idx`
ON `admin_learner_read_models` (`last_active` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
CREATE INDEX `admin_learner_read_models_lessons_idx`
ON `admin_learner_read_models` (`completed_lessons` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
CREATE INDEX `admin_learner_read_models_streak_idx`
ON `admin_learner_read_models` (`streak_days_at_last_activity` DESC,`user_id` ASC)
WHERE `status` <> 'deleted';
CREATE INDEX `admin_learner_read_models_status_joined_idx`
ON `admin_learner_read_models` (`status`,`created_at` DESC,`user_id` ASC);
CREATE INDEX `admin_learner_read_models_status_last_active_idx`
ON `admin_learner_read_models` (`status`,`last_active` DESC,`user_id` ASC);
CREATE INDEX `admin_learner_read_models_status_lessons_idx`
ON `admin_learner_read_models` (`status`,`completed_lessons` DESC,`user_id` ASC);
CREATE INDEX `admin_learner_read_models_status_streak_idx`
ON `admin_learner_read_models` (`status`,`streak_days_at_last_activity` DESC,`user_id` ASC);

INSERT INTO `admin_learner_read_models` (
  `user_id`,
  `email`,
  `display_name`,
  `status`,
  `created_at`,
  `completed_lessons`,
  `last_active`,
  `streak_days_at_last_activity`
)
SELECT
  `user`.`id`,
  `user`.`email`,
  coalesce(`learner_profiles`.`display_name`, `user`.`name`),
  coalesce(`learner_profiles`.`status`, 'active'),
  `user`.`created_at`,
  `summary`.`completed_lessons`,
  `summary`.`last_active`,
  `summary`.`streak_days_at_last_activity`
FROM `user`
INNER JOIN `learner_reporting_summaries` AS `summary`
  ON `summary`.`user_id` = `user`.`id`
LEFT JOIN `learner_profiles`
  ON `learner_profiles`.`user_id` = `user`.`id`;

CREATE TRIGGER `admin_learner_read_models_user_ai`
AFTER INSERT ON `user`
BEGIN
  INSERT INTO `admin_learner_read_models` (
    `user_id`,`email`,`display_name`,`status`,`created_at`
  ) VALUES (NEW.`id`,NEW.`email`,NEW.`name`,'active',NEW.`created_at`);
END;

CREATE TRIGGER `admin_learner_read_models_user_au`
AFTER UPDATE OF `email`, `name` ON `user`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `email` = NEW.`email`,
    `display_name` = coalesce(
      (SELECT `display_name` FROM `learner_profiles` WHERE `user_id` = NEW.`id`),
      NEW.`name`
    )
  WHERE `user_id` = NEW.`id`;
END;

CREATE TRIGGER `admin_learner_read_models_profile_ai`
AFTER INSERT ON `learner_profiles`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `display_name` = coalesce(
      NEW.`display_name`,
      (SELECT `name` FROM `user` WHERE `id` = NEW.`user_id`)
    ),
    `status` = NEW.`status`
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `admin_learner_read_models_profile_au`
AFTER UPDATE OF `display_name`, `status` ON `learner_profiles`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `display_name` = coalesce(
      NEW.`display_name`,
      (SELECT `name` FROM `user` WHERE `id` = NEW.`user_id`)
    ),
    `status` = NEW.`status`
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `admin_learner_read_models_profile_ad`
AFTER DELETE ON `learner_profiles`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `display_name` = (SELECT `name` FROM `user` WHERE `id` = OLD.`user_id`),
    `status` = 'active'
  WHERE `user_id` = OLD.`user_id`;
END;

CREATE TRIGGER `admin_learner_read_models_summary_ai`
AFTER INSERT ON `learner_reporting_summaries`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `completed_lessons` = NEW.`completed_lessons`,
    `last_active` = NEW.`last_active`,
    `streak_days_at_last_activity` = NEW.`streak_days_at_last_activity`
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `admin_learner_read_models_summary_au`
AFTER UPDATE OF `completed_lessons`, `last_active`, `streak_days_at_last_activity`
ON `learner_reporting_summaries`
BEGIN
  UPDATE `admin_learner_read_models`
  SET
    `completed_lessons` = NEW.`completed_lessons`,
    `last_active` = NEW.`last_active`,
    `streak_days_at_last_activity` = NEW.`streak_days_at_last_activity`
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TABLE `identity_admin_learner_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL UNIQUE,
  `email` text NOT NULL,
  `display_name` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE VIRTUAL TABLE `identity_admin_learner_fts`
USING fts5(`email`, `display_name`, content='identity_admin_learner_search_documents', content_rowid='rowid', tokenize='trigram');

CREATE TRIGGER `identity_admin_learner_search_documents_ai`
AFTER INSERT ON `identity_admin_learner_search_documents`
BEGIN
  INSERT INTO `identity_admin_learner_fts` (`rowid`,`email`,`display_name`)
  VALUES (NEW.`rowid`,NEW.`email`,NEW.`display_name`);
END;

CREATE TRIGGER `identity_admin_learner_search_documents_ad`
AFTER DELETE ON `identity_admin_learner_search_documents`
BEGIN
  INSERT INTO `identity_admin_learner_fts` (`identity_admin_learner_fts`,`rowid`,`email`,`display_name`)
  VALUES ('delete',OLD.`rowid`,OLD.`email`,OLD.`display_name`);
END;

CREATE TRIGGER `identity_admin_learner_search_documents_au`
AFTER UPDATE OF `email`, `display_name` ON `identity_admin_learner_search_documents`
BEGIN
  INSERT INTO `identity_admin_learner_fts` (`identity_admin_learner_fts`,`rowid`,`email`,`display_name`)
  VALUES ('delete',OLD.`rowid`,OLD.`email`,OLD.`display_name`);
  INSERT INTO `identity_admin_learner_fts` (`rowid`,`email`,`display_name`)
  VALUES (NEW.`rowid`,NEW.`email`,NEW.`display_name`);
END;

INSERT INTO `identity_admin_learner_search_documents` (`user_id`,`email`,`display_name`)
SELECT
  `user_id`,
  `email`,
  `display_name`
FROM `admin_learner_read_models`;

CREATE TRIGGER `identity_admin_learner_read_model_search_ai`
AFTER INSERT ON `admin_learner_read_models`
BEGIN
  INSERT INTO `identity_admin_learner_search_documents` (`user_id`,`email`,`display_name`)
  VALUES (NEW.`user_id`,NEW.`email`,NEW.`display_name`);
END;

CREATE TRIGGER `identity_admin_learner_read_model_search_au`
AFTER UPDATE OF `email`, `display_name` ON `admin_learner_read_models`
BEGIN
  UPDATE `identity_admin_learner_search_documents`
  SET `email` = NEW.`email`, `display_name` = NEW.`display_name`
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `identity_admin_learner_read_model_search_ad`
AFTER DELETE ON `admin_learner_read_models`
BEGIN
  DELETE FROM `identity_admin_learner_search_documents`
  WHERE `user_id` = OLD.`user_id`;
END;

CREATE TABLE `course_curriculum_version_title_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `curriculum_version_id` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  FOREIGN KEY (`curriculum_version_id`) REFERENCES `course_curriculum_versions`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE VIRTUAL TABLE `course_curriculum_version_title_fts`
USING fts5(`title`, content='course_curriculum_version_title_search_documents', content_rowid='rowid', tokenize='trigram');

CREATE TRIGGER `course_title_search_documents_ai`
AFTER INSERT ON `course_curriculum_version_title_search_documents`
BEGIN
  INSERT INTO `course_curriculum_version_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;

CREATE TRIGGER `course_title_search_documents_ad`
AFTER DELETE ON `course_curriculum_version_title_search_documents`
BEGIN
  INSERT INTO `course_curriculum_version_title_fts` (`course_curriculum_version_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
END;

CREATE TRIGGER `course_title_search_documents_au`
AFTER UPDATE OF `title` ON `course_curriculum_version_title_search_documents`
BEGIN
  INSERT INTO `course_curriculum_version_title_fts` (`course_curriculum_version_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
  INSERT INTO `course_curriculum_version_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;

INSERT INTO `course_curriculum_version_title_search_documents` (`curriculum_version_id`,`title`)
SELECT `id`,`title`
FROM `course_curriculum_versions`;

CREATE TRIGGER `course_curriculum_version_title_search_ai`
AFTER INSERT ON `course_curriculum_versions`
BEGIN
  INSERT INTO `course_curriculum_version_title_search_documents` (`curriculum_version_id`,`title`)
  VALUES (NEW.`id`,NEW.`title`);
END;

CREATE TRIGGER `course_curriculum_version_title_search_ad`
AFTER DELETE ON `course_curriculum_versions`
BEGIN
  DELETE FROM `course_curriculum_version_title_search_documents`
  WHERE `curriculum_version_id` = OLD.`id`;
END;

CREATE TRIGGER `course_curriculum_version_title_search_au`
AFTER UPDATE OF `title` ON `course_curriculum_versions`
BEGIN
  UPDATE `course_curriculum_version_title_search_documents`
  SET `title` = NEW.`title`
  WHERE `curriculum_version_id` = OLD.`id`;
END;

CREATE TABLE `writing_task_title_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `task_id` text NOT NULL UNIQUE,
  `title` text NOT NULL,
  FOREIGN KEY (`task_id`) REFERENCES `writing_tasks`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE VIRTUAL TABLE `writing_task_title_fts`
USING fts5(`title`, content='writing_task_title_search_documents', content_rowid='rowid', tokenize='trigram');

CREATE TRIGGER `writing_title_search_documents_ai`
AFTER INSERT ON `writing_task_title_search_documents`
BEGIN
  INSERT INTO `writing_task_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;

CREATE TRIGGER `writing_title_search_documents_ad`
AFTER DELETE ON `writing_task_title_search_documents`
BEGIN
  INSERT INTO `writing_task_title_fts` (`writing_task_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
END;

CREATE TRIGGER `writing_title_search_documents_au`
AFTER UPDATE OF `title` ON `writing_task_title_search_documents`
BEGIN
  INSERT INTO `writing_task_title_fts` (`writing_task_title_fts`,`rowid`,`title`)
  VALUES ('delete',OLD.`rowid`,OLD.`title`);
  INSERT INTO `writing_task_title_fts` (`rowid`,`title`)
  VALUES (NEW.`rowid`,NEW.`title`);
END;

INSERT INTO `writing_task_title_search_documents` (`task_id`,`title`)
SELECT `id`,`title`
FROM `writing_tasks`;

CREATE TRIGGER `writing_task_title_search_ai`
AFTER INSERT ON `writing_tasks`
BEGIN
  INSERT INTO `writing_task_title_search_documents` (`task_id`,`title`)
  VALUES (NEW.`id`,NEW.`title`);
END;

CREATE TRIGGER `writing_task_title_search_ad`
AFTER DELETE ON `writing_tasks`
BEGIN
  DELETE FROM `writing_task_title_search_documents`
  WHERE `task_id` = OLD.`id`;
END;

CREATE TRIGGER `writing_task_title_search_au`
AFTER UPDATE OF `title` ON `writing_tasks`
BEGIN
  UPDATE `writing_task_title_search_documents`
  SET `title` = NEW.`title`
  WHERE `task_id` = OLD.`id`;
END;
