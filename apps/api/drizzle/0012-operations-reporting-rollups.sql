CREATE TABLE `operations_reporting_daily_metrics` (
  `date_key` text PRIMARY KEY NOT NULL,
  `signups` integer DEFAULT 0 NOT NULL CHECK (`signups` >= 0),
  `first_starts` integer DEFAULT 0 NOT NULL CHECK (`first_starts` >= 0),
  `completions` integer DEFAULT 0 NOT NULL CHECK (`completions` >= 0),
  `returned_learners` integer DEFAULT 0 NOT NULL CHECK (`returned_learners` >= 0),
  `created_writings` integer DEFAULT 0 NOT NULL CHECK (`created_writings` >= 0),
  `check_succeeded_writings` integer DEFAULT 0 NOT NULL CHECK (`check_succeeded_writings` >= 0),
  `revised_after_check_writings` integer DEFAULT 0 NOT NULL CHECK (`revised_after_check_writings` >= 0)
);

CREATE TABLE `operations_reporting_learner_activations` (
  `user_id` text PRIMARY KEY NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `signup_date` text NOT NULL,
  `first_start_date` text,
  `returned_within_7_days` integer DEFAULT 0 NOT NULL CHECK (`returned_within_7_days` IN (0, 1))
);

CREATE TABLE `operations_reporting_lesson_metrics` (
  `course_id` text NOT NULL,
  `curriculum_version_id` text NOT NULL,
  `lesson_id` text NOT NULL,
  `started` integer DEFAULT 0 NOT NULL CHECK (`started` >= 0),
  `completed` integer DEFAULT 0 NOT NULL CHECK (`completed` >= 0),
  PRIMARY KEY (`course_id`,`curriculum_version_id`,`lesson_id`)
);

CREATE TABLE `operations_reporting_checkpoint` (
  `id` integer PRIMARY KEY NOT NULL CHECK (`id` = 1),
  `source_changed_at` integer NOT NULL,
  `reconciled_at` integer NOT NULL
);

CREATE TABLE `operations_reporting_lesson_title_search_documents` (
  `rowid` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `curriculum_version_id` text NOT NULL,
  `lesson_id` text NOT NULL,
  `title` text NOT NULL,
  UNIQUE (`curriculum_version_id`,`lesson_id`),
  FOREIGN KEY (`curriculum_version_id`,`lesson_id`) REFERENCES `lesson_versions`(`curriculum_version_id`,`id`) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE `operations_reporting_lesson_title_fts`
USING fts5(`title`, content='operations_reporting_lesson_title_search_documents', content_rowid='rowid', tokenize='trigram');

CREATE TRIGGER `operations_reporting_lesson_title_search_documents_ai` AFTER INSERT ON `operations_reporting_lesson_title_search_documents`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_fts` (`rowid`,`title`) VALUES (NEW.`rowid`,NEW.`title`);
END;
CREATE TRIGGER `operations_reporting_lesson_title_search_documents_ad` AFTER DELETE ON `operations_reporting_lesson_title_search_documents`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_fts` (`operations_reporting_lesson_title_fts`,`rowid`,`title`) VALUES ('delete',OLD.`rowid`,OLD.`title`);
END;
CREATE TRIGGER `operations_reporting_lesson_title_search_documents_au` AFTER UPDATE OF `title` ON `operations_reporting_lesson_title_search_documents`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_fts` (`operations_reporting_lesson_title_fts`,`rowid`,`title`) VALUES ('delete',OLD.`rowid`,OLD.`title`);
  INSERT INTO `operations_reporting_lesson_title_fts` (`rowid`,`title`) VALUES (NEW.`rowid`,NEW.`title`);
END;

INSERT INTO `operations_reporting_lesson_title_search_documents` (`curriculum_version_id`,`lesson_id`,`title`)
SELECT `curriculum_version_id`,`id`,`title` FROM `lesson_versions`;

CREATE TRIGGER `lesson_version_title_search_ai` AFTER INSERT ON `lesson_versions`
BEGIN
  INSERT INTO `operations_reporting_lesson_title_search_documents` (`curriculum_version_id`,`lesson_id`,`title`) VALUES (NEW.`curriculum_version_id`,NEW.`id`,NEW.`title`);
END;
CREATE TRIGGER `lesson_version_title_search_ad` AFTER DELETE ON `lesson_versions`
BEGIN
  DELETE FROM `operations_reporting_lesson_title_search_documents` WHERE `curriculum_version_id` = OLD.`curriculum_version_id` AND `lesson_id` = OLD.`id`;
END;
CREATE TRIGGER `lesson_version_title_search_au` AFTER UPDATE OF `title` ON `lesson_versions`
BEGIN
  UPDATE `operations_reporting_lesson_title_search_documents` SET `title` = NEW.`title` WHERE `curriculum_version_id` = NEW.`curriculum_version_id` AND `lesson_id` = NEW.`id`;
END;

INSERT INTO `operations_reporting_checkpoint` (`id`,`source_changed_at`,`reconciled_at`)
VALUES (1, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000);

INSERT INTO `operations_reporting_learner_activations` (`user_id`,`signup_date`,`first_start_date`,`returned_within_7_days`)
SELECT
  `user`.`id`,
  date(`user`.`created_at` / 1000, 'unixepoch', '+09:00'),
  `first_start`.`first_start_date`,
  CASE WHEN EXISTS (
    SELECT 1
    FROM `learner_activity_days` AS `activity`
    WHERE `activity`.`user_id` = `user`.`id`
      AND `activity`.`activity_date` > `first_start`.`first_start_date`
      AND `activity`.`activity_date` <= date(`first_start`.`first_start_date`, '+7 days')
  ) THEN 1 ELSE 0 END
FROM `user`
INNER JOIN `learner_profiles` AS `profile` ON `profile`.`user_id` = `user`.`id`
LEFT JOIN (
  SELECT `user_id`, date(min(`started_at`) / 1000, 'unixepoch', '+09:00') AS `first_start_date`
  FROM `learner_lesson_progress`
  GROUP BY `user_id`
) AS `first_start` ON `first_start`.`user_id` = `user`.`id`
WHERE `profile`.`status` <> 'deleted'
;

INSERT INTO `operations_reporting_daily_metrics` (
  `date_key`,`signups`,`first_starts`,`completions`,`returned_learners`,
  `created_writings`,`check_succeeded_writings`,`revised_after_check_writings`
)
SELECT
  `event`.`date_key`,
  sum(`event`.`signups`),
  sum(`event`.`first_starts`),
  sum(`event`.`completions`),
  sum(`event`.`returned_learners`),
  sum(`event`.`created_writings`),
  sum(`event`.`check_succeeded_writings`),
  sum(`event`.`revised_after_check_writings`)
FROM (
  SELECT `signup_date` AS `date_key`, 1 AS `signups`, 0 AS `first_starts`, 0 AS `completions`, 0 AS `returned_learners`, 0 AS `created_writings`, 0 AS `check_succeeded_writings`, 0 AS `revised_after_check_writings`
  FROM `operations_reporting_learner_activations`
  UNION ALL
  SELECT `first_start_date`, 0, 1, 0, `returned_within_7_days`, 0, 0, 0
  FROM `operations_reporting_learner_activations`
  WHERE `first_start_date` IS NOT NULL
  UNION ALL
  SELECT date(`progress`.`completed_at` / 1000, 'unixepoch', '+09:00'), 0, 0, 1, 0, 0, 0, 0
  FROM `learner_lesson_progress` AS `progress`
  INNER JOIN `identity_reporting_learners` AS `learner` ON `learner`.`user_id` = `progress`.`user_id`
  WHERE `progress`.`status` = 'completed' AND `progress`.`completed_at` IS NOT NULL
  UNION ALL
  SELECT
    date(`event`.`recorded_at` / 1000, 'unixepoch', '+09:00'), 0, 0, 0, 0,
    CASE WHEN `event`.`event_type` = 'writing_created' THEN 1 ELSE 0 END,
    CASE WHEN `event`.`event_type` = 'check_succeeded' THEN 1 ELSE 0 END,
    CASE WHEN `event`.`event_type` = 'revised_after_check' THEN 1 ELSE 0 END
  FROM `writing_events` AS `event`
  INNER JOIN `identity_reporting_learners` AS `learner` ON `learner`.`user_id` = `event`.`user_id`
  WHERE `event`.`event_type` IN ('writing_created','check_succeeded','revised_after_check')
) AS `event`
GROUP BY `event`.`date_key`;

INSERT INTO `operations_reporting_lesson_metrics` (`course_id`,`curriculum_version_id`,`lesson_id`,`started`,`completed`)
SELECT
  `progress`.`course_id`,
  `progress`.`curriculum_version_id`,
  `progress`.`lesson_id`,
  count(*),
  sum(CASE WHEN `progress`.`status` = 'completed' THEN 1 ELSE 0 END)
FROM `learner_lesson_progress` AS `progress`
INNER JOIN `identity_reporting_learners` AS `learner` ON `learner`.`user_id` = `progress`.`user_id`
GROUP BY `progress`.`course_id`,`progress`.`curriculum_version_id`,`progress`.`lesson_id`;

CREATE TRIGGER `operations_activation_daily_ai` AFTER INSERT ON `operations_reporting_learner_activations`
BEGIN
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`signups`) VALUES (NEW.`signup_date`,1)
  ON CONFLICT (`date_key`) DO UPDATE SET `signups` = `signups` + 1;
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`first_starts`,`returned_learners`)
  SELECT NEW.`first_start_date`,1,NEW.`returned_within_7_days` WHERE NEW.`first_start_date` IS NOT NULL
  ON CONFLICT (`date_key`) DO UPDATE SET `first_starts` = `first_starts` + 1, `returned_learners` = `returned_learners` + NEW.`returned_within_7_days`;
END;

CREATE TRIGGER `operations_activation_daily_ad` AFTER DELETE ON `operations_reporting_learner_activations`
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `signups` = `signups` - 1 WHERE `date_key` = OLD.`signup_date`;
  UPDATE `operations_reporting_daily_metrics` SET `first_starts` = `first_starts` - 1, `returned_learners` = `returned_learners` - OLD.`returned_within_7_days` WHERE `date_key` = OLD.`first_start_date` AND OLD.`first_start_date` IS NOT NULL;
END;

CREATE TRIGGER `operations_activation_daily_au` AFTER UPDATE ON `operations_reporting_learner_activations`
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `signups` = `signups` - 1 WHERE `date_key` = OLD.`signup_date`;
  UPDATE `operations_reporting_daily_metrics` SET `first_starts` = `first_starts` - 1, `returned_learners` = `returned_learners` - OLD.`returned_within_7_days` WHERE `date_key` = OLD.`first_start_date` AND OLD.`first_start_date` IS NOT NULL;
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`signups`) VALUES (NEW.`signup_date`,1)
  ON CONFLICT (`date_key`) DO UPDATE SET `signups` = `signups` + 1;
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`first_starts`,`returned_learners`)
  SELECT NEW.`first_start_date`,1,NEW.`returned_within_7_days` WHERE NEW.`first_start_date` IS NOT NULL
  ON CONFLICT (`date_key`) DO UPDATE SET `first_starts` = `first_starts` + 1, `returned_learners` = `returned_learners` + NEW.`returned_within_7_days`;
END;

CREATE TRIGGER `operations_user_activation_au` AFTER UPDATE OF `created_at` ON `user`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET `signup_date` = date(NEW.`created_at` / 1000, 'unixepoch', '+09:00')
  WHERE `user_id` = NEW.`id`;
END;

CREATE TRIGGER `operations_progress_activation_ai` AFTER INSERT ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = NEW.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `operations_progress_activation_au` AFTER UPDATE OF `started_at`,`user_id` ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = OLD.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = OLD.`user_id`;
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = NEW.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `operations_progress_activation_ad` AFTER DELETE ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET
    `first_start_date` = (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`),
    `returned_within_7_days` = CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = OLD.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = OLD.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  WHERE `user_id` = OLD.`user_id`;
END;

CREATE TRIGGER `operations_activity_activation_ai` AFTER INSERT ON `learner_activity_days`
BEGIN
  UPDATE `operations_reporting_learner_activations`
  SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = NEW.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END
  WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `operations_activity_activation_au` AFTER UPDATE OF `activity_date`,`user_id` ON `learner_activity_days`
BEGIN
  UPDATE `operations_reporting_learner_activations` SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = OLD.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END WHERE `user_id` = OLD.`user_id`;
  UPDATE `operations_reporting_learner_activations` SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = NEW.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END WHERE `user_id` = NEW.`user_id`;
END;

CREATE TRIGGER `operations_activity_activation_ad` AFTER DELETE ON `learner_activity_days`
BEGIN
  UPDATE `operations_reporting_learner_activations` SET `returned_within_7_days` = CASE WHEN EXISTS (SELECT 1 FROM `learner_activity_days` WHERE `user_id` = OLD.`user_id` AND `activity_date` > `first_start_date` AND `activity_date` <= date(`first_start_date`, '+7 days')) THEN 1 ELSE 0 END WHERE `user_id` = OLD.`user_id`;
END;

CREATE TRIGGER `operations_progress_daily_ai` AFTER INSERT ON `learner_lesson_progress`
WHEN NEW.`status` = 'completed' AND NEW.`completed_at` IS NOT NULL AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
BEGIN
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`completions`) VALUES (date(NEW.`completed_at` / 1000, 'unixepoch', '+09:00'),1)
  ON CONFLICT (`date_key`) DO UPDATE SET `completions` = `completions` + 1;
