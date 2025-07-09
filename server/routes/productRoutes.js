// // ===== File: server/routes/productRoutes.js (PHIÊN BẢN CUỐI CÙNG, ĐẦY ĐỦ TÍNH NĂNG) =====
// const express = require('express');
// const asyncHandler = require('express-async-handler');
// const sql = require('mssql');
// const { protect, admin } = require('../middleware/authMiddleware.js');
// const { pool } = require('../config/db.js');

// // const router = express.Router();

// // // GET /api/products - Lấy danh sách sản phẩm với bộ lọc và phân trang
// // router.get('/', asyncHandler(async (req, res) => {
// //     const {
// //         keyword, brandId, categoryId, minPrice, maxPrice, isPromotional,
// //         weight, balance, flex, sortBy, pageSize: pageSizeQuery, page: pageQuery
// //     } = req.query;

// //     const pageSize = parseInt(pageSizeQuery) || 12;
// //     const page = parseInt(pageQuery) || 1;
// //     const offset = (page - 1) * pageSize;

// //     const request = pool.request();
// //     const countRequest = pool.request();
// //     let whereClauses = ["p.IsDeleted = 0"]; // Bắt đầu với điều kiện không lấy sản phẩm đã xóa

// //     const addInput = (name, type, value) => {
// //         request.input(name, type, value);
// //         countRequest.input(name, type, value);
// //     };

// //     if (keyword) { whereClauses.push("p.Name LIKE @keyword"); addInput('keyword', sql.NVarChar, `%${keyword}%`); }
// //     if (brandId) { whereClauses.push("p.BrandId = @brandId"); addInput('brandId', sql.Int, brandId); }
// //     if (categoryId) { whereClauses.push("p.CategoryId = @categoryId"); addInput('categoryId', sql.Int, categoryId); }
// //     if (minPrice && !isNaN(minPrice)) { whereClauses.push("p.Price >= @minPrice"); addInput('minPrice', sql.Decimal, parseFloat(minPrice)); }
// //     if (maxPrice && !isNaN(maxPrice)) { whereClauses.push("p.Price <= @maxPrice"); addInput('maxPrice', sql.Decimal, parseFloat(maxPrice)); }
// //     if (isPromotional === 'true') { whereClauses.push("p.IsPromotional = 1"); }

// //     const addJsonFilter = (keyInDb, paramName, values) => {
// //         if (!values) return;
// //         const valuesArr = values.split(',').map(v => v.trim());
// //         const orConditions = valuesArr.map((val, index) => {
// //             const inputName = `${paramName}${index}`;
// //             addInput(inputName, sql.NVarChar, `%${val}%`);
// //             return `s.spec_value LIKE @${inputName}`;
// //         });
// //         whereClauses.push(`EXISTS (SELECT 1 FROM OPENJSON(p.Specifications) WITH (spec_key NVARCHAR(100) '$.key', spec_value NVARCHAR(MAX) '$.value') AS s WHERE s.spec_key = N'${keyInDb}' AND (${orConditions.join(' OR ')}))`);
// //     };

// //     addJsonFilter('Trọng lượng', 'weight', weight);
// //     addJsonFilter('Điểm cân bằng', 'balance', balance);
// //     addJsonFilter('Độ cứng', 'flex', flex);

// //     const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

// //     let orderByClause = 'ORDER BY p.CreatedAt DESC';
// //     if (sortBy) {
// //         switch (sortBy) {
// //             case 'price_asc': orderByClause = 'ORDER BY p.Price ASC'; break;
// //             case 'price_desc': orderByClause = 'ORDER BY p.Price DESC'; break;
// //             case 'rating_desc': orderByClause = 'ORDER BY p.Rating DESC'; break;
// //         }
// //     }

// //     const productQuery = `
// //         SELECT p.Id as id, p.Name as name, p.Price as price, p.OriginalPrice as originalPrice, p.Image as image, 
// //                b.Name as brand, p.Rating as rating, p.NumReviews as numReviews, 
// //                p.IsPromotional as isPromotional, p.CountInStock as countInStock
// //         FROM Products p
// //         LEFT JOIN Brands b ON p.BrandId = b.Id
// //         LEFT JOIN Categories c ON p.CategoryId = c.Id
// //         ${whereClause}
// //         ${orderByClause}
// //         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
// //     `;
// //     request.input('offset', sql.Int, offset);
// //     request.input('pageSize', sql.Int, pageSize);

// //     const countQuery = `SELECT COUNT(*) as total FROM Products p ${whereClause}`;

// //     const [productResult, countResult] = await Promise.all([request.query(productQuery), countRequest.query(countQuery)]);
    
// //     res.json({
// //         products: productResult.recordset,
// //         page: page,
// //         pages: Math.ceil(countResult.recordset[0].total / pageSize),
// //         count: countResult.recordset[0].total
// //     });
// // }));
// // ===== File: server/routes/productRoutes.js (SỬA LỖI LỌC THEO DANH MỤC) =====

