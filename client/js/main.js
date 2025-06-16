// ===== client/js/main.js (BẢN SỬA LỖI TOÀN DIỆN) =====
import { showToast, formatCurrency } from './utils.js';
import { loadLayout } from './layout.js';
import { createProductCard, createRatingComponent } from './components.js';

// --- BIẾN TOÀN CỤC VÀ CẤU HÌNH ---
const CATEGORIES = {
    'guitar': { name: 'Guitar', subs: ['acoustic', 'classic', 'electric', 'bass'] },
    'piano': { name: 'Piano', subs: ['digital', 'upright', 'grand'] },
    'ukulele': { name: 'Ukulele', subs: ['soprano', 'concert', 'tenor'] },
};
let allProducts = [];
const API_URL = '/api';
let currentCart = [];
const DOMElements = {};

// --- HÀM KHỞI TẠO CHÍNH ---
document.addEventListener('DOMContentLoaded', () => {
    loadLayout();
    cacheDOMElements();
    loadCartFromLocalStorage();
    updateCartIconCountUI();
    updateAuthUI(); 
    setupEventListeners();
    
    renderPageSpecificContent();
    updateFooterYear();
    setupScrollAnimations();
});

// --- BỘ ĐIỀU HƯỚNG VÀ RENDER TRANG ---
function renderPageSpecificContent() {
    const bodyClass = document.body.classList;
    if (bodyClass.contains('products-page')) {
        renderProductListPage();
    } else if (bodyClass.contains('home-page')) {
        renderHomePage();
    } else if (bodyClass.contains('product-detail-page')) {
        
        renderProductDetailPage();
    }
    highlightActiveNavLink();
}

async function renderHomePage() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Lỗi fetch sản phẩm');
        const data = await response.json();
        allProducts = data.products;
        const productGridEl = document.querySelector('.products-section-home .product-grid');
        if (productGridEl) {
            productGridEl.innerHTML = '';
            const promotionalProducts = allProducts.filter(p => p.isPromotional).slice(0, 4);
            const productsToShow = promotionalProducts.length > 0 ? promotionalProducts : allProducts.slice(0, 4);
            productsToShow.forEach(p => productGridEl.appendChild(createProductCard(p)));
        }
    } catch (error) { console.error("Không thể tải sản phẩm nổi bật:", error); }
}

async function renderProductListPage() {
    await populateBrandFilter();
    initializePriceSlider();
    renderCategoryTags();
    await applyFiltersAndSort();
}


// ===== THAY THẾ HOÀN TOÀN HÀM NÀY TRONG client/js/main.js =====

