// ===== server/server.js (BẢN SỬA LỖI ĐƯỜNG DẪN) =====

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import các file routes
const productRoutes = require('./routes/productRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');

// Import middleware xử lý lỗi
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// --- 1. ĐỊNH NGHĨA CÁC ROUTE API ---
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- 2. CẤU HÌNH PHỤC VỤ FRONTEND ---

// SỬA LỖI TẠI ĐÂY:
// Thay vì dùng path.resolve(), chúng ta sẽ đi lùi một cấp từ thư mục hiện tại (__dirname)
// để trỏ ra thư mục gốc của dự án (GUITAR_SHIP2).
const __projectRoot = path.join(__dirname, '..');

// Phục vụ các file tĩnh (HTML, CSS, JS, images...) từ thư mục 'client'
app.use(express.static(path.join(__projectRoot, 'client')));

// Route "catch-all": Mọi request GET không khớp với các route API ở trên
// sẽ được chuyển về file index.html của frontend.
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__projectRoot, 'client', 'index.html'));
});


// --- 3. MIDDLEWARE XỬ LÝ LỖI (LUÔN ĐẶT Ở CUỐI CÙNG) ---
app.use(notFound);
app.use(errorHandler);

// --- 4. KHỞI ĐỘNG SERVER ---
const uri = process.env.ATLAS_URI;
mongoose.connect(uri)
    .then(() => {
        console.log("MongoDB database connection established successfully!");
        app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
    })
    .catch(err => console.error("Could not connect to MongoDB:", err)); 