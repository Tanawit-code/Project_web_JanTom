-- ===== ข้อมูลตัวอย่างสำหรับทีม (ไม่มีข้อมูลส่วนตัว/ประวัติการยืม) =====
-- บัญชีทดสอบ: admin/Admin@1234, approver/Approver@1234, demo/Demo@1234 (ใช้ในเครื่องตัวเองเท่านั้น)
-- สร้างฐานข้อมูล assetdb ก่อน แล้ว Import ไฟล์นี้เข้าไป
--
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 10, 2026 at 04:13 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `assetdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `asset`
--

CREATE TABLE `asset` (
  `asset_id` int(11) NOT NULL,
  `asset_code` varchar(30) NOT NULL,
  `asset_name` varchar(150) NOT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `model` varchar(50) DEFAULT NULL,
  `serial_number` varchar(80) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `status` enum('available','borrowed','repair','retired') NOT NULL DEFAULT 'available',
  `location` varchar(100) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `cat_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `asset`
--

INSERT INTO `asset` (`asset_id`, `asset_code`, `asset_name`, `brand`, `model`, `serial_number`, `purchase_date`, `price`, `status`, `location`, `image_url`, `cat_id`) VALUES
(1, 'AST-0001', 'โน้ตบุ๊ก Dell Latitude', 'Dell', 'Latitude 5420', 'SN-D5420-01', '2024-02-29', 28000.00, 'available', 'คลังไอที', '/uploads/1791258914162-979094976.jpg', 1),
(2, 'AST-0002', 'โปรเจกเตอร์ Epson', 'Epson', 'EB-X06', 'SN-EPX06-01', '2023-11-13', 15000.00, 'available', 'ห้องประชุม A', '/uploads/1791258881414-56004592.jpg', 2),
(3, 'AST-0003', 'กล้องถ่ายภาพ Canon', 'Canon', 'EOS 200D', 'SN-EOS-01', '2024-01-18', 22000.00, 'available', 'คลังไอที', '/uploads/1791259121562-646489660.webp', 1),
(4, 'AST-0004', 'สว่านไฟฟ้า Bosch', 'Bosch', 'GSB 13RE', 'SN-BOSCH-01', '2022-06-09', 3500.00, 'available', 'ห้องช่าง', '/uploads/1791258701640-381870041.jpg', 3),
(5, 'AST-0005', 'ไมค์ BOYA', 'BOYA', 'V2.0', 'SN-005', '2026-06-10', 2000.00, 'available', 'คลังไอที', '/uploads/1791260410747-539846236.jpg', 2);

-- --------------------------------------------------------

--
-- Table structure for table `asset_category`
--

CREATE TABLE `asset_category` (
  `cat_id` int(11) NOT NULL,
  `cat_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `asset_category`
--

INSERT INTO `asset_category` (`cat_id`, `cat_name`, `description`) VALUES
(1, 'คอมพิวเตอร์/โน้ตบุ๊ก', 'อุปกรณ์คอมพิวเตอร์'),
(2, 'อุปกรณ์นำเสนอ', 'โปรเจกเตอร์ จอ ลำโพง'),
(3, 'เครื่องมือช่าง', 'อุปกรณ์ซ่อมบำรุงทั่วไป');

-- --------------------------------------------------------

--
-- Table structure for table `borrow_detail`
--

CREATE TABLE `borrow_detail` (
  `detail_id` int(11) NOT NULL,
  `condition_out` varchar(255) DEFAULT NULL,
  `detail_note` varchar(255) DEFAULT NULL,
  `borrow_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `borrow_request`
--

CREATE TABLE `borrow_request` (
  `borrow_id` int(11) NOT NULL,
  `borrow_code` varchar(20) NOT NULL,
  `request_date` datetime NOT NULL DEFAULT current_timestamp(),
  `due_date` date NOT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','returned','cancelled') NOT NULL DEFAULT 'pending',
  `approve_date` datetime DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `emp_id` int(11) NOT NULL,
  `approver_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `dept_id` int(11) NOT NULL,
  `dept_name` varchar(100) NOT NULL,
  `dept_location` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`dept_id`, `dept_name`, `dept_location`) VALUES
(1, 'ฝ่ายไอที', 'อาคาร 1 ชั้น 3'),
(2, 'ฝ่ายบัญชี', 'อาคาร 2 ชั้น 1'),
(3, 'ฝ่ายบุคคล', 'อาคาร 1 ชั้น 1');

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `emp_id` int(11) NOT NULL,
  `emp_code` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `position` varchar(50) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('employee','approver','admin') NOT NULL DEFAULT 'employee',
  `status` enum('pending','active') NOT NULL DEFAULT 'active',
  `approval_token_hash` char(64) DEFAULT NULL,
  `approval_expires` datetime DEFAULT NULL,
  `reset_token_hash` char(64) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `dept_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`emp_id`, `emp_code`, `first_name`, `last_name`, `position`, `phone`, `email`, `username`, `password_hash`, `role`, `status`, `approval_token_hash`, `approval_expires`, `reset_token_hash`, `reset_expires`, `created_at`, `dept_id`) VALUES
(1, 'ADM-0001', 'ผู้ดูแล', 'ระบบ', NULL, NULL, 'admin@example.com', 'admin', '$2a$10$sZ2cIuI7qJYnwnHAH1Q2SeHXaPoLkXu9mYVIaPnpkLmRmTvfmcZve', 'admin', 'active', NULL, NULL, NULL, NULL, '2026-10-10 00:00:00', NULL),
(2, 'APR-0001', 'ผู้อนุมัติ', 'ตัวอย่าง', 'หัวหน้าแผนก', NULL, 'approver@example.com', 'approver', '$2a$10$oHKnTdPtDi0yrhaR9QeVCOcGkrRWPVCZdy28fQ5p/ockIIZw2gm5C', 'approver', 'active', NULL, NULL, NULL, NULL, '2026-10-10 00:00:00', 1),
(3, 'EMP-0001', 'พนักงาน', 'ตัวอย่าง', 'เจ้าหน้าที่', NULL, 'demo@example.com', 'demo', '$2a$10$4zb2AtmBrlRRtUzBKc0vLeneL/yIWOKLx4lWB4LallKcsDIf13L0q', 'employee', 'active', NULL, NULL, NULL, NULL, '2026-10-10 00:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `fine`
--

CREATE TABLE `fine` (
  `fine_id` int(11) NOT NULL,
  `fine_code` varchar(24) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `detail_id` int(11) DEFAULT NULL,
  `fine_type` enum('late','damaged','other') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('unpaid','slip_submitted','paid','cancelled') NOT NULL DEFAULT 'unpaid',
  `slip_file` varchar(255) DEFAULT NULL,
  `slip_hash` char(64) DEFAULT NULL,
  `slip_uploaded_at` datetime DEFAULT NULL,
  `review_note` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `notif_id` int(11) NOT NULL,
  `emp_id` int(11) NOT NULL,
  `type` varchar(30) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `link` varchar(100) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `repair`
--

CREATE TABLE `repair` (
  `repair_id` int(11) NOT NULL,
  `report_date` date NOT NULL DEFAULT curdate(),
  `problem_detail` varchar(255) NOT NULL,
  `repair_date` date DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `repair_status` enum('pending','in_progress','done','cannot_repair') NOT NULL DEFAULT 'pending',
  `asset_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `return_record`
--

CREATE TABLE `return_record` (
  `return_id` int(11) NOT NULL,
  `return_date` datetime NOT NULL DEFAULT current_timestamp(),
  `condition_in` varchar(255) DEFAULT NULL,
  `fine_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `return_note` varchar(255) DEFAULT NULL,
  `detail_id` int(11) NOT NULL,
  `received_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `asset`
--
ALTER TABLE `asset`
  ADD PRIMARY KEY (`asset_id`),
  ADD UNIQUE KEY `asset_code` (`asset_code`),
  ADD KEY `cat_id` (`cat_id`);

--
-- Indexes for table `asset_category`
--
ALTER TABLE `asset_category`
  ADD PRIMARY KEY (`cat_id`);

--
-- Indexes for table `borrow_detail`
--
ALTER TABLE `borrow_detail`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `borrow_id` (`borrow_id`),
  ADD KEY `asset_id` (`asset_id`);

--
-- Indexes for table `borrow_request`
--
ALTER TABLE `borrow_request`
  ADD PRIMARY KEY (`borrow_id`),
  ADD UNIQUE KEY `borrow_code` (`borrow_code`),
  ADD KEY `emp_id` (`emp_id`),
  ADD KEY `approver_id` (`approver_id`);

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`dept_id`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`emp_id`),
  ADD UNIQUE KEY `emp_code` (`emp_code`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `dept_id` (`dept_id`);

--
-- Indexes for table `fine`
--
ALTER TABLE `fine`
  ADD PRIMARY KEY (`fine_id`),
  ADD UNIQUE KEY `fine_code` (`fine_code`),
  ADD KEY `idx_fine_emp_status` (`emp_id`,`status`),
  ADD KEY `idx_fine_slip_hash` (`slip_hash`),
  ADD KEY `detail_id` (`detail_id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`notif_id`),
  ADD KEY `idx_notif_emp` (`emp_id`,`is_read`,`created_at`);

--
-- Indexes for table `repair`
--
ALTER TABLE `repair`
  ADD PRIMARY KEY (`repair_id`),
  ADD KEY `asset_id` (`asset_id`);

--
-- Indexes for table `return_record`
--
ALTER TABLE `return_record`
  ADD PRIMARY KEY (`return_id`),
  ADD UNIQUE KEY `detail_id` (`detail_id`),
  ADD KEY `received_by` (`received_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `asset`
--
ALTER TABLE `asset`
  MODIFY `asset_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `asset_category`
--
ALTER TABLE `asset_category`
  MODIFY `cat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `borrow_detail`
--
ALTER TABLE `borrow_detail`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `borrow_request`
--
ALTER TABLE `borrow_request`
  MODIFY `borrow_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `dept_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `emp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `fine`
--
ALTER TABLE `fine`
  MODIFY `fine_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `notif_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `repair`
--
ALTER TABLE `repair`
  MODIFY `repair_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `return_record`
--
ALTER TABLE `return_record`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asset`
--
ALTER TABLE `asset`
  ADD CONSTRAINT `asset_ibfk_1` FOREIGN KEY (`cat_id`) REFERENCES `asset_category` (`cat_id`);

--
-- Constraints for table `borrow_detail`
--
ALTER TABLE `borrow_detail`
  ADD CONSTRAINT `borrow_detail_ibfk_1` FOREIGN KEY (`borrow_id`) REFERENCES `borrow_request` (`borrow_id`),
  ADD CONSTRAINT `borrow_detail_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`asset_id`);

--
-- Constraints for table `borrow_request`
--
ALTER TABLE `borrow_request`
  ADD CONSTRAINT `borrow_request_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  ADD CONSTRAINT `borrow_request_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `employee` (`emp_id`);

--
-- Constraints for table `employee`
--
ALTER TABLE `employee`
  ADD CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `department` (`dept_id`);

--
-- Constraints for table `fine`
--
ALTER TABLE `fine`
  ADD CONSTRAINT `fine_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`),
  ADD CONSTRAINT `fine_ibfk_2` FOREIGN KEY (`detail_id`) REFERENCES `borrow_detail` (`detail_id`),
  ADD CONSTRAINT `fine_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `employee` (`emp_id`),
  ADD CONSTRAINT `fine_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `employee` (`emp_id`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`) ON DELETE CASCADE;

--
-- Constraints for table `repair`
--
ALTER TABLE `repair`
  ADD CONSTRAINT `repair_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`asset_id`);

--
-- Constraints for table `return_record`
--
ALTER TABLE `return_record`
  ADD CONSTRAINT `return_record_ibfk_1` FOREIGN KEY (`detail_id`) REFERENCES `borrow_detail` (`detail_id`),
  ADD CONSTRAINT `return_record_ibfk_2` FOREIGN KEY (`received_by`) REFERENCES `employee` (`emp_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
