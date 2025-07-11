// ===== File: client/js/pages.js (VERSION 2.9 - FIXED & IMPROVED) =====
import store from './store.js';
import * as api from './api.js';
import { createProductCard, createRatingComponent } from './components.js';
import { formatCurrency, showToast } from './utils.js';
import * as templates from './templates.js';

let priceSliderInstance = null;

// =======================================================================
// AUTH MODAL
// =======================================================================
export function renderAuthModal(tab = 'login') {
    const loginTab = document.getElementById('login-tab-btn');
    const registerTab = document.getElementById('register-tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (!loginTab || !registerTab || !loginForm || !registerForm) return;

    if (tab === 'login') {
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

// =======================================================================
// HOME PAGE - SKELETON LOADING
// =======================================================================
export async function renderHomePage() {
    const productGridEl = document.getElementById('homepage-product-grid');
    const tabsContainer = document.querySelector('.product-tabs');

    if (!tabsContainer || !productGridEl) return;
    
    const renderProductsByFilter = async (filter = 'newest') => {
        if (productGridEl) {
            productGridEl.innerHTML = ''; // Clear old products
            for (let i = 0; i < 8; i++) {
                productGridEl.innerHTML += `
                    <div class="skeleton-card">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-info">
                            <div class="skeleton-line short"></div>
                            <div class="skeleton-line medium"></div>
                            <div class="skeleton-line"></div>
                        </div>
                    </div>
                `;
            }
        }
        
        try {
            let query = 'pageSize=8';
            if (filter === 'promo') query += '&isPromotional=true';
            else if (filter === 'bestseller') query += '&sortBy=rating_desc';
            
            let { products } = await api.fetchProducts(query);
            
            productGridEl.innerHTML = '';
            
            if (products && products.length > 0) {
                products.forEach(p => productGridEl.appendChild(createProductCard(p)));
            } else {
                productGridEl.innerHTML = '<p>Không tìm thấy sản phẩm phù hợp.</p>';
            }
        } catch (error) {
            console.error(error);
            productGridEl.innerHTML = '<p class="error-message">Không thể tải sản phẩm.</p>';
        }
    };

    tabsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.product-tab-btn') && !e.target.classList.contains('active')) {
            tabsContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            renderProductsByFilter(e.target.dataset.filter);
        }
    });

    renderProductsByFilter('newest');
}

// =======================================================================
// PRODUCT LIST PAGE
// =======================================================================
export async function renderProductListPage() {
    // CẢI TIẾN: Khởi tạo bộ lọc khi vào trang
    await initializeFilters(); 
    
    document.getElementById('apply-filters-btn')?.addEventListener('click', () => applyFiltersAndRender());
    document.getElementById('sort-by-filter')?.addEventListener('change', () => applyFiltersAndRender());
    
    document.getElementById('pagination-container')?.addEventListener('click', (e) => {
        const pageBtn = e.target.closest('.pagination-btn');
        if (pageBtn && !pageBtn.disabled && !pageBtn.classList.contains('active')) {
            applyFiltersAndRender(Number(pageBtn.dataset.page));
        }
    });
    
    document.getElementById('active-filters-container')?.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-filter-btn');
        if (removeBtn) {
            removeFilter(removeBtn.dataset.key, removeBtn.dataset.value);
        } else if (e.target.id === 'clear-all-filters-btn') {
            clearAllFilters();
        }
    });
    
    applyFiltersAndRender(new URLSearchParams(window.location.search).get('page') || 1); 
}

// CẢI TIẾN: Hoàn thiện hàm khởi tạo bộ lọc
async function initializeFilters() {
    try {
        const [brands] = await Promise.all([
            api.fetchBrands()
            // Có thể thêm fetchCategories hoặc fetchProductsMeta ở đây nếu cần
        ]);
        
        const brandContainer = document.getElementById('brand-filter-options');
        if (brandContainer && brands) {
            brandContainer.innerHTML = brands.map(brand => `<label><input type="checkbox" name="brand" value="${brand.name}"><span>${brand.name}</span></label>`).join('');
        }

        // Tạm thời hardcode khoảng giá, vì chưa có API `products/meta`
        const sliderEl = document.getElementById('price-slider');
        if (sliderEl && typeof noUiSlider !== 'undefined') {
            const min = 0;
            const max = 5000000;
            if(priceSliderInstance) priceSliderInstance.destroy();
            priceSliderInstance = noUiSlider.create(sliderEl, { start: [min, max], connect: true, step: 50000, range: { 'min': min, 'max': max }, format: { to: value => Math.round(value), from: value => Number(value) } });
            const lowerValEl = document.getElementById('price-lower-value');
            const upperValEl = document.getElementById('price-upper-value');
            priceSliderInstance.on('update', (values) => {
                if(lowerValEl) lowerValEl.textContent = formatCurrency(values[0]);
                if(upperValEl) upperValEl.textContent = formatCurrency(values[1]);
            });
        }
    } catch (error) { console.error("Lỗi khởi tạo bộ lọc:", error); }
}


function buildFilterParamsFromUI() {
    const urlParams = new URLSearchParams();
    const currentParams = new URLSearchParams(window.location.search);
    ['mainCategory', 'subCategory', 'isPromotional', 'keyword'].forEach(key => {
        if(currentParams.has(key)) urlParams.set(key, currentParams.get(key));
    });

    const getCheckedValues = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value).join(',');
    const brands = getCheckedValues('brand'); if (brands) urlParams.set('brand', brands);
    const weight = getCheckedValues('weight'); if (weight) urlParams.set('weight', weight);
    const balance = getCheckedValues('balance'); if (balance) urlParams.set('balance', balance);
    if (priceSliderInstance) {
        const [minPrice, maxPrice] = priceSliderInstance.get();
        const range = priceSliderInstance.options.range;
        if (Number(minPrice) > range.min) urlParams.set('minPrice', minPrice);
        if (Number(maxPrice) < range.max) urlParams.set('maxPrice', maxPrice);
    }
    const sortBy = document.getElementById('sort-by-filter')?.value; if (sortBy) urlParams.set('sortBy', sortBy);
    return urlParams;
}

function syncFilterUIFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = urlParams.has(cb.name) && urlParams.get(cb.name).split(',').includes(cb.value); });
    if (priceSliderInstance) {
        const minPrice = urlParams.get('minPrice');
        const maxPrice = urlParams.get('maxPrice');
        const range = priceSliderInstance.options.range;
        priceSliderInstance.set([minPrice || range.min, maxPrice || range.max]);
    }
    const sortBy = urlParams.get('sortBy'); if (sortBy) document.getElementById('sort-by-filter').value = sortBy;
    const mainCategory = urlParams.get('mainCategory');
    const racquetFiltersEl = document.getElementById('racquet-filters'); if (racquetFiltersEl) racquetFiltersEl.style.display = (mainCategory === 'vot-cau-long') ? 'block' : 'none';
}

function renderActiveFilterTags() {
    const container = document.getElementById('active-filters-container'); if (!container) return;
    const urlParams = new URLSearchParams(window.location.search);
    let tagsHTML = ''; let hasFilters = false;
    const filterLabels = { brand: "Thương hiệu", weight: "Trọng lượng", balance: "Cân bằng", minPrice: "Giá từ", maxPrice: "Giá đến", keyword: "Từ khóa" };
    urlParams.forEach((value, key) => {
        if (['page', 'sortBy', 'mainCategory', 'isPromotional', 'subCategory'].includes(key)) return;
        hasFilters = true;
        if (key === 'minPrice' || key === 'maxPrice') {
             tagsHTML += `<div class="filter-tag">${filterLabels[key]}: ${formatCurrency(parseInt(value))} <button class="remove-filter-btn" data-key="${key}" data-value="${value}">×</button></div>`;
        } else {
            value.split(',').forEach(val => { tagsHTML += `<div class="filter-tag">${filterLabels[key] || key}: ${val} <button class="remove-filter-btn" data-key="${key}" data-value="${val}">×</button></div>`; });
        }
    });
    if (hasFilters) tagsHTML += `<button id="clear-all-filters-btn">Xóa tất cả</button>`;
    container.innerHTML = tagsHTML;
}

