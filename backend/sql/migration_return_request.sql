-- Run once on an existing database to allow borrowers to notify admins that an item is ready to return.
ALTER TABLE BORROW_DETAIL
  ADD COLUMN return_requested_at DATETIME DEFAULT NULL AFTER detail_note;

CREATE INDEX idx_borrow_detail_return_requested
  ON BORROW_DETAIL (return_requested_at);