// // ... (các dòng import giữ nguyên)

// const router = express.Router();

// // GET /api/products - Lấy danh sách sản phẩm với bộ lọc và phân trang
// router.get('/', asyncHandler(async (req, res) => {
//     const {
//         keyword, brandId, categoryId, minPrice, maxPrice, isPromotional,
//         weight, balance, flex, sortBy, pageSize: pageSizeQuery, page: pageQuery,
//         mainCategory // ++ THÊM: Nhận tham số mainCategory từ frontend
//     } = req.query;

//     const pageSize = parseInt(pageSizeQuery) || 12;
//     const page = parseInt(pageQuery) || 1;
//     const offset = (page - 1) * pageSize;

//     const request = pool.request();
//     const countRequest = pool.request();
//     let whereClauses = ["p.IsDeleted = 0"];

//     const addInput = (name, type, value) => {
//         request.input(name, type, value);
//         countRequest.input(name, type, value);
//     };
    
//     // ++ SỬA LỖI: LOGIC MỚI ĐỂ XỬ LÝ mainCategory
//     let resolvedCategoryId = categoryId;
//     if (mainCategory) {
//         // Nếu có mainCategory, tìm ID tương ứng trong bảng Categories
//         const categoryResult = await pool.request()
//             .input('mainCategoryName', sql.NVarChar, mainCategory)
//             .query('SELECT Id FROM Categories WHERE Name = @mainCategoryName');
//         if (categoryResult.recordset.length > 0) {
//             resolvedCategoryId = categoryResult.recordset[0].Id;
//         } else {
//             // Không tìm thấy danh mục, trả về mảng rỗng
//             return res.json({ products: [], page: 1, pages: 0, count: 0 });
//         }
//     }
//     // Kết thúc logic mới

//     if (keyword) { whereClauses.push("p.Name LIKE @keyword"); addInput('keyword', sql.NVarChar, `%${keyword}%`); }
//     if (brandId) { whereClauses.push("p.BrandId = @brandId"); addInput('brandId', sql.Int, brandId); }
    
//     // ++ SỬA LỖI: Sử dụng resolvedCategoryId đã được xử lý ở trên
//     if (resolvedCategoryId) { 
//         whereClauses.push("p.CategoryId = @categoryId"); 
//         addInput('categoryId', sql.Int, resolvedCategoryId); 
//     }

//     if (minPrice && !isNaN(minPrice)) { whereClauses.push("p.Price >= @minPrice"); addInput('minPrice', sql.Decimal, parseFloat(minPrice)); }
//     if (maxPrice && !isNaN(maxPrice)) { whereClauses.push("p.Price <= @maxPrice"); addInput('maxPrice', sql.Decimal, parseFloat(maxPrice)); }
//     if (isPromotional === 'true') { whereClauses.push("p.IsPromotional = 1"); }

//     const addJsonFilter = (keyInDb, paramName, values) => {
//         if (!values) return;
//         const valuesArr = values.split(',').map(v => v.trim());
//         const orConditions = valuesArr.map((val, index) => {
//             const inputName = `${paramName}${index}`;
//             addInput(inputName, sql.NVarChar, `%${val}%`);
//             return `s.spec_value LIKE @${inputName}`;
//         });
//         whereClauses.push(`EXISTS (SELECT 1 FROM OPENJSON(p.Specifications) WITH (spec_key NVARCHAR(100) '$.key', spec_value NVARCHAR(MAX) '$.value') AS s WHERE s.spec_key = N'${keyInDb}' AND (${orConditions.join(' OR ')}))`);
//     };

//     addJsonFilter('Trọng lượng', 'weight', weight);
//     addJsonFilter('Điểm cân bằng', 'balance', balance);
//     addJsonFilter('Độ cứng', 'flex', flex);

//     const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

//     let orderByClause = 'ORDER BY p.CreatedAt DESC';
//     if (sortBy) {
//         switch (sortBy) {
//             case 'price_asc': orderByClause = 'ORDER BY p.Price ASC'; break;
//             case 'price_desc': orderByClause = 'ORDER BY p.Price DESC'; break;
//             case 'rating_desc': orderByClause = 'ORDER BY p.Rating DESC'; break;
//         }
//     }

//     const productQuery = `
//         SELECT p.Id as id, p.Name as name, p.Price as price, p.OriginalPrice as originalPrice, p.Image as image, 
//                b.Name as brand, p.Rating as rating, p.NumReviews as numReviews, 
//                p.IsPromotional as isPromotional, p.CountInStock as countInStock,
//                c.Name as categoryName
//         FROM Products p
//         LEFT JOIN Brands b ON p.BrandId = b.Id
//         LEFT JOIN Categories c ON p.CategoryId = c.Id
//         ${whereClause}
//         ${orderByClause}
//         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
//     `;
//     request.input('offset', sql.Int, offset);
//     request.input('pageSize', sql.Int, pageSize);

