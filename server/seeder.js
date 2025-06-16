// ===== server/seeder.js (PHIÊN BẢN ĐÚNG) =====

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const products = require('./data/products.js');
const Product = require('./models/productModel.js'); // SỬA Ở ĐÂY: Import model trực tiếp
const User = require('./models/userModel.js'); 
const Order = require('./models/orderModel.js');

dotenv.config({ path: './.env' }); // Đảm bảo đường dẫn đến .env là chính xác

const importData = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI);
        console.log('Database connected for seeding...');

        // Xóa hết dữ liệu cũ từ các collection
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        // Thêm dữ liệu sản phẩm mới
        // Dữ liệu 'products' được import từ data/products.js đã là một mảng các object
        await Product.insertMany(products);

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error with data import: ${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI);
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`Error with data destruction: ${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}