END;

CREATE TRIGGER `operations_progress_daily_ad` AFTER DELETE ON `learner_lesson_progress`
WHEN OLD.`status` = 'completed' AND OLD.`completed_at` IS NOT NULL AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`)
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `completions` = `completions` - 1 WHERE `date_key` = date(OLD.`completed_at` / 1000, 'unixepoch', '+09:00');
END;

CREATE TRIGGER `operations_progress_daily_au` AFTER UPDATE OF `status`,`completed_at`,`user_id` ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `completions` = `completions` - 1 WHERE OLD.`status` = 'completed' AND OLD.`completed_at` IS NOT NULL AND `date_key` = date(OLD.`completed_at` / 1000, 'unixepoch', '+09:00') AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`);
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`completions`)
  SELECT date(NEW.`completed_at` / 1000, 'unixepoch', '+09:00'),1 WHERE NEW.`status` = 'completed' AND NEW.`completed_at` IS NOT NULL AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
  ON CONFLICT (`date_key`) DO UPDATE SET `completions` = `completions` + 1;
END;

CREATE TRIGGER `operations_writing_daily_ai` AFTER INSERT ON `writing_events`
WHEN NEW.`event_type` IN ('writing_created','check_succeeded','revised_after_check') AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
BEGIN
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`created_writings`,`check_succeeded_writings`,`revised_after_check_writings`)
  VALUES (date(NEW.`recorded_at` / 1000, 'unixepoch', '+09:00'), NEW.`event_type` = 'writing_created', NEW.`event_type` = 'check_succeeded', NEW.`event_type` = 'revised_after_check')
  ON CONFLICT (`date_key`) DO UPDATE SET `created_writings` = `created_writings` + (NEW.`event_type` = 'writing_created'), `check_succeeded_writings` = `check_succeeded_writings` + (NEW.`event_type` = 'check_succeeded'), `revised_after_check_writings` = `revised_after_check_writings` + (NEW.`event_type` = 'revised_after_check');
END;

CREATE TRIGGER `operations_writing_daily_ad` AFTER DELETE ON `writing_events`
WHEN OLD.`event_type` IN ('writing_created','check_succeeded','revised_after_check') AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`)
BEGIN
  UPDATE `operations_reporting_daily_metrics` SET `created_writings` = `created_writings` - (OLD.`event_type` = 'writing_created'), `check_succeeded_writings` = `check_succeeded_writings` - (OLD.`event_type` = 'check_succeeded'), `revised_after_check_writings` = `revised_after_check_writings` - (OLD.`event_type` = 'revised_after_check') WHERE `date_key` = date(OLD.`recorded_at` / 1000, 'unixepoch', '+09:00');
END;

CREATE TRIGGER `operations_writing_daily_au` AFTER UPDATE OF `event_type`,`recorded_at`,`user_id` ON `writing_events`
BEGIN
  UPDATE `operations_reporting_daily_metrics`
  SET
    `created_writings` = `created_writings` - (OLD.`event_type` = 'writing_created'),
    `check_succeeded_writings` = `check_succeeded_writings` - (OLD.`event_type` = 'check_succeeded'),
    `revised_after_check_writings` = `revised_after_check_writings` - (OLD.`event_type` = 'revised_after_check')
  WHERE OLD.`event_type` IN ('writing_created','check_succeeded','revised_after_check')
    AND `date_key` = date(OLD.`recorded_at` / 1000, 'unixepoch', '+09:00')
    AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`);
  INSERT INTO `operations_reporting_daily_metrics` (`date_key`,`created_writings`,`check_succeeded_writings`,`revised_after_check_writings`)
  SELECT
    date(NEW.`recorded_at` / 1000, 'unixepoch', '+09:00'),
    NEW.`event_type` = 'writing_created',
    NEW.`event_type` = 'check_succeeded',
    NEW.`event_type` = 'revised_after_check'
  WHERE NEW.`event_type` IN ('writing_created','check_succeeded','revised_after_check')
    AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
  ON CONFLICT (`date_key`) DO UPDATE SET
    `created_writings` = `created_writings` + (NEW.`event_type` = 'writing_created'),
    `check_succeeded_writings` = `check_succeeded_writings` + (NEW.`event_type` = 'check_succeeded'),
    `revised_after_check_writings` = `revised_after_check_writings` + (NEW.`event_type` = 'revised_after_check');
