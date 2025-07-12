const express = require('express');
const asyncHandler = require('express-async-handler');
const sql = require('mssql');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');

const router = express.Router();

// @desc    Lấy tất cả danh mục kèm số lượng sản phẩm
// @route   GET /api/categories
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    // TỐI ƯU: Dùng LEFT JOIN và GROUP BY để chạy 1 query duy nhất
    const result = await pool.request().query(`
        SELECT 
            c.Id as id, 
            c.Name as name, 
            c.ParentId as parentId,
            COUNT(p.Id) as productCount
        FROM 
            Categories c
        LEFT JOIN 
            Products p ON c.Id = p.CategoryId AND p.IsDeleted = 0
        GROUP BY
            c.Id, c.Name, c.ParentId
        ORDER BY 
            c.Name ASC
    `);
    res.json(result.recordset);
}));

// @desc    Tạo danh mục mới
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const { name, parentId } = req.body;
    if (!name || name.trim() === '') {
        res.status(400);
        throw new Error('Tên danh mục không được để trống');
    }
    const result = await pool.request()
        .input('Name', sql.NVarChar, name)
        .input('ParentId', sql.Int, parentId || null)
        .query('INSERT INTO Categories (Name, ParentId) OUTPUT INSERTED.Id as id, INSERTED.Name as name, INSERTED.ParentId as parentId, 0 as productCount VALUES (@Name, @ParentId)');
    res.status(201).json(result.recordset[0]);
}));

// @desc    Cập nhật tên danh mục
// @route   PUT /api/categories/:id
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
        .query('UPDATE Categories SET Name = @Name OUTPUT INSERTED.Id as id, INSERTED.Name as name, INSERTED.ParentId as parentId WHERE Id = @Id');

    if (result.recordset.length > 0) {
        res.json(result.recordset[0]);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy danh mục');
    }
}));


// @desc    Xóa danh mục
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const checkResult = await pool.request().input('CategoryId', sql.Int, req.params.id).query('SELECT COUNT(*) as productCount FROM Products WHERE CategoryId = @CategoryId AND IsDeleted = 0');
    if (checkResult.recordset[0].productCount > 0) {
        res.status(400);
        throw new Error('Không thể xóa danh mục đang được sản phẩm sử dụng.');
    }
    const deleteResult = await pool.request().input('Id', sql.Int, req.params.id).query('DELETE FROM Categories WHERE Id = @Id');
    
    if (deleteResult.rowsAffected[0] > 0) {
        res.json({ message: 'Xóa danh mục thành công' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy danh mục để xóa.');
    }
}));

module.exports = router;