const mongoose = require('mongoose');
const dotenv = require('dotenv');
const products = require('./data/products.js');

// Lấy model Product từ file server.js (cần chỉnh sửa server.js một chút)
// Tạm thời chúng ta sẽ định nghĩa lại model ở đây cho đơn giản
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    brand: { type: String },
    mainCategory: { type: String },
    description: { type: String },
    fullDescription: { type: String },
    isPromotional: { type: Boolean, default: false },
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI);
        console.log('Database connected for seeding...');

        await Product.deleteMany(); // Xóa hết dữ liệu cũ
        await Product.insertMany(products); // Thêm dữ liệu mới

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error with data import: ${error}`);
        process.exit(1);
    }
};

importData();