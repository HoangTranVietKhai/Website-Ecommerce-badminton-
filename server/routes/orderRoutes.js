// ===== File: server/routes/orderRoutes.js (HOÀN CHỈNH) =====

const express = require('express');
const asyncHandler = require('express-async-handler');
const sql = require('mssql');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private
// ===== File: server/routes/orderRoutes.js (SỬA LỖI ĐẶT HÀNG - PHIÊN BẢN CUỐI CÙNG) =====

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private
router.post('/', protect, asyncHandler(async (req, res, next) => {
    const { orderItems, shippingAddress, paymentMethod, applyFirstOrderDiscount } = req.body;

    // === BƯỚC 1: KIỂM TRA ĐẦU VÀO CƠ BẢN ===
    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('Không có sản phẩm trong đơn hàng.');
    }
    if (!shippingAddress || !shippingAddress.address) {
        res.status(400);
        throw new Error('Thông tin giao hàng không đầy đủ.');
    }

    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();

        // === BƯỚC 2: LẤY THÔNG TIN SẢN PHẨM THỰC TẾ TỪ DB (GIÁ, TỒN KHO) ===
        const productIds = orderItems.map(item => parseInt(item.product, 10)).filter(id => !isNaN(id));
        const stringIds = orderItems
            .filter(item => item.stringingInfo && item.stringingInfo.stringId)
            .map(item => parseInt(item.stringingInfo.stringId, 10)).filter(id => !isNaN(id));
        
        let allIds = [...new Set([...productIds, ...stringIds])];

        if (allIds.length === 0) {
            throw new Error('Đơn hàng không có ID sản phẩm hợp lệ.');
        }

        // Tạo câu query an toàn với parameters
        const idParams = allIds.map((_, i) => `@id${i}`).join(',');
        const request = new sql.Request(transaction);
        allIds.forEach((id, i) => request.input(`id${i}`, sql.Int, id));
        
        const dbProductsResult = await request.query(`SELECT Id, Name, Price, CountInStock FROM Products WHERE Id IN (${idParams})`);
        
        const dbProductsMap = new Map(dbProductsResult.recordset.map(p => [p.Id, p]));

        // === BƯỚC 3: XÁC THỰC TỪNG SẢN PHẨM VÀ TÍNH TOÁN LẠI TỔNG TIỀN ===
        let serverCalculatedItemsPrice = 0;
        let serverCalculatedStringingPrice = 0;

        for (const item of orderItems) {
            const dbProduct = dbProductsMap.get(parseInt(item.product));

            // Kiểm tra sản phẩm có tồn tại không
            if (!dbProduct) {
                throw new Error(`Sản phẩm "${item.name}" không còn tồn tại trong hệ thống.`);
            }

            // ++ SỬA LỖI QUAN TRỌNG: KIỂM TRA TỒN KHO ++
            if (dbProduct.CountInStock < item.qty) {
                throw new Error(`Sản phẩm "${item.name}" không đủ hàng. Trong kho chỉ còn ${dbProduct.CountInStock} sản phẩm.`);
            }
            
            // Dùng giá từ DB, không tin tưởng giá từ client
            serverCalculatedItemsPrice += dbProduct.Price * item.qty;

            // Xử lý giá cước nếu có
            if (item.stringingInfo && item.stringingInfo.stringId) {
                 const dbString = dbProductsMap.get(parseInt(item.stringingInfo.stringId));
                 if (!dbString) {
                    throw new Error(`Loại cước cho sản phẩm "${item.name}" không hợp lệ.`);
                 }
                 item.stringingInfo.stringPrice = dbString.Price;
                 serverCalculatedStringingPrice += dbString.Price * item.qty;
            }
        }
         let discountAmount = 0;
        let discountCode = null;

        if (applyFirstOrderDiscount) {
            // Xác thực lại ở backend để đảm bảo an toàn
            const userOrderCountResult = await new sql.Request(transaction)
                .input('UserId', sql.Int, req.user.id)
                .query('SELECT COUNT(*) as orderCount FROM Orders WHERE UserId = @UserId');
            
            if (userOrderCountResult.recordset[0].orderCount === 0) {
                discountAmount = (serverCalculatedItemsPrice + serverCalculatedStringingPrice) * 0.15;
                discountCode = 'FIRST_ORDER_15';
            }
        }
        
        const subtotal = serverCalculatedItemsPrice + serverCalculatedStringingPrice;
        const shippingPrice = subtotal > 2000000 ? 0 : 30000;
        const serverCalculatedTotalPrice = subtotal + shippingPrice - discountAmount;

        // === BƯỚC 4: TẠO ĐƠN HÀNG VỚI DỮ LIỆU ĐÃ ĐƯỢC XÁC THỰC ===
        const orderResult = await new sql.Request(transaction)
            .input('UserId', sql.Int, req.user.id)
            .input('ShippingAddress', sql.NVarChar, shippingAddress.address)
            .input('City', sql.NVarChar, shippingAddress.city)
            .input('PostalCode', sql.NVarChar, shippingAddress.postalCode)
            .input('Country', sql.NVarChar, shippingAddress.country)
            .input('PaymentMethod', sql.NVarChar, paymentMethod)
            .input('ShippingPrice', sql.Decimal(18, 2), shippingPrice)
            .input('TotalPrice', sql.Decimal(18, 2), serverCalculatedTotalPrice)
            .input('DiscountAmount', sql.Decimal(18, 2), discountAmount) // Thêm input
            .input('DiscountCode', sql.NVarChar, discountCode) 
               .query(`INSERT INTO Orders (UserId, ShippingAddress, City, PostalCode, Country, PaymentMethod, ShippingPrice, TotalPrice, DiscountAmount, DiscountCode)
                    OUTPUT INSERTED.Id
                    VALUES (@UserId, @ShippingAddress, @City, @PostalCode, @Country, @PaymentMethod, @ShippingPrice, @TotalPrice, @DiscountAmount, @DiscountCode)`);  
            const orderId = orderResult.recordset[0].Id;

        // === BƯỚC 5: GHI CÁC MỤC ĐƠN HÀNG VÀ CẬP NHẬT TỒN KHO ===
        for (const item of orderItems) {
            const dbProduct = dbProductsMap.get(parseInt(item.product));

            // Ghi vào OrderItems
            await new sql.Request(transaction)
                .input('OrderId', sql.Int, orderId)
                .input('ProductId', sql.Int, item.product)
                .input('Name', sql.NVarChar, item.name)
                .input('Quantity', sql.Int, item.qty)
                .input('Price', sql.Decimal(18, 2), dbProduct.Price) // Dùng giá từ DB
                .input('Image', sql.NVarChar, item.image)
                .input('StringingInfo', sql.NVarChar, item.stringingInfo ? JSON.stringify(item.stringingInfo) : null)
                .query(`INSERT INTO OrderItems (OrderId, ProductId, Name, Quantity, Price, Image, StringingInfo)
                        VALUES (@OrderId, @ProductId, @Name, @Quantity, @Price, @Image, @StringingInfo)`);
            
            // Cập nhật tồn kho
            await new sql.Request(transaction)
                .input('Quantity', sql.Int, item.qty)
                .input('ProductId', sql.Int, item.product)
                .query('UPDATE Products SET CountInStock = CountInStock - @Quantity WHERE Id = @ProductId');
        }

        await transaction.commit();
        
        res.status(201).json({ id: orderId });

    } catch (err) {
        await transaction.rollback();
        // Ném lỗi với status code để middleware xử lý
        // Nếu là lỗi do người dùng (ví dụ hết hàng), trả về 400. Lỗi hệ thống trả về 500.
        const statusCode = err.message.includes("không đủ hàng") || err.message.includes("không còn tồn tại") ? 400 : 500;
        res.status(statusCode);
        next(err); // Chuyển lỗi cho errorHandler
    }
}));


