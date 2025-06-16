// ===== client/js/components.js (ĐÃ ÁP DỤNG BEM) =====
import { formatCurrency } from './utils.js';

export function createProductCard(product) {
    const productCard = document.createElement('div');
    // Block
    productCard.className = 'product-card';
    productCard.dataset.productId = product._id;

    let saleTagHTML = '';
    // Mặc định, giá là một element
    let priceHTML = `<p class="product-card__price">${formatCurrency(product.price)}</p>`;

    if (product.originalPrice && product.originalPrice > product.price) {
        // Thêm Modifier cho Block nếu có giảm giá
        productCard.classList.add('product-card--on-sale'); 

        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        // Element
        saleTagHTML = `<div class="product-card__sale-tag">-${discount}%</div>`; 
        
        // Cập nhật priceHTML với các Elements mới
        priceHTML = `
            <div class="product-card__price-container">
                <span class="product-card__sale-price">${formatCurrency(product.price)}</span>
                <span class="product-card__original-price">${formatCurrency(product.originalPrice)}</span>
            </div>
        `;
    }

    productCard.innerHTML = `
        ${saleTagHTML}
        <div class="product-card__image-container">
            <img class="product-card__image" src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <h3 class="product-card__title">${product.name}</h3>
        ${priceHTML}
    `;

    return productCard;
}// ===== Thêm vào file client/js/components.js =====

/**
 * Tạo component hiển thị các ngôi sao đánh giá.
 * @param {number} value - Điểm đánh giá (ví dụ: 4.5).
 * @param {string} text - Text hiển thị bên cạnh (ví dụ: 'từ 10 đánh giá').
 * @returns {string} - Chuỗi HTML của component.
 */
export function createRatingComponent(value, text) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        let starClass = 'fas fa-star'; // Mặc định là sao đầy
        if (value >= i) {
            // không cần làm gì, đã là sao đầy
        } else if (value >= i - 0.5) {
            starClass = 'fas fa-star-half-alt'; // Sao nửa
        } else {
            starClass = 'far fa-star'; // Sao rỗng (cần Font Awesome 'regular' style)
        }
        starsHTML += `<span><i class="${starClass}"></i></span>`;
    }

    return `
        <div class="rating-component">
            <div class="rating-stars">${starsHTML}</div>
            ${text ? `<span class="rating-text">${text}</span>` : ''}
        </div>
    `;
}