function removeFilter(key, value) {
    const urlParams = new URLSearchParams(window.location.search);
    if (['minPrice', 'maxPrice', 'keyword'].includes(key)) {
        urlParams.delete(key);
    } else if (urlParams.has(key)) {
        let values = urlParams.get(key).split(',').filter(v => v !== value);
        if (values.length > 0) urlParams.set(key, values.join(','));
        else urlParams.delete(key);
    }
    urlParams.set('page', '1');
    applyFiltersAndRender(1, urlParams);
}

function clearAllFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const preservedParams = ['mainCategory', 'subCategory', 'isPromotional', 'keyword'];
    const newParams = new URLSearchParams();
    preservedParams.forEach(key => { if(urlParams.has(key)) newParams.set(key, urlParams.get(key)); });
    newParams.set('page', '1');
    applyFiltersAndRender(1, newParams);
}

async function applyFiltersAndRender(page = 1, newParams = null) {
    document.body.classList.remove('overlay-is-active', 'modal-is-open', 'filter-is-open');
    document.getElementById('filter-drawer')?.classList.remove('is-open');

    const productGridEl = document.getElementById('product-grid-container');
    const noProductsMessage = document.getElementById('no-products-found-detailed');
    const spinner = document.getElementById('spinner-overlay'); 

    if (spinner) spinner.classList.remove('hidden');
    if (productGridEl) productGridEl.innerHTML = '';
    if (noProductsMessage) noProductsMessage.style.display = 'none';

    let urlParams;
    if (newParams) {
        urlParams = newParams;
    } else {
        urlParams = buildFilterParamsFromUI();
        urlParams.set('page', page);
    }
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    syncFilterUIFromURL();
    renderActiveFilterTags();
    
    try {
        const { products, count, page: currentPage, pages: totalPages } = await api.fetchProducts(urlParams.toString());
        
        const countDisplay = document.getElementById('product-count-display');
        if (countDisplay) {
            countDisplay.innerHTML = `Tìm thấy <strong>${count}</strong> sản phẩm`;
        }
        renderProductGrid(products);
        renderPagination(totalPages, currentPage);

    } catch (error) {
        console.error("Lỗi khi áp dụng bộ lọc và render sản phẩm:", error);
        const gridWrapper = document.getElementById('product-grid-wrapper');
        if (gridWrapper) {
            gridWrapper.innerHTML = `<p class="error-message">Không thể tải sản phẩm. Vui lòng thử lại.</p>`;
        }
    } finally {
        if (spinner) spinner.classList.add('hidden');
    }
}

function renderProductGrid(products) {
    const gridWrapper = document.getElementById('product-grid-wrapper');
    const noProductsMessage = document.getElementById('no-products-found-detailed');
    if (!gridWrapper || !noProductsMessage) return;
    
    const oldGrid = gridWrapper.querySelector('#product-grid-container');
    if(oldGrid) oldGrid.remove();
    
    const productGridEl = document.createElement('div');
    productGridEl.id = 'product-grid-container';
    productGridEl.className = 'products-grid-v2';
    gridWrapper.prepend(productGridEl);

    if (products && products.length > 0) {
        products.forEach(p => productGridEl.appendChild(createProductCard(p)));
        noProductsMessage.style.display = 'none';
    } else {
        noProductsMessage.style.display = 'flex';
    }
}

