// ===== File: server/routes/newsletterRoutes.js (FILE MỚI) =====
const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const sql = require('mssql');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Đăng ký nhận bản tin
// @route   POST /api/newsletter/subscribe
// @access  Public
router.post(
    '/subscribe',
    [
        // Validate email đầu vào
        body('email', 'Vui lòng nhập một địa chỉ email hợp lệ.').isEmail().normalizeEmail(),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400);
            throw new Error(errors.array()[0].msg);
        }

        const { email } = req.body;

        // 1. Kiểm tra xem email đã tồn tại chưa
        const existingSubscriber = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT Id FROM Subscribers WHERE Email = @Email');

        if (existingSubscriber.recordset.length > 0) {
            // Nếu đã tồn tại, chỉ cần trả về thông báo thành công mà không cần báo lỗi
            // để tránh lộ thông tin và mang lại trải nghiệm tốt.
            return res.status(200).json({ message: 'Cảm ơn bạn đã quan tâm đến SportStore!' });
        }

        // 2. Nếu chưa tồn tại, thêm email mới vào database
        await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('INSERT INTO Subscribers (Email) VALUES (@Email)');

        console.log(`[Newsletter] New subscriber: ${email}`);
        res.status(201).json({ message: 'Đăng ký nhận tin thành công! Cảm ơn bạn.' });
    })
);

module.exports = router;