//     const countQuery = `SELECT COUNT(*) as total FROM Products p LEFT JOIN Categories c ON p.CategoryId = c.Id ${whereClause}`;

//     const [productResult, countResult] = await Promise.all([request.query(productQuery), countRequest.query(countQuery)]);
    
//     res.json({
//         products: productResult.recordset,
//         page: page,
//         pages: Math.ceil(countResult.recordset[0].total / pageSize),
//         count: countResult.recordset[0].total
//     });
// }));

// // ... (các routes còn lại trong file productRoutes.js giữ nguyên)
// // GET /api/products/:id
// router.get('/:id', asyncHandler(async (req, res) => {
//     const productId = req.params.id;
//     const productResult = await pool.request().input('Id', sql.Int, productId).query(`
//         SELECT p.*, b.Name as brandName, c.Name as categoryName
//         FROM Products p
//         LEFT JOIN Brands b ON p.BrandId = b.Id
//         LEFT JOIN Categories c ON p.CategoryId = c.Id
//         WHERE p.Id = @Id AND p.IsDeleted = 0
//     `);
//     if (productResult.recordset.length === 0) {
//         res.status(404); throw new Error('Sản phẩm không tồn tại');
//     }
//     const product = productResult.recordset[0];

//     const reviewsResult = await pool.request().input('ProductId', sql.Int, productId).query(`
//         SELECT r.Id as id, r.Name as name, r.Rating as rating, r.Comment as comment, u.Name as userName, r.CreatedAt as createdAt
//         FROM Reviews r JOIN Users u ON r.UserId = u.Id 
//         WHERE r.ProductId = @ProductId ORDER BY r.CreatedAt DESC
//     `);
    
//     res.json({
//         id: product.Id,
//         name: product.Name,
//         price: product.Price,
//         originalPrice: product.OriginalPrice,
//         image: product.Image,
//         images: product.Images,
//         brandId: product.BrandId,
//         brand: product.brandName,
//         categoryId: product.CategoryId,
//         category: product.categoryName,
//         description: product.Description,
//         fullDescription: product.FullDescription,
//         rating: product.Rating,
//         numReviews: product.NumReviews,
//         isPromotional: product.IsPromotional,
//         countInStock: product.CountInStock,
//         warranty: product.Warranty,
//         youtubeLink: product.YoutubeLink,
//         specifications: product.Specifications,
//         createdAt: product.CreatedAt,
//         reviews: reviewsResult.recordset
//     });
// }));

// // POST /api/products (Admin)
// // router.post('/', protect, admin, asyncHandler(async (req, res) => {
// //     const { name = 'Sản phẩm mới', price = 0, originalPrice = null, image = '/images/sample.jpg', images = '[]', brandId, categoryId, description = 'Mô tả ngắn...', fullDescription = '', countInStock = 0, isPromotional = false, warranty = 'Không có', youtubeLink = null, specifications = '[]' } = req.body;
    
// //     const result = await pool.request()
// //         .input('Name', sql.NVarChar, name)
// //         .input('Price', sql.Decimal(18, 2), price)
// //         .input('OriginalPrice', sql.Decimal(18, 2), originalPrice)
// //         .input('Image', sql.NVarChar, image)
// //         .input('Images', sql.NVarChar, images)
// //         .input('Description', sql.NVarChar, description)
// //         .input('FullDescription', sql.NVarChar(sql.MAX), fullDescription)
// //         .input('CountInStock', sql.Int, countInStock)
// //         .input('IsPromotional', sql.Bit, isPromotional)
// //         .input('Warranty', sql.NVarChar, warranty)
// //         .input('YoutubeLink', sql.NVarChar, youtubeLink)
// //         .input('Specifications', sql.NVarChar(sql.MAX), specifications)
// //         .input('BrandId', sql.Int, brandId)
// //         .input('CategoryId', sql.Int, categoryId)
// //         .query(`
// //             INSERT INTO Products (Name, Price, OriginalPrice, Image, Images, Description, FullDescription, CountInStock, IsPromotional, Warranty, YoutubeLink, Specifications, BrandId, CategoryId) 
// //             OUTPUT INSERTED.Id as id, INSERTED.Name as name
// //             VALUES (@Name, @Price, @OriginalPrice, @Image, @Images, @Description, @FullDescription, @CountInStock, @IsPromotional, @Warranty, @YoutubeLink, @Specifications, @BrandId, @CategoryId)
// //         `);
// //     res.status(201).json(result.recordset[0]);
// // }));
// // ===== File: server/routes/productRoutes.js (SỬA LỖI THÊM SẢN PHẨM) =====

// // ... (các routes khác giữ nguyên)