function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const createButton = (text, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.className = 'pagination-btn';
        if (isActive) btn.classList.add('active');
        btn.disabled = isDisabled;
        btn.dataset.page = page;
        return btn;
    };
    
    container.appendChild(createButton('«', currentPage - 1, false, currentPage === 1));
    const pagesToShow = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
    } else {
        pagesToShow.push(1);
        if (currentPage > 3) pagesToShow.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pagesToShow.push(i);
        if (currentPage < totalPages - 2) pagesToShow.push('...');
        pagesToShow.push(totalPages);
    }
    pagesToShow.forEach(p => {
        if (p === '...') {
            const span = document.createElement('span');
            span.textContent = '...';
            span.className = 'pagination-dots';
            container.appendChild(span);
        } else {
            container.appendChild(createButton(p, p, p === currentPage));
        }
    });
    container.appendChild(createButton('»', currentPage + 1, false, currentPage === totalPages));
}

// =======================================================================
// PRODUCT DETAIL PAGE
// =======================================================================
export async function renderProductDetailPage() {
    const container = document.getElementById('product-detail-container');
    const productId = new URLSearchParams(window.location.search).get('id');

    if (!container || !productId) return;
    container.innerHTML = `<p class="loading-message">Đang tải thông tin sản phẩm...</p>`;

    try {
        const product = await api.fetchProductById(productId);
        store.addProduct(product);
        container.innerHTML = templates.generateProductDetailHTML(product);
        document.title = `${product.name} - SportStore`;
        
        initImageGallery();
        initProductTabs();
        await initStringingOptions(product);
        renderReviewForm(product, store.getUser());
        await renderRelatedProducts(productId);
    } catch (error) {
        container.innerHTML = `<h1 class="page-title">${error.message}</h1>`;
    }
}

function initImageGallery() {
    const mainImage = document.getElementById('main-product-image');
    const galleryContainer = document.getElementById('thumbnail-gallery');
    if (!mainImage || !galleryContainer) return;

    galleryContainer.addEventListener('click', (e) => {
        const thumbnail = e.target.closest('.thumbnail-item');
        if (thumbnail) {
            mainImage.src = thumbnail.querySelector('img').src;
            galleryContainer.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        }
    });
}

function initProductTabs() {
    const tabContainer = document.querySelector('.product-tabs-container');
    if (!tabContainer) return;
    const tabButtons = tabContainer.querySelectorAll('.tab-btn');
    const tabContents = tabContainer.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            tabContainer.querySelector(`#${targetTabId}`)?.classList.add('active');
        });
    });
}

