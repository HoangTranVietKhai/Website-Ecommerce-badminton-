// ===== server/routes/orderRoutes.js (PHIÊN BẢN HOÀN THIỆN) =====
const express = require('express');
const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel.js');
const Product = require('../models/productModel.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// ... (Route POST /, GET /myorders, GET /:id giữ nguyên) ...
router.post('/', protect, asyncHandler(async (req, res) => { /* ... Giữ nguyên ... */ }));
router.get('/myorders', protect, asyncHandler(async (req, res) => { /* ... Giữ nguyên ... */ }));
router.get('/:id', protect, asyncHandler(async (req, res) => { /* ... Giữ nguyên ... */ }));
router.get('/', protect, admin, asyncHandler(async (req, res) => { /* ... Giữ nguyên ... */ }));
router.put('/:id/deliver', protect, admin, asyncHandler(async (req, res) => { /* ... Giữ nguyên ... */ }));


// @desc    Cập nhật đơn hàng thành đã thanh toán
// @route   PUT /api/orders/:id/pay
// @access  Private
router.put(
    '/:id/pay',
    protect,
    asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = { // Lưu thông tin từ PayPal
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.payer.email_address,
            };
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    })
);

module.exports = router;