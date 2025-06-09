import { showToast, formatCurrency } from './utils.js';
import { loadLayout } from './layout.js';
import { createProductCard } from './components.js';

let allProducts = [];
const API_URL = 'http://localhost:5000/api';
let currentCart = [];
const DOMElements = {};

// Hàm chính, chạy khi trang được tải xong
document.addEventListener('DOMContentLoaded', async () => {
    loadLayout();
    cacheDOMElements();
    loadCartFromLocalStorage();
    updateCartIconCountUI();
    updateAuthUI(); // <-- Quan trọng: Kiểm tra đăng nhập ngay khi tải trang
    setupEventListeners();

    await fetchAllProducts();
    
    renderPageSpecificContent();
    updateFooterYear();
    highlightActiveNavLink();
    setupScrollAnimations();
});

// Lấy toàn bộ sản phẩm từ API và lưu vào biến allProducts
async function fetchAllProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProducts = await response.json();
    } catch (error) {
        console.error("Không thể lấy sản phẩm:", error);
    }
}

// Kiểm tra xem người dùng đang ở trang nào và hiển thị nội dung phù hợp
function renderPageSpecificContent() {
    if (document.body.classList.contains('products-page')) {
        populateBrandFilter();
        applyFiltersAndSort();
    } else if (document.body.classList.contains('home-page')) {
        const productGridEl = document.querySelector('.products-section-home .product-grid');
        if (productGridEl) {
            productGridEl.innerHTML = '';
            const promotionalProducts = allProducts.filter(p => p.isPromotional).slice(0, 4);
            
            if (promotionalProducts.length > 0) {
                promotionalProducts.forEach(p => productGridEl.appendChild(createProductCard(p)));
            } else {
                allProducts.slice(0, 4).forEach(p => productGridEl.appendChild(createProductCard(p)));
            }
        }
    } else if (document.body.classList.contains('product-detail-page')) {
        renderProductDetailPage();
    }
}

// Lấy ID từ URL và hiển thị trang chi tiết sản phẩm
async function renderProductDetailPage() {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (!productId) throw new Error('Không tìm thấy ID sản phẩm.');

        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Sản phẩm không tồn tại');
        const product = await response.json();

        document.title = `${product.name} - UMT Instruments`;
        container.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-image-gallery">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info-panel">
                    <h1 class="product-title">${product.name}</h1>
                    <p class="product-brand">Thương hiệu: ${product.brand}</p>
                    <span class="product-price-detail">${formatCurrency(product.price)}</span>
                    <p class="product-short-description">${product.description}</p>
                    <div class="product-actions">
                        <button id="add-to-cart-detail" class="btn primary-btn" data-product-id="${product._id}">Thêm vào giỏ hàng</button>
                    </div>
                    <div class="product-full-description">
                        <h3>Mô tả chi tiết</h3>
                        <p>${product.fullDescription || 'Hiện chưa có mô tả chi tiết cho sản phẩm này.'}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        container.innerHTML = `<p class="error-message">Đã xảy ra lỗi khi tải sản phẩm. Vui lòng thử lại.</p>`;
    }
}

function handleProductCardClick(card) {
    const productId = card.dataset.productId;
    if (productId) window.location.href = `product-detail.html?id=${productId}`;
}

function handleAddToCart(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    const existingItem = currentCart.find(item => item._id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        currentCart.push({ ...product, quantity: 1 });
    }
    
    saveCartToLocalStorage();
    updateCartIconCountUI();
    animateCartIcon();
    showToast(`${product.name} đã được thêm vào giỏ.`, 2000, 'success');
}

function handleQuantityChange(button) {
    const productId = button.dataset.id;
    const item = currentCart.find(i => i._id === productId);
    if (!item) return;

    if (button.dataset.action === 'increase') {
        item.quantity++;
    } else if (button.dataset.action === 'decrease') {
        item.quantity--;
    }
    
    if (item.quantity <= 0) {
        currentCart = currentCart.filter(i => i._id !== productId);
    }
    
    saveCartToLocalStorage();
    renderCartItems();
    updateCartIconCountUI();
}

function handleRemoveItem(button) {
    const productId = button.dataset.id;
    currentCart = currentCart.filter(i => i._id !== productId);
    saveCartToLocalStorage();
    renderCartItems();
    updateCartIconCountUI();
}

