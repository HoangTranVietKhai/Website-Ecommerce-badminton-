// ===== server/server.js (PHIÊN BẢN HOÀN CHỈNH CUỐI CÙNG) =====

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import các file routes
const productRoutes = require('./routes/productRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- QUAN TRỌNG: Phục vụ các file tĩnh của Frontend ---
// Express sẽ ưu tiên tìm các file như /style.css, /js/main.js trong thư mục 'client'
// và gửi chúng đi nếu tìm thấy.
app.use(express.static(path.join(__dirname, '../client')));

// Sử dụng các Routes API
// Các yêu cầu bắt đầu bằng /api sẽ được chuyển đến các file route tương ứng
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// --- ROUTE "CATCH-ALL" CHO FRONTEND ---
// Route này phải được đặt ở CUỐI CÙNG.
// Nó sẽ bắt tất cả các yêu cầu GET không được xử lý ở trên (ví dụ: /about, /products)
// và gửi về file index.html để JavaScript phía client tự xử lý.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Kết nối DB và Chạy Server
const uri = process.env.ATLAS_URI;
mongoose.connect(uri)
    .then(() => {
        console.log("MongoDB database connection established successfully!");
        app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
    })
    .catch(err => console.error("Could not connect to MongoDB:", err));