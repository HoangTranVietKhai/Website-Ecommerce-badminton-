// ===== File: server/routes/dashboardRoutes.js =====
const express = require('express');
const asyncHandler = require('express-async-handler');
const sql = require('mssql');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Lấy các số liệu thống kê cho admin dashboard
// @route   GET /api/dashboard/stats
// @access  Private/Admin
router.get('/stats', protect, admin, asyncHandler(async (req, res) => {
    
    // Dùng Promise.all để chạy các câu query song song cho hiệu quả
    const [userResult, productResult, orderResult, salesResult] = await Promise.all([
        pool.request().query('SELECT COUNT(*) as total FROM Users WHERE IsDeleted = 0'),
        pool.request().query('SELECT COUNT(*) as total FROM Products WHERE IsDeleted = 0'),
        pool.request().query('SELECT COUNT(*) as total FROM Orders'),
        pool.request().query('SELECT SUM(TotalPrice) as total FROM Orders WHERE IsPaid = 1'),
    ]);

    const totalUsers = userResult.recordset[0].total;
    const totalProducts = productResult.recordset[0].total;
    const totalOrders = orderResult.recordset[0].total;
    const totalSales = salesResult.recordset[0].total || 0; // Nếu chưa có đơn hàng nào, SUM sẽ là NULL

    res.json({
        totalUsers,
        totalProducts,
        totalOrders,
        totalSales: parseFloat(totalSales)
    });
}));

module.exports = router;