// @desc    Lấy các đơn hàng của người dùng đăng nhập
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, asyncHandler(async (req, res) => {
    // ++ CẢI TIẾN: Trả về camelCase
    const orders = await pool.request()
        .input('UserId', sql.Int, req.user.id) // dùng req.user.id
        .query(`
            SELECT 
                Id as id, UserId as userId, CreatedAt as createdAt, TotalPrice as totalPrice, 
                IsPaid as isPaid, PaidAt as paidAt, IsDelivered as isDelivered, DeliveredAt as deliveredAt
            FROM Orders 
            WHERE UserId = @UserId 
            ORDER BY CreatedAt DESC
        `);
    res.json(orders.recordset);
}));

// @desc    Lấy một đơn hàng theo ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const request = pool.request().input('Id', sql.Int, orderId);

    // ++ SỬA LỖI: Đã xóa "o.UpdatedAt as updatedAt" khỏi câu query
    let query = `
        SELECT 
            o.Id as id, o.CreatedAt as createdAt, 
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
        WHERE o.Id = @Id
    `;

    if (req.user.role !== 'admin') {
        query += ' AND o.UserId = @UserId';
        request.input('UserId', sql.Int, req.user.id);
    }
    
    const result = await request.query(query);

    if (result.recordset.length === 0) {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.');
    }

    const firstRow = result.recordset[0];
    const order = {
        id: firstRow.id,
        createdAt: firstRow.createdAt,
        // updatedAt: firstRow.updatedAt, // <- Đã xóa dòng này
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
            .filter(row => row.orderItemId)
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
}));

