ALTER TABLE curriculum_versions
ADD COLUMN revision integer NOT NULL DEFAULT 1;

ALTER TABLE lesson_steps
ADD COLUMN status text NOT NULL DEFAULT 'active';
