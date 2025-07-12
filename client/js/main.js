// ===== File: client/js/main.js (PHIÊN BẢN CÓ SỬA LỖI VÀ KÍCH HOẠT TÌM KIẾM) =====
import store from './store.js';
import * as api from './api.js';
import { loadLayout } from './layout.js';
import { showToast, debounce } from './utils.js';
import * as pages from './pages.js';

// --- HÀM QUẢN LÝ UI TRUNG TÂM ---
function closeAllPopups() {
    document.body.classList.remove('overlay-is-active', 'menu-is-open', 'modal-is-open', 'cart-open', 'filter-is-open');
    document.querySelectorAll('.is-visible, .is-open').forEach(el => {
        el.classList.remove('is-visible', 'is-open');
    });
}

function openPopup(selector) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    closeAllPopups();
    
    document.body.classList.add('overlay-is-active');
    element.classList.add(element.matches('.cart-drawer, .products-sidebar-v2') ? 'is-open' : 'is-visible');

    if (element.matches('.cart-drawer')) document.body.classList.add('cart-open');
    else if (element.matches('.products-sidebar-v2')) document.body.classList.add('filter-is-open');
    else document.body.classList.add('modal-is-open');
    
    if(selector === '#auth-modal') {
        pages.renderAuthModal('login');
    }
}

function toggleMegaMenu(e) {
    e.preventDefault();
    e.stopPropagation(); 
    const dropdown = e.target.closest('.has-dropdown');
    if (!dropdown) return;
    
    const wasOpen = dropdown.classList.contains('is-open');
    closeAllPopups();
    
    if (!wasOpen) {
        dropdown.classList.add('is-open');
        document.body.classList.add('menu-is-open', 'overlay-is-active'); 
    }
}


// --- HÀM MỚI ĐỂ XỬ LÝ TÌM KIẾM GỢI Ý ---
function setupSearchSuggestions() {
    const searchInput = document.getElementById('search-input');
    const suggestionsContainer = document.getElementById('search-suggestions-container');
    const searchForm = document.getElementById('search-form');

    if (!searchInput || !suggestionsContainer || !searchForm) {
        return;
    }
    
    const renderSuggestions = (suggestions) => {
        if (!suggestions || suggestions.length === 0) {
            suggestionsContainer.classList.remove('visible');
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(item => `
            <a href="/product-detail.html?id=${item.id}" class="suggestion-item">
                <img src="${item.image || '/images/placeholder.png'}" alt="${item.name}">
                <div class="suggestion-item-info">
                    <span class="suggestion-item-name">${item.name}</span>
                    <span class="suggestion-item-price">${store.formatCurrency(item.price)}</span>
                </div>
            </a>
        `).join('');
        suggestionsContainer.classList.add('visible');
    };

    const fetchSuggestions = debounce(async (keyword) => {
        if (keyword.length < 2) {
            suggestionsContainer.classList.remove('visible');
            return;
        }
        try {
            const suggestions = await api.fetchProductSuggestions(keyword);
            renderSuggestions(suggestions);
        } catch (error) {
            console.error('Lỗi khi lấy gợi ý tìm kiếm:', error);
            suggestionsContainer.classList.remove('visible');
        }
    }, 300);

    searchInput.addEventListener('input', () => {
        fetchSuggestions(searchInput.value);
    });
    
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            suggestionsContainer.classList.remove('visible');
        }
    });

    let activeIndex = -1;
    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        if (!items.length) return;

        const updateActiveSuggestion = (items, index) => {
            items.forEach(item => item.classList.remove('active'));
            if (items[index]) {
                items[index].classList.add('active');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        };

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            updateActiveSuggestion(items, activeIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex > -1) ? (activeIndex - 1 + items.length) % items.length : items.length - 1;
            updateActiveSuggestion(items, activeIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex > -1 && items[activeIndex]) {
                items[activeIndex].click();
            } else {
                searchForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        } else if (e.key === 'Escape') {
            suggestionsContainer.classList.remove('visible');
        }
    });
}


// --- THIẾT LẬP EVENT LISTENERS ---
function setupEventListeners() {
    document.body.addEventListener('click', handleGlobalClick);
    document.body.addEventListener('submit', handleFormSubmit);
    document.addEventListener('add-to-cart-from-card', (e) => handleAddToCart(e.detail.productId));
}

