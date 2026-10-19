
const path = require('path');
const fs = require('fs');
const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

const LOGO_PATH = path.join(__dirname, '../assets/logo-company.png');
const FONT_REGULAR = path.join(__dirname, '../fonts/Sarabun-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '../fonts/Sarabun-Bold.ttf');

const REPORTS = {
  monthly: {
    title: 'รายงานรายการยืมทรัพย์สินประจำเดือน',
    sql: `
      SELECT
        br.borrow_code AS 'รหัสการยืม',
        br.request_date AS 'วันที่ยืม',
        br.due_date AS 'วันครบกำหนด',
        br.status AS 'สถานะ'
      FROM borrow_request br
      WHERE MONTH(br.request_date) = ?
        AND YEAR(br.request_date) = ?
      ORDER BY br.request_date DESC
    `,
    params: req => [Number(req.query.month), Number(req.query.year)]
  },

  popular: {
    title: 'รายงานทรัพย์สินที่ถูกยืมบ่อย',
    sql: `
      SELECT
        a.asset_code AS 'รหัสทรัพย์สิน',
        a.asset_name AS 'ชื่อทรัพย์สิน',
        COUNT(DISTINCT bd.borrow_id) AS 'จำนวนครั้งที่ยืม'
      FROM borrow_detail bd
      JOIN asset a ON a.asset_id = bd.asset_id
      JOIN borrow_request br ON br.borrow_id = bd.borrow_id
      WHERE br.status <> 'cancelled'
      GROUP BY a.asset_id, a.asset_code, a.asset_name
      ORDER BY COUNT(DISTINCT bd.borrow_id) DESC
      LIMIT 100
    `,
    params: () => []
  },

  fines: {
    title: 'รายงานค่าปรับที่จัดเก็บได้',
    sql: `
      SELECT
        fine_id AS 'รหัสค่าปรับ',
        fine_code AS 'เลขที่ค่าปรับ',
        amount AS 'จำนวนเงิน',
        paid_at AS 'วันที่ชำระ',
        status AS 'สถานะ'
      FROM fine
      WHERE status = 'paid'
        AND paid_at IS NOT NULL
        AND MONTH(paid_at) = ?
        AND YEAR(paid_at) = ?
      ORDER BY paid_at DESC
    `,
    params: req => [Number(req.query.month), Number(req.query.year)]
  },

  overdue: {
    title: 'รายงานรายการค้างคืน',
    sql: `
      SELECT
        br.borrow_code AS 'รหัสการยืม',
        br.due_date AS 'วันครบกำหนด',
        DATEDIFF(CURDATE(), br.due_date) AS 'จำนวนวันที่เกินกำหนด',
        br.status AS 'สถานะ'
      FROM borrow_request br
      WHERE br.due_date < CURDATE()
        AND br.status = 'approved'
      ORDER BY br.due_date ASC
    `,
    params: () => []
  }
};

async function getRows(type, req) {
  const config = REPORTS[type];

  if (!config) {
    const error = new Error('ไม่พบประเภทรายงาน');
    error.status = 400;
    throw error;
  }

  if (['monthly', 'fines'].includes(type)) {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (
      !Number.isInteger(month) ||
      month < 1 || month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 || year > 2200
    ) {
      const error = new Error('กรุณาระบุเดือนและปีให้ถูกต้อง');
      error.status = 400;
      throw error;
    }
  }

  const [rows] = await pool.query(config.sql, config.params(req));
  return rows;
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';

  if (value instanceof Date) {
    return value.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok'
    });
  }

  return String(value);
}

function drawReportHeader(doc, title, type, month, year) {
  const left = 42;
  const width = doc.page.width - 84;
  const right = left + width;

  doc.save();
  doc.roundedRect(left, 35, width, 88, 8).fill('#17365D');

  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, left + 12, 48, {
      fit: [60, 60],
      align: 'center',
      valign: 'center'
    });
  }

  doc.font('Sarabun-Bold')
    .fontSize(17)
    .fillColor('#FFFFFF')
    .text('THAIASSET', left + 84, 47);

  doc.font('Sarabun-Regular')
    .fontSize(9)
    .fillColor('#DCE6F1')
    .text('ASSET MANAGEMENT SYSTEM', left + 84, 71);

  doc.font('Sarabun-Regular')
    .fontSize(10)
    .fillColor('#FFFFFF')
    .text(title, left + 84, 91, {
      width: width - 100,
      height: 20,
      ellipsis: true
    });

  doc.restore();

  const period = ['monthly', 'fines'].includes(type)
    ? `รอบรายงาน: ${String(month).padStart(2, '0')}/${year}`
    : 'รายงานข้อมูล ณ วันที่ออกรายงาน';

  doc.font('Sarabun-Regular')
    .fontSize(9)
    .fillColor('#475569')
    .text(period, left, 135);

  doc.text(
    `วันที่จัดทำ: ${new Date().toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })}`,
    left,
    151
  );

  doc.moveTo(left, 170)
    .lineTo(right, 170)
    .lineWidth(0.7)
    .strokeColor('#CBD5E1')
    .stroke();

  return { left, right, width, y: 184 };
}

