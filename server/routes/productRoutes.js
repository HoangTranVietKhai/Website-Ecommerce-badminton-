const express = require('express');
const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// @desc    Lấy tất cả sản phẩm VỚI BỘ LỌC NÂNG CAO
// @route   GET /api/products
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    const { keyword, brand, minPrice, maxPrice, mainCategory, subCategory } = req.query;

    let query = {};
    const hasActiveFilters =
        keyword ||
        (brand && brand !== 'all') ||
        mainCategory ||
        subCategory ||
        (minPrice !== undefined && maxPrice !== undefined);

    if (hasActiveFilters) {
        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }
        if (brand && brand !== 'all') {
            query.brand = brand;
        }
        if (mainCategory) {
            query.mainCategory = mainCategory;
        }
        if (subCategory) {
            query.subCategory = subCategory;
        }
        if (minPrice !== undefined && maxPrice !== undefined) {
            query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
        }
    } else {
        query = { isPromotional: true };
    }

    const products = await Product.find(query);

    const count = products.length;

    // QUAN TRỌNG: API NÀY LUÔN TRẢ VỀ OBJECT, KHÔNG PHẢI MẢNG
    res.json({ products, count });
}));


// @desc    Lấy một sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
// ===== PHẦN BỊ THIẾU CỦA BẠN NẰM Ở ĐÂY =====
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404);
            throw new Error('Sản phẩm không tồn tại');
        }
    } catch (error) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại hoặc ID không hợp lệ');
    }
}));


// --- ADMIN ROUTES ---
// @desc    Tạo một sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    // Logic tạo sản phẩm
    const product = new Product({
        name: 'Tên Mẫu',
        price: 0,
        originalPrice: 0,
        user: req.user._id,
        image: '/images/sample.jpg',
        brand: 'Thương Hiệu Mẫu',
        mainCategory: 'category',
        subCategory: 'sub-category',
        description: 'Mô tả mẫu',
        fullDescription: 'Mô tả chi tiết mẫu',
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
}));

// @desc    Cập nhật một sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    // Logic cập nhật sản phẩm
    const { name, price, originalPrice, image, brand, mainCategory, subCategory, description, fullDescription, isPromotional } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name;
        product.price = price;
        product.originalPrice = originalPrice;
        product.image = image;
        product.brand = brand;
        product.mainCategory = mainCategory;
        product.subCategory = subCategory;
        product.description = description;
        product.fullDescription = fullDescription;
        product.isPromotional = isPromotional;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
}));

// @desc    Xóa một sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne(); // Dùng deleteOne() cho Mongoose v6+
        res.json({ message: 'Sản phẩm đã được xóa' });
    } else {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }
}));


module.exports = router;router.post(
    '/:id/reviews',
    protect, // Chỉ user đã đăng nhập mới được review
    asyncHandler(async (req, res) => {
        const { rating, comment } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            // Kiểm tra xem user này đã review sản phẩm này chưa
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                res.status(400);
                throw new Error('Bạn đã đánh giá sản phẩm này rồi');
            }

            // Tạo đối tượng review mới
            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            // Thêm review vào mảng reviews của sản phẩm
            product.reviews.push(review);

            // Cập nhật lại số lượng reviews và điểm trung bình
            product.numReviews = product.reviews.length;
            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Đánh giá đã được thêm' });
        } else {
            res.status(404);
            throw new Error('Sản phẩm không tồn tại');
        }
    })
);router.get(
    '/:id/related',
    asyncHandler(async (req, res) => {
        // Đầu tiên, tìm sản phẩm hiện tại để biết category của nó
        const currentProduct = await Product.findById(req.params.id);

        if (!currentProduct) {
            res.status(404);
            throw new Error('Sản phẩm không tồn tại');
        }

        // Tìm các sản phẩm khác có cùng mainCategory,
        // loại trừ sản phẩm hiện tại (_id: { $ne: ... }),
        // và chỉ lấy 4 sản phẩm.
        const relatedProducts = await Product.find({
            mainCategory: currentProduct.mainCategory,
            _id: { $ne: req.params.id }, // $ne = Not Equal
        }).limit(4);

        res.json(relatedProducts);
    })
);  