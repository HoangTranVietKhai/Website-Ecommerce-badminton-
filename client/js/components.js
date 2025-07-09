import { formatCurrency } from './utils.js';

export function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card-v2';
    productCard.dataset.productId = product.id;

    let priceHTML = `<span class="product-price-v2">${formatCurrency(product.price)}</span>`;
    if (product.originalPrice && product.originalPrice > product.price) {
        priceHTML = `
            <div class="price-container">
                <span class="product-price-v2 sale">${formatCurrency(product.price)}</span>
                <span class="product-original-price-v2">${formatCurrency(product.originalPrice)}</span>
            </div>
        `;
    }

    productCard.innerHTML = `
        <div class="product-image-v2">
             <img src="${product.image || '/images/placeholder.png'}" alt="${product.name}" loading="lazy">
             ${product.isPromotional ? '<span class="promo-badge">Khuyến mãi</span>' : ''}
        </div>
        <div class="product-info-v2">
            <p class="product-brand-v2">${product.brand}</p>
            <h3 class="product-name-v2">${product.name}</h3>
            <div class="product-card-footer">
                ${priceHTML}
                <button class="add-to-cart-icon-btn" data-product-id="${product.id}" aria-label="Thêm vào giỏ">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
        <div class="product-card-actions">
            <button class="btn add-to-cart-from-card-btn" data-product-id="${product.id}">
                <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
            </button>
            <a href="/product-detail.html?id=${product.id}" class="btn secondary-btn" style="background-color: #e2e8f0; color: #333;">Xem chi tiết</a>
        </div>
    `;
    
    productCard.querySelectorAll('[data-product-id]').forEach(btn => {
        if (btn.tagName === 'BUTTON') {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.dispatchEvent(new CustomEvent('add-to-cart-from-card', { detail: { productId: product.id } }));
            });
        }
    });
    
    productCard.querySelector('.product-image-v2').addEventListener('click', () => {
         window.location.href = `/product-detail.html?id=${product.id}`;
    });

    return productCard;
}

export function createRatingComponent(value, text) {
    const ratingValue = Number(value) || 0;
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (ratingValue >= i) {
            starsHTML += '<span><i class="fas fa-star"></i></span>';
        } else if (ratingValue >= i - 0.5) {
            starsHTML += '<span><i class="fas fa-star-half-alt"></i></span>';
        } else {
            starsHTML += '<span><i class="far fa-star"></i></span>';
        }
    }
    return `
        <div class="rating-component">
            <div class="rating-stars">${starsHTML}</div>
            ${text ? `<span class="rating-text">${text}</span>` : ''}
        </div>
    `;
}