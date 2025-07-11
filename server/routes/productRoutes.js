// ===== File: server/routes/productRoutes.js (ĐÃ SỬA LỖI THỨ TỰ ROUTE) =====
const express = require('express');
const asyncHandler = require('express-async-handler');
const sql = require('mssql');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Lấy danh sách sản phẩm với bộ lọc và phân trang
// @route   GET /api/products
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    const {
        keyword, brand, mainCategory, subCategory, isPromotional,
        minPrice, maxPrice,
        sortBy, pageSize: pageSizeQuery, page: pageQuery
    } = req.query;

    const pageSize = parseInt(pageSizeQuery) || 12;
    const page = parseInt(pageQuery) || 1;
    const offset = (page - 1) * pageSize;

    const request = pool.request();
    const countRequest = pool.request();

    const joinClauses = [
        "LEFT JOIN Brands b ON p.BrandId = b.Id",
        "LEFT JOIN Categories c ON p.CategoryId = c.Id"
    ];
    let whereClauses = ["p.IsDeleted = 0"];

    const addInput = (name, type, value) => {
        request.input(name, type, value);
        countRequest.input(name, type, value);
    };

    if (keyword) { whereClauses.push("p.Name LIKE @keyword"); addInput('keyword', sql.NVarChar, `%${keyword}%`); }
    if (isPromotional === 'true') { whereClauses.push("p.IsPromotional = 1"); }
    
    if (brand) {
        whereClauses.push("b.Name IN (SELECT value FROM STRING_SPLIT(@brand, ','))");
        addInput('brand', sql.NVarChar, brand);
    }
    
    if (mainCategory) {
        whereClauses.push("c.Name IN (SELECT value FROM STRING_SPLIT(@mainCategory, ','))");
        addInput('mainCategory', sql.NVarChar, mainCategory);
    }
    
    if (subCategory) { whereClauses.push("p.SubCategory = @subCategory"); addInput('subCategory', sql.NVarChar, subCategory); }
    if (minPrice) { whereClauses.push("p.Price >= @minPrice"); addInput('minPrice', sql.Decimal(18, 2), minPrice); }
    if (maxPrice) { whereClauses.push("p.Price <= @maxPrice"); addInput('maxPrice', sql.Decimal(18, 2), maxPrice); }
    
    const joinClause = joinClauses.join(' ');
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderByClause = 'ORDER BY p.CreatedAt DESC';
    if (sortBy === 'price_asc') orderByClause = 'ORDER BY p.Price ASC';
    else if (sortBy === 'price_desc') orderByClause = 'ORDER BY p.Price DESC';
    else if (sortBy === 'rating_desc') orderByClause = 'ORDER BY p.Rating DESC, p.NumReviews DESC';
    else if (sortBy === 'newest') orderByClause = 'ORDER BY p.CreatedAt DESC';

    const productQuery = `
        SELECT p.Id as id, p.Name as name, p.Price as price, p.Image as image, 
               p.OriginalPrice as originalPrice, b.Name as brand, c.Name as categoryName, 
               p.IsPromotional as isPromotional, p.CountInStock as countInStock
        FROM Products p
        ${joinClause}
        ${whereClause}
        ${orderByClause}
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;
    addInput('offset', sql.Int, offset);
    addInput('pageSize', sql.Int, pageSize);
    
    const countQuery = `SELECT COUNT(*) as total FROM Products p ${joinClause} ${whereClause}`;

    const [productResult, countResult] = await Promise.all([request.query(productQuery), countRequest.query(countQuery)]);
    
    res.json({
        products: productResult.recordset.map(p => ({
            ...p,
            price: parseFloat(p.price),
            originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : null,
        })),
        page: page,
        pages: Math.ceil(countResult.recordset[0].total / pageSize),
        count: countResult.recordset[0].total
    });
}));

// ===== BẮT ĐẦU SỬA LỖI =====
// DI CHUYỂN ROUTE /suggestions LÊN TRÊN CÁC ROUTE CÓ THAM SỐ ĐỘNG NHƯ /:id

// @desc    Lấy gợi ý sản phẩm cho thanh tìm kiếm
// @route   GET /api/products/suggestions
// @access  Public
router.get('/suggestions', asyncHandler(async (req, res) => {
    const keyword = req.query.keyword;

    if (!keyword || keyword.trim().length < 2) {
        return res.json([]);
    }

    const result = await pool.request()
        .input('Keyword', sql.NVarChar, `%${keyword}%`)
        .input('StartKeyword', sql.NVarChar, `${keyword}%`)
        .query(`
            SELECT TOP 5 
                p.Id as id, 
                p.Name as name, 
                p.Image as image,
                p.Price as price,
                b.Name as brand
            FROM Products p
            LEFT JOIN Brands b ON p.BrandId = b.Id
            WHERE p.IsDeleted = 0 AND p.Name LIKE @Keyword
            ORDER BY 
                CASE 
                    WHEN p.Name LIKE @StartKeyword THEN 1
                    ELSE 2
                END, 
                p.NumReviews DESC
        `);

    const suggestions = result.recordset.map(p => ({
        ...p,
        price: parseFloat(p.price)
    }));

    res.json(suggestions);
}));


// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
    const productId = req.params.id;

    // Thêm kiểm tra để đảm bảo ID là một số
    if (isNaN(productId)) {
        res.status(400);
        throw new Error('ID sản phẩm không hợp lệ.');
    }

    const productResult = await pool.request().input('Id', sql.Int, productId).query(`
        SELECT p.*, b.Name as brand, c.Name as mainCategory
        FROM Products p
        LEFT JOIN Brands b ON p.BrandId = b.Id
        LEFT JOIN Categories c ON p.CategoryId = c.Id
        WHERE p.Id = @Id AND p.IsDeleted = 0
    `);
    if (productResult.recordset.length === 0) {
        res.status(404); throw new Error('Sản phẩm không tồn tại');
    }
    const product = productResult.recordset[0];

    const reviewsResult = await pool.request().input('ProductId', sql.Int, productId).query(`
        SELECT r.Id as id, r.Rating as rating, r.Comment as comment, u.Name as userName, r.CreatedAt as createdAt
        FROM Reviews r JOIN Users u ON r.UserId = u.Id 
        WHERE r.ProductId = @ProductId ORDER BY r.CreatedAt DESC
    `);
    
    const formattedProduct = {
        id: product.Id,
        name: product.Name,
        price: parseFloat(product.Price),
        originalPrice: product.OriginalPrice ? parseFloat(product.OriginalPrice) : null,
        image: product.Image,
        images: product.Images ? JSON.parse(product.Images) : [],
        brandId: product.BrandId,
        brand: product.brand,
        categoryId: product.CategoryId,
        mainCategory: product.mainCategory,
        subCategory: product.SubCategory,
        description: product.Description,
        fullDescription: product.FullDescription,
        rating: parseFloat(product.Rating),
        numReviews: product.NumReviews,
        isPromotional: product.IsPromotional,
        countInStock: product.CountInStock,
        warranty: product.Warranty,
        youtubeLink: product.YoutubeLink,
        specifications: product.Specifications ? JSON.parse(product.Specifications) : [],
        reviews: reviewsResult.recordset.map(r => ({...r, rating: parseFloat(r.rating)}))
    };
    res.json(formattedProduct);
}));

// ===== KẾT THÚC SỬA LỖI =====


// @desc    Tạo sản phẩm mới (Admin)
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const { 
        name, price, originalPrice, image, images, brandId, categoryId, subCategory,
        description, fullDescription, countInStock, isPromotional, 
        warranty, youtubeLink, specifications 
    } = req.body;
    
    if (!name || !brandId || !categoryId) {
        res.status(400);
        throw new Error(`Thiếu thông tin bắt buộc. Name: ${name}, BrandId: ${brandId}, CategoryId: ${categoryId}`);
    }

    const request = pool.request()
        .input('Name', sql.NVarChar, name)
        .input('Price', sql.Decimal(18, 2), price || 0)
        .input('OriginalPrice', sql.Decimal(18, 2), originalPrice || null)
        .input('Image', sql.NVarChar, image || '/images/placeholder.png')
        .input('Images', sql.NVarChar, images || '[]')
        .input('Description', sql.NVarChar(1000), description || '')
        .input('FullDescription', sql.NVarChar(sql.MAX), fullDescription || '')
        .input('CountInStock', sql.Int, countInStock || 0)
        .input('IsPromotional', sql.Bit, isPromotional || false)
        .input('Warranty', sql.NVarChar, warranty || 'Không có')
        .input('YoutubeLink', sql.NVarChar, youtubeLink || null)
        .input('Specifications', sql.NVarChar(sql.MAX), specifications || '[]')
        .input('BrandId', sql.Int, brandId)
        .input('CategoryId', sql.Int, categoryId)
        .input('SubCategory', sql.NVarChar, subCategory || null)
        .input('Rating', sql.Decimal(3, 2), 0)
        .input('NumReviews', sql.Int, 0);

    const result = await request.query(`
        INSERT INTO Products (
            Name, Price, OriginalPrice, Image, Images, Description, FullDescription, 
            CountInStock, IsPromotional, Warranty, YoutubeLink, Specifications, 
            BrandId, CategoryId, SubCategory, Rating, NumReviews
        ) 
        OUTPUT INSERTED.Id as id, INSERTED.Name as name
        VALUES (
            @Name, @Price, @OriginalPrice, @Image, @Images, @Description, @FullDescription,
            @CountInStock, @IsPromotional, @Warranty, @YoutubeLink, @Specifications,
            @BrandId, @CategoryId, @SubCategory, @Rating, @NumReviews
        )
    `);

    if (result.recordset && result.recordset.length > 0) {
        res.status(201).json(result.recordset[0]);
    } else {
        res.status(500);
        throw new Error("Không thể tạo sản phẩm, vui lòng thử lại.");
    }
}));


// @desc    Cập nhật sản phẩm (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const { 
        name, price, originalPrice, image, images, brandId, categoryId, subCategory,
        description, fullDescription, countInStock, isPromotional, 
        warranty, youtubeLink, specifications 
    } = req.body;

    const request = pool.request().input('Id', sql.Int, productId);
    const setClauses = [];

    const addClause = (key, value, type) => {
        if (value !== undefined) {
            setClauses.push(`${key} = @${key}`);
            request.input(key, type, value);
        }
    };

    addClause('Name', name, sql.NVarChar);
    addClause('Price', price, sql.Decimal(18,2));
    addClause('OriginalPrice', originalPrice, sql.Decimal(18,2));
    addClause('Image', image, sql.NVarChar);
    addClause('Images', images, sql.NVarChar);
    addClause('BrandId', brandId, sql.Int);
    addClause('CategoryId', categoryId, sql.Int);
    addClause('SubCategory', subCategory, sql.NVarChar);
    addClause('Description', description, sql.NVarChar(1000));
    addClause('FullDescription', fullDescription, sql.NVarChar(sql.MAX));
    addClause('CountInStock', countInStock, sql.Int);
    addClause('IsPromotional', isPromotional, sql.Bit);
    addClause('Warranty', warranty, sql.NVarChar);
    addClause('YoutubeLink', youtubeLink, sql.NVarChar);
    addClause('Specifications', specifications, sql.NVarChar(sql.MAX));

    if (setClauses.length === 0) {
        return res.json({ message: 'Không có thông tin nào được cập nhật.' });
    }

    const result = await request.query(`
        UPDATE Products SET ${setClauses.join(', ')} 
        OUTPUT INSERTED.Id as id
        WHERE Id = @Id
    `);

    if(result.recordset.length > 0) {
        res.json(result.recordset[0]);
    } else {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại.');
    }
}));


// @desc    Xóa sản phẩm (Admin) - Soft delete
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const result = await pool.request()
        .input('Id', sql.Int, req.params.id)
        .query('UPDATE Products SET IsDeleted = 1 WHERE Id = @Id');
    if (result.rowsAffected[0] === 0) { 
        res.status(404); throw new Error('Sản phẩm không tồn tại'); 
    }
    res.json({ message: 'Sản phẩm đã được xóa' });
}));


// @desc    Tạo đánh giá mới
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, asyncHandler(async (req, res, next) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const { id: userId } = req.user;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        const productExists = await request.input('ProductId', sql.Int, productId).query('SELECT 1 FROM Products WHERE Id = @ProductId AND IsDeleted = 0');
        if(productExists.recordset.length === 0) {
            res.status(404); throw new Error('Sản phẩm không tồn tại');
        }
        const alreadyReviewed = await request.input('UserId', sql.Int, userId).query('SELECT 1 FROM Reviews WHERE ProductId = @ProductId AND UserId = @UserId');
        if (alreadyReviewed.recordset.length > 0) {
            res.status(400); throw new Error('Bạn đã đánh giá sản phẩm này');
        }
        await request.input('Rating', sql.Int, rating).input('Comment', sql.NVarChar, comment).query('INSERT INTO Reviews (ProductId, UserId, Rating, Comment) VALUES (@ProductId, @UserId, @Rating, @Comment)');
        await request.query(`UPDATE Products SET NumReviews = (SELECT COUNT(*) FROM Reviews WHERE ProductId = @ProductId), Rating = (SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM Reviews WHERE ProductId = @ProductId) WHERE Id = @ProductId`);
        await transaction.commit();
        res.status(201).json({ message: 'Đã thêm đánh giá' });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}));


// @desc    Lấy các sản phẩm liên quan
// @route   GET /api/products/:id/related
// @access  Public
router.get('/:id/related', asyncHandler(async (req, res) => {
    const currentProductResult = await pool.request().input('Id', sql.Int, req.params.id).query('SELECT CategoryId FROM Products WHERE Id = @Id');
    if (currentProductResult.recordset.length === 0) return res.json([]);
    const categoryId = currentProductResult.recordset[0].CategoryId;
    if (!categoryId) return res.json([]);
    const relatedResult = await pool.request().input('CategoryId', sql.Int, categoryId).input('Id', sql.Int, req.params.id).query(`SELECT TOP 4 p.Id as id, p.Name as name, p.Price as price, p.OriginalPrice as originalPrice, p.Image as image, b.Name as brand, p.IsPromotional as isPromotional FROM Products p LEFT JOIN Brands b ON p.BrandId = b.Id WHERE p.CategoryId = @CategoryId AND p.Id <> @Id AND p.IsDeleted = 0 ORDER BY NEWID()`);
    res.json(relatedResult.recordset.map(p => ({
            ...p,
            price: parseFloat(p.price),
            originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : null,
        })));
}));


module.exports = router;