async function renderProductDetailPage() {
    const container = document.getElementById('product-detail-container');
    if (!container) return;
    try {
        const productId = new URLSearchParams(window.location.search).get('id');
        if (!productId) throw new Error('Không tìm thấy ID sản phẩm.');

        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Sản phẩm không tồn tại');

        const product = await response.json();
        const user = JSON.parse(localStorage.getItem('user'));

        const productExistsInList = allProducts.some(p => p._id === product._id);
        if (!productExistsInList) allProducts.push(product);

        document.title = `${product.name} - UMT Instruments`;

        // --- Logic tạo các phần nội dung cho Tabs ---

        const allImages = [product.image, ...(product.images || [])];
        const thumbnailsHTML = allImages.map((img, index) => `<img src="${img}" alt="Thumbnail ${product.name} ${index + 1}" class="thumbnail-item ${index === 0 ? 'active' : ''}">`).join('');

        let priceHTML = `<div class="product-price-main">${formatCurrency(product.price)}</div>`;
        if (product.originalPrice && product.originalPrice > product.price) {
            priceHTML = `<div class="product-price-container-main"><span class="product-sale-price-main">${formatCurrency(product.price)}</span><span class="product-original-price-main">${formatCurrency(product.originalPrice)}</span></div>`;
        }

        let specsHTML = product.specifications && product.specifications.length > 0
            ? `<ul class="specs-list">${product.specifications.map(spec => `<li><span class="spec-key">${spec.key}</span><span class="spec-value">${spec.value}</span></li>`).join('')}</ul>`
            : '<p>Chưa có thông số kỹ thuật cho sản phẩm này.</p>';

        let videoHTML = '<p>Sản phẩm này chưa có video review.</p>';
        if (product.youtubeLink) {
            const videoIdMatch = product.youtubeLink.match(/(?:v=|\/|embed\/|youtu.be\/)([a-zA-Z0-9_-]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            if (videoId) {
                videoHTML = `<div class="video-responsive-container"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            }
        }

        const reviewsHTML = product.reviews.length > 0
            ? product.reviews.map(review => `<div class="review-item"><strong>${review.name}</strong>${createRatingComponent(review.rating)}<p class="review-date">${new Date(review.createdAt).toLocaleDateString('vi-VN')}</p><p>${review.comment}</p></div>`).join('')
            : '<p>Chưa có đánh giá nào cho sản phẩm này.</p>';

        // --- Cấu trúc HTML chính với Tabs ---
        container.innerHTML = `
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
                    <button class="tab-btn active" data-tab="description">Mô Tả Chi Tiết</button>
                    <button class="tab-btn" data-tab="specs">Thông Số Kỹ Thuật</button>
                    <button class="tab-btn" data-tab="video">Video</button>
                    <button class="tab-btn" data-tab="reviews">Đánh Giá (${product.numReviews})</button>
                </div>
                <div class="tab-content-container">
                    <div id="description" class="tab-content active">${product.fullDescription || '<p>Chưa có mô tả chi tiết.</p>'}</div>
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
function initProductTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.dataset.tab;

            // Xóa class active khỏi tất cả các nút và nội dung
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Thêm class active cho nút và nội dung được chọn
            button.classList.add('active');
            document.getElementById(targetTabId).classList.add('active');
        });
    });
}
        // Khởi tạo các event listeners
        initImageGallery();
        initProductTabs();
        renderReviewForm(product, user); // Hàm này sẽ render form vào .review-form-container
        fetchAndRenderRelatedProducts(productId);

    } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        container.innerHTML = `<p class="error-message">Đã xảy ra lỗi: ${error.message}</p>`;
    }
}
// ================= KẾT THÚC THAY THẾ HÀM RENDERPRODUCTDETAILPAGE =================

