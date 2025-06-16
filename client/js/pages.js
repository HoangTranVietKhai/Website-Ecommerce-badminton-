// client/js/pages.js

import store from './store.js';
import * as api from './api.js';
import { createProductCard, createRatingComponent } from './components.js';
import { formatCurrency, showToast } from './utils.js';

// --- Home Page ---
export async function renderHomePage() {
    try {
        const { products } = await api.fetchProducts();
        store.setProducts(products);

        const productGridEl = document.querySelector('.products-section-home .product-grid');
        if (productGridEl) {
            productGridEl.innerHTML = '';
            const promotionalProducts = products.filter(p => p.isPromotional).slice(0, 4);
            const productsToShow = promotionalProducts.length > 0 ? promotionalProducts : products.slice(0, 4);
            productsToShow.forEach(p => productGridEl.appendChild(createProductCard(p)));
        }
    } catch (error) {
        console.error("Could not load featured products:", error);
    }
}

// --- Products List Page ---
export async function renderProductListPage() {
    const brandFilter = document.getElementById('brand-filter');
    const priceSlider = document.getElementById('price-slider');

    // Populate brand filter only once
    if (brandFilter && brandFilter.options.length <= 1) {
        const { products } = await api.fetchProducts();
        const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    }

    // Initialize price slider only once
    if (priceSlider && !priceSlider.noUiSlider) {
        noUiSlider.create(priceSlider, {
            start: [0, 50000000],
            connect: true,
            step: 100000,
            range: { 'min': 0, 'max': 50000000 },
            format: { to: v => Math.round(v), from: v => Number(v) }
        });
        const minValEl = document.getElementById('price-min-value');
        const maxValEl = document.getElementById('price-max-value');
        priceSlider.noUiSlider.on('update', (values) => {
            if (minValEl && maxValEl) {
                minValEl.textContent = formatCurrency(values[0]);
                maxValEl.textContent = formatCurrency(values[1]);
            }
        });
        priceSlider.noUiSlider.on('change', applyFiltersAndRender);
    }
    
    renderCategoryTags();
    await applyFiltersAndRender();
}

export async function applyFiltersAndRender() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParams = new URLSearchParams();

    // Build query from URL and filters
    ['mainCategory', 'subCategory', 'keyword'].forEach(param => {
        if (urlParams.has(param)) queryParams.set(param, urlParams.get(param));
    });

    const brand = document.getElementById('brand-filter')?.value;
    if (brand && brand !== 'all') queryParams.set('brand', brand);

    const priceSlider = document.getElementById('price-slider')?.noUiSlider;
    if (priceSlider) {
        const [min, max] = priceSlider.get();
        queryParams.set('minPrice', min);
        queryParams.set('maxPrice', max);
    }

    try {
        const { products, count } = await api.fetchProducts(queryParams.toString());
        store.setProducts(products);
        renderProductGrid(products, count);
    } catch (error) {
        console.error("Error applying filters:", error);
    }
}

function renderProductGrid(products, count) {
    const productGridEl = document.querySelector('.products-page .product-listing .product-grid');
    const noProductsMessage = document.getElementById('no-products-found-detailed');
    const countDisplay = document.getElementById('product-count-display');

    if (countDisplay) countDisplay.innerHTML = `Tìm thấy <strong>${count}</strong> sản phẩm`;
    if (!productGridEl || !noProductsMessage) return;

    productGridEl.innerHTML = '';
    if (products.length > 0) {
        products.forEach(p => productGridEl.appendChild(createProductCard(p)));
        noProductsMessage.style.display = 'none';
    } else {
        noProductsMessage.style.display = 'block';
    }
}

function renderCategoryTags() {
    const container = document.getElementById('category-tags-container');
    if (!container) return;
    const urlParams = new URLSearchParams(window.location.search);
    const mainCategory = urlParams.get('mainCategory');
    const subCategoryParam = urlParams.get('subCategory');
    const CATEGORIES = {
        'guitar': { name: 'Guitar', subs: ['acoustic', 'classic', 'electric'] },
        'piano': { name: 'Piano', subs: ['digital', 'upright'] },
    };

    if (mainCategory && CATEGORIES[mainCategory]) {
        const { name, subs } = CATEGORIES[mainCategory];
        let tagsHTML = `<button class="category-tag ${!subCategoryParam ? 'active' : ''}" data-sub-category="all">Tất cả ${name}</button>`;
        tagsHTML += subs.map(sub => `<button class="category-tag ${subCategoryParam === sub ? 'active' : ''}" data-sub-category="${sub}">${sub.charAt(0).toUpperCase() + sub.slice(1)}</button>`).join('');
        container.innerHTML = tagsHTML;
    } else {
        container.innerHTML = '';
    }
}

// --- Product Detail Page ---
export async function renderProductDetailPage() {
    const container = document.getElementById('product-detail-container');
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!container || !productId) return;

    try {
        const product = await api.fetchProductById(productId);
        store.addProduct(product); // Add to our central store
        
        container.innerHTML = generateProductDetailHTML(product);
        
        initImageGallery();
        initProductTabs();
        
        // Render sub-components
        renderReviewForm(product, store.getUser());
        renderRelatedProducts(productId);

    } catch (error) {
        console.error("Error loading product detail:", error);
        container.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}