function renderCartItems() {
    DOMElements.emptyCartView.style.display = currentCart.length === 0 ? 'flex' : 'none';
    DOMElements.cartFooter.style.display = currentCart.length === 0 ? 'none' : 'block';
    
    DOMElements.cartItemsContainer.innerHTML = currentCart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="item-details">
                <h4>${item.name}</h4>
                <div class="item-actions">
                    <span class="item-price">${formatCurrency(item.price)}</span>
                    <div class="item-quantity-controls">
                        <button class="quantity-btn" data-id="${item._id}" data-action="decrease" aria-label="Giảm số lượng">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item._id}" data-action="increase" aria-label="Tăng số lượng">+</button>
                    </div>
                </div>
            </div>
            <button class="remove-item-btn" data-id="${item._id}" aria-label="Xóa sản phẩm"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    DOMElements.cartTotalSpan.textContent = formatCurrency(total);
}

function populateBrandFilter() {
    const brandFilter = document.getElementById('brand-filter');
    if (!brandFilter || brandFilter.length > 1) return;

    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

function applyFiltersAndSort() {
    const brandFilterValue = document.getElementById('brand-filter')?.value || 'all';
    const priceSortValue = document.getElementById('price-sort')?.value || 'default';
    let filteredProducts = [...allProducts];

    if (brandFilterValue !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.brand === brandFilterValue);
    }
    if (priceSortValue === 'asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (priceSortValue === 'desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    renderProductGrid(filteredProducts);
}

function renderProductGrid(productsToRender) {
    const productGridEl = document.querySelector('.product-listing .product-grid');
    const noProductsMessage = document.getElementById('no-products-found-detailed');
    if (!productGridEl || !noProductsMessage) return;

    productGridEl.innerHTML = '';
    productsToRender.forEach(p => productGridEl.appendChild(createProductCard(p)));
    noProductsMessage.style.display = productsToRender.length === 0 ? 'block' : 'none';
}

function highlightActiveNavLink() {
    const navLinks = document.querySelectorAll('.main-navigation a');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
        if (currentPage === linkPage) {
            link.classList.add('active');
        }
    });
}

// Dùng event delegation để quản lý tất cả các event click một cách hiệu quả
function setupEventListeners() {
    document.body.addEventListener("click", handleBodyClick);
    if (document.body.classList.contains("products-page")) {
        document.getElementById("brand-filter")?.addEventListener("change", applyFiltersAndSort);
        document.getElementById("price-sort")?.addEventListener("change", applyFiltersAndSort);
    }
    // Gán sự kiện submit cho các form
    document.getElementById('login-form')?.addEventListener('submit', handleAuthFormSubmit);
    document.getElementById('register-form')?.addEventListener('submit', handleAuthFormSubmit);
}

// Xử lý tập trung tất cả các sự kiện click trên trang
function handleBodyClick(e) {
    // Nếu click ra ngoài modal, đóng nó lại
    if (e.target.id === 'auth-modal-overlay') {
        closeAuthModal();
        return;
    }

    const target = e.target.closest('button, a, .product-card');
    if (!target) return;

    // Xử lý các sự kiện authentication
    if (target.matches('#login-btn')) {
        openAuthModal('login');
    } else if (target.matches('#logout-btn')) {
        logout();
    } else if (target.matches('#close-auth-modal')) {
        closeAuthModal();
    } else if (target.matches('.auth-tab-btn')) {
        const formId = target.dataset.form;
        openAuthModal(formId.includes('login') ? 'login' : 'register');
    } 
    // Xử lý các sự kiện cũ
    else if (target.matches('#view-cart-btn')) {
        openCartDrawer();
    } else if (target.matches('.close-cart-btn') || target.matches('.cart-overlay')) {
        closeCartDrawer();
    } else if (target.matches('#mobile-nav-toggle')) {
        toggleMobileMenu(target);
    } else if (target.matches('.product-card')) {
        handleProductCardClick(target);
    } else if (target.matches('#add-to-cart-detail')) {
        handleAddToCart(target.dataset.productId);
    } else if (target.matches('.quantity-btn')) {
        handleQuantityChange(target);
    } else if (target.matches('.remove-item-btn')) {
        handleRemoveItem(target);
    }
}