END;

CREATE TRIGGER `operations_progress_lesson_ai` AFTER INSERT ON `learner_lesson_progress`
WHEN EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
BEGIN
  INSERT INTO `operations_reporting_lesson_metrics` (`course_id`,`curriculum_version_id`,`lesson_id`,`started`,`completed`) VALUES (NEW.`course_id`,NEW.`curriculum_version_id`,NEW.`lesson_id`,1,NEW.`status` = 'completed')
  ON CONFLICT (`course_id`,`curriculum_version_id`,`lesson_id`) DO UPDATE SET `started` = `started` + 1, `completed` = `completed` + (NEW.`status` = 'completed');
END;

CREATE TRIGGER `operations_progress_lesson_ad` AFTER DELETE ON `learner_lesson_progress`
WHEN EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`)
BEGIN
  UPDATE `operations_reporting_lesson_metrics` SET `started` = `started` - 1, `completed` = `completed` - (OLD.`status` = 'completed') WHERE `course_id` = OLD.`course_id` AND `curriculum_version_id` = OLD.`curriculum_version_id` AND `lesson_id` = OLD.`lesson_id`;
END;

CREATE TRIGGER `operations_progress_lesson_au` AFTER UPDATE OF `course_id`,`curriculum_version_id`,`lesson_id`,`status`,`user_id` ON `learner_lesson_progress`
BEGIN
  UPDATE `operations_reporting_lesson_metrics` SET `started` = `started` - 1, `completed` = `completed` - (OLD.`status` = 'completed') WHERE `course_id` = OLD.`course_id` AND `curriculum_version_id` = OLD.`curriculum_version_id` AND `lesson_id` = OLD.`lesson_id` AND EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = OLD.`user_id`);
  INSERT INTO `operations_reporting_lesson_metrics` (`course_id`,`curriculum_version_id`,`lesson_id`,`started`,`completed`)
  SELECT NEW.`course_id`,NEW.`curriculum_version_id`,NEW.`lesson_id`,1,NEW.`status` = 'completed' WHERE EXISTS (SELECT 1 FROM `identity_reporting_learners` WHERE `user_id` = NEW.`user_id`)
  ON CONFLICT (`course_id`,`curriculum_version_id`,`lesson_id`) DO UPDATE SET `started` = `started` + 1, `completed` = `completed` + (NEW.`status` = 'completed');
END;

CREATE TRIGGER `operations_profile_rollups_au` AFTER UPDATE OF `status` ON `learner_profiles`
WHEN (OLD.`status` = 'deleted') <> (NEW.`status` = 'deleted')
BEGIN
  DELETE FROM `operations_reporting_learner_activations` WHERE `user_id` = NEW.`user_id` AND NEW.`status` = 'deleted';
  INSERT INTO `operations_reporting_learner_activations` (`user_id`,`signup_date`,`first_start_date`,`returned_within_7_days`)
  SELECT `user`.`id`,date(`user`.`created_at` / 1000, 'unixepoch', '+09:00'),date(min(`progress`.`started_at`) / 1000, 'unixepoch', '+09:00'),CASE WHEN EXISTS (
    SELECT 1 FROM `learner_activity_days` AS `activity`
    WHERE `activity`.`user_id` = NEW.`user_id`
      AND `activity`.`activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
      AND `activity`.`activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
  ) THEN 1 ELSE 0 END
  FROM `user` LEFT JOIN `learner_lesson_progress` AS `progress` ON `progress`.`user_id` = `user`.`id`
  WHERE `user`.`id` = NEW.`user_id` AND NEW.`status` <> 'deleted' GROUP BY `user`.`id`
  ON CONFLICT (`user_id`) DO UPDATE SET `signup_date` = excluded.`signup_date`, `first_start_date` = excluded.`first_start_date`;
  UPDATE `operations_reporting_daily_metrics` SET `completions` = `completions` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id` AND `status` = 'completed' AND date(`completed_at` / 1000, 'unixepoch', '+09:00') = `date_key`);
  UPDATE `operations_reporting_daily_metrics` SET
    `created_writings` = `created_writings` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `writing_events` WHERE `user_id` = NEW.`user_id` AND `event_type` = 'writing_created' AND date(`recorded_at` / 1000, 'unixepoch', '+09:00') = `date_key`),
    `check_succeeded_writings` = `check_succeeded_writings` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `writing_events` WHERE `user_id` = NEW.`user_id` AND `event_type` = 'check_succeeded' AND date(`recorded_at` / 1000, 'unixepoch', '+09:00') = `date_key`),
    `revised_after_check_writings` = `revised_after_check_writings` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `writing_events` WHERE `user_id` = NEW.`user_id` AND `event_type` = 'revised_after_check' AND date(`recorded_at` / 1000, 'unixepoch', '+09:00') = `date_key`);
  UPDATE `operations_reporting_lesson_metrics` SET
    `started` = `started` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id` AND `course_id` = `operations_reporting_lesson_metrics`.`course_id` AND `curriculum_version_id` = `operations_reporting_lesson_metrics`.`curriculum_version_id` AND `lesson_id` = `operations_reporting_lesson_metrics`.`lesson_id`),
    `completed` = `completed` + CASE WHEN NEW.`status` = 'deleted' THEN -1 ELSE 1 END * (SELECT count(*) FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id` AND `status` = 'completed' AND `course_id` = `operations_reporting_lesson_metrics`.`course_id` AND `curriculum_version_id` = `operations_reporting_lesson_metrics`.`curriculum_version_id` AND `lesson_id` = `operations_reporting_lesson_metrics`.`lesson_id`);
