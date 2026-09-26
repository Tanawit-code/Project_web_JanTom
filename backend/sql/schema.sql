CREATE DATABASE IF NOT EXISTS assetdb CHARACTER SET utf8mb4;
USE assetdb;

CREATE TABLE IF NOT EXISTS DEPARTMENT (
  dept_id INT AUTO_INCREMENT PRIMARY KEY,
  dept_name VARCHAR(100) NOT NULL,
  dept_location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS EMPLOYEE (
  emp_id INT AUTO_INCREMENT PRIMARY KEY,
  emp_code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  position VARCHAR(50),
  phone VARCHAR(15),
  email VARCHAR(100) UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee','approver','admin') NOT NULL DEFAULT 'employee',
  dept_id INT,
  FOREIGN KEY (dept_id) REFERENCES DEPARTMENT(dept_id)
);

CREATE TABLE IF NOT EXISTS ASSET_CATEGORY (
  cat_id INT AUTO_INCREMENT PRIMARY KEY,
  cat_name VARCHAR(100) NOT NULL,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ASSET (
  asset_id INT AUTO_INCREMENT PRIMARY KEY,
  asset_code VARCHAR(30) NOT NULL UNIQUE,
  asset_name VARCHAR(150) NOT NULL,
  brand VARCHAR(50),
  model VARCHAR(50),
  serial_number VARCHAR(80),
  purchase_date DATE,
  price DECIMAL(12,2),
  status ENUM('available','borrowed','repair','retired') NOT NULL DEFAULT 'available',
  location VARCHAR(100),
  cat_id INT,
  FOREIGN KEY (cat_id) REFERENCES ASSET_CATEGORY(cat_id)
);

CREATE TABLE IF NOT EXISTS BORROW_REQUEST (
  borrow_id INT AUTO_INCREMENT PRIMARY KEY,
  borrow_code VARCHAR(20) NOT NULL UNIQUE,
  request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date DATE NOT NULL,
  purpose VARCHAR(255),
  status ENUM('pending','approved','rejected','returned','cancelled') NOT NULL DEFAULT 'pending',
  approve_date DATETIME,
  note VARCHAR(255),
  emp_id INT NOT NULL,
  approver_id INT,
  FOREIGN KEY (emp_id) REFERENCES EMPLOYEE(emp_id),
  FOREIGN KEY (approver_id) REFERENCES EMPLOYEE(emp_id)
);

CREATE TABLE IF NOT EXISTS BORROW_DETAIL (
  detail_id INT AUTO_INCREMENT PRIMARY KEY,
  condition_out VARCHAR(255),
  detail_note VARCHAR(255),
  borrow_id INT NOT NULL,
  asset_id INT NOT NULL,
  FOREIGN KEY (borrow_id) REFERENCES BORROW_REQUEST(borrow_id),
  FOREIGN KEY (asset_id) REFERENCES ASSET(asset_id)
);

CREATE TABLE IF NOT EXISTS RETURN_RECORD (
  return_id INT AUTO_INCREMENT PRIMARY KEY,
  return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  condition_in VARCHAR(255),
  fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  return_note VARCHAR(255),
  detail_id INT NOT NULL UNIQUE,
  received_by INT NOT NULL,
  FOREIGN KEY (detail_id) REFERENCES BORROW_DETAIL(detail_id),
  FOREIGN KEY (received_by) REFERENCES EMPLOYEE(emp_id)
);

CREATE TABLE IF NOT EXISTS REPAIR (
  repair_id INT AUTO_INCREMENT PRIMARY KEY,
  report_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  problem_detail VARCHAR(255) NOT NULL,
  repair_date DATE,
  cost DECIMAL(10,2),
  repair_status ENUM('pending','in_progress','done','cannot_repair') NOT NULL DEFAULT 'pending',
  asset_id INT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES ASSET(asset_id)
);

-- seed data
INSERT INTO DEPARTMENT (dept_name, dept_location) VALUES
('ฝ่ายไอที', 'อาคาร 1 ชั้น 3'),
('ฝ่ายบัญชี', 'อาคาร 2 ชั้น 1'),
('ฝ่ายบุคคล', 'อาคาร 1 ชั้น 1');

INSERT INTO ASSET_CATEGORY (cat_name, description) VALUES
('คอมพิวเตอร์/โน้ตบุ๊ก', 'อุปกรณ์คอมพิวเตอร์'),
('อุปกรณ์นำเสนอ', 'โปรเจกเตอร์ จอ ลำโพง'),
('เครื่องมือช่าง', 'อุปกรณ์ซ่อมบำรุงทั่วไป');

INSERT INTO ASSET (asset_code, asset_name, brand, model, serial_number, purchase_date, price, status, location, cat_id) VALUES
('AST-0001', 'โน้ตบุ๊ก Dell Latitude', 'Dell', 'Latitude 5420', 'SN-D5420-01', '2024-03-01', 28000.00, 'available', 'คลังไอที', 1),
('AST-0002', 'โปรเจกเตอร์ Epson', 'Epson', 'EB-X06', 'SN-EPX06-01', '2023-11-15', 15000.00, 'available', 'ห้องประชุม A', 2),
('AST-0003', 'กล้องถ่ายภาพ Canon', 'Canon', 'EOS 200D', 'SN-EOS-01', '2024-01-20', 22000.00, 'available', 'คลังไอที', 1),
('AST-0004', 'สว่านไฟฟ้า Bosch', 'Bosch', 'GSB 13RE', 'SN-BOSCH-01', '2022-06-10', 3500.00, 'available', 'ห้องช่าง', 3);

-- run: node utils/createAdmin.js <username> <email_or_null> <password>  after npm install
-- to create the first admin account with a proper bcrypt hash