function handleGlobalClick(e) {
    const target = e.target;
    const closest = (selector) => target.closest(selector);

    if (target.id === 'page-overlay' || closest('.close-auth-modal, .close-cart-btn, #close-filter-btn')) {
        e.preventDefault();
        closeAllPopups();
        return;
    }
    
    if (closest('#products-menu-trigger')) {
        toggleMegaMenu(e);
        return;
    }
    
    if (!closest('.has-dropdown') && !closest('.mega-menu-v2')) {
        if(document.body.classList.contains('menu-is-open')){
            closeAllPopups();
        }
    }
    
    const categoryCard = closest('.category-card');
    if (categoryCard) {
        const link = categoryCard.dataset.link;
        if (link) window.location.href = link;
        return;
    }
    
    const popupTrigger = closest('#view-cart-btn, #login-btn, #login-for-review-btn, #open-filter-btn, #open-contact-modal-btn');
    if (popupTrigger) {
        let selector;
        if (popupTrigger.id === 'view-cart-btn') selector = '#cart-drawer';
        else if (popupTrigger.id === 'open-filter-btn') selector = '#filter-drawer';
        else if (popupTrigger.id === 'open-contact-modal-btn') selector = '#contact-modal';
        else selector = '#auth-modal'; // for login-btn and login-for-review-btn
        
        openPopup(selector);
        if(selector === '#cart-drawer') renderCartItems();
        return;
    }
    
    const authTab = closest('.auth-tab-btn');
    if (authTab) {
        pages.renderAuthModal(authTab.dataset.form.includes('login') ? 'login' : 'register');
        return;
    }

    if (closest('#logout-btn')) { logout(); return; }
    if (closest('#add-to-cart-detail')) { handleAddToCart(closest('#add-to-cart-detail').dataset.productId); return; }
    if (closest('.quantity-btn')) { handleQuantityChange(closest('.quantity-btn')); return; }
    if (closest('.remove-item-btn-v2')) { handleRemoveItem(closest('.remove-item-btn-v2')); return; }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    switch (form.id) {
        case 'login-form':
        case 'register-form':
            await handleAuthFormSubmit(form);
            break;
        case 'review-form':
            await handleReviewSubmit(form);
            break;
        case 'search-form':
            handleSearchSubmit(form);
            break;
        case 'shipping-form':
            pages.handleShippingFormSubmit(form);
            break;
        case 'newsletter-form':
            await handleNewsletterSubmit(form);
            break;
        case 'contact-form':
            showToast('Cảm ơn bạn đã gửi thông tin!', 'success');
            form.reset();
            break;
    }
}

function renderPageSpecificContent() {
    try {
        if (document.body.classList.contains('home-page')) pages.renderHomePage();
        else if (document.body.classList.contains('products-page')) pages.renderProductListPage();
        else if (document.body.classList.contains('product-detail-page')) pages.renderProductDetailPage();
        else if (document.body.classList.contains('shipping-page')) pages.renderShippingPage();
        else if (document.body.classList.contains('placeorder-page')) pages.renderPlaceOrderPage();
        else if (document.body.classList.contains('myorders-page')) pages.renderMyOrdersPage();
        else if (document.body.classList.contains('order-detail-page')) pages.renderOrderDetailPage();
    } catch (error) {
        console.error("Lỗi khi render nội dung trang:", error);
    }

    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl && store.getUser()) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    }
}

// --- LOGIC CAROUSEL & SCROLL EFFECTS ---
function setupCarousel() {
    const carouselContainer = document.querySelector('.main-slideshow');
    if (!carouselContainer) return;

    const carouselInner = carouselContainer.querySelector('.carousel-inner');
    const totalItems = carouselContainer.querySelectorAll('.carousel-item').length;
    if (totalItems <= 1) return;
    
    const prevBtn = carouselContainer.querySelector('.carousel-control-prev');
    const nextBtn = carouselContainer.querySelector('.carousel-control-next');
    const indicators = Array.from(carouselContainer.querySelectorAll('.indicator'));
    let currentIndex = 0;
    let autoSlideInterval;

    function updateCarousel() {
        carouselInner.style.transform = `translateX(-${currentIndex * (100 / totalItems)}%)`;
        indicators.forEach((indicator, index) => indicator.classList.toggle('active', index === currentIndex));
    }
    
    const resetAutoSlide = () => { clearInterval(autoSlideInterval); autoSlideInterval = setInterval(() => { currentIndex = (currentIndex + 1) % totalItems; updateCarousel(); }, 5000); };
    
    if (prevBtn) prevBtn.addEventListener('click', () => { currentIndex = (currentIndex - 1 + totalItems) % totalItems; updateCarousel(); resetAutoSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { currentIndex = (currentIndex + 1) % totalItems; updateCarousel(); resetAutoSlide(); });
    
    indicators.forEach((indicator, i) => indicator.addEventListener('click', () => { currentIndex = i; updateCarousel(); resetAutoSlide(); }));
    
    resetAutoSlide();
}

function setupScrollEffects() {
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => scrollToTopBtn.classList.toggle('visible', window.scrollY > 300));
        scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
}