function drawFooter(doc, pageNumber, totalPages) {
  const left = 42;
  const right = doc.page.width - 42;
  const y = doc.page.height - 38;

  doc.save();

  doc.moveTo(left, y - 9)
    .lineTo(right, y - 9)
    .lineWidth(0.5)
    .strokeColor('#CBD5E1')
    .stroke();

  doc.font('Sarabun-Regular')
    .fontSize(8)
    .fillColor('#64748B')
    .text('เอกสารภายในองค์กร | THAIASSET', left, y);

  doc.text(`หน้า ${pageNumber} / ${totalPages}`, left, y, {
    width: right - left,
    align: 'right'
  });

  doc.restore();
}

// อ่านรายงาน
router.get('/:type', async (req, res) => {
  try {
    const rows = await getRows(req.params.type, req);

    res.json({
      title: REPORTS[req.params.type].title,
      rows
    });
  } catch (err) {
    console.error('Reports API error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'โหลดรายงานไม่สำเร็จ'
    });
  }
});

// ส่งออก Excel
router.get('/:type/excel', async (req, res) => {
  try {
    const rows = await getRows(req.params.type, req);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('รายงาน');

    sheet.columns = rows.length
      ? Object.keys(rows[0]).map(key => ({
        header: key,
        key,
        width: 24
      }))
      : [{ header: 'ผลรายงาน', key: 'message', width: 30 }];

    if (rows.length) {
      sheet.addRows(rows);
    } else {
      sheet.addRow({ message: 'ไม่พบข้อมูล' });
    }

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF17365D' }
    };

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${req.params.type}-report.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err);

    if (!res.headersSent) {
      res.status(err.status || 500).json({
        message: err.message || 'ส่งออก Excel ไม่สำเร็จ'
      });
    }
  }
});

// ส่งออก PDF แบบเอกสารบริษัท
router.get('/:type/pdf', async (req, res) => {
  try {
    const type = req.params.type;
    const rows = await getRows(type, req);

    if (!fs.existsSync(FONT_REGULAR) || !fs.existsSync(FONT_BOLD)) {
      throw new Error(
        'ไม่พบฟอนต์ Sarabun กรุณาวางไฟล์ใน backend/fonts'
      );
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 55, left: 42, right: 42 },
      bufferPages: true,
      autoFirstPage: false
    });

    doc.registerFont('Sarabun-Regular', FONT_REGULAR);
    doc.registerFont('Sarabun-Bold', FONT_BOLD);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-report.pdf"`
    );

    doc.pipe(res);

    const columns = rows.length
      ? Object.keys(rows[0])
      : ['ผลรายงาน'];

    const newPage = () => {
      doc.addPage();

      const header = drawReportHeader(
        doc,
        REPORTS[type].title,
        type,
        req.query.month,
        req.query.year
      );

      return {
        ...header,
        columns,
        colWidths: columns.map(() => header.width / columns.length)
      };
    };

    const drawTableHeader = page => {
      const height = 30;

      doc.rect(page.left, page.y, page.width, height).fill('#E8EEF5');

      let x = page.left;

      columns.forEach((column, i) => {
        doc.font('Sarabun-Bold')
          .fontSize(9)
          .fillColor('#17365D')
          .text(String(column), x + 5, page.y + 8, {
            width: page.colWidths[i] - 10,
            height: height - 8
          });

        x += page.colWidths[i];
      });

      page.y += height;
    };

    let page = newPage();
    drawTableHeader(page);

    if (!rows.length) {
      doc.font('Sarabun-Regular')
        .fontSize(10)
        .fillColor('#475569')
        .text('ไม่พบข้อมูลในเงื่อนไขที่เลือก', page.left, page.y + 10);
    } else {
      for (let index = 0; index < rows.length; index++) {
        const values = columns.map(key => formatValue(rows[index][key]));
        const padding = 6;

        doc.font('Sarabun-Regular').fontSize(8.5);

        const heights = values.map((value, i) =>
          doc.heightOfString(value, {
            width: page.colWidths[i] - padding * 2
          }) + padding * 2
        );

        const rowHeight = Math.max(27, ...heights);

        if (page.y + rowHeight > doc.page.height - 58) {
          page = newPage();
          drawTableHeader(page);
        }

        if (index % 2 === 1) {
          doc.rect(page.left, page.y, page.width, rowHeight)
            .fill('#F8FAFC');
        }

        let x = page.left;

        values.forEach((value, i) => {
          doc.font('Sarabun-Regular')
            .fontSize(8.5)
            .fillColor('#1E293B')
            .text(value, x + padding, page.y + padding, {
              width: page.colWidths[i] - padding * 2
            });

          x += page.colWidths[i];
        });

        doc.moveTo(page.left, page.y + rowHeight)
          .lineTo(page.right, page.y + rowHeight)
          .lineWidth(0.4)
          .strokeColor('#D9E2EC')
          .stroke();

        page.y += rowHeight;
      }
    }

    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      drawFooter(doc, i + 1, range.count);
    }

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);

    if (!res.headersSent) {
      res.status(err.status || 500).json({
        message: err.message || 'ส่งออก PDF ไม่สำเร็จ'
      });
    }
  }
});

module.exports = router;
