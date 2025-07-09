// ===== File: server/middleware/authMiddleware.js (FIXED) =====
const jwt = require('jsonwebtoken');
const asyncHandler =require('express-async-handler');
const sql = require('mssql');
const { pool } = require('../config/db.js');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Sửa lỗi: Thêm điều kiện `IsDeleted = 0` để không xác thực người dùng đã bị xóa.
            // Cải tiến: Trả về key dạng camelCase.
            const result = await pool.request()
                .input('Id', sql.Int, decoded.userId)
                .query(`
                    SELECT 
                        Id as id, 
                        Name as name, 
                        Email as email, 
                        Role as role 
                    FROM Users 
                    WHERE Id = @Id AND IsDeleted = 0
                `);

            if (result.recordset.length === 0) {
                res.status(401);
                throw new Error('Not authorized, user not found or has been deleted');
            }
            // req.user giờ sẽ có các key camelCase
            req.user = result.recordset[0];
            
            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };