-- รันไฟล์นี้เพิ่มเติม ถ้าสร้างฐานข้อมูล assetdb ไปแล้วก่อนหน้านี้
USE assetdb;
ALTER TABLE ASSET ADD COLUMN image_url VARCHAR(255) NULL AFTER location;
