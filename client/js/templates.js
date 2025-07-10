import { formatCurrency } from './utils.js';
import { createRatingComponent } from './components.js';

export function generateSummaryItemHTML(item) {
    let stringingDetailHTML = '';
    if (item.stringingInfo && typeof item.stringingInfo === 'object') {
        const info = item.stringingInfo;
        if (info.stringName) {
           stringingDetailHTML = `<p style="font-size: 0.9rem; color: #555; margin-top: 4px;">+ Cước: ${info.stringName} (${info.tension || 'N/A'} kg)</p>`;
        }
    }
    return `
        <div class="summary-cart-item">
            <img src="${item.image}" alt="${item.name}" loading="lazy"/>
            <div class="item-info">
                <a href="/product-detail.html?id=${item.id || item.product}" style="font-weight: 600;">${item.name}</a>
                <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                ${stringingDetailHTML}
            </div>
        </div>
    `;
}

export function generateOrderDetailHTML(order) {
    let orderItemsHTML = order.orderItems.map(item => {
        let stringingDetailHTML = '';
        if (item.stringingInfo) {
             try {
                // Backend trả về JSON, nên không cần parse lại
                const info = item.stringingInfo;
                if (info && info.stringName) {
                    stringingDetailHTML = `<p style="font-size: 0.9rem; color: #555;">+ Cước: ${info.stringName}<br>+ Căng: ${info.tension || 'N/A'} kg</p>`;
                }
             } catch(e) { console.error('Lỗi xử lý stringingInfo trong đơn hàng:', e); }
        }
        return `
            <div class="summary-cart-item">
                <img src="${item.image}" alt="${item.name}" loading="lazy"/>
                <div class="item-info">
                    <a href="/product-detail.html?id=${item.productId}" style="font-weight: 600;">${item.name}</a>
                    <p style="font-size: 0.9rem;">${item.quantity} x ${formatCurrency(item.price)}</p>
                    ${stringingDetailHTML}
                </div>
                <strong style="margin-left: auto;">${formatCurrency(item.price * item.quantity)}</strong>
            </div>`;
    }).join('');

    const itemsPrice = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const stringingPrice = order.orderItems.reduce((acc, item) => {
        if(item.stringingInfo){
            try {
                const info = item.stringingInfo;
                if(info && info.stringPrice) {
                    return acc + (info.stringPrice * item.quantity);
                }
            } catch(e) {}
        }
        return acc;
    }, 0);
    
    // ++ SỬA LỖI: Lấy trực tiếp phí vận chuyển từ object `order` đã được backend trả về
    const shippingPrice = order.shippingPrice || 0;
    let paymentActionHTML = '';
    if (!order.isPaid && order.paymentMethod === 'ZaloPay') {
        // Đây là code cho "Cách 1: Giả lập thanh toán"
        paymentActionHTML = `<button id="zalopay-payment-btn" class="btn primary-btn" style="width: 100%; margin-top: 1.5rem; background-color: #0068ff;">Thanh toán bằng ZaloPay</button>`;
    }
    return `
        <div class="page-header"><h1>Chi tiết đơn hàng #${order.id}</h1><p>Đặt lúc: ${new Date(order.createdAt).toLocaleString('vi-VN')}</p></div>
        <div class="placeorder-layout">
            <div class="placeorder-details">
                <div class="shipping-info card-section"><h3>Thông Tin Giao Hàng</h3><p><strong>Người nhận:</strong> ${order.userName}</p><p><strong>Email:</strong> ${order.userEmail}</p><p><strong>Địa chỉ:</strong> ${order.shippingAddress}, ${order.city}, ${order.postalCode}, ${order.country}</p><div class="status-badge ${order.isDelivered ? 'delivered' : ''}">${order.isDelivered ? `Đã giao hàng vào ${new Date(order.deliveredAt).toLocaleDateString('vi-VN')}` : 'Chưa giao hàng'}</div></div>
                <div class="shipping-info card-section" style="margin-top: 1rem;"><h3>Thanh Toán</h3><p><strong>Phương thức:</strong> ${order.paymentMethod}</p><div class="status-badge ${order.isPaid ? 'paid' : ''}">${order.isPaid ? `Đã thanh toán vào ${new Date(order.paidAt).toLocaleDateString('vi-VN')}` : 'Chưa thanh toán'}</div></div>
                <div class="order-items card-section"><h3>Sản Phẩm Đã Đặt</h3><div>${orderItemsHTML}</div></div>
            </div>
            <div class="order-summary-card card-section"><h3>Tóm Tắt Đơn Hàng</h3>
                <div class="summary-line"><span>Giá sản phẩm:</span><span>${formatCurrency(itemsPrice)}</span></div>
                <div class="summary-line"><span>Phí căng cước:</span><span>${formatCurrency(stringingPrice)}</span></div>
                <div class="summary-line"><span>Phí vận chuyển:</span><span>${formatCurrency(shippingPrice)}</span></div>
                <div class="summary-line total-line"><span>Tổng cộng:</span><span>${formatCurrency(order.totalPrice)}</span></div>
             ${paymentActionHTML}
            </div>
        </div>`;
}

