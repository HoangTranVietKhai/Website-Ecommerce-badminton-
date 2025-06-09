// ===== server/models/productModel.js =====
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    brand: { type: String },
    mainCategory: { type: String },
    description: { type: String },
    fullDescription: { type: String },
    isPromotional: { type: Boolean, default: false },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;