function generateProductDetailHTML(product) {
    // Helper to generate parts of the HTML for clarity
    const thumbnailsHTML = [product.image, ...(product.images || [])].map((img, index) => `<img src="${img}" alt="Thumbnail ${product.name} ${index + 1}" class="thumbnail-item ${index === 0 ? 'active' : ''}">`).join('');
    
    let priceHTML = `<div class="product-price-main">${formatCurrency(product.price)}</div>`;
    if (product.originalPrice && product.originalPrice > product.price) {
        priceHTML = `<div class="product-price-container-main"><span class="product-sale-price-main">${formatCurrency(product.price)}</span><span class="product-original-price-main">${formatCurrency(product.originalPrice)}</span></div>`;
    }

    const specsHTML = product.specifications?.length > 0
        ? `<ul class="specs-list">${product.specifications.map(spec => `<li><span class="spec-key">${spec.key}</span><span class="spec-value">${spec.value}</span></li>`).join('')}</ul>`
        : '<p>Chưa có thông số kỹ thuật.</p>';

    let videoHTML = '<p>Chưa có video review.</p>';
    if (product.youtubeLink) {
        const videoIdMatch = product.youtubeLink.match(/(?:v=|\/|embed\/|youtu.be\/)([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId) videoHTML = `<div class="video-responsive-container"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    
    const reviewsHTML = product.reviews?.length > 0
        ? product.reviews.map(review => `<div class="review-item"><strong>${review.name}</strong>${createRatingComponent(review.rating)}<p class="review-date">${new Date(review.createdAt).toLocaleDateString('vi-VN')}</p><p>${review.comment}</p></div>`).join('')
        : '<p>Chưa có đánh giá nào.</p>';

    return `
        <div class="product-detail-grid">
            <div class="product-media">
                <div class="main-image-container"><img id="main-product-image" src="${product.image}" alt="${product.name}"></div>
                <div id="thumbnail-gallery" class="thumbnail-gallery">${thumbnailsHTML}</div>
            </div>
            <div class="product-details-main">
                <h1 class="product-title">${product.name}</h1>
                <div class="product-meta"><span>Thương hiệu: <strong>${product.brand}</strong></span><div class="rating-container-detail">${createRatingComponent(product.rating, `${product.numReviews} đánh giá`)}</div></div>
                ${priceHTML}
                <div class="info-blocks">
                    <div class="info-block"><i class="fas fa-check-circle"></i> Tình trạng: <strong>${product.countInStock > 0 ? 'Còn hàng' : 'Hết hàng'}</strong></div>
                    <div class="info-block"><i class="fas fa-shield-alt"></i> Bảo hành: <strong>${product.warranty}</strong></div>
                    <div class="info-block"><i class="fas fa-shipping-fast"></i> <strong>Miễn phí vận chuyển</strong> cho đơn hàng > 2 triệu.</div>
                </div>
                <p class="product-short-description">${product.description}</p>
                <div class="product-actions">
                    <button id="add-to-cart-detail" class="btn primary-btn btn-lg" data-product-id="${product._id}" ${product.countInStock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> ${product.countInStock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                    </button>
                </div>
            </div>
        </div>
        <div class="product-tabs-container">
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="description">Mô Tả</button>
                <button class="tab-btn" data-tab="specs">Thông Số</button>
                <button class="tab-btn" data-tab="video">Video</button>
                <button class="tab-btn" data-tab="reviews">Đánh Giá (${product.numReviews})</button>
            </div>
            <div class="tab-content-container">
                <div id="description" class="tab-content active"><p>${product.fullDescription || 'Chưa có mô tả chi tiết.'}</p></div>
                <div id="specs" class="tab-content">${specsHTML}</div>
                <div id="video" class="tab-content">${videoHTML}</div>
                <div id="reviews" class="tab-content">
                    <div class="reviews-layout">
                        <div class="reviews-list">${reviewsHTML}</div>
                        <div class="review-form-container"></div>
                    </div>
                </div>
            </div>
        </div>
        <div id="related-products-section" class="related-products-section" style="display: none;">
            <h2>Có Thể Bạn Cũng Thích</h2>
            <div id="related-products-grid" class="product-grid"></div>
        </div>
    `;
}

async function renderRelatedProducts(productId) {
    try {
        const relatedProducts = await api.fetchRelatedProducts(productId);
        const section = document.getElementById('related-products-section');
        const grid = document.getElementById('related-products-grid');
        if (section && grid && relatedProducts.length > 0) {
            grid.innerHTML = '';
            relatedProducts.forEach(p => grid.appendChild(createProductCard(p)));
            section.style.display = 'block';
        }
    } catch (error) {
        console.error('Could not load related products:', error);
    }
}

function renderReviewForm(product, user) {
    const container = document.querySelector('.review-form-container');
    if(!container) return;
    
    let formHTML = '';
    if (user) {
        const alreadyReviewed = product.reviews.some(r => r.user === user.id);
        if (alreadyReviewed) {
             formHTML = `<p>Cảm ơn bạn đã đánh giá sản phẩm này.</p>`;
        } else {
             formHTML = `
                <h4>Viết đánh giá của bạn</h4>
                <form id="review-form" class="auth-form">
                    <div class="form-group"><label for="rating">Xếp hạng</label><select id="rating" class="filter-group select" required><option value="">Chọn...</option><option value="1">1 - Tệ</option><option value="2">2 - Tạm</option><option value="3">3 - Ổn</option><option value="4">4 - Tốt</option><option value="5">5 - Tuyệt vời</option></select></div>
                    <div class="form-group"><label for="comment">Bình luận</label><textarea id="comment" rows="3" required></textarea></div>
                    <button type="submit" class="btn primary-btn">Gửi</button><p id="review-form-error" class="form-error"></p>
                </form>
            `;
        }
    } else {
        formHTML = `<p>Vui lòng <button class="link-like-btn" id="login-for-review-btn">đăng nhập</button> để viết đánh giá.</p>`;
    }
    
    container.innerHTML = formHTML;
}

// Helpers for the detail page that need to be in this file
export function initImageGallery() {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    if (!mainImage || thumbnails.length === 0) return;

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            mainImage.src = thumb.src;
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
}

export function initProductTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(targetTabId)?.classList.add('active');
        });
    });
}