// // POST /api/products (Admin)
// // router.post('/', protect, admin, asyncHandler(async (req, res) => {
// //     const { name = 'Sản phẩm mới', price = 0, originalPrice = null, image = '/images/sample.jpg', images = '[]', brandId, categoryId, description = 'Mô tả ngắn...', fullDescription = '', countInStock = 0, isPromotional = false, warranty = 'Không có', youtubeLink = null, specifications = '[]' } = req.body;
    
// //     // ++ SỬA LỖI: Thêm kiểm tra đầu vào cho brandId và categoryId
// //     if (!brandId || !categoryId) {
// //         res.status(400);
// //         throw new Error('Vui lòng chọn Thương hiệu và Danh mục cho sản phẩm.');
// //     }
// //     // Kết thúc phần sửa lỗi

// //     const result = await pool.request()
// //         .input('Name', sql.NVarChar, name)
// //         .input('Price', sql.Decimal(18, 2), price)
// //         .input('OriginalPrice', sql.Decimal(18, 2), originalPrice)
// //         .input('Image', sql.NVarChar, image)
// //         .input('Images', sql.NVarChar, images)
// //         .input('Description', sql.NVarChar, description)
// //         .input('FullDescription', sql.NVarChar(sql.MAX), fullDescription)
// //         .input('CountInStock', sql.Int, countInStock)
// //         .input('IsPromotional', sql.Bit, isPromotional)
// //         .input('Warranty', sql.NVarChar, warranty)
// //         .input('YoutubeLink', sql.NVarChar, youtubeLink)
// //         .input('Specifications', sql.NVarChar(sql.MAX), specifications)
// //         .input('BrandId', sql.Int, brandId)
// //         .input('CategoryId', sql.Int, categoryId)
// //         .query(`
// //             INSERT INTO Products (Name, Price, OriginalPrice, Image, Images, Description, FullDescription, CountInStock, IsPromotional, Warranty, YoutubeLink, Specifications, BrandId, CategoryId) 
// //             OUTPUT INSERTED.Id as id, INSERTED.Name as name
// //             VALUES (@Name, @Price, @OriginalPrice, @Image, @Images, @Description, @FullDescription, @CountInStock, @IsPromotional, @Warranty, @YoutubeLink, @Specifications, @BrandId, @CategoryId)
// //         `);
// //     res.status(201).json(result.recordset[0]);
// // }));

// // ... (các routes còn lại trong file productRoutes.js giữ nguyên)
// // PUT /api/products/:id (Admin)
// router.post('/', protect, admin, asyncHandler(async (req, res) => {
//     // Lấy tất cả dữ liệu từ body
//     const { 
//         name, price, originalPrice, image, images, brandId, categoryId, 
//         description, fullDescription, countInStock, isPromotional, 
//         warranty, youtubeLink, specifications 
//     } = req.body;
    
//     // Kiểm tra các trường bắt buộc
//     if (!name || !brandId || !categoryId) {
//         res.status(400);
//         throw new Error('Tên sản phẩm, Thương hiệu và Danh mục không được để trống.');
//     }

//     // ++ SỬA LỖI Ở ĐÂY: Thêm giá trị mặc định cho Rating và NumReviews
//     const request = pool.request()
//         .input('Name', sql.NVarChar, name)
//         .input('Price', sql.Decimal(18, 2), price || 0)
//         .input('OriginalPrice', sql.Decimal(18, 2), originalPrice || null)
//         .input('Image', sql.NVarChar, image || '/images/placeholder.png')
//         .input('Images', sql.NVarChar, images || '[]')
//         .input('Description', sql.NVarChar(1000), description || '')
//         .input('FullDescription', sql.NVarChar(sql.MAX), fullDescription || '')
//         .input('CountInStock', sql.Int, countInStock || 0)
//         .input('IsPromotional', sql.Bit, isPromotional || false)
//         .input('Warranty', sql.NVarChar, warranty || 'Không có')
//         .input('YoutubeLink', sql.NVarChar, youtubeLink || null)
//         .input('Specifications', sql.NVarChar(sql.MAX), specifications || '[]')
//         .input('BrandId', sql.Int, brandId)
//         .input('CategoryId', sql.Int, categoryId)
//         // Thêm giá trị mặc định cho các cột mới
//         .input('Rating', sql.Decimal(3, 2), 0)
//         .input('NumReviews', sql.Int, 0);

//     // Cập nhật câu lệnh INSERT để bao gồm cả Rating và NumReviews
//     const result = await request.query(`
//         INSERT INTO Products (
//             Name, Price, OriginalPrice, Image, Images, Description, FullDescription, 
//             CountInStock, IsPromotional, Warranty, YoutubeLink, Specifications, 
//             BrandId, CategoryId, 
//             Rating, NumReviews
//         ) 
//         OUTPUT INSERTED.Id as id, INSERTED.Name as name
//         VALUES (
//             @Name, @Price, @OriginalPrice, @Image, @Images, @Description, @FullDescription,
//             @CountInStock, @IsPromotional, @Warranty, @YoutubeLink, @Specifications,
//             @BrandId, @CategoryId,
//             @Rating, @NumReviews
//         )
//     `);

