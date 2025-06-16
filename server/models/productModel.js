// ===== server/models/productModel.js (CẬP NHẬT CHO REVIEWS) =====
const mongoose = require('mongoose');

// THÊM MỚI: Định nghĩa schema cho mỗi review
const reviewSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên người review
    rating: { type: Number, required: true }, // Số sao (1-5)
    comment: { type: String, required: true }, // Nội dung bình luận
    user: { // Liên kết đến người dùng đã review
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, { timestamps: true });


const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    image: { type: String },
    brand: { type: String },
    mainCategory: { type: String, required: true },
    subCategory: { type: String },
    description: { type: String },
    fullDescription: { type: String },
    isPromotional: { type: Boolean, default: false },

    // --- THÊM CÁC TRƯỜNG MỚI CHO REVIEW ---
    reviews: [reviewSchema], // Một mảng các review
    rating: { // Điểm trung bình
        type: Number,
        required: true,
        default: 0,
    },
    numReviews: { // Tổng số review
        type: Number,
        required: true,
        default: 0,
    },
    // Thêm trường số lượng trong kho
    countInStock: {
        type: Number,
        
        required: true,
        default: 0
    },
     images: [String], // Mảng chứa link các ảnh phụ
        warranty: { type: String, default: '12 tháng' }, 
        youtubeLink: { type: String }, // Link video review trên YouTube
 specifications: [
        {
            key: { type: String },
            value: { type: String }
        }
    ]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;