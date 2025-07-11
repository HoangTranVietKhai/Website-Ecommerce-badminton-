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
// THÊM MỚI: Import các route còn thiếu
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
                    "'unsafe-inline'"
                ],
                "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                "img-src": ["'self'", "data:", "https://images.unsplash.com", "https://plus.unsplash.com", "https://cdn.shopvnb.com", "https://shopvnb.com"],
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
});
app.use('/api', apiLimiter);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/brands', brandRoutes); 
app.use('/api/categories', categoryRoutes);
// THÊM MỚI: Sử dụng các route còn thiếu
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/tracking', trackingRoutes);


// --- Phục vụ file cho Single Page Application (SPA) ---
const __projectRoot = path.resolve(__dirname, '..');
const clientPath = path.join(__projectRoot, 'client');

// 1. Phục vụ các file tĩnh (CSS, JS, images, etc.) từ thư mục client
app.use(express.static(clientPath));

// 2. Đối với bất kỳ request GET nào không khớp với API và file tĩnh ở trên,
//    trả về file index.html để JS router phía client xử lý.
//    Đây là cách làm đúng cho một SPA.
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
    console.log('✅ Database pool closed.');
    process.exit(0);
});