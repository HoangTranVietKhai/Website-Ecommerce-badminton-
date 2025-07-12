const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const productRoutes = require('./routes/productRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const brandRoutes = require('./routes/brandRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const newsletterRoutes = require('./routes/newsletterRoutes.js');
const trackingRoutes = require('./routes/trackingRoutes.js');

const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');
const { poolConnect, closePool } = require('./config/db.js');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "script-src": [
                    "'self'", 
                    "https://cdnjs.cloudflare.com",
                    "'unsafe-inline'" // Cần cho một số thư viện hoặc script nhỏ
                ],
                "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                "img-src": [
                    "'self'", 
                    "data:", 
                    "https://images.unsplash.com", 
                    "https://plus.unsplash.com", 
                    "https://cdn.shopvnb.com", // Thêm nguồn ảnh từ VNB
                    "https://shopvnb.com"
                ],
                 "frame-src": ["'self'", "https://www.youtube.com"], // Cho phép nhúng video Youtube
            },
        },
    })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- API Routes ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.",
});
app.use('/api', apiLimiter);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/brands', brandRoutes); 
app.use('/api/categories', categoryRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/tracking', trackingRoutes);


// --- Phục vụ file cho Single Page Application (SPA) ---
const __projectRoot = path.resolve(__dirname, '..');
const clientPath = path.join(__projectRoot, 'client');

// 1. Phục vụ các file tĩnh (CSS, JS, images, etc.) từ thư mục client
// Thêm thư mục client/templates để phục vụ các file template cho admin
app.use(express.static(clientPath));
app.use('/templates', express.static(path.join(clientPath, 'templates')));

// 2. Đối với bất kỳ request GET nào không khớp với API và file tĩnh ở trên,
//    trả về file index.html để JS router phía client xử lý.
app.get('*', (req, res, next) => {
    // Bỏ qua các route API
    if (req.originalUrl.startsWith('/api')) {
        return next();
    }
    // Nếu không phải API, trả về trang chính
    res.sendFile(path.resolve(clientPath, 'index.html'));
});


// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server ---
const startServer = async () => {
    try {
        await poolConnect;
        console.log('✅ Database connection pool is ready.');

        app.listen(PORT, () => {
            const url = `http://localhost:${PORT}`;
            console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode on port: ${PORT}`);
            console.log(`🌐 Website is available at: ${url}`);
        });
    } catch (err) {
        console.error('❌ Database Connection Failed!', err);
        process.exit(1);
    }
};

startServer();

process.on('SIGINT', async () => {
    console.log('🔌 Server is shutting down...');
    await closePool();
    process.exit(0);
});