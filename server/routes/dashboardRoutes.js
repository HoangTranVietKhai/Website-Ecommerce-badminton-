// ===== server/routes/dashboardRoutes.js (FILE MỚI) =====
const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel.js');
const User = require('../models/userModel.js');
const Product = require('../models/productModel.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

// @desc    Lấy các số liệu thống kê cho admin dashboard
// @route   GET /api/dashboard/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalPrice' }
                }
            }
        ]);
        
        const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

        res.json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalSales
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
});

module.exports = router;