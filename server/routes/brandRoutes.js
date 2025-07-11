const express = require('express');
const asyncHandler = require('express-async-handler');
const sql = require('mssql');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Lấy tất cả thương hiệu kèm số lượng sản phẩm
// @route   GET /api/brands
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    // TỐI ƯU: Dùng LEFT JOIN và GROUP BY để chạy 1 query duy nhất
    const result = await pool.request().query(`
        SELECT 
            b.Id as id, 
            b.Name as name, 
            b.LogoUrl as logoUrl,
            COUNT(p.Id) as productCount
        FROM 
            Brands b
        LEFT JOIN 
            Products p ON b.Id = p.BrandId AND p.IsDeleted = 0
        GROUP BY 
            b.Id, b.Name, b.LogoUrl
        ORDER BY 
            b.Name ASC
    `);
    res.json(result.recordset);
}));

// @desc    Tạo thương hiệu mới
// @route   POST /api/brands
// @access  Private/Admin
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const { name, logoUrl } = req.body;
    if (!name || name.trim() === '') {
        res.status(400);
        throw new Error('Tên thương hiệu không được để trống');
    }
    const result = await pool.request()
        .input('Name', sql.NVarChar, name)
        .input('LogoUrl', sql.NVarChar, logoUrl)
        .query('INSERT INTO Brands (Name, LogoUrl) OUTPUT INSERTED.Id as id, INSERTED.Name as name, INSERTED.LogoUrl as logoUrl, 0 as productCount VALUES (@Name, @LogoUrl)');
    res.status(201).json(result.recordset[0]);
}));

// @desc    Cập nhật tên thương hiệu
// @route   PUT /api/brands/:id
// @access  Private/Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        res.status(400);
        throw new Error('Tên không được để trống');
    }
    const result = await pool.request()
        .input('Id', sql.Int, req.params.id)
        .input('Name', sql.NVarChar, name)
        .query('UPDATE Brands SET Name = @Name OUTPUT INSERTED.Id as id, INSERTED.Name as name WHERE Id = @Id');

    if (result.recordset.length > 0) {
        res.json(result.recordset[0]);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy thương hiệu');
    }
}));


// @desc    Xóa thương hiệu
// @route   DELETE /api/brands/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const checkResult = await pool.request().input('BrandId', sql.Int, req.params.id).query('SELECT COUNT(*) as productCount FROM Products WHERE BrandId = @BrandId AND IsDeleted = 0');
    if (checkResult.recordset[0].productCount > 0) {
        res.status(400);
        throw new Error('Không thể xóa thương hiệu đang được sản phẩm sử dụng.');
    }
    const deleteResult = await pool.request().input('Id', sql.Int, req.params.id).query('DELETE FROM Brands WHERE Id = @Id');

    if (deleteResult.rowsAffected[0] > 0) {
        res.json({ message: 'Xóa thương hiệu thành công' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy thương hiệu để xóa.');
    }
}));

module.exports = router;