//     if (result.recordset && result.recordset.length > 0) {
//         res.status(201).json(result.recordset[0]);
//     } else {
//         res.status(500);
//         throw new Error("Không thể tạo sản phẩm, vui lòng thử lại.");
//     }
// }));
// router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
//     const productId = req.params.id;
//     const productExistsResult = await pool.request().input('Id', sql.Int, productId).query('SELECT * FROM Products WHERE Id = @Id');
//     if (productExistsResult.recordset.length === 0) {
//         res.status(404); throw new Error('Sản phẩm không tồn tại');
//     }
//     const existingProduct = productExistsResult.recordset[0];
    
//     // **ĐẦY ĐỦ CÁC TRƯỜNG**
//     const updatedData = {
//         Name: req.body.name,
//         Price: req.body.price,
//         OriginalPrice: req.body.originalPrice,
//         Image: req.body.image,
//         Images: req.body.images,
//         BrandId: req.body.brandId,
//         CategoryId: req.body.categoryId,
//         Description: req.body.description,
//         FullDescription: req.body.fullDescription,
//         CountInStock: req.body.countInStock,
//         IsPromotional: req.body.isPromotional,
//         Warranty: req.body.warranty,
//         YoutubeLink: req.body.youtubeLink,
//         Specifications: req.body.specifications,
//     };

//     const request = pool.request();
//     request.input('Id', sql.Int, productId);
//     const setClauses = [];

//     // Duyệt qua các trường được gửi lên từ client để tạo câu lệnh UPDATE động
//     for (const key in updatedData) {
//         if (updatedData[key] !== undefined) { // Chỉ cập nhật những trường được gửi lên
//             let sqlType;
//             if (['Price', 'OriginalPrice'].includes(key)) { sqlType = sql.Decimal(18, 2); } 
//             else if (['CountInStock', 'BrandId', 'CategoryId'].includes(key)) { sqlType = sql.Int; } 
//             else if (['IsPromotional'].includes(key)) { sqlType = sql.Bit; }
//             else { sqlType = sql.NVarChar; } // Mặc định là NVarChar
            
//             request.input(key, sqlType, updatedData[key]);
//             setClauses.push(`${key} = @${key}`);
//         }
//     }
    
//     if (setClauses.length === 0) {
//         return res.json({ message: 'Không có thông tin nào được cập nhật.' });
//     }

//     const result = await request.query(`
//         UPDATE Products SET ${setClauses.join(', ')} 
//         OUTPUT INSERTED.Id as id
//         WHERE Id = @Id
//     `);
//     res.json(result.recordset[0]);
// }));

// // DELETE /api/products/:id (Admin)
// router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
//     // Nên soft delete thay vì xóa cứng để bảo toàn dữ liệu đơn hàng
//     // Tuy nhiên, để đơn giản cho yêu cầu hiện tại, ta sẽ xóa cứng
//     await pool.request().input('ProductId', sql.Int, req.params.id).query('DELETE FROM Reviews WHERE ProductId = @ProductId');
//     const result = await pool.request().input('Id', sql.Int, req.params.id).query('DELETE FROM Products WHERE Id = @Id');
//     if (result.rowsAffected[0] === 0) { 
//         res.status(404); throw new Error('Sản phẩm không tồn tại'); 
//     }
//     res.json({ message: 'Sản phẩm đã được xóa' });
// }));

// // GET /api/products/:id/related
// router.get('/:id/related', asyncHandler(async (req, res) => {
//     const currentProductResult = await pool.request().input('Id', sql.Int, req.params.id).query('SELECT CategoryId FROM Products WHERE Id = @Id');
//     if (currentProductResult.recordset.length === 0) return res.json([]);
    
//     const categoryId = currentProductResult.recordset[0].CategoryId;
//     if (!categoryId) return res.json([]); // Nếu sản phẩm không có danh mục

//     const relatedResult = await pool.request().input('CategoryId', sql.Int, categoryId).input('Id', sql.Int, req.params.id).query(`
//         SELECT TOP 4 p.Id as id, p.Name as name, p.Price as price, p.OriginalPrice as originalPrice, 
//                p.Image as image, b.Name as brand, p.IsPromotional as isPromotional 
//         FROM Products p
//         LEFT JOIN Brands b ON p.BrandId = b.Id
//         WHERE p.CategoryId = @CategoryId AND p.Id <> @Id AND p.IsDeleted = 0 ORDER BY NEWID()
//     `);
//     res.json(relatedResult.recordset);
// }));

