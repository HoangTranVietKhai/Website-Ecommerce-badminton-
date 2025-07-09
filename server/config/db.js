// ===== File: server/config/db.js (FILE MỚI) =====
const sql = require('mssql');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    pool: {
        max: 10, // Số kết nối tối đa trong pool
        min: 0,
        idleTimeoutMillis: 30000 // Thời gian chờ trước khi đóng kết nối không dùng
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Tạo một connection pool và export nó
// Ứng dụng sẽ tự động quản lý việc mở/đóng kết nối từ pool này
let pool = new sql.ConnectionPool(dbConfig);
let poolConnect = pool.connect(); // Bắt đầu kết nối ngay khi ứng dụng khởi động

// Hàm để đóng pool khi ứng dụng tắt
const closePool = async () => {
    try {
        await pool.close();
        console.log('Database connection pool closed.');
    } catch (err) {
        console.error('Error closing the database connection pool', err);
    }
};

module.exports = {
    pool,
    poolConnect,
    closePool
};