ALTER TABLE message_thread ADD COLUMN urgent bool NOT NULL DEFAULT FALSE;
ALTER TABLE message_draft ADD COLUMN urgent bool NOT NULL DEFAULT FALSE;