// ===== server/middleware/errorMiddleware.js (FILE MỚI) =====

// Middleware để bắt các route không tồn tại (lỗi 404)
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Middleware để bắt tất cả các lỗi khác
const errorHandler = (err, req, res, next) => {
    // Đôi khi lỗi có status 200, cần chuyển nó thành 500
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Xử lý lỗi đặc biệt của Mongoose (ví dụ: CastError khi ID không hợp lệ)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
    }

    res.status(statusCode).json({
        message: message,
        // Chỉ hiển thị stack trace khi ở môi trường development
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };