-- ระบบตรวจสลิปอัตโนมัติ: เก็บเลขอ้างอิงธุรกรรม ผลตรวจ และบันทึกผล
-- (รันครั้งเดียวกับฐานข้อมูลที่สร้างไว้แล้ว ถ้า import assetdb.sql ล่าสุดไม่ต้องรัน)
USE assetdb;

ALTER TABLE `fine`
  ADD COLUMN `slip_trans_ref` varchar(64) DEFAULT NULL AFTER `slip_hash`,
  ADD COLUMN `verify_result` enum('verified','needs_review','unavailable') DEFAULT NULL AFTER `review_note`,
  ADD COLUMN `verify_note` varchar(255) DEFAULT NULL AFTER `verify_result`,
  ADD COLUMN `auto_paid` tinyint(1) NOT NULL DEFAULT 0 AFTER `verify_note`,
  ADD UNIQUE KEY `uq_fine_slip_trans_ref` (`slip_trans_ref`);