// // POST /api/products/:id/reviews
// router.post('/:id/reviews', protect, asyncHandler(async (req, res, next) => {
//     const transaction = new sql.Transaction(pool);
//     await transaction.begin();
//     try {
//         const { rating, comment } = req.body;
//         const productId = req.params.id;
//         const { id: userId, name: userName } = req.user;
//         const existingReviewResult = await new sql.Request(transaction).input('UserId', sql.Int, userId).input('ProductId', sql.Int, productId).query('SELECT Id FROM Reviews WHERE UserId = @UserId AND ProductId = @ProductId');
//         if (existingReviewResult.recordset.length > 0) {
//             res.status(400); throw new Error('Bạn đã đánh giá sản phẩm này rồi');
//         }
//         await new sql.Request(transaction).input('Name', sql.NVarChar, userName).input('Rating', sql.Int, rating).input('Comment', sql.NVarChar, comment).input('UserId', sql.Int, userId).input('ProductId', sql.Int, productId).query('INSERT INTO Reviews (Name, Rating, Comment, UserId, ProductId) VALUES (@Name, @Rating, @Comment, @UserId, @ProductId)');
//         await new sql.Request(transaction).input('ProductId', sql.Int, productId).query(`UPDATE Products SET NumReviews = (SELECT COUNT(*) FROM Reviews WHERE ProductId = @ProductId), Rating = (SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM Reviews WHERE ProductId = @ProductId) WHERE Id = @ProductId`);
//         await transaction.commit();
//         res.status(201).json({ message: 'Đánh giá đã được thêm' });
//     } catch (error) {
//         await transaction.rollback();
//         next(error);
//     }
// }));


// module.exports = router;
// ===== File: server/routes/productRoutes.js (PHIÊN BẢN CÓ GỠ LỖI) =====
const express = require('express');
const asyncHandler = require('express-async-handler');
const sql = require('mssql');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// ... (Các route GET, PUT, DELETE, etc. khác giữ nguyên như cũ, không cần thay đổi)
// GET /api/products - Lấy danh sách sản phẩm với bộ lọc và phân trang
router.get('/', asyncHandler(async (req, res) => {
    const {
        keyword, brandId, categoryId, minPrice, maxPrice, isPromotional,
        weight, balance, flex, sortBy, pageSize: pageSizeQuery, page: pageQuery,
        mainCategory
    } = req.query;

    const pageSize = parseInt(pageSizeQuery) || 12;
    const page = parseInt(pageQuery) || 1;
    const offset = (page - 1) * pageSize;

    const request = pool.request();
    const countRequest = pool.request();
    let whereClauses = ["p.IsDeleted = 0"];

    const addInput = (name, type, value) => {
        request.input(name, type, value);
        countRequest.input(name, type, value);
    };
    
    let resolvedCategoryId = categoryId;
    if (mainCategory) {
        const categoryResult = await pool.request()
            .input('mainCategoryName', sql.NVarChar, mainCategory)
            .query('SELECT Id FROM Categories WHERE Name = @mainCategoryName');
        if (categoryResult.recordset.length > 0) {
            resolvedCategoryId = categoryResult.recordset[0].Id;
        } else {
            return res.json({ products: [], page: 1, pages: 0, count: 0 });
        }
    }

    if (keyword) { whereClauses.push("p.Name LIKE @keyword"); addInput('keyword', sql.NVarChar, `%${keyword}%`); }
    if (brandId) { whereClauses.push("p.BrandId = @brandId"); addInput('brandId', sql.Int, brandId); }
    
    if (resolvedCategoryId) { 
        whereClauses.push("p.CategoryId = @categoryId"); 
        addInput('categoryId', sql.Int, resolvedCategoryId); 
    }

    if (minPrice && !isNaN(minPrice)) { whereClauses.push("p.Price >= @minPrice"); addInput('minPrice', sql.Decimal, parseFloat(minPrice)); }
    if (maxPrice && !isNaN(maxPrice)) { whereClauses.push("p.Price <= @maxPrice"); addInput('maxPrice', sql.Decimal, parseFloat(maxPrice)); }
    if (isPromotional === 'true') { whereClauses.push("p.IsPromotional = 1"); }

    const addJsonFilter = (keyInDb, paramName, values) => {
        if (!values) return;
        const valuesArr = values.split(',').map(v => v.trim());
        const orConditions = valuesArr.map((val, index) => {
            const inputName = `${paramName}${index}`;
            addInput(inputName, sql.NVarChar, `%${val}%`);
            return `s.spec_value LIKE @${inputName}`;
        });
        whereClauses.push(`EXISTS (SELECT 1 FROM OPENJSON(p.Specifications) WITH (spec_key NVARCHAR(100) '$.key', spec_value NVARCHAR(MAX) '$.value') AS s WHERE s.spec_key = N'${keyInDb}' AND (${orConditions.join(' OR ')}))`);
    };

    addJsonFilter('Trọng lượng', 'weight', weight);
    addJsonFilter('Điểm cân bằng', 'balance', balance);
    addJsonFilter('Độ cứng', 'flex', flex);

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderByClause = 'ORDER BY p.CreatedAt DESC';
    if (sortBy) {
        switch (sortBy) {
            case 'price_asc': orderByClause = 'ORDER BY p.Price ASC'; break;
            case 'price_desc': orderByClause = 'ORDER BY p.Price DESC'; break;
            case 'rating_desc': orderByClause = 'ORDER BY p.Rating DESC'; break;
        }
    }

    const productQuery = `
        SELECT p.Id as id, p.Name as name, p.Price as price, p.OriginalPrice as originalPrice, p.Image as image, 
               b.Name as brand, p.Rating as rating, p.NumReviews as numReviews, 
               p.IsPromotional as isPromotional, p.CountInStock as countInStock,
               c.Name as categoryName
        FROM Products p
        LEFT JOIN Brands b ON p.BrandId = b.Id
        LEFT JOIN Categories c ON p.CategoryId = c.Id
        ${whereClause}
        ${orderByClause}
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `;
    request.input('offset', sql.Int, offset);
    request.input('pageSize', sql.Int, pageSize);

    const countQuery = `SELECT COUNT(*) as total FROM Products p LEFT JOIN Categories c ON p.CategoryId = c.Id ${whereClause}`;

    const [productResult, countResult] = await Promise.all([request.query(productQuery), countRequest.query(countQuery)]);
    
    res.json({
        products: productResult.recordset,
        page: page,
        pages: Math.ceil(countResult.recordset[0].total / pageSize),
        count: countResult.recordset[0].total
    });
}));

