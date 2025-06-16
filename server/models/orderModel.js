// ===== server/models/orderModel.js =====
const mongoose = require('mongoose');

// Định nghĩa schema cho mỗi sản phẩm trong đơn hàng
const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product', // Tham chiếu đến Product Model
    },
});

// Định nghĩa schema cho địa chỉ giao hàng
const shippingAddressSchema = new mongoose.Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Tham chiếu đến User Model
        },
        orderItems: [orderItemSchema], // Mảng các sản phẩm trong đơn hàng
        shippingAddress: shippingAddressSchema, // Địa chỉ giao hàng

        paymentMethod: {
            type: String,
            required: true,
        },
        paymentResult: { // Thông tin kết quả thanh toán từ cổng thanh toán (nếu có)
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
    },
    {
        timestamps: true, // Tự động thêm createdAt và updatedAt
    }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;