END;

CREATE TRIGGER `operations_profile_activation_ai` AFTER INSERT ON `learner_profiles`
WHEN NEW.`status` <> 'deleted'
BEGIN
  INSERT INTO `operations_reporting_learner_activations` (`user_id`,`signup_date`,`first_start_date`,`returned_within_7_days`)
  SELECT
    `user`.`id`,
    date(`user`.`created_at` / 1000, 'unixepoch', '+09:00'),
    (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`),
    CASE WHEN EXISTS (
      SELECT 1 FROM `learner_activity_days`
      WHERE `user_id` = NEW.`user_id`
        AND `activity_date` > (SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`)
        AND `activity_date` <= date((SELECT date(min(`started_at`) / 1000, 'unixepoch', '+09:00') FROM `learner_lesson_progress` WHERE `user_id` = NEW.`user_id`), '+7 days')
    ) THEN 1 ELSE 0 END
  FROM `user`
  WHERE `id` = NEW.`user_id`;
END;

CREATE TRIGGER `operations_profile_activation_ad` AFTER DELETE ON `learner_profiles`
BEGIN
  DELETE FROM `operations_reporting_learner_activations` WHERE `user_id` = OLD.`user_id`;
END;

CREATE TRIGGER `operations_reporting_checkpoint_progress_ai` AFTER INSERT ON `learner_lesson_progress` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_progress_au` AFTER UPDATE ON `learner_lesson_progress` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_progress_ad` AFTER DELETE ON `learner_lesson_progress` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_activity_ai` AFTER INSERT ON `learner_activity_days` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_activity_au` AFTER UPDATE ON `learner_activity_days` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_activity_ad` AFTER DELETE ON `learner_activity_days` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_writing_ai` AFTER INSERT ON `writing_events` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_writing_au` AFTER UPDATE ON `writing_events` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_writing_ad` AFTER DELETE ON `writing_events` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_profile_ai` AFTER INSERT ON `learner_profiles` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_profile_au` AFTER UPDATE OF `status` ON `learner_profiles` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
CREATE TRIGGER `operations_reporting_checkpoint_profile_ad` AFTER DELETE ON `learner_profiles` BEGIN UPDATE `operations_reporting_checkpoint` SET `source_changed_at` = unixepoch('subsec') * 1000, `reconciled_at` = unixepoch('subsec') * 1000 WHERE `id` = 1; END;