// --- CÁC HÀM LOGIC NGHIỆP VỤ ---
async function handleAddToCart(productId) {
    if (!productId || productId === 'undefined') { showToast('Lỗi: ID sản phẩm không hợp lệ.', 'error'); return; }
    const clickedButton = document.querySelector(`button[data-product-id="${productId}"]:not(:disabled)`);
    if (!clickedButton) return;
    const originalContent = clickedButton.innerHTML;
    clickedButton.disabled = true;
    clickedButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
    try {
        let product = store.findProductById(productId);
        if (!product) { product = await api.fetchProductById(productId); store.addProduct(product); }
        if (product) {
            let stringingInfo = null;
            if (document.body.classList.contains('product-detail-page')) {
                const stringSelect = document.getElementById('string-select');
                if (stringSelect && stringSelect.value !== 'none') {
                    const selectedOption = stringSelect.options[stringSelect.selectedIndex];
                    const tensionInput = document.getElementById('tension-input');
                    stringingInfo = { stringId: stringSelect.value, stringName: selectedOption.textContent.split(' (+')[0], stringPrice: parseFloat(selectedOption.dataset.price), tension: tensionInput ? tensionInput.value : null };
                }
            }
            store.addToCart(product, stringingInfo);
            updateCartIconCountUI();
            if (clickedButton.classList.contains('add-to-cart-icon-btn')) {
                clickedButton.classList.add('is-added');
                const addedIcon = clickedButton.querySelector('.added-icon');
                if (addedIcon) addedIcon.style.display = 'inline-block';
                setTimeout(() => {
                    clickedButton.classList.remove('is-added');
                    if (addedIcon) addedIcon.style.display = 'none';
                }, 2000);
            }
            setTimeout(() => {
                openPopup('#cart-drawer');
                renderCartItems();
            }, 300);
            showToast(`${product.name} đã được thêm vào giỏ.`, 'success');
        } else { throw new Error('Không thể tìm thấy thông tin sản phẩm.'); }
    } catch (error) { showToast(`Lỗi: ${error.message}`, 'error'); } finally {
        if (!clickedButton.classList.contains('add-to-cart-icon-btn')) {
            setTimeout(() => { if (clickedButton) { clickedButton.disabled = false; clickedButton.innerHTML = originalContent; } }, 500);
        } else {
            clickedButton.disabled = false;
            clickedButton.innerHTML = originalContent;
        }
    }
}
function handleQuantityChange(button) {
    store.updateCartItemQuantity(button.dataset.id, button.dataset.action);
    renderCartItems();
    updateCartIconCountUI();
}
function handleRemoveItem(button) {
    store.removeFromCart(button.dataset.id);
    renderCartItems();
    updateCartIconCountUI();
}
async function handleAuthFormSubmit(form) {
    const isLogin = form.id === 'login-form';
    const errorEl = document.getElementById(isLogin ? 'login-error' : 'register-error');
    const data = Object.fromEntries(new FormData(form).entries());
    errorEl.textContent = '';
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';
    try {
        if (!isLogin) {
            if (data.password !== data.confirmPassword) { throw new Error('Mật khẩu xác nhận không khớp.'); }
            if (data.password.length < 6) { throw new Error('Mật khẩu phải có ít nhất 6 ký tự.'); }
        }
        const result = isLogin ? await api.loginUser(data) : await api.registerUser(data);
        if (result.token && result.user) {
            store.setUser(result.user, result.token);
            updateAuthUI();
            closeAllPopups();
            showToast(isLogin ? 'Đăng nhập thành công!' : 'Đăng ký thành công!', 'success');
            const redirectUrl = localStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            } else if (document.body.classList.contains('product-detail-page') || document.body.classList.contains('profile-page')) {
                window.location.reload();
            }
        } else { throw new Error('Phản hồi từ máy chủ không hợp lệ.'); }
    } catch (error) {
        errorEl.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}