export function generateProductDetailHTML(product) {
    const allImages = [product.image, ...(product.images || [])].filter(Boolean);
    const thumbnailsHTML = allImages.map((img, index) => 
        `<img src="${img}" alt="Thumbnail ${product.name} ${index + 1}" class="thumbnail-item ${index === 0 ? 'active' : ''}" data-index="${index}" loading="lazy">`
    ).join('');
    
    let priceHTML = `<div class="product-price-main">${formatCurrency(product.price)}</div>`;
    if (product.originalPrice && product.originalPrice > product.price) {
        priceHTML = `
            <div>
                <span class="product-price-main" style="color: #e74c3c; margin-right: 1rem;">${formatCurrency(product.price)}</span>
                <span class="product-original-price" style="text-decoration: line-through; opacity: 0.6;">${formatCurrency(product.originalPrice)}</span>
            </div>`;
    }

    let specsData = [];
    try {
        if (typeof product.specifications === 'string' && product.specifications.trim().startsWith('[')) {
             specsData = JSON.parse(product.specifications);
        } else if (Array.isArray(product.specifications)) {
            specsData = product.specifications;
        }
    } catch (e) { console.error("Lỗi parse JSON thông số:", e); }
    
    const specsHTML = specsData.length > 0
        ? `<ul class="specs-list">${specsData.map(spec => `<li><span class="spec-key">${spec.key}</span><span class="spec-value">${spec.value}</span></li>`).join('')}</ul>`
        : '<p>Chưa có thông số kỹ thuật.</p>';

    let videoHTML = '<p>Chưa có video review.</p>';
    if (product.youtubeLink) {
        const videoIdMatch = product.youtubeLink.match(/(?:v=|\/|embed\/|youtu.be\/)([a-zA-Z0-9_-]{11})/);
        if (videoIdMatch?.[1]) {
            videoHTML = `<div class="video-responsive-container"><iframe src="https://www.youtube.com/embed/${videoIdMatch[1]}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
    }
    
    const reviewsHTML = product.reviews?.length > 0
        ? product.reviews.map(review => 
            `<div class="review-item"><strong>${review.userName || review.name}</strong>${createRatingComponent(review.rating)}<p class="review-date">${new Date(review.createdAt).toLocaleDateString('vi-VN')}</p><p>${review.comment}</p></div>`
        ).join('')
        : '<p>Chưa có đánh giá nào.</p>';

    const stringingOptionsHTML = product.mainCategory === 'vot-cau-long' ? `
        <div class="stringing-options card-section"><h4><i class="fas fa-cogs"></i> Tùy Chọn Căng Cước</h4><div class="form-group"><label for="string-select">Chọn loại cước:</label><select id="string-select"><option value="none">Không căng cước</option></select></div><div class="form-group" id="tension-group" style="display: none;"><label for="tension-input">Mức căng (kg):</label><input type="number" id="tension-input" min="9" max="14" step="0.5" placeholder="VD: 10.5"></div></div>` : '';

    return `
        <div class="product-detail-grid">
            <div class="product-media"><div class="main-image-container"><img id="main-product-image" src="${product.image}" alt="${product.name}"></div><div id="thumbnail-gallery" class="thumbnail-gallery">${thumbnailsHTML}</div></div>
            <div class="product-details-main"><h1 class="product-title">${product.name}</h1><div class="product-meta"><span>Thương hiệu: <strong>${product.brand}</strong></span><div class="rating-container-detail">${createRatingComponent(product.rating, `${product.numReviews} đánh giá`)}</div></div>${priceHTML}<div class="info-blocks"><div class="info-block"><i class="fas fa-check-circle"></i> Tình trạng: <strong>${product.countInStock > 0 ? 'Còn hàng' : 'Hết hàng'}</strong></div><div class="info-block"><i class="fas fa-shield-alt"></i> Bảo hành: <strong>${product.warranty || 'Không có'}</strong></div></div><p class="product-short-description">${product.description}</p>${stringingOptionsHTML}<div class="product-actions"><button id="add-to-cart-detail" class="btn primary-btn btn-lg" data-product-id="${product.id}" ${product.countInStock === 0 ? 'disabled' : ''}><i class="fas fa-shopping-cart"></i> ${product.countInStock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</button></div></div>
        </div>
        <div class="product-tabs-container"><div class="tab-buttons"><button class="tab-btn active" data-tab="description">Mô Tả</button><button class="tab-btn" data-tab="specs">Thông Số</button><button class="tab-btn" data-tab="video">Video</button><button class="tab-btn" data-tab="reviews">Đánh Giá (${product.numReviews})</button></div><div class="tab-content-container"><div id="description" class="tab-content active">${product.fullDescription ? `<p>${product.fullDescription.replace(/\n/g, '</p><p>')}</p>` : 'Chưa có mô tả chi tiết.'}</div><div id="specs" class="tab-content">${specsHTML}</div><div id="video" class="tab-content">${videoHTML}</div><div id="reviews" class="tab-content"><div class="reviews-layout"><div class="reviews-list">${reviewsHTML}</div><div class="review-form-container"></div></div></div></div></div>
        <section id="related-products-section" class="related-products-section" style="display: none;"><h2 class="section-title">Sản phẩm liên quan</h2><div id="related-products-grid" class="products-grid"></div></section>`;
}

export function generateReviewFormHTML() {
    return `
        <h4>Viết đánh giá của bạn</h4>
        <form id="review-form" class="auth-form">
            <div class="form-group">
                <label for="rating">Xếp hạng</label>
                <select id="rating" required>
                    <option value="">Chọn...</option>
                    <option value="1">1 - Tệ</option>
                    <option value="2">2 - Tạm</option>
                    <option value="3">3 - Ổn</option>
                    <option value="4">4 - Tốt</option>
                    <option value="5">5 - Tuyệt vời</option>
                </select>
            </div>
            <div class="form-group">
                <label for="comment">Bình luận</label>
                <textarea id="comment" rows="3" required></textarea>
            </div>
            <button type="submit" class="btn primary-btn">Gửi</button>
            <p id="review-form-error" class="form-error"></p>
        </form>
    `;
}