// ===== server/models/userModel.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Email phải là duy nhất
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' } // Vai trò: user hoặc admin
}, { timestamps: true });

// Middleware: Tự động mã hóa mật khẩu TRƯỚC KHI lưu vào database
userSchema.pre('save', async function (next) {
    // Chỉ mã hóa nếu mật khẩu được thay đổi (hoặc là người dùng mới)
    if (!this.isModified('password')) {
        return next();
    }
    // Tạo "muối" để tăng cường bảo mật và mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;