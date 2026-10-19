-- Run once on an existing database to enable employee asset reservations.
ALTER TABLE ASSET
  MODIFY COLUMN status enum('available','reserved','borrowed','repair','retired') NOT NULL DEFAULT 'available';

ALTER TABLE BORROW_REQUEST
  MODIFY COLUMN status enum('pending','reserved','approved','rejected','returned','cancelled') NOT NULL DEFAULT 'pending',
  ADD COLUMN pickup_date date DEFAULT NULL AFTER due_date;