// ======================= BẮT ĐẦU THÊM HÀM MỚI ========================
// Thêm hàm này ngay sau hàm renderProductDetailPage bạn vừa thay thế
function initImageGallery() {
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

// Tách logic render review form ra hàm riêng cho sạch sẽ
function renderReviewForm(product, user) {
    const container = document.querySelector('.review-form-container');
    if(!container) return;
    
    let reviewFormHTML = '';
    if (user) {
        // Kiểm tra xem user đã review chưa
        const alreadyReviewed = product.reviews.some(r => r.user === user.id);
        if(alreadyReviewed) {
             reviewFormHTML = `<p>Cảm ơn bạn đã đánh giá sản phẩm này.</p>`;
        } else {
             reviewFormHTML = `
                <h4>Viết đánh giá của bạn</h4>
                <form id="review-form" class="auth-form">
                    <div class="form-group"><label for="rating">Xếp hạng</label><select id="rating" class="filter-group select"><option value="">Chọn...</option><option value="1">1 - Rất tệ</option><option value="2">2 - Tệ</option><option value="3">3 - Ổn</option><option value="4">4 - Tốt</option><option value="5">5 - Tuyệt vời</option></select></div>
                    <div class="form-group"><label for="comment">Bình luận</label><textarea id="comment" rows="4" required></textarea></div>
                    <button type="submit" class="btn primary-btn">Gửi đánh giá</button><p id="review-form-error" class="form-error"></p>
                </form>
            `;
        }
    } else {
        reviewFormHTML = `<p>Vui lòng <button class="link-like-btn" id="login-for-review-btn">đăng nhập</button> để viết đánh giá.</p>`;
    }
    
    container.innerHTML = reviewFormHTML;

    document.getElementById('review-form')?.addEventListener('submit', (e) => handleReviewSubmit(e, product._id));
    document.getElementById('login-for-review-btn')?.addEventListener('click', () => openAuthModal('login'));
}
async function fetchAndRenderRelatedProducts(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}/related`);
        if (!response.ok) return; // Không có sản phẩm liên quan thì không làm gì cả

        const relatedProducts = await response.json();
        
        const section = document.getElementById('related-products-section');
        const grid = document.getElementById('related-products-grid');

        if (section && grid && relatedProducts.length > 0) {
            grid.innerHTML = ''; // Xóa nội dung cũ
            relatedProducts.forEach(product => {
                grid.appendChild(createProductCard(product));
            });
            section.style.display = 'block'; // Hiển thị section lên
        }
    } catch (error) {
        console.error('Không thể tải sản phẩm liên quan:', error);
    }
}
async function handleReviewSubmit(e, productId) {
    e.preventDefault();
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;
    const errorEl = document.getElementById('review-form-error');

    if (!rating || !comment) {
        errorEl.textContent = 'Vui lòng chọn xếp hạng và viết bình luận.';
        return;
    }
    errorEl.textContent = '';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Bạn cần đăng nhập để đánh giá', 3000, 'error');
            return;
        }

        const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gửi đánh giá thất bại');
        }

        showToast('Cảm ơn bạn đã đánh giá!', 2000, 'success');
        // Tải lại trang để xem review mới
        window.location.reload();

    } catch (error) {
        errorEl.textContent = error.message;
        console.error("Lỗi khi gửi review:", error);
    }
}
// --- BỘ LỌC SẢN PHẨM ---
async function applyFiltersAndSort() {
    const urlParams = new URLSearchParams(window.location.search);
    const mainCategory = urlParams.get('mainCategory') || '';
    const subCategory = urlParams.get('subCategory') || '';
    // SỬA LỖI 1: Khai báo `keyword` ở scope đúng
    const keyword = urlParams.get('keyword') || ''; 
    const brand = document.getElementById('brand-filter')?.value || 'all';
    const priceSlider = document.getElementById('price-slider');
    const [minPrice, maxPrice] = priceSlider && priceSlider.noUiSlider ? priceSlider.noUiSlider.get() : [undefined, undefined];

    const queryParams = new URLSearchParams();
    if (keyword) queryParams.append('keyword', keyword);
    if (brand !== 'all') queryParams.append('brand', brand);
    if (minPrice !== undefined) queryParams.append('minPrice', minPrice);
    if (maxPrice !== undefined) queryParams.append('maxPrice', maxPrice);
    if (mainCategory) queryParams.append('mainCategory', mainCategory);
    if (subCategory) queryParams.append('subCategory', subCategory);

    try {
        const response = await fetch(`${API_URL}/products?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Lỗi khi lọc sản phẩm');
        const data = await response.json();
        allProducts = data.products;
        
        // SỬA LỖI 2: Đảm bảo các element tồn tại trước khi thay đổi
        const countDisplay = document.getElementById('product-count-display');
        const titleDisplay = document.getElementById('page-main-title');

        if (countDisplay) {
            countDisplay.innerHTML = `Tìm thấy <strong>${data.count}</strong> sản phẩm`;
        }
        
        if (titleDisplay) {
            const pageTitle = mainCategory && CATEGORIES[mainCategory] ? CATEGORIES[mainCategory].name : (keyword ? `Kết quả cho "${keyword}"` : 'Sản Phẩm Nổi Bật');
            titleDisplay.textContent = pageTitle;
            document.title = `${pageTitle} - UMT Instruments`;
        }

        renderProductGrid(data.products);
    } catch (error) { console.error("Lỗi khi áp dụng bộ lọc:", error); }
}

function renderProductGrid(productsToRender) {
    const productGridEl = document.querySelector('.products-page .product-listing .product-grid');
    const noProductsMessage = document.getElementById('no-products-found-detailed');
    if (!productGridEl || !noProductsMessage) return;
    productGridEl.innerHTML = '';
    if (Array.isArray(productsToRender)) {
        productsToRender.forEach(p => productGridEl.appendChild(createProductCard(p)));
        noProductsMessage.style.display = productsToRender.length === 0 ? 'block' : 'none';
    } else {
        noProductsMessage.style.display = 'block';
    }
}

async function populateBrandFilter() {
    const brandFilter = document.getElementById('brand-filter');
    if (!brandFilter || brandFilter.length > 1) return;
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Lỗi fetch brand');
        const data = await response.json();
        const productsArray = data.products;
        if (!Array.isArray(productsArray)) throw new Error("Dữ liệu không hợp lệ.");
        const brands = [...new Set(productsArray.map(p => p.brand).filter(Boolean))].sort();
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    } catch (error) { console.error("Không thể tải danh sách thương hiệu:", error); }
}

