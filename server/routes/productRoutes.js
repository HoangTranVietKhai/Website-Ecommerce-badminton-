// ===== server/routes/productRoutes.js =====
const express = require('express');
const Product = require('../models/productModel.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Lấy tất cả sản phẩm (Public)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy một sản phẩm theo ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) { res.json(product); } 
        else { res.status(404).json({ message: 'Không tìm thấy sản phẩm' }); }
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// --- CÁC ROUTE CỦA ADMIN ---

// Tạo một sản phẩm mới (Private/Admin)
router.post('/', protect, admin, async (req, res) => {
    const product = new Product({
        name: 'Sản phẩm mẫu',
        price: 0,
        image: '/images/sample.jpg',
        brand: 'Thương hiệu mẫu',
        mainCategory: 'Loại mẫu',
        description: 'Mô tả mẫu',
    });
    try {
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: 'Tạo sản phẩm thất bại', error });
    }
});

// Cập nhật một sản phẩm (Private/Admin)
router.put('/:id', protect, admin, async (req, res) => {
    const { name, price, image, brand, mainCategory, description, isPromotional } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = name || product.name;
            product.price = price === undefined ? product.price : price;
            product.image = image || product.image;
            product.brand = brand || product.brand;
            product.mainCategory = mainCategory || product.mainCategory;
            product.description = description || product.description;
            product.isPromotional = isPromotional === undefined ? product.isPromotional : isPromotional;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Cập nhật thất bại', error });
    }
});

// Xóa một sản phẩm (Private/Admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Sản phẩm đã được xóa' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Xóa thất bại', error });
    }
});

module.exports = router;