async function initStringingOptions(product) {
    if (product.mainCategory !== 'vot-cau-long') return;
    const stringSelect = document.getElementById('string-select');
    const tensionGroup = document.getElementById('tension-group');
    if (!stringSelect || !tensionGroup) return;
    try {
        const { products: strings } = await api.fetchProducts('mainCategory=phu-kien&subCategory=cuoc-dan-vot');
        strings.forEach(str => {
            const option = new Option(`${str.name} (+${formatCurrency(str.price)})`, str.id);
            option.dataset.price = str.price;
            stringSelect.appendChild(option);
        });
        stringSelect.addEventListener('change', (e) => {
            tensionGroup.style.display = (e.target.value === 'none') ? 'none' : 'block';
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách cước:", error);
    }
}

function renderReviewForm(product, user) {
    const container = document.querySelector('.review-form-container');
    if(!container) return;
    if (user) {
        const userHasReviewed = product.reviews?.some(r => r.userId === user.id);
        if (userHasReviewed) {
            container.innerHTML = `<p>Cảm ơn bạn đã đánh giá sản phẩm này.</p>`;
        } else {
            container.innerHTML = templates.generateReviewFormHTML();
        }
    } else {
        container.innerHTML = `<p>Vui lòng <button class="link-like-btn" id="login-for-review-btn">đăng nhập</button> để viết đánh giá.</p>`;
    }
}

async function renderRelatedProducts(productId) {
    const section = document.getElementById('related-products-section');
    const grid = document.getElementById('related-products-grid');
    if (!section || !grid) return;
    try {
        const relatedProducts = await api.fetchRelatedProducts(productId);
        if (relatedProducts.length > 0) {
            grid.innerHTML = '';
            relatedProducts.forEach(p => grid.appendChild(createProductCard(p)));
            section.style.display = 'block';
        }
    } catch (error) { console.error('Lỗi tải sản phẩm liên quan:', error); }
}

// =======================================================================
// CHECKOUT FLOW (Shipping, Place Order, Order Detail)
// =======================================================================
function checkAuthStateAndRedirect() {
    if (!store.getUser()) {
        alert('Vui lòng đăng nhập để tiếp tục.');
        localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search); 
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

export function renderShippingPage() {
    if (!checkAuthStateAndRedirect()) return;

    if (store.getCart().length === 0) {
        alert("Giỏ hàng của bạn đang trống.");
        window.location.href = '/index.html';
        return;
    }

    const savedAddress = store.getShippingAddress();
    document.getElementById('address').value = savedAddress.address || '';
    document.getElementById('city').value = savedAddress.city || '';
    document.getElementById('postalCode').value = savedAddress.postalCode || '700000';
    document.getElementById('country').value = savedAddress.country || 'Việt Nam';
}

export function handleShippingFormSubmit(form) {
    const addressData = {
        address: form.querySelector('#address').value,
        city: form.querySelector('#city').value,
        postalCode: form.querySelector('#postalCode').value,
        country: form.querySelector('#country').value,
    };
    const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked').value;
    
    store.saveShippingAddress(addressData);
    store.savePaymentMethod(paymentMethod);
    window.location.href = '/placeorder.html';
}

export async function renderPlaceOrderPage() {
    if (!checkAuthStateAndRedirect()) return;
    if (store.getCart().length === 0) {
        alert("Giỏ hàng của bạn đang trống.");
        window.location.href = '/index.html';
        return;
    }

    const shippingAddress = store.getShippingAddress();
    const paymentMethod = store.getPaymentMethod();
    const cartItems = store.getCart();

    document.getElementById('shipping-address-display').textContent = `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.postalCode}, ${shippingAddress.country}`;
    document.getElementById('payment-method-display').textContent = paymentMethod === 'ZaloPay' ? 'Ví ZaloPay' : 'Thanh toán khi nhận hàng (COD)';

    document.getElementById('placeorder-items-list').innerHTML = cartItems.map(item => templates.generateSummaryItemHTML(item)).join('');
    
    const subtotal = store.getCartTotalPrice();
    const shippingPrice = subtotal > 2000000 ? 0 : 30000;
    let discountAmount = 0;
    let isDiscountEligible = false;

    try {
        const discountInfo = await api.checkFirstOrderDiscount(store.getToken());
        if (discountInfo.eligible) {
            isDiscountEligible = true;
            discountAmount = subtotal * (discountInfo.discountPercent / 100);
            
            const summaryCard = document.querySelector('.order-summary-card');
            const taxPriceLine = document.getElementById('tax-price')?.parentElement;
            if (summaryCard && taxPriceLine) {
                const discountLineHTML = `
                    <div class="summary-line" style="color: var(--color-primary-start);">
                        <span>Giảm giá (${discountInfo.discountPercent}%):</span>
                        <span>-${formatCurrency(discountAmount)}</span>
                    </div>
                `;
                taxPriceLine.insertAdjacentHTML('beforebegin', discountLineHTML);
            }
        }
    } catch (error) {
        console.error("Lỗi khi kiểm tra giảm giá:", error);
    }

    const totalPrice = subtotal + shippingPrice - discountAmount;

    document.getElementById('items-price').textContent = formatCurrency(subtotal);
    document.getElementById('shipping-price').textContent = formatCurrency(shippingPrice);
    document.getElementById('tax-price').textContent = formatCurrency(0);
    document.getElementById('total-price').textContent = formatCurrency(totalPrice);

    document.getElementById('place-order-btn').addEventListener('click', async (e) => {
        const placeOrderBtn = e.target;
        const errorEl = document.getElementById('place-order-error');

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Đang xử lý...';
        if(errorEl) errorEl.textContent = '';

        try {
            const orderData = {
                orderItems: cartItems.map(item => ({
                    product: item.id,
                    name: item.name,
                    qty: item.quantity,
                    image: item.image,
                    price: item.price,
                    stringingInfo: item.stringingInfo,
                })),
                shippingAddress, 
                paymentMethod,
                applyFirstOrderDiscount: isDiscountEligible,
            };
            
            const createdOrder = await api.createOrder(orderData, store.getToken());
            store.clearCart();
            window.location.href = `/order.html?id=${createdOrder.id}`;

        } catch (error) {
            if(errorEl) errorEl.textContent = `Lỗi: ${error.message}`;
            showToast(`Đặt hàng thất bại: ${error.message}`, 'error', 5000); 
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Đặt Hàng';
        }
    });
}

export async function renderOrderDetailPage() {
    if (!checkAuthStateAndRedirect()) return;
    const orderId = new URLSearchParams(window.location.search).get('id');
    const container = document.getElementById('order-detail-container');
    if (!container) return;
    container.innerHTML = `<p class="loading-message">Đang tải chi tiết đơn hàng...</p>`;

    try {
        const order = await api.fetchOrderById(orderId, store.getToken());
        document.title = `Chi tiết đơn hàng #${order.id} - SportStore`;
        container.innerHTML = templates.generateOrderDetailHTML(order);

        const zaloPayBtn = document.getElementById('zalopay-payment-btn');
        if (zaloPayBtn) {
            zaloPayBtn.addEventListener('click', async () => {
                zaloPayBtn.disabled = true;
                zaloPayBtn.textContent = 'Đang tạo thanh toán...';
                // SỬA LỖI: Xóa bỏ khối try...catch lồng nhau bị thừa
                try {
                    const result = await api.createZaloPayPaymentUrl(order.id, store.getToken());
                    
                    if (result.return_code === 1) {
                        window.location.href = result.order_url;
                    } else {
                        showToast(`Lỗi: ${result.return_message || 'Không thể tạo thanh toán'}`, 'error');
                        zaloPayBtn.disabled = false;
                        zaloPayBtn.textContent = 'Thanh toán bằng ZaloPay';
                    }
                } catch (error) {
                    showToast(`Lỗi: ${error.message}`, 'error');
                    zaloPayBtn.disabled = false;
                    zaloPayBtn.textContent = 'Thanh toán bằng ZaloPay';
                }
            });
        }

    } catch (error) {
        container.innerHTML = `<h1 class="page-title">Lỗi: ${error.message}</h1>`;
    }
}


export async function renderMyOrdersPage() {
    if (!checkAuthStateAndRedirect()) return;
    
    const container = document.getElementById('orders-container');
    const loadingEl = document.getElementById('loading-orders');
    const noOrdersEl = document.getElementById('no-orders-found');
    const tableEl = document.getElementById('myorders-table');
    const tableBodyEl = document.getElementById('myorders-table-body');

    if (!container || !loadingEl || !noOrdersEl || !tableEl || !tableBodyEl) return;

    try {
        const orders = await api.fetchMyOrders(store.getToken());

        loadingEl.style.display = 'none';
        if (orders.length === 0) {
            noOrdersEl.style.display = 'block';
            return;
        }

        tableEl.style.display = 'table';
        tableBodyEl.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>${formatCurrency(order.totalPrice)}</td>
                <td><span class="status-badge ${order.isPaid ? 'paid' : ''}">${order.isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}</span></td>
                <td><span class="status-badge ${order.isDelivered ? 'delivered' : ''}">${order.isDelivered ? 'Đã giao' : 'Đang xử lý'}</span></td>
                <td><a href="/order.html?id=${order.id}" class="btn primary-btn" style="padding: 5px 10px; font-size: 14px;">Xem</a></td>
            </tr>
        `).join('');
    } catch (error) {
        loadingEl.style.display = 'none';
        container.innerHTML = `<p class="error-message">Lỗi khi tải đơn hàng: ${error.message}</p>`;
    }
}