function initializePriceSlider() {
    const priceSlider = document.getElementById('price-slider');
    if (!priceSlider || priceSlider.noUiSlider) return;
    noUiSlider.create(priceSlider, { start: [0, 50000000], connect: true, step: 100000, range: { 'min': 0, 'max': 50000000 }, format: { to: value => Math.round(value), from: value => Number(value) } });
    const minPriceEl = document.getElementById('price-min-value');
    const maxPriceEl = document.getElementById('price-max-value');
    priceSlider.noUiSlider.on('update', (values) => {
        if(minPriceEl && maxPriceEl) {
            minPriceEl.textContent = formatCurrency(values[0]);
            maxPriceEl.textContent = formatCurrency(values[1]);
        }
    });
    priceSlider.noUiSlider.on('change', applyFiltersAndSort);
}

function renderCategoryTags() {
    const container = document.getElementById('category-tags-container');
    if (!container) return;
    const urlParams = new URLSearchParams(window.location.search);
    const mainCategory = urlParams.get('mainCategory');
    const subCategoryParam = urlParams.get('subCategory');
    if (mainCategory && CATEGORIES[mainCategory]) {
        const categoryName = CATEGORIES[mainCategory].name;
        let tagsHTML = `<button class="category-tag ${!subCategoryParam ? 'active' : ''}" data-sub-category="all">Tất cả ${categoryName}</button>`;
        tagsHTML += CATEGORIES[mainCategory].subs.map(sub => `<button class="category-tag ${subCategoryParam === sub ? 'active' : ''}" data-sub-category="${sub}">${sub.charAt(0).toUpperCase() + sub.slice(1)}</button>`).join('');
        container.innerHTML = tagsHTML;
    } else {
        container.innerHTML = '';
    }
}

// --- XỬ LÝ SỰ KIỆN ---
function setupEventListeners() {
    document.body.addEventListener("click", handleBodyClick);
    if (document.body.classList.contains("products-page")) {
        document.getElementById("brand-filter")?.addEventListener("change", applyFiltersAndSort);
    }
    document.getElementById('login-form')?.addEventListener('submit', handleAuthFormSubmit);
    document.getElementById('register-form')?.addEventListener('submit', handleAuthFormSubmit);
    document.getElementById('search-form')?.addEventListener('submit', handleSearchSubmit);
}

function handleBodyClick(e) {
    if (e.target.id === 'auth-modal-overlay' || e.target.id === 'cart-overlay') { closeAuthModal(); closeCartDrawer(); return; }
    const target = e.target.closest('button, a, .product-card');
    if (!target) return;
    
    // SỬA LỖI 3: Khai báo `classes` trước khi dùng
    const classes = target.classList;
    const id = target.id;

    if (classes.contains('category-tag')) { handleCategoryTagClick(target); }
    else if (classes.contains('product-card')) { handleProductCardClick(target); } 
    else if (id === 'login-btn') { openAuthModal('login'); }
    else if (id === 'logout-btn') { logout(); }
    else if (id === 'close-auth-modal') { closeAuthModal(); }
    else if (classes.contains('auth-tab-btn')) { openAuthModal(target.dataset.form.includes('login') ? 'login' : 'register'); }
    else if (id === 'view-cart-btn' || classes.contains('checkout-btn')) { openCartDrawer(); }
    else if (classes.contains('close-cart-btn')) { closeCartDrawer(); }
    else if (id === 'mobile-nav-toggle') { toggleMobileMenu(target); }
    else if (id === 'add-to-cart-detail') { handleAddToCart(target.dataset.productId); }
    else if (classes.contains('quantity-btn')) { handleQuantityChange(target); }
    else if (classes.contains('remove-item-btn')) { handleRemoveItem(target); }
}

