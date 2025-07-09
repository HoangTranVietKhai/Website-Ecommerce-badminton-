const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const { protect, admin } = require('../middleware/authMiddleware.js');
const { pool } = require('../config/db.js');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// @route   POST /api/users/register
// @desc    Đăng ký người dùng mới
// @access  Public
router.post(
    '/register',
    [
        body('name', 'Tên không được để trống').not().isEmpty().trim().escape(),
        body('email', 'Vui lòng nhập một email hợp lệ').isEmail().normalizeEmail(),
        body('password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 }),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;

        const userExistsResult = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT Id FROM Users WHERE Email = @Email AND IsDeleted = 0');

        if (userExistsResult.recordset.length > 0) {
            res.status(400);
            throw new Error('Email đã được sử dụng');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.request()
            .input('Name', sql.NVarChar, name)
            .input('Email', sql.NVarChar, email)
            .input('Password', sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO Users (Name, Email, Password) 
                OUTPUT INSERTED.Id as id, INSERTED.Name as name, INSERTED.Email as email, INSERTED.Role as role 
                VALUES (@Name, @Email, @Password)
            `);

        const newUser = result.recordset[0];

        if (newUser) {
            const payload = { userId: newUser.id, role: newUser.role };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

            res.status(201).json({
                token,
                user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
            });
        } else {
            res.status(400);
            throw new Error('Dữ liệu người dùng không hợp lệ');
        }
    })
);


// @route   POST /api/users/login
// @desc    Đăng nhập và trả về token
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // =======================================================================
    // SỬA LỖI Ở ĐÂY: Dùng alias để thống nhất camelCase
    // =======================================================================
    const result = await pool.request()
        .input('Email', sql.NVarChar, email)
        .query(`
            SELECT Id as id, Name as name, Email as email, Password as password, Role as role 
            FROM Users 
            WHERE Email = @Email AND IsDeleted = 0
        `);

    const user = result.recordset[0];

    // Sửa lỗi: So sánh với user.password (thay vì user.Password)
    if (user && (await bcrypt.compare(password, user.password))) {
        // Sửa lỗi: Tạo payload từ user.id (thay vì user.Id)
        const payload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Sửa lỗi: Trả về object user đã được chuẩn hóa
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } else {
        res.status(401);
        throw new Error('Email hoặc mật khẩu không đúng');
    }
    // =======================================================================
    // KẾT THÚC PHẦN SỬA LỖI
    // =======================================================================
}));


// @route   GET /api/users/profile
// @desc    Lấy thông tin profile của người dùng
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
    const user = req.user;
    if (user) {
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
}));


// @route   PUT /api/users/profile
// @desc    Cập nhật thông tin profile của người dùng
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
    const user = req.user;
    const { name, email, password } = req.body;

    let setClauses = [];
    const request = pool.request().input('Id', sql.Int, user.id); 

    if (name) {
        setClauses.push("Name = @Name");
        request.input('Name', sql.NVarChar, name);
    }
    if (email) {
        setClauses.push("Email = @Email");
        request.input('Email', sql.NVarChar, email);
    }
    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        setClauses.push("Password = @Password");
        request.input('Password', sql.NVarChar, hashedPassword);
    }
    
    if (setClauses.length > 0) {
        const query = `
            UPDATE Users 
            SET ${setClauses.join(', ')} 
            OUTPUT INSERTED.Id as id, INSERTED.Name as name, INSERTED.Email as email, INSERTED.Role as role 
            WHERE Id = @Id
        `;
        const result = await request.query(query);
        const updatedUser = result.recordset[0];
        
        res.json({ user: updatedUser });
    } else {
        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
}));

// @route   GET /api/users
// @desc    Lấy tất cả người dùng (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, asyncHandler(async (req, res, next) => {
    try {
        const pageSize = parseInt(req.query.pageSize) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * pageSize;

        const userRequest = pool.request();
        const countRequest = pool.request();

        const userQuery = `
            SELECT Id as id, Name as name, Email as email, Role as role, CreatedAt as createdAt
            FROM Users 
            WHERE IsDeleted = 0
            ORDER BY CreatedAt DESC
            OFFSET @offset ROWS
            FETCH NEXT @pageSize ROWS ONLY
        `;
        userRequest.input('offset', sql.Int, offset);
        userRequest.input('pageSize', sql.Int, pageSize);

        const countQuery = `SELECT COUNT(*) as total FROM Users WHERE IsDeleted = 0`;

        const [userResult, countResult] = await Promise.all([
            userRequest.query(userQuery),
            countRequest.query(countQuery)
        ]);

        const totalUsers = countResult.recordset[0].total;
        
        res.json({
            users: userResult.recordset, 
            page: page,
            pages: Math.ceil(totalUsers / pageSize),
            count: totalUsers
        });

    } catch (error) {
        next(error);
    }
}));

// @route   GET /api/users/:id
// @desc    Lấy thông tin người dùng theo ID bởi Admin
// @access  Private/Admin
router.get('/:id', protect, admin, asyncHandler(async (req, res) => {
    const result = await pool.request()
        .input('Id', sql.Int, req.params.id)
        .query('SELECT Id as id, Name as name, Email as email, Role as role FROM Users WHERE Id = @Id AND IsDeleted = 0');
    
    if (result.recordset.length > 0) {
        res.json(result.recordset[0]);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
}));

// @route   PUT /api/users/:id
// @desc    Cập nhật thông tin người dùng bởi Admin
// @access  Private/Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;
    
    const request = pool.request()
        .input('Id', sql.Int, req.params.id)
        .input('Name', sql.NVarChar, name)
        .input('Email', sql.NVarChar, email)
        .input('Role', sql.NVarChar, role);

    const query = `
        UPDATE Users 
        SET Name = @Name, Email = @Email, Role = @Role 
        OUTPUT INSERTED.Id as id, INSERTED.Name as name, INSERTED.Email as email, INSERTED.Role as role 
        WHERE Id = @Id
    `;
    const result = await request.query(query);

    if (result.recordset.length > 0) {
        res.json(result.recordset[0]);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng để cập nhật');
    }
}));

// @route   DELETE /api/users/:id
// @desc    Xóa người dùng (Admin only) - SOFT DELETE
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const userIdToDelete = req.params.id;

    if (parseInt(userIdToDelete, 10) === req.user.id) {
        res.status(400);
        throw new Error('Không thể tự xóa tài khoản admin của chính mình.');
    }
    
    const result = await pool.request()
        .input('Id', sql.Int, userIdToDelete)
        .query('UPDATE Users SET IsDeleted = 1 WHERE Id = @Id');
    
    if (result.rowsAffected[0] > 0) {
        res.json({ message: 'Người dùng đã được vô hiệu hóa' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
}));

router.get('/check-discount', protect, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const result = await pool.request()
        .input('UserId', sql.Int, userId)
        .query('SELECT COUNT(*) as orderCount FROM Orders WHERE UserId = @UserId');

    const orderCount = result.recordset[0].orderCount;

    if (orderCount === 0) {
        // Đây là người mua lần đầu
        res.json({
            eligible: true,
            discountPercent: 15,
            message: "Chúc mừng! Bạn được giảm giá 15% cho đơn hàng đầu tiên."
        });
    } else {
        // Người dùng đã có đơn hàng
        res.json({ eligible: false });
    }
}));

module.exports = router;