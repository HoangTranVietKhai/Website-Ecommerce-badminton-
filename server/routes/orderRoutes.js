// ===== File: server/routes/orderRoutes.js (SỬA LỖI ĐẶT HÀNG & BẢO MẬT) =====

const express = require('express');
const asyncHandler = require('express-async-handler');
const sql = require('mssql');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private
router.post('/', protect, asyncHandler(async (req, res, next) => {
    const { orderItems, shippingAddress, paymentMethod, applyFirstOrderDiscount } = req.body;

    if (!orderItems || orderItems.length === 0) {
        res.status(400); throw new Error('Không có sản phẩm trong đơn hàng.');
    }
    if (!shippingAddress || !shippingAddress.address) {
        res.status(400); throw new Error('Thông tin giao hàng không đầy đủ.');
    }

    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();

        const productIds = orderItems.map(item => parseInt(item.product, 10)).filter(id => !isNaN(id));
        const stringIds = orderItems
            .filter(item => item.stringingInfo && item.stringingInfo.stringId && item.stringingInfo.stringId !== 'none')
            .map(item => parseInt(item.stringingInfo.stringId, 10)).filter(id => !isNaN(id));
        
        let allIds = [...new Set([...productIds, ...stringIds])];

        if (allIds.length === 0) {
            throw new Error('Đơn hàng không có ID sản phẩm hợp lệ.');
        }

        const idParams = allIds.map((_, i) => `@id${i}`).join(',');
        const request = new sql.Request(transaction);
        allIds.forEach((id, i) => request.input(`id${i}`, sql.Int, id));
        
        const dbProductsResult = await request.query(`SELECT Id, Name, Price, CountInStock FROM Products WHERE Id IN (${idParams})`);
        const dbProductsMap = new Map(dbProductsResult.recordset.map(p => [p.Id, p]));

        let serverCalculatedItemsPrice = 0;
        let serverCalculatedStringingPrice = 0;

        for (const item of orderItems) {
            const dbProduct = dbProductsMap.get(parseInt(item.product));

            if (!dbProduct) {
                throw new Error(`Sản phẩm "${item.name}" không còn tồn tại.`);
            }
            if (dbProduct.CountInStock < item.qty) {
                throw new Error(`Sản phẩm "${item.name}" không đủ hàng. Trong kho chỉ còn ${dbProduct.CountInStock}.`);
            }
            
            serverCalculatedItemsPrice += dbProduct.Price * item.qty;

            if (item.stringingInfo && item.stringingInfo.stringId && item.stringingInfo.stringId !== 'none') {
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
            const userOrderCountResult = await new sql.Request(transaction)
                .input('UserId', sql.Int, req.user.id)
                .query('SELECT COUNT(*) as orderCount FROM Orders WHERE UserId = @UserId');
            
            if (userOrderCountResult.recordset[0].orderCount === 0) {
                const totalForDiscount = serverCalculatedItemsPrice + serverCalculatedStringingPrice;
                discountAmount = totalForDiscount * 0.15;
                discountCode = 'FIRST_ORDER_15';
            }
        }
        
        const subtotal = serverCalculatedItemsPrice + serverCalculatedStringingPrice;
        const shippingPrice = subtotal > 2000000 ? 0 : 30000;
        const serverCalculatedTotalPrice = subtotal + shippingPrice - discountAmount;

        const orderResult = await new sql.Request(transaction)
            .input('UserId', sql.Int, req.user.id)
            .input('ShippingAddress', sql.NVarChar, shippingAddress.address)
            .input('City', sql.NVarChar, shippingAddress.city)
            .input('PostalCode', sql.NVarChar, shippingAddress.postalCode)
            .input('Country', sql.NVarChar, shippingAddress.country)
            .input('PaymentMethod', sql.NVarChar, paymentMethod)
            .input('ShippingPrice', sql.Decimal(18, 2), shippingPrice)
            .input('TotalPrice', sql.Decimal(18, 2), serverCalculatedTotalPrice)
            .input('DiscountAmount', sql.Decimal(18, 2), discountAmount)
            .input('DiscountCode', sql.NVarChar, discountCode)
            .query(`INSERT INTO Orders (UserId, ShippingAddress, City, PostalCode, Country, PaymentMethod, ShippingPrice, TotalPrice, DiscountAmount, DiscountCode)
                    OUTPUT INSERTED.Id
                    VALUES (@UserId, @ShippingAddress, @City, @PostalCode, @Country, @PaymentMethod, @ShippingPrice, @TotalPrice, @DiscountAmount, @DiscountCode)`);  
        const orderId = orderResult.recordset[0].Id;

        for (const item of orderItems) {
            const dbProduct = dbProductsMap.get(parseInt(item.product));

            await new sql.Request(transaction)
                .input('OrderId', sql.Int, orderId)
                .input('ProductId', sql.Int, item.product)
                .input('Name', sql.NVarChar, item.name)
                .input('Quantity', sql.Int, item.qty)
                .input('Price', sql.Decimal(18, 2), dbProduct.Price)
                .input('Image', sql.NVarChar, item.image)
                .input('StringingInfo', sql.NVarChar, item.stringingInfo ? JSON.stringify(item.stringingInfo) : null)
                .query(`INSERT INTO OrderItems (OrderId, ProductId, Name, Quantity, Price, Image, StringingInfo)
                        VALUES (@OrderId, @ProductId, @Name, @Quantity, @Price, @Image, @StringingInfo)`);
            
            await new sql.Request(transaction)
                .input('Quantity', sql.Int, item.qty)
                .input('ProductId', sql.Int, item.product)
                .query('UPDATE Products SET CountInStock = CountInStock - @Quantity WHERE Id = @ProductId');
        }

        await transaction.commit();
        
        const createdOrder = await pool.request().input('OrderId', sql.Int, orderId).query('SELECT Id as id FROM Orders WHERE Id = @OrderId');
        res.status(201).json(createdOrder.recordset[0]);

    } catch (err) {
        await transaction.rollback();
        const statusCode = err.message.includes("không đủ hàng") || err.message.includes("không còn tồn tại") ? 400 : 500;
        res.status(statusCode);
        next(err);
    }
}));


router.get('/myorders', protect, asyncHandler(async (req, res) => {
    const orders = await pool.request()
        .input('UserId', sql.Int, req.user.id)
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

router.get('/:id', protect, asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const request = pool.request().input('Id', sql.Int, orderId);

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
        isPaid: firstRow.isPaid,
        paidAt: firstRow.paidAt,
        isDelivered: firstRow.isDelivered,
        deliveredAt: firstRow.deliveredAt,
        totalPrice: parseFloat(firstRow.totalPrice),
        shippingPrice: parseFloat(firstRow.shippingPrice),
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
                price: parseFloat(row.itemPrice),
                image: row.image,
                stringingInfo: row.stringingInfo ? JSON.parse(row.stringingInfo) : null
            }))
    };

    res.json(order);
}));

router.get('/', protect, admin, asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * pageSize;

    const { keyword, status } = req.query;

    const request = pool.request();
    const countRequest = pool.request();
    
    let whereClauses = [];

    if (keyword) {
        whereClauses.push('(CAST(o.Id AS NVARCHAR(10)) LIKE @keyword OR u.Name LIKE @keyword)');
        request.input('keyword', sql.NVarChar, `%${keyword}%`);
        countRequest.input('keyword', sql.NVarChar, `%${keyword}%`);
    }

    if (status === 'paid') whereClauses.push('o.IsPaid = 1');
    else if (status === 'notpaid') whereClauses.push('o.IsPaid = 0');
    if (status === 'delivered') whereClauses.push('o.IsDelivered = 1');
    else if (status === 'notdelivered') whereClauses.push('o.IsDelivered = 0');
    
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
        orders: orderResult.recordset.map(o => ({...o, totalPrice: parseFloat(o.totalPrice)})),
        page: page,
        pages: Math.ceil(totalOrders / pageSize),
        count: totalOrders
    });
}));

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

router.post('/:id/create-zalopay-payment', protect, asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const orderResult = await pool.request()
        .input('Id', sql.Int, orderId)
        .input('UserId', sql.Int, req.user.id)
        .query('SELECT TotalPrice as totalPrice, IsPaid as isPaid FROM Orders WHERE Id = @Id AND UserId = @UserId');

    const order = orderResult.recordset[0];
    if (!order) {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng.');
    }
    if (order.isPaid) {
        res.status(400);
        throw new Error('Đơn hàng này đã được thanh toán.');
    }

    const mockUrl = `/zalopay-mock.html?orderId=${orderId}&amount=${order.totalPrice}&originalUrl=/order.html?id=${orderId}`;

    res.json({
        return_code: 1,
        order_url: mockUrl,
    });
}));

router.post('/zalopay-mock-callback', asyncHandler(async (req, res) => {
    const { orderId, status } = req.body;
    console.log(`[MOCK CALLBACK] Nhận callback cho đơn hàng ${orderId} với trạng thái ${status}`);
    
    if (status === 'success') {
         await pool.request()
            .input('Id', sql.Int, orderId)
            .query("UPDATE Orders SET IsPaid = 1, PaidAt = GETDATE(), PaymentMethod = 'ZaloPay (Mock)' WHERE Id = @Id");
        console.log(`[MOCK CALLBACK] Đã cập nhật đơn hàng ${orderId} thành công.`);
    }
    res.status(200).json({ message: 'Callback received' });
}));

module.exports = router;