// @route   GET /api/orders
// @desc    Lấy tất cả đơn hàng (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * pageSize;

    // ++ CẢI TIẾN: Thêm logic cho tìm kiếm và lọc
    const { keyword, status, dateFrom, dateTo } = req.query;

    const request = pool.request();
    const countRequest = pool.request();
    
    // Sử dụng một mảng để xây dựng các điều kiện WHERE
    let whereClauses = [];

    // Lọc theo từ khóa (ID đơn hàng hoặc tên khách hàng)
    if (keyword) {
        whereClauses.push('(CAST(o.Id AS NVARCHAR(10)) LIKE @keyword OR u.Name LIKE @keyword)');
        request.input('keyword', sql.NVarChar, `%${keyword}%`);
        countRequest.input('keyword', sql.NVarChar, `%${keyword}%`);
    }

    // Lọc theo trạng thái thanh toán
    if (status === 'paid') {
        whereClauses.push('o.IsPaid = 1');
    } else if (status === 'notpaid') {
        whereClauses.push('o.IsPaid = 0');
    }

    // Lọc theo trạng thái giao hàng
    if (status === 'delivered') {
        whereClauses.push('o.IsDelivered = 1');
    } else if (status === 'notdelivered') {
        whereClauses.push('o.IsDelivered = 0');
    }
    
    // Lọc theo khoảng ngày (chưa làm ở bước này, sẽ thêm nếu cần)

    // Nối các điều kiện WHERE lại với nhau
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
        SELECT 
            o.Id as id, o.CreatedAt as createdAt, o.TotalPrice as totalPrice, 
            o.IsPaid as isPaid, o.IsDelivered as isDelivered, u.Name as userName 
        FROM Orders o JOIN Users u ON o.UserId = u.Id 
        ${whereClause}
        ORDER BY o.CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
    `;
    request.input('offset', sql.Int, offset);
    request.input('pageSize', sql.Int, pageSize);

    const countQuery = `SELECT COUNT(*) as total FROM Orders o JOIN Users u ON o.UserId = u.Id ${whereClause}`;

    const [orderResult, countResult] = await Promise.all([
        request.query(query),
        countRequest.query(countQuery)
    ]);

    const totalOrders = countResult.recordset[0].total;

    res.json({
        orders: orderResult.recordset,
        page: page,
        pages: Math.ceil(totalOrders / pageSize),
    });
}));

// @route   PUT /api/orders/:id/deliver
// @desc    Cập nhật trạng thái đã giao hàng (Admin only)
// @access  Private/Admin
router.put('/:id/deliver', protect, admin, asyncHandler(async (req, res) => {
    const result = await pool.request()
        .input('Id', sql.Int, req.params.id)
        .query('UPDATE Orders SET IsDelivered = 1, DeliveredAt = GETDATE() WHERE Id = @Id');

    if (result.rowsAffected[0] > 0) {
        res.json({ message: 'Đơn hàng đã được cập nhật là đã giao' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng');
    }
}));

// @route   PUT /api/orders/:id/pay
// @desc    Cập nhật trạng thái đã thanh toán (Admin only)
// @access  Private/Admin
router.put('/:id/pay', protect, admin, asyncHandler(async (req, res) => {
    const result = await pool.request()
        .input('Id', sql.Int, req.params.id)
        .query('UPDATE Orders SET IsPaid = 1, PaidAt = GETDATE() WHERE Id = @Id');

    if (result.rowsAffected[0] > 0) {
        res.json({ message: 'Đơn hàng đã được cập nhật là đã thanh toán' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng');
    }
}));
module.exports = router;