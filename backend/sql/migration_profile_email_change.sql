-- Run once on an existing database to enable secure email change confirmation.
ALTER TABLE EMPLOYEE
  ADD COLUMN pending_email varchar(100) DEFAULT NULL,
  ADD COLUMN email_change_token_hash char(64) DEFAULT NULL,
  ADD COLUMN email_change_expires datetime DEFAULT NULL;