// POST /api/products (Admin) - Tạo sản phẩm mới
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    // ================== DÒNG GỠ LỖI QUAN TRỌNG ==================
    console.log('--- SERVER NHẬN ĐƯỢC YÊU CẦU TẠO SẢN PHẨM ---');
    console.log('Dữ liệu (req.body):', req.body);
    // ============================================================

    const { 
        name, price, originalPrice, image, images, brandId, categoryId, 
        description, fullDescription, countInStock, isPromotional, 
        warranty, youtubeLink, specifications 
    } = req.body;
    
    if (!name || !brandId || !categoryId) {
        res.status(400);
        // Gửi về thông báo lỗi rõ ràng hơn
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
        .input('Rating', sql.Decimal(3, 2), 0)
        .input('NumReviews', sql.Int, 0);

    const result = await request.query(`
        INSERT INTO Products (
            Name, Price, OriginalPrice, Image, Images, Description, FullDescription, 
            CountInStock, IsPromotional, Warranty, YoutubeLink, Specifications, 
            BrandId, CategoryId, 
            Rating, NumReviews
        ) 
        OUTPUT INSERTED.Id as id, INSERTED.Name as name
        VALUES (
            @Name, @Price, @OriginalPrice, @Image, @Images, @Description, @FullDescription,
            @CountInStock, @IsPromotional, @Warranty, @YoutubeLink, @Specifications,
            @BrandId, @CategoryId,
            @Rating, @NumReviews
        )
    `);

    if (result.recordset && result.recordset.length > 0) {
        console.log('--- TẠO SẢN PHẨM THÀNH CÔNG ---');
        res.status(201).json(result.recordset[0]);
    } else {
        console.error('--- TẠO SẢN PHẨM THẤT BẠI, KHÔNG CÓ KẾT QUẢ TRẢ VỀ TỪ DB ---');
        res.status(500);
        throw new Error("Không thể tạo sản phẩm, vui lòng thử lại.");
    }
}));