function handleSearchSubmit(e) { e.preventDefault(); const keyword = document.getElementById('search-input').value; window.location.href = `/products.html?keyword=${encodeURIComponent(keyword)}`; }
function handleProductCardClick(card) { const productId = card.dataset.productId; if (productId) window.location.href = `/product-detail.html?id=${productId}`; }
function handleCategoryTagClick(tagButton) {
    const subCategory = tagButton.dataset.subCategory;
    const urlParams = new URLSearchParams(window.location.search);
    if (subCategory === 'all') { urlParams.delete('subCategory'); } else { urlParams.set('subCategory', subCategory); }
    history.pushState(null, '', `${window.location.pathname}?${urlParams.toString()}`);
    renderCategoryTags();
    applyFiltersAndSort();
}

// --- GIỎ HÀNG VÀ XÁC THỰC (Không thay đổi) ---
// (Các hàm handleAddToCart, handleQuantityChange, handleRemoveItem, renderCartItems, updateAuthUI, logout, ... giữ nguyên)
function handleAddToCart(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) { showToast('Lỗi: Không tìm thấy sản phẩm.', 3000, 'error'); return; }
    const existingItem = currentCart.find(item => item._id === productId);
    if (existingItem) { existingItem.quantity++; } else { currentCart.push({ ...product, quantity: 1 }); }
    saveCartToLocalStorage(); updateCartIconCountUI(); animateCartIcon();
    showToast(`${product.name} đã được thêm vào giỏ.`, 2000, 'success');
}
function handleQuantityChange(button) { const productId = button.dataset.id; const item = currentCart.find(i => i._id === productId); if (!item) return; if (button.dataset.action === 'increase') { item.quantity++; } else if (button.dataset.action === 'decrease') { item.quantity--; } if (item.quantity <= 0) { currentCart = currentCart.filter(i => i._id !== productId); } saveCartToLocalStorage(); renderCartItems(); updateCartIconCountUI(); }
function handleRemoveItem(button) { const productId = button.dataset.id; currentCart = currentCart.filter(i => i._id !== productId); saveCartToLocalStorage(); renderCartItems(); updateCartIconCountUI(); }
function renderCartItems() {
    DOMElements.emptyCartView.style.display = currentCart.length === 0 ? 'flex' : 'none';
    DOMElements.cartFooter.style.display = currentCart.length === 0 ? 'none' : 'block';
    DOMElements.cartItemsContainer.innerHTML = currentCart.map(item => `<div class="cart-item"><img src="${item.image}" alt="${item.name}" class="cart-item-image"><div class="item-details"><h4>${item.name}</h4><div class="item-actions"><span class="item-price">${formatCurrency(item.price)}</span><div class="item-quantity-controls"><button class="quantity-btn" data-id="${item._id}" data-action="decrease">-</button><span>${item.quantity}</span><button class="quantity-btn" data-id="${item._id}" data-action="increase">+</button></div></div></div><button class="remove-item-btn" data-id="${item._id}"><i class="fas fa-times"></i></button></div>`).join('');
    DOMElements.cartTotalSpan.textContent = formatCurrency(currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
}
function updateAuthUI() { const user = JSON.parse(localStorage.getItem('user')); const loginBtn = document.getElementById('login-btn'); const userInfoDiv = document.getElementById('user-info'); document.getElementById('admin-link')?.remove(); if (user) { loginBtn.style.display = 'none'; userInfoDiv.style.display = 'flex'; document.getElementById('user-name').textContent = `Chào, ${user.name}`; if (user.role === 'admin') { userInfoDiv.insertAdjacentHTML('beforeend', `<a href="/admin.html" id="admin-link" style="margin-left: 1rem; color: var(--color-accent); font-weight: 600;">Admin</a>`); } } else { loginBtn.style.display = 'block'; userInfoDiv.style.display = 'none'; } }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); updateAuthUI(); showToast('Bạn đã đăng xuất.', 2000); window.location.href = '/index.html'; }
function openAuthModal(mode = 'login') {
    document.getElementById('auth-modal-overlay').style.display = 'block';
    document.getElementById('auth-modal').style.display = 'block';
    const loginTab = document.getElementById('login-tab-btn');
    const registerTab = document.getElementById('register-tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
    if (mode === 'login') {
        loginTab.classList.add('active'); registerTab.classList.remove('active');
        loginForm.style.display = 'block'; registerForm.style.display = 'none';
    } else {
        loginTab.classList.remove('active'); registerTab.classList.add('active');
        loginForm.style.display = 'none'; registerForm.style.display = 'block';
    }
}
function closeAuthModal() { document.getElementById('auth-modal-overlay').style.display = 'none'; document.getElementById('auth-modal').style.display = 'none'; }
async function handleAuthFormSubmit(e) { e.preventDefault(); const formId = e.target.id; const formData = new FormData(e.target); const data = Object.fromEntries(formData.entries()); if (formId === 'login-form') { try { const response = await fetch(`${API_URL}/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.message); localStorage.setItem('token', result.token); localStorage.setItem('user', JSON.stringify(result.user)); updateAuthUI(); closeAuthModal(); showToast('Đăng nhập thành công!', 2000, 'success'); } catch (error) { document.getElementById('login-error').textContent = error.message; } } else if (formId === 'register-form') { try { const response = await fetch(`${API_URL}/users/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.message); showToast(result.message, 3000, 'success'); openAuthModal('login'); } catch (error) { document.getElementById('register-error').textContent = error.message; } } }


// --- HÀM TIỆN ÍCH KHÁC (Không thay đổi) ---
function highlightActiveNavLink() { const urlParams = new URLSearchParams(window.location.search); const mainCategory = urlParams.get('mainCategory'); const currentPage = window.location.pathname.split('/').pop() || 'index.html'; document.querySelectorAll('.sub-navigation a').forEach(link => { const linkCategory = new URL(link.href).searchParams.get('mainCategory'); link.classList.toggle('active', mainCategory === linkCategory); }); document.querySelectorAll('.main-navigation a').forEach(link => { const linkPage = link.getAttribute('href').split('/').pop() || 'index.html'; const isProductsPage = currentPage === 'products.html' && linkPage === 'products.html'; const isOtherPage = currentPage !== 'products.html' && currentPage === linkPage; link.classList.toggle('active', isProductsPage || isOtherPage); }); }
function cacheDOMElements() { DOMElements.cartDrawer = document.getElementById("cart-drawer"); DOMElements.cartOverlay = document.querySelector(".cart-overlay"); DOMElements.cartItemsContainer = document.getElementById("cart-items-container"); DOMElements.cartFooter = document.querySelector(".cart-footer"); DOMElements.emptyCartView = document.getElementById("empty-cart-view"); DOMElements.cartTotalSpan = document.getElementById("cart-total"); DOMElements.cartCountSpan = document.getElementById("cart-count-main"); DOMElements.cartIconBtn = document.getElementById("view-cart-btn"); }
function loadCartFromLocalStorage() { currentCart = JSON.parse(localStorage.getItem("cart")) || []; }
function saveCartToLocalStorage() { localStorage.setItem("cart", JSON.stringify(currentCart)); }
function updateCartIconCountUI() { const totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0); if (DOMElements.cartCountSpan) { DOMElements.cartCountSpan.textContent = totalItems; DOMElements.cartCountSpan.style.display = totalItems > 0 ? "flex" : "none"; } }
function updateFooterYear() { const yearSpan = document.getElementById("current-year"); if (yearSpan) { yearSpan.textContent = new Date().getFullYear(); } }
function toggleMobileMenu(button) { const navList = document.querySelector(".main-navigation"); const isActive = navList.classList.toggle("active"); button.setAttribute("aria-expanded", isActive); button.querySelector("i").className = isActive ? "fas fa-times" : "fas fa-bars"; }
function openCartDrawer() { renderCartItems(); document.body.classList.add("cart-open"); DOMElements.cartDrawer.classList.add("is-open"); DOMElements.cartOverlay.classList.add("is-visible"); }
function closeCartDrawer() { document.body.classList.remove("cart-open"); DOMElements.cartDrawer.classList.remove("is-open"); DOMElements.cartOverlay.classList.remove("is-visible"); }
function animateCartIcon() { DOMElements.cartIconBtn?.classList.add("is-animating"); DOMElements.cartIconBtn?.addEventListener("animationend", () => { DOMElements.cartIconBtn.classList.remove("is-animating"); }, { once: true }); }
function setupScrollAnimations() { const elementsToAnimate = document.querySelectorAll('.fade-in-element'); if (!elementsToAnimate.length) return; const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.15 }); elementsToAnimate.forEach(el => { observer.observe(el); }); }