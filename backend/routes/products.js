const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// 6.4 Public product listing — used by the shop page. Supports ?q= search and ?category=
router.get('/', async (req, res) => {
  try {
    const { q, category } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบสินค้า' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// 6.3 Admin-only: Insert
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อสินค้าและราคา' });
    }
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, price, stock || 0, category || null, image_url || null]
    );
    res.status(201).json({ id: result.insertId, message: 'เพิ่มสินค้าสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// 6.3 Admin-only: Update
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    const [result] = await pool.query(
      `UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image_url=?
       WHERE id=?`,
      [name, description, price, stock, category, image_url, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบสินค้า' });
    res.json({ message: 'แก้ไขสินค้าสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// 6.3 Admin-only: Delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบสินค้า' });
    res.json({ message: 'ลบสินค้าสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;