function logout() {
    store.logout();
    updateAuthUI();
    showToast('Bạn đã đăng xuất.');
    if (['/profile.html', '/myorders.html', '/admin.html', '/shipping.html', '/placeorder.html', '/order.html'].some(page => window.location.pathname.endsWith(page))) {
        window.location.href = '/index.html';
    } else {
        window.location.reload();
    }
}
function updateAuthUI() {
    const user = store.getUser();
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;
    authSection.innerHTML = user ? `
        <div id="user-info-container" class="action-btn-group" style="display: flex; align-items: center; gap: 0.5rem;">
            <a href="/profile.html" class="action-btn"><i class="fas fa-user" style="margin-right: 8px;"></i> ${user.name}</a>
            ${user.role === 'admin' ? '<a href="/admin.html" class="action-btn" style="background-color: var(--color-accent); color: white;">Admin</a>' : ''}
            <button id="logout-btn" class="action-btn" title="Đăng xuất" style="min-width: 40px;"><i class="fas fa-sign-out-alt"></i></button>
        </div>` : '<button id="login-btn" class="action-btn">Tài khoản</button>';
}
function updateCartIconCountUI() {
    const cartCountSpan = document.getElementById('cart-count-main');
    if (!cartCountSpan) return;
    const totalItems = store.getCartTotalItems();
    cartCountSpan.textContent = totalItems;
    cartCountSpan.style.display = totalItems > 0 ? 'flex' : 'none';
}
function renderCartItems() {
    const cart = store.getCart();
    const itemsContainer = document.getElementById('cart-items-container');
    const emptyView = document.getElementById('empty-cart-view');
    const cartFooter = document.querySelector('.cart-footer');
    const cartTotalSpan = document.getElementById('cart-total');
    if (!itemsContainer || !emptyView || !cartFooter || !cartTotalSpan) return;
    const hasItems = cart.length > 0;
    emptyView.style.display = hasItems ? 'none' : 'flex';
    cartFooter.style.display = hasItems ? 'flex' : 'none';
    itemsContainer.innerHTML = '';
    if (hasItems) {
        cart.forEach((item) => {
            if (!item || !item.id || !item.name) { return; }
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item-v2';
            const cartItemId = store.getCartItemId(item);
            let stringingHTML = '';
            if (item.stringingInfo) {
                stringingHTML = `<div class="cart-item-options-v2">+ Cước: ${item.stringingInfo.stringName} ${item.stringingInfo.tension ? `(${item.stringingInfo.tension} kg)` : ''}</div>`;
            }
            itemEl.innerHTML = `
                <img src="${item.image || '/images/placeholder.png'}" alt="${item.name}" class="cart-item-image-v2" loading="lazy">
                <div class="cart-item-details-v2">
                    <div class="cart-item-info-v2">
                        <a href="/product-detail.html?id=${item.id}" class="cart-item-name-v2">${item.name}</a>
                        ${stringingHTML}
                    </div>
                    <div class="cart-item-footer-v2">
                        <div class="item-quantity-controls-v2">
                            <button class="quantity-btn" data-id="${cartItemId}" data-action="decrease">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" data-id="${cartItemId}" data-action="increase">+</button>
                        </div>
                        <span class="cart-item-price-v2">${store.formatCurrency(item.price * item.quantity)}</span>
                        <button class="remove-item-btn-v2" data-id="${cartItemId}" title="Xóa sản phẩm"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>`;
            itemsContainer.appendChild(itemEl);
        });
        cartTotalSpan.textContent = store.formatCurrency(store.getCartTotalPrice());
    }
}
async function handleReviewSubmit(form) {
    const productId = new URLSearchParams(window.location.search).get('id');
    const rating = form.querySelector('#rating').value;
    const comment = form.querySelector('#comment').value;
    const errorEl = form.querySelector('#review-form-error');
    errorEl.textContent = '';
    try {
        await api.submitReview(productId, { rating, comment }, store.getToken());
        showToast('Cảm ơn bạn đã đánh giá!', 'success');
        window.location.reload();
    } catch (error) {
        errorEl.textContent = error.message;
    }
}
async function handleNewsletterSubmit(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    if (!email) return;
    try {
        const response = await api.subscribeNewsletter(email);
        showToast(response.message, 'success');
        form.reset();
    } catch (error) {
        showToast(`Lỗi: ${error.message}`, 'error');
    }
}
function handleSearchSubmit(form) {
    const keyword = form.querySelector('#search-input').value.trim();
    if (keyword) {
        const suggestionsContainer = document.getElementById('search-suggestions-container');
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('visible');
        }
        window.location.href = `/products.html?keyword=${encodeURIComponent(keyword)}`;
    }
}


// --- HÀM KHỞI TẠO CHÍNH ---
function main() {
    if (document.body.classList.contains('admin-page')) {
        console.log("-> Admin page detected, public main.js will not run layout/page logic.");
        return;
    }

    try {
        loadLayout();
        store.loadCart();
        updateAuthUI();
        updateCartIconCountUI();
        setupEventListeners();
        renderPageSpecificContent();
        setupCarousel();
        setupScrollEffects();
        setupSearchSuggestions();
        
        console.log("✅ Application initialized successfully!");
    } catch (error) {
        console.error("❌ Critical error during application initialization:", error);
    }
}

document.addEventListener('DOMContentLoaded', main);