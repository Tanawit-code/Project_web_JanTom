-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 18, 2026 at 01:42 PM
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
(5, 'AST-0005', 'ไมค์ BOYA', 'BOYA', 'V2.0', 'SN-005', '2026-06-10', 2000.00, 'available', 'ครังไอที', '/uploads/1791260410747-539846236.jpg', 2),
(7, 'AST-0006', 'โน้ตบุ๊ก Lenovo ThinkPad 2', 'Lenovo', 'ThinkPad E14 Gen 5', 'SN-LNV-E14-01', '2024-05-20', 26900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323372/assets/aqyj21tiapcbunf9zdrl.jpg', 1),
(8, 'AST-0007', 'โน้ตบุ๊ก Lenovo ThinkPad', 'Lenovo', 'ThinkPad E14 Gen 5', 'SN-LNV-E14-02', '2024-05-20', 26900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323326/assets/pex4geeik2afu0qxlmd6.jpg', 1),
(9, 'AST-0008', 'โน้ตบุ๊ก HP ProBook', 'HP', 'ProBook 440 G10', 'SN-HP-440-01', '2024-08-12', 24500.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323337/assets/xx1lalsodqvehudoezjp.jpg', 1),
(10, 'AST-0009', 'โน้ตบุ๊ก ASUS Vivobook', 'ASUS', 'Vivobook 15 X1504', 'SN-ASUS-V15-01', '2025-02-10', 18900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323276/assets/xybxs4rthmolagxzoq6c.jpg', 1),
(11, 'AST-0010', 'MacBook Air 13 นิ้ว', 'Apple', 'MacBook Air M2', 'SN-APL-MBA-01', '2024-03-15', 37900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323248/assets/avfghp1mykodxfmpfbtd.jpg', 1),
(12, 'AST-0011', 'คอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex', 'Dell', 'OptiPlex 3000', 'SN-DELL-OP3K-01', '2023-09-05', 19500.00, 'available', 'ห้องสำนักงาน', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323229/assets/ksizi8jzxqrnzdahmznk.jpg', 1),
(13, 'AST-0012', 'โปรเจกเตอร์ BenQ', 'BenQ', 'MH560', 'SN-BNQ-MH560-01', '2024-04-02', 17900.00, 'available', 'ห้องประชุม B', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323205/assets/yncgu3h3sodnlwwdgnn6.png', 2),
(14, 'AST-0013', 'จอโปรเจกเตอร์ ขาตั้ง 100 นิ้ว', 'Telon', 'Tripod 100\"', 'SN-TLN-100-01', '2023-07-18', 3200.00, 'available', 'ห้องประชุม A', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323176/assets/ugc4mmqop7pe91gnfzj1.jpg', 2),
(15, 'AST-0014', 'ลำโพงประชุมไร้สาย', 'Jabra', 'Speak 510', 'SN-JBR-S510-01', '2024-01-22', 5900.00, 'available', 'ห้องประชุม A', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323156/assets/q6nftvms8nhdlllysvzf.jpg', 2),
(16, 'AST-0015', 'ตัวควบคุมสไลด์ (Presenter)', 'Logitech', 'R400', 'SN-LGT-R400-01', '2023-10-09', 1200.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323136/assets/oqiocppdathoux9fjyvy.jpg', 2),
(17, 'AST-0016', 'จอทีวีสำหรับประชุม 55 นิ้ว', 'Samsung', 'UA55CU7700', 'SN-SSG-55-01', '2024-06-30', 14900.00, 'available', 'ห้องประชุม B', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323121/assets/ntkip6soiu7zelexhoam.jpg', 2),
(18, 'AST-0017', 'เครื่องพิมพ์เลเซอร์ HP', 'HP', 'LaserJet Pro M404dn', 'SN-HP-M404-01', '2023-05-14', 9900.00, 'available', 'ห้องสำนักงาน', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323098/assets/vcqtepshzesawqhwktlf.jpg', 4),
(19, 'AST-0018', 'เครื่องพิมพ์ Brother อเนกประสงค์', 'Brother', 'MFC-L2750DW', 'SN-BRO-L2750-01', '2024-02-08', 8500.00, 'available', 'ห้องสำนักงาน', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323077/assets/qgrvmnm1qa9yuoq3oz81.jpg', 4),
(20, 'AST-0019', 'สแกนเนอร์เอกสาร', 'Epson', 'WorkForce DS-530II', 'SN-EPS-DS530-01', '2023-12-01', 13900.00, 'available', 'ห้องสำนักงาน', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323056/assets/okbiw306yvkg00ynrets.jpg', 4),
(21, 'AST-0020', 'เครื่องเย็บกระดาษแบบอุตสาหกรรม', 'Max', 'HD-12N', 'SN-MAX-HD12-01', '2022-11-21', 650.00, 'available', 'ห้องสำนักงาน', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323035/assets/nu9pjpxv81yj6drr7bdz.jpg', 4),
(22, 'AST-0021', 'เครื่องเคลือบบัตร A3', 'Fellowes', 'Neptune 3 A3', 'SN-FLW-NEP3-01', '2023-03-27', 4200.00, 'available', 'ห้องสำนักงาน', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323019/assets/yfrlyjnqmuid728jhbna.jpg', 4),
(23, 'AST-0022', 'เราเตอร์ Wi-Fi 6', 'TP-Link', 'Archer AX55', 'SN-TPL-AX55-01', '2024-07-11', 2900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322992/assets/obqkiwpit1habqhaxukm.jpg', 5),
(24, 'AST-0023', 'สวิตช์ 24 พอร์ต', 'Cisco', 'CBS110-24T', 'SN-CSC-110-01', '2023-08-19', 6900.00, 'available', 'ห้องเซิร์ฟเวอร์', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322975/assets/pc7gdsshpu578jcwh20s.jpg', 5),
(25, 'AST-0024', 'แอคเซสพอยต์', 'Ubiquiti', 'UniFi U6-Lite', 'SN-UBQ-U6L-01', '2024-09-03', 3500.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322960/assets/vhwvqcrhklsxyv1tgiwu.png', 5),
(26, 'AST-0025', 'เครื่องทดสอบสายแลน', 'Fluke', 'MicroScanner2', 'SN-FLK-MS2-01', '2022-10-10', 15500.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322945/assets/bpf7hz8scxzhiwbap80s.jpg', 9),
(27, 'AST-0026', 'กล้อง Mirrorless Sony', 'Sony', 'Alpha a6400', 'SN-SNY-A6400-01', '2024-03-09', 32900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322926/assets/orvalhmyjww2koyknuc8.jpg', 6),
(28, 'AST-0027', 'กล้อง GoPro Action Camera', 'GoPro', 'HERO12 Black', 'SN-GPR-H12-01', '2024-10-15', 13500.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322899/assets/or6cgblcwvnw64gcqtu3.jpg', 6),
(29, 'AST-0028', 'ขาตั้งกล้อง', 'Manfrotto', 'MT190X3', 'SN-MFT-190-01', '2023-06-06', 4800.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322849/assets/fxq5bel55eetbkstexyg.jpg', 6),
(31, 'AST-0030', 'ไฟสตูดิโอ LED', 'Godox', 'SL60W', 'SN-GDX-SL60-01', '2023-11-25', 4500.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322825/assets/zgbkjpd7yo5ca3kepler.jpg', 6),
(32, 'AST-0031', 'iPad สำหรับใช้งานนอกสถานที่', 'Apple', 'iPad 10th Gen', 'SN-APL-IPD-01', '2024-01-12', 12900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322802/assets/hjf4cg2hirrrftltfrdj.jpg', 7),
(35, 'AST-0034', 'จอภาพ 24 นิ้ว', 'Dell', 'P2422H', 'SN-DELL-P2422-01', '2023-09-05', 5900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322758/assets/jdvtybicqfxg0waa7sgi.jpg', 8),
(36, 'AST-0035', 'จอภาพ 27 นิ้ว', 'LG', '27UL500', 'SN-LG-27UL-01', '2024-02-14', 8900.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322732/assets/uhsiunmghxdkoqss1hzt.jpg', 8),
(38, 'AST-0037', 'คีย์บอร์ดและเมาส์ไร้สาย', 'Logitech', 'MK270', 'SN-LGT-MK270-01', '2024-01-08', 650.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322689/assets/bd3fbnynrgtb8bjk5voc.jpg', 8),
(39, 'AST-0038', 'เว็บแคม Full HD', 'Logitech', 'C920', 'SN-LGT-C920-01', '2023-10-17', 2400.00, 'available', 'คลังไอที', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322657/assets/rtpjlelj4mmlb3iqsng7.png', 8),
(40, 'AST-0039', 'ชุดไขควงอเนกประสงค์', 'Wiha', 'Precision 31 pcs', 'SN-WHA-31-01', '2023-04-12', 1800.00, 'available', 'ห้องช่าง', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322670/assets/vgbwuipjdxvpoomcy7mf.jpg', 3),
(41, 'AST-0040', 'เครื่องเจียร์ไฟฟ้า', 'Makita', '9553NB', 'SN-MKT-9553-01', '2022-08-23', 2100.00, 'available', 'ห้องช่าง', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322544/assets/rt0fjosop67ygxkszp32.jpg', 3),
(42, 'AST-0041', 'บันไดอลูมิเนียมพับได้', 'Gold Series', 'GS-4x4', 'SN-GLD-LDR-01', '2022-05-16', 3900.00, 'available', 'ห้องช่าง', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322527/assets/ax4tkvn8eyg8tesxv1gm.jpg', 3),
(44, 'AST-0043', 'มัลติมิเตอร์ดิจิทัล', 'Fluke', '117', 'SN-FLK-117-01', '2022-12-05', 7500.00, 'available', 'ห้องช่าง', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322468/assets/e2m05tycifsiqe2uhhks.jpg', 9),
(45, 'AST-0044', 'เครื่องวัดระยะเลเซอร์', 'Bosch', 'GLM 40', 'SN-BSH-GLM40-01', '2023-02-20', 2500.00, 'available', 'ห้องช่าง', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322412/assets/irrjwfxtq0aokzsxyjo0.jpg', 9),
(46, 'AST-0045', 'รถยนต์ส่วนกลาง', 'Toyota', 'Corolla Altis 1.8', 'SN-TYT-ALT-01', '2023-01-10', 850000.00, 'available', 'ลานจอดรถ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322402/assets/j8rd89ecel27r4pl0upl.jpg', 10),
(47, 'AST-0046', 'รถกระบะส่วนกลาง', 'Isuzu', 'D-Max Hi-Lander', 'SN-ISZ-DMX-01', '2022-09-01', 720000.00, 'available', 'ลานจอดรถ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322386/assets/ov9vmamagvn9ndhx1qrs.jpg', 10),
(48, 'AST-0047', 'รถจักรยานยนต์ส่งเอกสาร', 'Honda', 'Wave 125i', 'SN-HND-W125-01', '2023-04-04', 45000.00, 'available', 'ลานจอดรถ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322377/assets/kdwj80yeqq3tfoifmeml.jpg', 10),
(49, 'AST-0048', 'ชุดปฐมพยาบาลพกพา', 'Safety Plus', 'FA-Box M', 'SN-SFP-FA-01', '2024-01-05', 1500.00, 'available', 'คลังพัสดุ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322245/assets/cymiqsvci3ajgih5ysdd.jpg', 11),
(50, 'AST-0049', 'หมวกนิรภัย (ชุด 5 ใบ)', '3M', 'H-700', 'SN-3M-H700-01', '2023-08-08', 2500.00, 'available', 'คลังพัสดุ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322239/assets/tbbvtqekeldtscs6xhnc.jpg', 11),
(51, 'AST-0050', 'เต็นท์พับ 3x3 เมตร', 'Sport Pro', 'Easy-Up 3x3', 'SN-SPP-T33-01', '2023-11-03', 3900.00, 'available', 'คลังพัสดุ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322230/assets/syly4czb3naov6wzxvva.jpg', 12),
(52, 'AST-0051', 'โต๊ะพับอเนกประสงค์ 180 ซม.', 'Index', 'FT-180', 'SN-IDX-FT180-01', '2023-05-22', 1900.00, 'available', 'คลังพัสดุ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792323414/assets/jgbagtkamsrlk5dr3fma.jpg', 12),
(53, 'AST-0052', 'เก้าอี้พับ (ชุด 10 ตัว)', 'Index', 'FC-10', 'SN-IDX-FC10-01', '2023-05-22', 4500.00, 'available', 'คลังพัสดุ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322114/assets/raxwo4erndlbt58wgqxu.jpg', 12),
(54, 'AST-0053', 'ป้ายไวนิลขาตั้ง X-Stand', 'Generic', 'X-Stand 60x160', 'SN-XST-01', '2024-02-27', 600.00, 'available', 'คลังพัสดุ', 'https://res.cloudinary.com/uh1wpe42/image/upload/v1792322088/assets/izxd7zjkljgr22rsgjvc.jpg', 12);

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
(3, 'เครื่องมือช่าง', 'อุปกรณ์ซ่อมบำรุงทั่วไป'),
(4, 'อุปกรณ์สำนักงาน', 'เครื่องพิมพ์ สแกนเนอร์ เครื่องเย็บกระดาษ อุปกรณ์ใช้งานในสำนักงาน'),
(5, 'อุปกรณ์เครือข่าย', 'เราเตอร์ สวิตช์ แอคเซสพอยต์ และอุปกรณ์สื่อสารข้อมูล'),
(6, 'กล้องและงานภาพ/เสียง', 'กล้อง ไมโครโฟน ขาตั้ง และอุปกรณ์ผลิตสื่อ'),
(7, 'มือถือ/แท็บเล็ต', 'สมาร์ตโฟนและแท็บเล็ตสำหรับใช้งานนอกสถานที่'),
(8, 'อุปกรณ์ต่อพ่วงคอมพิวเตอร์', 'จอภาพ คีย์บอร์ด เมาส์ ฮาร์ดดิสก์ภายนอก อุปกรณ์เสริม'),
(9, 'เครื่องมือวัดและทดสอบ', 'มัลติมิเตอร์ เครื่องวัดระยะ เครื่องทดสอบสายแลน'),
(10, 'ยานพาหนะ', 'รถยนต์และรถจักรยานยนต์ของบริษัท'),
(11, 'อุปกรณ์ความปลอดภัย', 'หมวกนิรภัย ชุดปฐมพยาบาล อุปกรณ์ป้องกันส่วนบุคคล'),
(12, 'อุปกรณ์จัดงาน/กิจกรรม', 'เต็นท์ โต๊ะพับ เก้าอี้ ป้ายและอุปกรณ์จัดอีเวนต์');

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

--
-- Dumping data for table `borrow_detail`
--

INSERT INTO `borrow_detail` (`detail_id`, `condition_out`, `detail_note`, `borrow_id`, `asset_id`) VALUES
(1, NULL, NULL, 1, 4),
(2, NULL, NULL, 1, 3),
(3, NULL, NULL, 2, 2),
(4, NULL, NULL, 3, 5),
(5, NULL, NULL, 4, 5),
(6, NULL, NULL, 4, 1),
(7, NULL, NULL, 4, 4),
(8, NULL, NULL, 5, 3),
(9, NULL, NULL, 5, 4),
(10, NULL, NULL, 6, 5),
(11, NULL, NULL, 6, 4),
(12, NULL, NULL, 7, 3),
(13, NULL, NULL, 7, 4),
(14, NULL, NULL, 8, 5),
(15, NULL, NULL, 9, 4);

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

--
-- Dumping data for table `borrow_request`
--

INSERT INTO `borrow_request` (`borrow_id`, `borrow_code`, `request_date`, `due_date`, `purpose`, `status`, `approve_date`, `note`, `emp_id`, `approver_id`) VALUES
(1, 'BR-20261001-2035', '2026-10-01 20:36:45', '2026-01-10', 'ทำงาน', 'returned', '2026-10-01 20:37:19', NULL, 2, 1),
(2, 'BR-20261006-7599', '2026-10-06 10:59:50', '2026-10-06', 'ประชุมนอกสถานที่', 'returned', '2026-10-06 11:00:08', NULL, 4, 1),
(3, 'BR-20261006-4737', '2026-10-06 11:24:47', '2026-10-10', 'ใช้นอกสถานที่', 'returned', '2026-10-06 11:25:20', NULL, 5, 1),
(4, 'BR-20261006-5165', '2026-10-06 12:17:30', '2026-10-06', 'ใช้นอกสถานที่', 'returned', '2026-10-06 12:19:14', NULL, 5, 1),
(5, 'BR-20261010-2307', '2026-10-10 03:26:42', '2026-10-13', 'ลอง', 'returned', '2026-10-10 03:26:51', NULL, 5, 1),
(6, 'BR-20261010-5676', '2026-10-10 03:28:12', '2026-10-11', NULL, 'returned', '2026-10-10 03:28:24', NULL, 5, 1),
(7, 'BR-20261011-2619', '2026-10-11 19:51:56', '2026-10-14', NULL, 'returned', '2026-10-11 19:52:20', NULL, 13, 1),
(8, 'BR-20261017-4276', '2026-10-17 21:15:21', '2026-10-18', NULL, 'returned', '2026-10-17 21:15:39', NULL, 5, 1),
(9, 'BR-20261018-4012', '2026-10-18 17:05:51', '2026-10-17', NULL, 'returned', '2026-10-18 17:07:21', NULL, 5, 1);

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
  `dept_id` int(11) DEFAULT NULL,
  `pending_email` varchar(100) DEFAULT NULL,
  `email_change_token_hash` char(64) DEFAULT NULL,
  `email_change_expires` datetime DEFAULT NULL,
  `pending_password_hash` varchar(255) DEFAULT NULL,
  `password_change_token_hash` char(64) DEFAULT NULL,
  `password_change_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`emp_id`, `emp_code`, `first_name`, `last_name`, `position`, `phone`, `email`, `username`, `password_hash`, `role`, `status`, `approval_token_hash`, `approval_expires`, `reset_token_hash`, `reset_expires`, `created_at`, `dept_id`, `pending_email`, `email_change_token_hash`, `email_change_expires`, `pending_password_hash`, `password_change_token_hash`, `password_change_expires`) VALUES
(1, 'ADM-0001', 'ผู้ดูแล', 'ระบบ', NULL, NULL, NULL, 'admin', '$2a$10$AqpEEHr.lu7FurUEDPNWP.yADb/PwqSl7IURpNgWWvRB9Lypor18S', 'admin', 'active', NULL, NULL, NULL, NULL, '2026-10-09 00:52:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, '001', 'tanawit', 'chawprakan', 'it', '123456', 'tanawit@gmail.com', 'tanawit', '$2a$10$CW95ZvuwfMaesAVBZT4t8OLmbDWT4eDECht2h8i8bGz0g8ojwn6d6', 'employee', 'active', NULL, NULL, NULL, NULL, '2026-10-09 00:52:36', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'EMP-0001', 'tanawit', 'chawprakan', 'it', '123456', 'tanawit-it@gmail.com', 'tanawit_it', '$2a$10$25DBN1gkBF3anjR3QsUj9uYaxSQtvJtlvdwDJxXcHQPYNcDKfaGTq', 'employee', 'active', NULL, NULL, NULL, NULL, '2026-10-09 00:52:36', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'EMP-0002', 'Teerapat', 'poom', 'it', '123456789', 'teerapat@gmail.com', 'teerapat', '$2a$10$VVqtb.P5x6T8Twxax8Kb0.LuhmZtxpkMdW2d69AKlwZG4FR/9S116', 'employee', 'active', NULL, NULL, NULL, NULL, '2026-10-09 00:52:36', 1, 'hajungbungphoo@gmail.com', '141a96557d9ebf9db3e8f0bd6cc64420f59f08efd910c91ce608de9a6c34f8a1', '2026-10-18 18:03:53', NULL, NULL, NULL),
(6, 'EMP-0003', 'Natapat', 'natt', 'it', '1234567', 'Natapat@gmail.com', 'Natapat', '$2a$10$4qJZJhwzc6RXpWnXOAPK8eDazEpfmEag1hhfF6CzEm.1eTvz8L9ZC', 'employee', 'active', NULL, NULL, NULL, NULL, '2026-10-09 00:52:36', 1, NULL, NULL, NULL, NULL, NULL, NULL),
(13, '00067', 'weera', 'weeradon', NULL, NULL, 'hajungbungphoo@gmail.com', 'weeradon', '$2a$10$BZTW4TdcHylQ7iKx4GQwVOs6o8euQfeA9ST7Z9v5hRSb3vtNKBdh6', 'employee', 'active', NULL, NULL, NULL, NULL, '2026-10-11 19:41:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
  `slip_trans_ref` varchar(64) DEFAULT NULL,
  `slip_uploaded_at` datetime DEFAULT NULL,
  `review_note` varchar(255) DEFAULT NULL,
  `verify_result` enum('verified','needs_review','unavailable') DEFAULT NULL,
  `verify_note` varchar(255) DEFAULT NULL,
  `auto_paid` tinyint(1) NOT NULL DEFAULT 0,
  `paid_at` datetime DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fine`
--

INSERT INTO `fine` (`fine_id`, `fine_code`, `emp_id`, `detail_id`, `fine_type`, `amount`, `reason`, `status`, `slip_file`, `slip_hash`, `slip_trans_ref`, `slip_uploaded_at`, `review_note`, `verify_result`, `verify_note`, `auto_paid`, `paid_at`, `reviewed_by`, `created_by`, `created_at`) VALUES
(1, 'FN-20261010-8167', 5, 8, 'late', 100.00, 'ล่าช้า 1 วัน', 'paid', 'slip-1-1791641402716-511497521.png', 'fc6c54ba7b93436478ab375dead6bd1896c24695567fb2a9602a7306cf8f690e', NULL, '2026-10-10 21:10:02', NULL, NULL, NULL, 0, '2026-10-10 21:10:30', 1, 1, '2026-10-10 03:27:27'),
(2, 'FN-20261010-7238', 5, 11, 'damaged', 100.00, 'ทรัพย์สินชำรุด/เสียหาย', 'paid', 'slip-2-1791641410368-55819345.jpg', '4c0452025b6dad7518837389e077c6d1da84660e2bf5c67c09b652bcec9a1382', NULL, '2026-10-10 21:10:10', NULL, NULL, NULL, 0, '2026-10-10 21:10:24', 1, 1, '2026-10-10 03:28:40'),
(3, 'FN-20261010-8687', 5, 10, 'damaged', 110.00, 'ทรัพย์สินชำรุด/เสียหาย', 'paid', 'slip-3-1791641252453-531090658.jpg', 'd1f799c45485e8f174657adf5e75c2f0a2c0efaa3c35f04698986f2f65ae775e', NULL, '2026-10-10 21:07:32', NULL, NULL, NULL, 0, '2026-10-10 21:07:43', 1, 1, '2026-10-10 03:29:18'),
(4, 'FN-20261011-3388', 13, 12, 'damaged', 100.00, 'ทรัพย์สินชำรุด/เสียหาย', 'paid', 'slip-4-1791723386870-576117227.jpeg', 'ef8238ae9c10985f7538f662af9817e0084960dce12d645706385ed3ca0e54a8', NULL, '2026-10-11 19:56:26', NULL, NULL, NULL, 0, '2026-10-11 19:57:18', 1, 1, '2026-10-11 19:55:52'),
(5, 'FN-20261018-7137', 5, NULL, 'damaged', 150.00, 'จอแตก', 'paid', 'slip-5-1792317302795-985021685.jpg', 'f3e2b4cfe3d21c7bbe48caa9ee47508ff12a2dced696ce56510276656da4262a', NULL, '2026-10-18 16:55:02', NULL, NULL, NULL, 0, '2026-10-18 17:01:43', 1, 1, '2026-10-18 16:54:15'),
(6, 'FN-20261018-9875', 5, NULL, 'damaged', 200.00, 'test', 'paid', 'slip-6-1792317736331-400954013.png', '5e18f89ec4e35b2718643cd00d9f4766ca07061d2a94a5867eac4e6d2a2e25f2', 'MOCK527C86AD99333E17C296', '2026-10-18 17:02:16', NULL, 'verified', 'ตรวจอัตโนมัติผ่าน: ยอด 200.00 บาท ตรงกัน อ้างอิง MOCK527C86AD99333E17C296', 1, '2026-10-18 17:02:16', NULL, 1, '2026-10-18 17:02:02'),
(7, 'FN-20261018-1405', 5, 15, 'late', 100.00, 'ส่งคืนล่าช้า 1 วัน (วันละ 100 บาท)', 'paid', 'slip-7-1792318311460-233482108.png', '030481e5eb9f6671740ab7dcb48fd8ecdd6069a570b229b524ce461bebd2b1f6', 'MOCK069AD0FC6FDBB176FFB1', '2026-10-18 17:11:51', NULL, 'verified', 'ตรวจอัตโนมัติผ่าน: ยอด 100.00 บาท ตรงกัน อ้างอิง MOCK069AD0FC6FDBB176FFB1', 1, '2026-10-18 17:11:51', NULL, 1, '2026-10-18 17:11:30'),
(8, 'FN-20261018-2139', 5, NULL, 'late', 100.00, 'test', 'paid', 'slip-8-1792318390079-657270968.png', '8e6c99933da50e5bba686c460507d3d40bc159bc7867faa954e9d4026e80d1e2', 'MOCK72D09BBBACF885FD06B6', '2026-10-18 17:13:10', NULL, 'verified', 'ตรวจอัตโนมัติผ่าน: ยอด 100.00 บาท ตรงกัน อ้างอิง MOCK72D09BBBACF885FD06B6', 1, '2026-10-18 17:13:10', NULL, 1, '2026-10-18 17:12:57'),
(9, 'FN-20261018-5832', 5, NULL, 'late', 100.00, 'test2', 'paid', 'slip-9-1792318586158-198417610.png', '450bec81e6e3f346fb615f2a1b7e3530e7bf85e7267035cbcdc40cb0073b5ef9', 'MOCK95A30D3F36BF56463AF6', '2026-10-18 17:16:26', NULL, 'verified', 'ตรวจอัตโนมัติผ่าน: ยอด 100.00 บาท ตรงกัน อ้างอิง MOCK95A30D3F36BF56463AF6', 1, '2026-10-18 17:16:26', NULL, 1, '2026-10-18 17:14:04');

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

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`notif_id`, `emp_id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`) VALUES
(1, 5, 'fine_created', 'ตรวจพบ: ส่งคืนล่าช้า', 'ล่าช้า 1 วัน — ค่าปรับ 100.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-10 03:27:27'),
(2, 5, 'fine_created', 'ตรวจพบ: ทรัพย์สินชำรุด/เสียหาย', 'ทรัพย์สินชำรุด/เสียหาย — ค่าปรับ 100.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-10 03:28:40'),
(3, 5, 'fine_created', 'ตรวจพบ: ทรัพย์สินชำรุด/เสียหาย', 'ทรัพย์สินชำรุด/เสียหาย — ค่าปรับ 110.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-10 03:29:18'),
(4, 1, 'slip_submitted', 'มีสลิปค่าปรับรอตรวจสอบ', 'Teerapat poom ส่งสลิปค่าปรับ FN-20261010-8687 จำนวน 110.00 บาท', '/admin/fines', 1, '2026-10-10 21:07:32'),
(5, 5, 'fine_paid', 'ยืนยันการชำระค่าปรับแล้ว', 'ค่าปรับ FN-20261010-8687 จำนวน 110.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-10 21:07:43'),
(6, 1, 'slip_submitted', 'มีสลิปค่าปรับรอตรวจสอบ', 'Teerapat poom ส่งสลิปค่าปรับ FN-20261010-8167 จำนวน 100.00 บาท', '/admin/fines', 1, '2026-10-10 21:10:02'),
(7, 1, 'slip_submitted', 'มีสลิปค่าปรับรอตรวจสอบ', 'Teerapat poom ส่งสลิปค่าปรับ FN-20261010-7238 จำนวน 100.00 บาท', '/admin/fines', 1, '2026-10-10 21:10:10'),
(8, 5, 'fine_paid', 'ยืนยันการชำระค่าปรับแล้ว', 'ค่าปรับ FN-20261010-7238 จำนวน 100.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-10 21:10:24'),
(9, 5, 'fine_paid', 'ยืนยันการชำระค่าปรับแล้ว', 'ค่าปรับ FN-20261010-8167 จำนวน 100.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-10 21:10:30'),
(10, 13, 'fine_created', 'ตรวจพบ: ทรัพย์สินชำรุด/เสียหาย', 'ทรัพย์สินชำรุด/เสียหาย — ค่าปรับ 100.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-11 19:55:52'),
(11, 1, 'slip_submitted', 'มีสลิปค่าปรับรอตรวจสอบ', 'weeradon weeradon ส่งสลิปค่าปรับ FN-20261011-3388 จำนวน 100.00 บาท', '/admin/fines', 1, '2026-10-11 19:56:26'),
(12, 13, 'fine_paid', 'ยืนยันการชำระค่าปรับแล้ว', 'ค่าปรับ FN-20261011-3388 จำนวน 100.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-11 19:57:18'),
(13, 5, 'fine_created', 'ตรวจพบ: ทรัพย์สินชำรุด/เสียหาย', 'จอแตก — ค่าปรับ 150.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-18 16:54:15'),
(14, 1, 'slip_submitted', 'มีสลิปค่าปรับรอตรวจสอบ', 'Teerapat poom ส่งสลิปค่าปรับ FN-20261018-7137 จำนวน 150.00 บาท', '/admin/fines', 1, '2026-10-18 16:55:02'),
(15, 5, 'fine_paid', 'ยืนยันการชำระค่าปรับแล้ว', 'ค่าปรับ FN-20261018-7137 จำนวน 150.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-18 17:01:43'),
(16, 5, 'fine_created', 'ตรวจพบ: ทรัพย์สินชำรุด/เสียหาย', 'test — ค่าปรับ 200.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-18 17:02:02'),
(17, 5, 'fine_paid', 'ชำระค่าปรับเรียบร้อย (ตรวจสอบอัตโนมัติ)', 'ค่าปรับ FN-20261018-9875 จำนวน 200.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-18 17:02:16'),
(18, 1, 'fine_paid', 'พนักงานชำระค่าปรับแล้ว (ตรวจสลิปอัตโนมัติ)', 'Teerapat poom ชำระค่าปรับ FN-20261018-9875 จำนวน 200.00 บาท', '/admin/fines', 1, '2026-10-18 17:02:16'),
(19, 5, 'fine_created', 'ตรวจพบ: ส่งคืนล่าช้า', 'ส่งคืนล่าช้า 1 วัน (วันละ 100 บาท) — ค่าปรับ 100.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-18 17:11:30'),
(20, 5, 'fine_paid', 'ชำระค่าปรับเรียบร้อย (ตรวจสอบอัตโนมัติ)', 'ค่าปรับ FN-20261018-1405 จำนวน 100.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-18 17:11:51'),
(21, 1, 'fine_paid', 'พนักงานชำระค่าปรับแล้ว (ตรวจสลิปอัตโนมัติ)', 'Teerapat poom ชำระค่าปรับ FN-20261018-1405 จำนวน 100.00 บาท', '/admin/fines', 1, '2026-10-18 17:11:51'),
(22, 5, 'fine_created', 'ตรวจพบ: ส่งคืนล่าช้า', 'test — ค่าปรับ 100.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-18 17:12:57'),
(23, 5, 'fine_paid', 'ชำระค่าปรับเรียบร้อย (ตรวจสอบอัตโนมัติ)', 'ค่าปรับ FN-20261018-2139 จำนวน 100.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 1, '2026-10-18 17:13:10'),
(24, 1, 'fine_paid', 'พนักงานชำระค่าปรับแล้ว (ตรวจสลิปอัตโนมัติ)', 'Teerapat poom ชำระค่าปรับ FN-20261018-2139 จำนวน 100.00 บาท', '/admin/fines', 1, '2026-10-18 17:13:10'),
(25, 5, 'fine_created', 'ตรวจพบ: ส่งคืนล่าช้า', 'test2 — ค่าปรับ 100.00 บาท กรุณาชำระผ่าน QR แล้วแนบสลิป', '/my-fines', 1, '2026-10-18 17:14:04'),
(26, 1, 'slip_submitted', 'มีสลิปค่าปรับรอตรวจสอบ', 'Teerapat poom ส่งสลิปค่าปรับ FN-20261018-5832 จำนวน 100.00 บาท — ตรวจอัตโนมัติไม่ได้ (จำลองบริการตรวจสลิปล่ม (mock)) กรุณาตรวจสลิปเอง', '/admin/fines', 1, '2026-10-18 17:15:16'),
(27, 5, 'fine_rejected', 'สลิปไม่ผ่านการตรวจสอบ', 'ค่าปรับ FN-20261018-5832: d — กรุณาแนบสลิปใหม่', '/my-fines', 0, '2026-10-18 17:15:40'),
(28, 5, 'fine_paid', 'ชำระค่าปรับเรียบร้อย (ตรวจสอบอัตโนมัติ)', 'ค่าปรับ FN-20261018-5832 จำนวน 100.00 บาท ชำระเรียบร้อย ขอบคุณครับ', '/my-fines', 0, '2026-10-18 17:16:26'),
(29, 1, 'fine_paid', 'พนักงานชำระค่าปรับแล้ว (ตรวจสลิปอัตโนมัติ)', 'Teerapat poom ชำระค่าปรับ FN-20261018-5832 จำนวน 100.00 บาท', '/admin/fines', 1, '2026-10-18 17:16:26');

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
-- Dumping data for table `return_record`
--

INSERT INTO `return_record` (`return_id`, `return_date`, `condition_in`, `fine_amount`, `return_note`, `detail_id`, `received_by`) VALUES
(1, '2026-10-01 20:37:44', NULL, 0.00, NULL, 1, 1),
(2, '2026-10-01 20:37:45', NULL, 0.00, NULL, 2, 1),
(3, '2026-10-06 11:00:34', 'ปกติ', 0.00, NULL, 3, 1),
(4, '2026-10-06 11:27:08', 'เกินกำหนด 1 วัน', 100.00, NULL, 4, 1),
(5, '2026-10-06 12:20:33', 'ปกติ', 0.00, NULL, 6, 1),
(6, '2026-10-06 12:20:33', 'ปกติ', 0.00, NULL, 7, 1),
(7, '2026-10-06 12:20:34', 'ปกติ', 0.00, NULL, 5, 1),
(8, '2026-10-10 03:27:27', 'ปกติ', 0.00, NULL, 9, 1),
(9, '2026-10-10 03:27:27', NULL, 100.00, NULL, 8, 1),
(10, '2026-10-10 03:28:40', 'แตก', 100.00, NULL, 11, 1),
(11, '2026-10-10 03:29:18', 'แตก', 110.00, NULL, 10, 1),
(12, '2026-10-11 19:55:52', 'จอแตก', 100.00, NULL, 12, 1),
(13, '2026-10-11 19:55:56', 'ปกติ', 0.00, NULL, 13, 1),
(14, '2026-10-18 17:11:16', 'ปกติ', 0.00, NULL, 14, 1),
(15, '2026-10-18 17:11:30', 'คืนล่าช้า', 100.00, NULL, 15, 1);

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
  ADD UNIQUE KEY `uq_fine_slip_trans_ref` (`slip_trans_ref`),
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
  MODIFY `asset_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `asset_category`
--
ALTER TABLE `asset_category`
  MODIFY `cat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `borrow_detail`
--
ALTER TABLE `borrow_detail`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `borrow_request`
--
ALTER TABLE `borrow_request`
  MODIFY `borrow_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `dept_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `emp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `fine`
--
ALTER TABLE `fine`
  MODIFY `fine_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `notif_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `repair`
--
ALTER TABLE `repair`
  MODIFY `repair_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `return_record`
--
ALTER TABLE `return_record`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
