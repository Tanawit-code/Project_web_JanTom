-- รันครั้งเดียวกับฐานข้อมูลที่มีอยู่แล้ว: เพิ่มคอลัมน์สำหรับยืนยันการเปลี่ยนรหัสผ่านทางอีเมล
USE assetdb;
ALTER TABLE `employee`
  ADD COLUMN `pending_password_hash` varchar(255) DEFAULT NULL,
  ADD COLUMN `password_change_token_hash` char(64) DEFAULT NULL,
  ADD COLUMN `password_change_expires` datetime DEFAULT NULL;
