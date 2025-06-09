// ===== server/middleware/authMiddleware.js =====
const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');

const protect = async (req, res, next) => {
    let token;
    // Kiểm tra xem header có chứa token 'Bearer' không
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token ra khỏi header (Bỏ chữ 'Bearer ')
            token = req.headers.authorization.split(' ')[1];
            
            // Giải mã token để lấy thông tin (userId, role)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Tìm người dùng trong DB dựa trên ID từ token, và gắn vào đối tượng request
            req.user = await User.findById(decoded.userId).select('-password');
            
            next(); // Cho phép đi tiếp
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    // Middleware này phải được dùng SAU middleware 'protect'
    if (req.user && req.user.role === 'admin') {
        next(); // Nếu là admin, cho đi tiếp
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' }); // 403: Forbidden
    }
};

module.exports = { protect, admin };    