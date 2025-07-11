// ===== File: client/js/main.js (VERSION 2.8 - FIXED INITIALIZATION LOGIC) =====
import store from './store.js';
import * as api from './api.js';
import { loadLayout } from './layout.js';
import { showToast } from './utils.js';
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
    
    document.body.classList.add('overlay-is-active', 'modal-is-open');
    const isDrawer = element.matches('.cart-drawer, .products-sidebar-v2');
    element.classList.add(isDrawer ? 'is-open' : 'is-visible');
    if (isDrawer) {
        if (element.id === 'cart-drawer') document.body.classList.add('cart-open');
        else if (element.id === 'filter-drawer') document.body.classList.add('filter-is-open');
    }
    
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
        document.body.classList.add('menu-is-open'); 
    }
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
    
    if (!closest('.has-dropdown')) {
        const menu = document.querySelector('.has-dropdown.is-open');
        if (menu) {
            closeAllPopups();
        }
    }

    if (closest('#products-menu-trigger')) {
        toggleMegaMenu(e);
    } else if (closest('.category-card')) {
        const link = closest('.category-card').dataset.link;
        if (link) window.location.href = link;
    } else if (closest('#view-cart-btn')) {
        openPopup('#cart-drawer');
        renderCartItems();
    } else if (closest('#login-btn, #login-for-review-btn')) {
        openPopup('#auth-modal');
    } else if (closest('#open-filter-btn')) {
        openPopup('#filter-drawer');
    } else if (closest('#open-contact-modal-btn')) {
        openPopup('#contact-modal');
    } else if (closest('.auth-tab-btn')) {
        pages.renderAuthModal(closest('.auth-tab-btn').dataset.form.includes('login') ? 'login' : 'register');
    } else if (closest('#logout-btn')) {
        logout();
    } else if (closest('#add-to-cart-detail')) {
        handleAddToCart(closest('#add-to-cart-detail').dataset.productId);
    } else if (closest('.quantity-btn')) {
        handleQuantityChange(closest('.quantity-btn'));
    } else if (closest('.remove-item-btn-v2')) {
        handleRemoveItem(closest('.remove-item-btn-v2'));
    }
}

function handleFormSubmit(e) {
    const formId = e.target.id;
    if (['login-form', 'register-form', 'review-form', 'search-form', 'shipping-form', 'newsletter-form', 'contact-form'].includes(formId)) {
        e.preventDefault();
    }

    switch (formId) {
        case 'login-form':
        case 'register-form':
            handleAuthFormSubmit(e.target);
            break;
        case 'review-form':
            handleReviewSubmit(e.target);
            break;
        case 'search-form':
            handleSearchSubmit(e.target);
            break;
        case 'shipping-form':
            pages.handleShippingFormSubmit(e.target);
            break;
        case 'newsletter-form':
        case 'contact-form':
            showToast('Cảm ơn bạn đã gửi thông tin!', 'success');
            e.target.reset();
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
    const carouselItems = carouselContainer.querySelectorAll('.carousel-item');
    const prevBtn = carouselContainer.querySelector('.carousel-control-prev');
    const nextBtn = carouselContainer.querySelector('.carousel-control-next');
    const indicatorsContainer = carouselContainer.querySelector('.carousel-indicators');
    
    if (!carouselInner || !carouselItems.length || !indicatorsContainer) return;
    
    const indicators = Array.from(indicatorsContainer.querySelectorAll('.indicator'));
    let currentIndex = 0;
    const totalItems = carouselItems.length;
    let autoSlideInterval;

    function updateCarousel() {
        carouselInner.style.transform = `translateX(${-currentIndex * 100 / totalItems}%)`;
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    function showNextSlide() {
        currentIndex = (currentIndex + 1) % totalItems;
        updateCarousel();
    }
    
    function startAutoSlide() {
        stopAutoSlide(); 
        autoSlideInterval = setInterval(showNextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoSlide(); currentIndex = (currentIndex - 1 + totalItems) % totalItems; updateCarousel(); startAutoSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoSlide(); showNextSlide(); startAutoSlide(); });

    indicators.forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            stopAutoSlide();
            currentIndex = parseInt(e.target.dataset.slideTo);
            updateCarousel();
            startAutoSlide();
        });
    });

    updateCarousel();
    startAutoSlide();
}

function setupScrollEffects() {
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
}

// --- CÁC HÀM LOGIC NGHIỆP VỤ ---
async function handleAddToCart(productId) {
    if (!productId || productId === 'undefined') {
        showToast('Lỗi: ID sản phẩm không hợp lệ.', 'error');
        return;
    }
    
    const clickedButton = document.querySelector(`button[data-product-id="${productId}"].add-to-cart-icon-btn, button[data-product-id="${productId}"].add-to-cart-from-card-btn, #add-to-cart-detail[data-product-id="${productId}"]`);
    if (!clickedButton || clickedButton.disabled) return;

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
                    stringingInfo = { 
                        stringId: stringSelect.value, 
                        stringName: selectedOption.textContent.split(' (+')[0], 
                        stringPrice: parseFloat(selectedOption.dataset.price), 
                        tension: tensionInput ? tensionInput.value : null 
                    };
                }
            }
            store.addToCart(product, stringingInfo);
            updateCartIconCountUI();
            openPopup('#cart-drawer');
            renderCartItems();
            showToast(`${product.name} đã được thêm vào giỏ.`, 'success');
        } else { throw new Error('Không thể tìm thấy thông tin sản phẩm.'); }
    } catch(error) { showToast(`Lỗi: ${error.message}`, 'error'); }
    finally {
        setTimeout(() => {
            if(clickedButton) {
                clickedButton.disabled = false;
                clickedButton.innerHTML = originalContent;
            }
        }, 500);
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
            if (data.password !== data.confirmPassword) {
                throw new Error('Mật khẩu xác nhận không khớp.');
            }
            if (data.password.length < 6) {
                throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
            }
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
        } else {
            throw new Error('Phản hồi từ máy chủ không hợp lệ.');
        }

    } catch (error) {
        errorEl.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}   //aa//
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
            if (!item || !item.id || !item.name) {
                console.warn("Một sản phẩm trong giỏ hàng bị lỗi, đã bỏ qua:", item);
                return;
            }

            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item-v2';
            const cartItemId = store.getCartItemId(item);
            const imageUrl = item.image || '/images/placeholder.png'; 
            const productUrl = `/product-detail.html?id=${item.id}`;
            const itemName = item.name || 'Sản phẩm không tên';
            const itemPrice = item.price || 0;
            
            let stringingHTML = '';
            if (item.stringingInfo) {
                stringingHTML = `<div class="cart-item-options-v2">+ Cước: ${item.stringingInfo.stringName} ${item.stringingInfo.tension ? `(${item.stringingInfo.tension} kg)` : ''}</div>`;
            }

            itemEl.innerHTML = `
                <img src="${imageUrl}" alt="${itemName}" class="cart-item-image-v2" loading="lazy">
                <div class="cart-item-details-v2">
                    <div class="cart-item-info-v2">
                        <a href="${productUrl}" class="cart-item-name-v2">${itemName}</a>
                        ${stringingHTML}
                    </div>
                    <div class="cart-item-footer-v2">
                        <div class="item-quantity-controls-v2">
                            <button class="quantity-btn" data-id="${cartItemId}" data-action="decrease">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" data-id="${cartItemId}" data-action="increase">+</button>
                        </div>
                        <span class="cart-item-price-v2">${store.formatCurrency(itemPrice * item.quantity)}</span>
                        <button class="remove-item-btn-v2" data-id="${cartItemId}" title="Xóa sản phẩm"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>`;
            itemsContainer.appendChild(itemEl);
        });
        cartTotalSpan.textContent = store.formatCurrency(store.getCartTotalPrice());
    }
}

function handleSearchSubmit(form) {
    const keyword = form.querySelector('#search-input').value.trim();
    if (keyword) {
        window.location.href = `/products.html?keyword=${encodeURIComponent(keyword)}`;
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

// --- HÀM KHỞI TẠO CHÍNH ---
function main() {
    // Sửa lỗi: Di chuyển check admin vào trong hàm main
    if (document.body.classList.contains('admin-page')) {
        console.log("-> Đang ở trang Admin, main.js sẽ không khởi tạo layout và các trang công khai.");
        return; // Dừng lại, không chạy code cho trang công khai
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
        
        console.log("✅ Ứng dụng đã khởi tạo thành công!");
    } catch (error) {
        console.error("❌ Lỗi nghiêm trọng khi khởi tạo ứng dụng:", error);
    }
}

// Chạy hàm main sau khi DOM đã được tải hoàn toàn
document.addEventListener('DOMContentLoaded', main);