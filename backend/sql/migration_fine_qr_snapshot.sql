-- Run once on an existing database to preserve the payment details used by each fine QR.
ALTER TABLE FINE
  ADD COLUMN qr_amount DECIMAL(10,2) DEFAULT NULL AFTER amount,
  ADD COLUMN qr_promptpay_id VARCHAR(32) DEFAULT NULL AFTER qr_amount,
  ADD COLUMN qr_account_name VARCHAR(100) DEFAULT NULL AFTER qr_promptpay_id,
  ADD COLUMN qr_payload TEXT NULL AFTER qr_account_name,
  ADD COLUMN qr_created_at DATETIME DEFAULT NULL AFTER qr_payload;
