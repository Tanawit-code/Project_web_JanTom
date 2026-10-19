-- Run once on an existing database to enable one-time due-date reminder emails.
CREATE TABLE IF NOT EXISTS BORROW_DUE_REMINDER (
  borrow_id int(11) NOT NULL,
  status enum('sending', 'sent') NOT NULL DEFAULT 'sending',
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  sent_at datetime DEFAULT NULL,
  PRIMARY KEY (borrow_id),
  CONSTRAINT borrow_due_reminder_ibfk_1
    FOREIGN KEY (borrow_id) REFERENCES BORROW_REQUEST (borrow_id) ON DELETE CASCADE
);