// ... (Các route GET :id, PUT, DELETE, etc. khác giữ nguyên như cũ, không cần thay đổi)
// GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const productResult = await pool.request().input('Id', sql.Int, productId).query(`
        SELECT p.*, b.Name as brandName, c.Name as categoryName
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
        SELECT r.Id as id, r.Name as name, r.Rating as rating, r.Comment as comment, u.Name as userName, r.CreatedAt as createdAt
        FROM Reviews r JOIN Users u ON r.UserId = u.Id 
        WHERE r.ProductId = @ProductId ORDER BY r.CreatedAt DESC
    `);
    
    res.json({
        id: product.Id,
        name: product.Name,
        price: product.Price,
        originalPrice: product.OriginalPrice,
        image: product.Image,
        images: product.Images,
        brandId: product.BrandId,
        brand: product.brandName,
        categoryId: product.CategoryId,
        category: product.categoryName,
        description: product.Description,
        fullDescription: product.FullDescription,
        rating: product.Rating,
        numReviews: product.NumReviews,
        isPromotional: product.IsPromotional,
        countInStock: product.CountInStock,
        warranty: product.Warranty,
        youtubeLink: product.YoutubeLink,
        specifications: product.Specifications,
        createdAt: product.CreatedAt,
        reviews: reviewsResult.recordset
    });
}));
// PUT /api/products/:id (Admin)
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const productExistsResult = await pool.request().input('Id', sql.Int, productId).query('SELECT * FROM Products WHERE Id = @Id');
    if (productExistsResult.recordset.length === 0) {
        res.status(404); throw new Error('Sản phẩm không tồn tại');
    }
    const existingProduct = productExistsResult.recordset[0];
    
    const updatedData = {
        Name: req.body.name,
        Price: req.body.price,
        OriginalPrice: req.body.originalPrice,
        Image: req.body.image,
        Images: req.body.images,
        BrandId: req.body.brandId,
        CategoryId: req.body.categoryId,
        Description: req.body.description,
        FullDescription: req.body.fullDescription,
        CountInStock: req.body.countInStock,
        IsPromotional: req.body.isPromotional,
        Warranty: req.body.warranty,
        YoutubeLink: req.body.youtubeLink,
        Specifications: req.body.specifications,
    };

    const request = pool.request();
    request.input('Id', sql.Int, productId);
    const setClauses = [];

    for (const key in updatedData) {
        if (updatedData[key] !== undefined) { 
            let sqlType;
            if (['Price', 'OriginalPrice'].includes(key)) { sqlType = sql.Decimal(18, 2); } 
            else if (['CountInStock', 'BrandId', 'CategoryId'].includes(key)) { sqlType = sql.Int; } 
            else if (['IsPromotional'].includes(key)) { sqlType = sql.Bit; }
            else { sqlType = sql.NVarChar; }
            
            request.input(key, sqlType, updatedData[key]);
            setClauses.push(`${key} = @${key}`);
        }
    }
    
    if (setClauses.length === 0) {
        return res.json({ message: 'Không có thông tin nào được cập nhật.' });
    }

    const result = await request.query(`
        UPDATE Products SET ${setClauses.join(', ')} 
        OUTPUT INSERTED.Id as id
        WHERE Id = @Id
    `);
    res.json(result.recordset[0]);
}));

// DELETE /api/products/:id (Admin)
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    await pool.request().input('ProductId', sql.Int, req.params.id).query('DELETE FROM Reviews WHERE ProductId = @ProductId');
    const result = await pool.request().input('Id', sql.Int, req.params.id).query('DELETE FROM Products WHERE Id = @Id');
    if (result.rowsAffected[0] === 0) { 
        res.status(404); throw new Error('Sản phẩm không tồn tại'); 
    }
    res.json({ message: 'Sản phẩm đã được xóa' });
}));

// GET /api/products/:id/related
router.get('/:id/related', asyncHandler(async (req, res) => {
    const currentProductResult = await pool.request().input('Id', sql.Int, req.params.id).query('SELECT CategoryId FROM Products WHERE Id = @Id');
    if (currentProductResult.recordset.length === 0) return res.json([]);
    
    const categoryId = currentProductResult.recordset[0].CategoryId;
    if (!categoryId) return res.json([]);

    const relatedResult = await pool.request().input('CategoryId', sql.Int, categoryId).input('Id', sql.Int, req.params.id).query(`
        SELECT TOP 4 p.Id as id, p.Name as name, p.Price as price, p.OriginalPrice as originalPrice, 
               p.Image as image, b.Name as brand, p.IsPromotional as isPromotional 
        FROM Products p
        LEFT JOIN Brands b ON p.BrandId = b.Id
        WHERE p.CategoryId = @CategoryId AND p.Id <> @Id AND p.IsDeleted = 0 ORDER BY NEWID()
    `);
    res.json(relatedResult.recordset);
}));

// POST /api/products/:id/reviews
router.post('/:id/reviews', protect, asyncHandler(async (req, res, next) => {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;
        const { id: userId, name: userName } = req.user;
        const existingReviewResult = await new sql.Request(transaction).input('UserId', sql.Int, userId).input('ProductId', sql.Int, productId).query('SELECT Id FROM Reviews WHERE UserId = @UserId AND ProductId = @ProductId');
        if (existingReviewResult.recordset.length > 0) {
            res.status(400); throw new Error('Bạn đã đánh giá sản phẩm này rồi');
        }
        await new sql.Request(transaction).input('Name', sql.NVarChar, userName).input('Rating', sql.Int, rating).input('Comment', sql.NVarChar, comment).input('UserId', sql.Int, userId).input('ProductId', sql.Int, productId).query('INSERT INTO Reviews (Name, Rating, Comment, UserId, ProductId) VALUES (@Name, @Rating, @Comment, @UserId, @ProductId)');
        await new sql.Request(transaction).input('ProductId', sql.Int, productId).query(`UPDATE Products SET NumReviews = (SELECT COUNT(*) FROM Reviews WHERE ProductId = @ProductId), Rating = (SELECT AVG(CAST(Rating AS DECIMAL(3,2))) FROM Reviews WHERE ProductId = @ProductId) WHERE Id = @ProductId`);
        await transaction.commit();
        res.status(201).json({ message: 'Đánh giá đã được thêm' });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}));


module.exports = router;