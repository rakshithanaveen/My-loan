import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../utils/database.js';

const router = express.Router();

// Add Payment
router.post('/', async (req, res) => {
  try {
    const { loan_id, amount, payment_date, month, notes } = req.body;
    const userId = req.user.id;

    if (!loan_id || !amount || !payment_date || !month) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify loan ownership
    const loan = await dbGet('SELECT * FROM loans WHERE id = ? AND user_id = ?', [loan_id, userId]);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const paymentId = uuidv4();
    await dbRun(
      `INSERT INTO payments (id, loan_id, user_id, amount, payment_date, month, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'paid', ?)`,
      [paymentId, loan_id, userId, amount, payment_date, month, notes || '']
    );

    res.status(201).json({
      message: 'Payment recorded successfully',
      id: paymentId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Payments for Loan
router.get('/loan/:loan_id', async (req, res) => {
  try {
    const { loan_id } = req.params;
    const userId = req.user.id;

    // Verify loan ownership
    const loan = await dbGet('SELECT * FROM loans WHERE id = ? AND user_id = ?', [loan_id, userId]);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const payments = await dbAll(
      'SELECT * FROM payments WHERE loan_id = ? AND is_deleted = 0 ORDER BY payment_date DESC',
      [loan_id]
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All User Payments
router.get('/', async (req, res) => {
  try {
    const payments = await dbAll(
      'SELECT p.*, l.borrower_name FROM payments p LEFT JOIN loans l ON p.loan_id = l.id WHERE p.user_id = ? AND p.is_deleted = 0 ORDER BY p.payment_date DESC',
      [req.user.id]
    );
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Payment
router.put('/:id', async (req, res) => {
  try {
    const { amount, payment_date, status, notes } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await dbGet('SELECT * FROM payments WHERE id = ? AND user_id = ?', [id, userId]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await dbRun(
      'UPDATE payments SET amount = ?, payment_date = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [amount || payment.amount, payment_date || payment.payment_date, status || payment.status, notes || payment.notes, id]
    );

    res.json({ message: 'Payment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Payment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await dbGet('SELECT * FROM payments WHERE id = ? AND user_id = ?', [id, userId]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Soft delete
    await dbRun('UPDATE payments SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await dbGet(`
      SELECT
        COUNT(*) as total_payments,
        SUM(amount) as total_collected,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM payments
      WHERE user_id = ? AND is_deleted = 0
    `, [userId]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