// --- CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS) ---
function cacheDOMElements() {
    DOMElements.cartDrawer = document.getElementById("cart-drawer");
    DOMElements.cartOverlay = document.querySelector(".cart-overlay");
    DOMElements.cartItemsContainer = document.getElementById("cart-items-container");
    DOMElements.cartFooter = document.querySelector(".cart-footer");
    DOMElements.emptyCartView = document.getElementById("empty-cart-view");
    DOMElements.cartTotalSpan = document.getElementById("cart-total");
    DOMElements.cartCountSpan = document.getElementById("cart-count-main");
    DOMElements.cartIconBtn = document.getElementById("view-cart-btn");
}
function loadCartFromLocalStorage() { currentCart = JSON.parse(localStorage.getItem("cart")) || []; }
function saveCartToLocalStorage() { localStorage.setItem("cart", JSON.stringify(currentCart)); }
function updateCartIconCountUI() {
    const totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
    if (DOMElements.cartCountSpan) {
        DOMElements.cartCountSpan.textContent = totalItems;
        DOMElements.cartCountSpan.style.display = totalItems > 0 ? "flex" : "none";
    }
}
function updateFooterYear() {
    const yearSpan = document.getElementById("current-year");
    if (yearSpan) { yearSpan.textContent = new Date().getFullYear(); }
}
function toggleMobileMenu(button) {
    const navList = document.getElementById("main-nav-list");
    const isActive = navList.classList.toggle("active");
    button.setAttribute("aria-expanded", isActive);
    button.querySelector("i").className = isActive ? "fas fa-times" : "fas fa-bars";
}
function openCartDrawer() {
    renderCartItems();
    document.body.classList.add("cart-open");
    DOMElements.cartDrawer.classList.add("is-open");
    DOMElements.cartOverlay.classList.add("is-visible");
}
function closeCartDrawer() {
    document.body.classList.remove("cart-open");
    DOMElements.cartDrawer.classList.remove("is-open");
    DOMElements.cartOverlay.classList.remove("is-visible");
}
function animateCartIcon() {
    DOMElements.cartIconBtn?.classList.add("is-animating");
    DOMElements.cartIconBtn?.addEventListener("animationend", () => {
        DOMElements.cartIconBtn.classList.remove("is-animating");
    }, { once: true });
}
function setupScrollAnimations() {
    const elementsToAnimate = document.querySelectorAll('.fade-in-element');
    if (!elementsToAnimate.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    elementsToAnimate.forEach(el => { observer.observe(el); });
}

// --- CÁC HÀM XỬ LÝ AUTHENTICATION ---
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
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}
function closeAuthModal() {
    document.getElementById('auth-modal-overlay').style.display = 'none';
    document.getElementById('auth-modal').style.display = 'none';
}
async function handleAuthFormSubmit(e) {
    e.preventDefault();
    const formId = e.target.id;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    if (formId === 'login-form') {
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            updateAuthUI();
            closeAuthModal();
        } catch (error) {
            document.getElementById('login-error').textContent = error.message;
        }
    } else if (formId === 'register-form') {
        try {
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showToast(result.message, 3000, 'success');
            openAuthModal('login');
        } catch (error) {
            document.getElementById('register-error').textContent = error.message;
        }
    }
}
// ===== Sửa lại hàm updateAuthUI() trong client/js/main.js =====

function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const loginBtn = document.getElementById('login-btn');
    const userInfoDiv = document.getElementById('user-info');
    
    // THÊM MỚI: Xóa link Admin cũ đi để tránh trùng lặp
    const existingAdminLink = document.getElementById('admin-link');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }

    if (token && user) {
        loginBtn.style.display = 'none';
        userInfoDiv.style.display = 'flex';
        document.getElementById('user-name').textContent = `Chào, ${user.name}`;

        // THÊM MỚI: Nếu người dùng là admin, thêm link vào trang quản trị
        if (user.role === 'admin') {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.textContent = 'Trang Admin';
            adminLink.id = 'admin-link'; // Để dễ dàng tìm và xóa
            adminLink.style.marginLeft = '1rem'; // Thêm khoảng cách
            // Chèn link vào sau nút đăng xuất
            document.getElementById('logout-btn').insertAdjacentElement('afterend', adminLink);
        }

    } else {
        loginBtn.style.display = 'block';
        userInfoDiv.style.display = 'none';
    }

}
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    showToast('Bạn đã đăng xuất.', 2000);
}