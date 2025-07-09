// ===== File: server/routes/trackingRoutes.js (FILE MỚI) =====
const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const sql = require('mssql');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Tra cứu thông tin đơn hàng
// @route   POST /api/tracking
// @access  Public
router.post(
    '/',
    [
        // Validate dữ liệu đầu vào
        body('orderId', 'Mã đơn hàng không hợp lệ.').not().isEmpty().isNumeric(),
        body('email', 'Email không hợp lệ.').isEmail().normalizeEmail()
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400);
            throw new Error(errors.array()[0].msg);
        }

        const { orderId, email } = req.body;

        // Truy vấn để lấy đơn hàng và thông tin các sản phẩm đi kèm
        const result = await pool.request()
            .input('OrderId', sql.Int, orderId)
            .input('Email', sql.NVarChar, email)
            .query(`
                SELECT 
                    o.Id as id, o.CreatedAt as createdAt, o.UpdatedAt as updatedAt,
                    o.IsPaid as isPaid, o.PaidAt as paidAt, o.IsDelivered as isDelivered, o.DeliveredAt as deliveredAt,
                    o.TotalPrice as totalPrice, o.ShippingPrice as shippingPrice,
                    o.ShippingAddress as shippingAddress, o.City as city, o.PostalCode as postalCode, o.Country as country,
                    o.PaymentMethod as paymentMethod,
                    u.Name as userName, u.Email as userEmail,
                    oi.Id as orderItemId, oi.ProductId as productId, oi.Name as productName, 
                    oi.Quantity as quantity, oi.Price as itemPrice, oi.Image as image, oi.StringingInfo as stringingInfo
                FROM Orders o
                JOIN Users u ON o.UserId = u.Id
                LEFT JOIN OrderItems oi ON o.Id = oi.OrderId
                WHERE o.Id = @OrderId AND u.Email = @Email
            `);
        
        if (result.recordset.length === 0) {
            res.status(404);
            throw new Error('Không tìm thấy đơn hàng với thông tin đã cung cấp. Vui lòng kiểm tra lại.');
        }

        // Gom nhóm dữ liệu lại thành một object Order duy nhất
        const firstRow = result.recordset[0];
        const order = {
            id: firstRow.id,
            createdAt: firstRow.createdAt,
            updatedAt: firstRow.updatedAt,
            isPaid: firstRow.isPaid,
            paidAt: firstRow.paidAt,
            isDelivered: firstRow.isDelivered,
            deliveredAt: firstRow.deliveredAt,
            totalPrice: firstRow.totalPrice,
            shippingPrice: firstRow.shippingPrice,
            shippingAddress: firstRow.shippingAddress,
            city: firstRow.city,
            postalCode: firstRow.postalCode,
            country: firstRow.country,
            paymentMethod: firstRow.paymentMethod,
            userName: firstRow.userName,
            userEmail: firstRow.userEmail,
            orderItems: result.recordset
                .filter(row => row.orderItemId) // Chỉ lấy những dòng có item
                .map(row => ({
                    id: row.orderItemId,
                    productId: row.productId,
                    name: row.productName,
                    quantity: row.quantity,
                    price: row.itemPrice,
                    image: row.image,
                    stringingInfo: row.stringingInfo ? JSON.parse(row.stringingInfo) : null
                }))
        };

        res.json(order);
    })
);

module.exports = router;