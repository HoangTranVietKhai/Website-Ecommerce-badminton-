// ===== File: client/js/admin.js (TÁCH RA TỪ ADMIN.HTML VÀ HOÀN THIỆN) =====

import * as api from './api.js';
import { formatCurrency, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // === AUTHENTICATION CHECK ===
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!user || user.role !== 'admin' || !token) {
        document.getElementById('admin-auth-layer').innerHTML = '<p style="color: red;">Truy cập bị từ chối. Bạn không phải là Admin hoặc chưa đăng nhập.</p>';
        setTimeout(() => { window.location.href = '/index.html'; }, 2000);
        return;
    }
    document.getElementById('admin-auth-layer').style.display = 'none';
    document.querySelector('.protected-content').style.display = 'flex';

    // === DOM ELEMENTS ===
    const mainContentContainer = document.getElementById('admin-main-content');
    const productModal = document.getElementById('product-modal');
    const productModalOverlay = document.getElementById('product-modal-overlay');
    const productForm = document.getElementById('product-form');

    // === STATE ===
    let currentView = null;
    let cachedData = {
        brands: [],
        categories: []
    };

    // === TEMPLATE LOADER ===
    async function loadTemplateIntoMain(viewName) {
        mainContentContainer.innerHTML = `<div class="content-loader"><div class="spinner"></div></div>`;
        try {
            const response = await fetch(`/templates/admin/${viewName}.html`);
            if (!response.ok) throw new Error(`Không thể tải template: ${response.statusText}`);
            mainContentContainer.innerHTML = await response.text();
            currentView = viewName;
        } catch (error) {
            mainContentContainer.innerHTML = `<h1 style="color:red;">Lỗi tải trang</h1><p>${error.message}</p>`;
        }
    }

    // === RENDER FUNCTIONS ===
    function renderAdminPagination(totalPages, currentPage, containerSelector, targetSection) {
        const container = document.querySelector(containerSelector);
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
            btn.dataset.target = targetSection;
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
                const span = document.createElement('span'); span.textContent = '...'; span.className = 'pagination-dots'; container.appendChild(span);
            } else { container.appendChild(createButton(p, p, p === currentPage)); }
        });
        container.appendChild(createButton('»', currentPage + 1, false, currentPage === totalPages));
    }

    // === DATA FETCH & RENDER ===
    async function fetchAdminStats() {
        try {
            const stats = await api.fetchDashboardStats(token);
            document.getElementById('stats-total-sales').textContent = formatCurrency(stats.totalSales);
            document.getElementById('stats-total-orders').textContent = stats.totalOrders.toLocaleString('vi-VN');
            document.getElementById('stats-total-users').textContent = stats.totalUsers.toLocaleString('vi-VN');
            document.getElementById('stats-total-products').textContent = stats.totalProducts.toLocaleString('vi-VN');
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                document.querySelectorAll('.stat-card p').forEach(p => p.textContent = 'Lỗi');
            }
        }
    }
    
    async function cacheDropdownData() {
        try {
            const [brands, categories] = await Promise.all([
                api.fetchBrands(),
                api.fetchCategories()
            ]);
            cachedData.brands = brands;
            cachedData.categories = categories;
        } catch(error) {
            showToast('Lỗi tải dữ liệu cho bộ lọc', 'error');
        }
    }
    
    function renderProductFilters() {
        const brandSelect = document.getElementById('product-brand-filter');
        const categorySelect = document.getElementById('product-category-filter');
        if (brandSelect && cachedData.brands.length > 0) {
            brandSelect.innerHTML = '<option value="">Tất cả</option>' + cachedData.brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        }
        if (categorySelect && cachedData.categories.length > 0) {
            categorySelect.innerHTML = '<option value="">Tất cả</option>' + cachedData.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    }

    async function fetchAndRenderProducts(page = 1) {
        const productListBody = document.getElementById('product-list-body');
        if (!productListBody) return;

        const keyword = document.getElementById('product-search-input')?.value || '';
        const brandId = document.getElementById('product-brand-filter')?.value || '';
        const categoryId = document.getElementById('product-category-filter')?.value || '';

        const params = new URLSearchParams({ page: page, pageSize: 10 });
        if (keyword) params.append('keyword', keyword);
        if (brandId) params.append('brandId', brandId);
        if (categoryId) params.append('categoryId', categoryId);

        try {
            const data = await api.fetchProducts(params.toString());
            if (data && data.products) {
                productListBody.innerHTML = data.products.map(p => {
                    let statusBadges = '';
                    if (p.isPromotional) statusBadges += `<span class="status-badge" style="background-color: #f39c12; color: white;">KM</span> `;
                    if (p.countInStock > 0) statusBadges += `<span class="status-badge" style="background-color: #27ae60; color: white;">Còn hàng</span>`;
                    else statusBadges += `<span class="status-badge" style="background-color: #c0392b; color: white;">Hết hàng</span>`;

                    return `
                    <tr>
                        <td><img src="${p.image || '/images/placeholder.png'}" alt="${p.name}"></td>
                        <td>${p.name}<br><small style="color:#7f8c8d;">Thương hiệu: ${p.brand || 'N/A'}</small></td>
                        <td>${p.categoryName || 'N/A'}</td>
                        <td>${formatCurrency(p.price)}</td>
                        <td>${p.countInStock}</td>
                        <td>${statusBadges}</td>
                        <td>
                            <button class="btn edit-btn product-edit-btn" data-id="${p.id}">Sửa</button>
                            <button class="btn delete-btn product-delete-btn" data-id="${p.id}">Xóa</button>
                        </td>
                    </tr>`;
                }).join('');
                renderAdminPagination(data.pages, data.page, '#products-pagination-container', 'products');
            }
        } catch (error) {
            if (error.message !== 'Unauthorized' && productListBody) productListBody.innerHTML = `<tr><td colspan="7" class="text-center">Lỗi tải sản phẩm: ${error.message}</td></tr>`;
        }
    }
    
    async function fetchAndRenderCategories() {
        const categoryListBody = document.getElementById('category-list-body');
        if (!categoryListBody) return;
        try {
            const categories = await api.fetchCategories();
            categoryListBody.innerHTML = categories.map(c => `
                <tr data-id="${c.id}">
                    <td>${c.id}</td>
                    <td class="editable-name" data-original-name="${c.name}">${c.name}</td>
                    <td>${c.productCount}</td>
                    <td>
                        <button class="btn edit-btn category-edit-btn">Sửa</button>
                        <button class="btn delete-btn category-delete-btn" data-id="${c.id}">Xóa</button>
                    </td>
                </tr>`).join('');
        } catch (error) {
            if (error.message !== 'Unauthorized' && categoryListBody) categoryListBody.innerHTML = `<tr><td colspan="4" class="text-center">${error.message}</td></tr>`;
        }
    }

    async function fetchAndRenderBrands() {
        const brandListBody = document.getElementById('brand-list-body');
        if (!brandListBody) return;
        try {
            const brands = await api.fetchBrands();
            brandListBody.innerHTML = brands.map(b => `
                <tr data-id="${b.id}">
                    <td>${b.id}</td>
                    <td class="editable-name" data-original-name="${b.name}">${b.name}</td>
                    <td>${b.productCount}</td>
                    <td>
                        <button class="btn edit-btn brand-edit-btn">Sửa</button>
                        <button class="btn delete-btn brand-delete-btn" data-id="${b.id}">Xóa</button>
                    </td>
                </tr>`).join('');
        } catch (error) {
            if (error.message !== 'Unauthorized' && brandListBody) brandListBody.innerHTML = `<tr><td colspan="4" class="text-center">${error.message}</td></tr>`;
        }
    }

    async function fetchAndRenderUsers(page = 1) {
        const userListBody = document.getElementById('user-list-body');
        if (!userListBody) return;
        try {
            const { users, pages } = await api.fetchAllUsers(token, `page=${page}&pageSize=10`);
            userListBody.innerHTML = users.map(u => `
                <tr data-id="${u.id}">
                    <td>${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>
                        <select class="role-select" data-id="${u.id}" ${u.id === user.id ? 'disabled' : ''}>
                            <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn delete-btn user-delete-btn" data-id="${u.id}" ${u.id === user.id ? 'disabled' : ''}>Xóa</button>
                    </td>
                </tr>
            `).join('');
            renderAdminPagination(pages, page, '#users-pagination-container', 'users');
        } catch (error) {
            if (error.message !== 'Unauthorized' && userListBody) userListBody.innerHTML = `<tr><td colspan="5" class="text-center">${error.message}</td></tr>`;
        }
    }

    async function fetchAndRenderOrders(page = 1) {
        const orderListBody = document.getElementById('order-list-body');
        if (!orderListBody) return;

        const keyword = document.getElementById('order-search-input')?.value || '';
        const status = document.getElementById('order-status-filter')?.value || '';

        const params = new URLSearchParams({ page: page, pageSize: 10 });
        if (keyword) params.append('keyword', keyword);
        if (status) params.append('status', status);

        try {
            const { orders, pages } = await api.fetchAllOrders(token, params.toString());
            orderListBody.innerHTML = orders.map(o => `
                 <tr>
                    <td>#${o.id}</td>
                    <td>${o.userName}</td>
                    <td>${new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>${formatCurrency(o.totalPrice)}</td>
                    <td><span class="status-badge ${o.isPaid ? 'paid' : ''}">${o.isPaid ? 'Đã TT' : 'Chưa TT'}</span></td>
                    <td><span class="status-badge ${o.isDelivered ? 'delivered' : ''}">${o.isDelivered ? 'Đã giao' : 'Đang xử lý'}</span></td>
                    <td><a href="/order.html?id=${o.id}" target="_blank" class="btn edit-btn" style="padding: 5px 10px;">Xem</a></td>
                </tr>
            `).join('');
             renderAdminPagination(pages, page, '#orders-pagination-container', 'orders');
        } catch (error) {
             if (error.message !== 'Unauthorized' && orderListBody) orderListBody.innerHTML = `<tr><td colspan="7" class="text-center">${error.message}</td></tr>`;
        }
    }

    // === MODAL & FORM HANDLERS ===
    async function openProductModal(product = null) {
        productForm.reset();
        document.getElementById('product-id').value = '';
        productModalOverlay.classList.add('is-visible');
        productModal.style.display = 'block';
        setTimeout(() => productModal.classList.add('is-visible'), 10);
        document.getElementById('product-modal-title').textContent = 'Đang tải dữ liệu...';

        const brandSelect = document.getElementById('product-brandId');
        const categorySelect = document.getElementById('product-categoryId');
        
        brandSelect.innerHTML = '<option value="">-- Chọn thương hiệu --</option>' + cachedData.brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        categorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>' + cachedData.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        if (product) {
            document.getElementById('product-modal-title').textContent = 'Chỉnh Sửa Sản Phẩm';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-price').value = product.price || 0;
            document.getElementById('product-original-price').value = product.originalPrice || '';
            document.getElementById('product-countInStock').value = product.countInStock || 0;
            document.getElementById('product-image').value = product.image || '';
            document.getElementById('product-images').value = product.images ? JSON.stringify(product.images, null, 2) : '[]';
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-fullDescription').value = product.fullDescription || '';
            document.getElementById('product-warranty').value = product.warranty || '';
            document.getElementById('product-youtubeLink').value = product.youtubeLink || '';
            document.getElementById('product-specifications').value = product.specifications ? JSON.stringify(product.specifications, null, 2) : '[]';
            document.getElementById('product-isPromotional').checked = product.isPromotional || false;
            brandSelect.value = product.brandId || '';
            categorySelect.value = product.categoryId || '';
        } else { 
            document.getElementById('product-modal-title').textContent = 'Thêm Sản Phẩm Mới';
            document.getElementById('product-images').value = '[]';
            document.getElementById('product-specifications').value = '[]';
        }
    }

    function closeProductModal() {
        productModal.classList.remove('is-visible');
        setTimeout(() => { 
            productModalOverlay.classList.remove('is-visible'); 
            productModal.style.display = 'none'; 
        }, 300);
    }

    async function onProductFormSubmit(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true; 
        submitBtn.textContent = 'Đang lưu...';
        
        const id = document.getElementById('product-id').value;
        const originalPriceValue = document.getElementById('product-original-price').value;

        const productData = {
            name: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            originalPrice: originalPriceValue ? parseFloat(originalPriceValue) : null,
            brandId: document.getElementById('product-brandId').value,
            categoryId: document.getElementById('product-categoryId').value,
            countInStock: parseInt(document.getElementById('product-countInStock').value, 10),
            image: document.getElementById('product-image').value.trim(),
            images: document.getElementById('product-images').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            fullDescription: document.getElementById('product-fullDescription').value.trim(),
            warranty: document.getElementById('product-warranty').value.trim(),
            youtubeLink: document.getElementById('product-youtubeLink').value.trim(),
            specifications: document.getElementById('product-specifications').value.trim(),
            isPromotional: document.getElementById('product-isPromotional').checked
        };

        if (!productData.name || !productData.brandId || !productData.categoryId) {
            showToast('Vui lòng điền Tên sản phẩm, Thương hiệu và Danh mục.', 'error');
            submitBtn.disabled = false; 
            submitBtn.textContent = originalBtnText;
            return;
        }

        try {
            if (id) { 
                await api.updateProduct(id, productData, token); 
                showToast('Cập nhật sản phẩm thành công!', 'success'); 
            } else { 
                await api.createProduct(productData, token); 
                showToast('Thêm sản phẩm thành công!', 'success'); 
            }
            closeProductModal();
            const currentPage = document.querySelector('#products-pagination-container .active')?.dataset.page || 1;
            fetchAndRenderProducts(currentPage);
        } catch (error) { 
            if (error.message !== 'Unauthorized') showToast(`Lỗi: ${error.message}`, 'error');
        } finally { 
            submitBtn.disabled = false; 
            submitBtn.textContent = originalBtnText;
        }
    }

    // === EVENT HANDLER & ROUTER ===
    async function handleViewChange(viewName) {
        if (currentView === viewName && viewName !== 'dashboard') return; 
        await loadTemplateIntoMain(viewName);
        
        switch(viewName) {
            case 'dashboard': fetchAdminStats(); break;
            case 'products':
                renderProductFilters();
                document.getElementById('apply-product-filters-btn')?.addEventListener('click', () => fetchAndRenderProducts(1));
                fetchAndRenderProducts(1); 
                break;
            case 'categories': fetchAndRenderCategories(); break;
            case 'brands': fetchAndRenderBrands(); break;
            case 'users': fetchAndRenderUsers(1); break;
            case 'orders': 
                document.getElementById('apply-order-filters-btn')?.addEventListener('click', () => fetchAndRenderOrders(1));
                fetchAndRenderOrders(1);
                break;
        }
    }

    function setupEventListeners() {
        document.body.addEventListener('change', async (e) => {
            if (e.target.classList.contains('role-select')) {
                const userId = e.target.dataset.id;
                const newRole = e.target.value;
                const originalRole = newRole === 'admin' ? 'user' : 'admin';

                if (confirm(`Bạn có chắc muốn thay đổi vai trò của người dùng #${userId} thành "${newRole}"?`)) {
                    try {
                        await api.updateUserRoleByAdmin(userId, newRole, token);
                        showToast('Cập nhật vai trò thành công!', 'success');
                    } catch (err) {
                        showToast(`Lỗi: ${err.message}`, 'error');
                        e.target.value = originalRole;
                    }
                } else {
                    e.target.value = originalRole;
                }
            }
        });

        document.body.addEventListener('click', async (e) => {
            const target = e.target;
            const closest = (selector) => target.closest(selector);
            
            const navLink = closest('.admin-nav .nav-link');
            if (navLink && !navLink.href.endsWith('/index.html')) {
                e.preventDefault();
                const targetView = navLink.dataset.target;
                if (currentView !== targetView) {
                    document.querySelectorAll('.admin-nav .nav-link').forEach(l => l.classList.remove('active'));
                    navLink.classList.add('active');
                    window.location.hash = targetView;
                    handleViewChange(targetView);
                }
                return;
            }

            const paginationBtn = closest('.pagination-btn');
            if (paginationBtn && !paginationBtn.disabled && !paginationBtn.classList.contains('active')) {
                const page = Number(paginationBtn.dataset.page);
                const targetSection = paginationBtn.dataset.target;
                if (targetSection === 'products') fetchAndRenderProducts(page);
                if (targetSection === 'users') fetchAndRenderUsers(page);
                if (targetSection === 'orders') fetchAndRenderOrders(page);
                return;
            }

            if (closest('#add-product-btn')) { openProductModal(); return; }
            if (target.id === 'close-product-modal' || target.id === 'product-modal-overlay') { closeProductModal(); return; }
            
            const editProductBtn = closest('.product-edit-btn');
            if (editProductBtn) {
                editProductBtn.textContent = '...'; editProductBtn.disabled = true;
                try { 
                    const product = await api.fetchProductById(editProductBtn.dataset.id); 
                    openProductModal(product); 
                } 
                catch(error) { if (error.message !== 'Unauthorized') showToast(`Lỗi: ${error.message}`, 'error'); } 
                finally { if (editProductBtn) { editProductBtn.textContent = 'Sửa'; editProductBtn.disabled = false; } }
                return;
            }

            const deleteProductBtn = closest('.product-delete-btn');
            if (deleteProductBtn) {
                if (confirm('Xóa sản phẩm này? (Hành động này chỉ ẩn sản phẩm)')) {
                    try { 
                        await api.deleteProduct(deleteProductBtn.dataset.id, token); 
                        showToast('Xóa thành công'); 
                        const currentPage = document.querySelector('#products-pagination-container .active')?.dataset.page || 1;
                        fetchAndRenderProducts(currentPage);
                        fetchAdminStats(); 
                    } 
                    catch (error) { if (error.message !== 'Unauthorized') showToast(`Lỗi: ${error.message}`, 'error'); }
                }
                return;
            }
            
            if (closest('#add-category-btn')) {
                const nameInput = document.getElementById('new-category-name');
                const name = nameInput.value.trim();
                if(name) try { await api.createCategory({ name }, token); showToast('Thêm thành công'); fetchAndRenderCategories(); nameInput.value = ''; } catch(e) { showToast(e.message, 'error'); }
                return;
            }
             if (closest('#add-brand-btn')) {
                const nameInput = document.getElementById('new-brand-name');
                const name = nameInput.value.trim();
                if(name) try { await api.createBrand({ name }, token); showToast('Thêm thành công'); fetchAndRenderBrands(); nameInput.value = ''; } catch(e) { showToast(e.message, 'error'); }
                return;
            }
            if (closest('.category-delete-btn') || closest('.brand-delete-btn')) {
                const isBrand = closest('.brand-delete-btn');
                const type = isBrand ? 'thương hiệu' : 'danh mục';
                const id = target.dataset.id;
                if (confirm(`Xóa ${type} này?`)) {
                    try { 
                        if (isBrand) await api.deleteBrand(id, token);
                        else await api.deleteCategory(id, token);
                        showToast('Xóa thành công'); 
                        isBrand ? fetchAndRenderBrands() : fetchAndRenderCategories();
                    } catch (e) { showToast(e.message, 'error'); }
                }
                return;
            }

            const editBtn = closest('.category-edit-btn, .brand-edit-btn');
            if(editBtn) {
                const row = editBtn.closest('tr');
                const nameCell = row.querySelector('.editable-name');
                const id = row.dataset.id;
                const originalName = nameCell.dataset.originalName;
                const isBrand = editBtn.classList.contains('brand-edit-btn');
                const type = isBrand ? 'thương hiệu' : 'danh mục';

                if (editBtn.textContent === 'Sửa') {
                    nameCell.innerHTML = `<input type="text" value="${originalName}" class="form-control" style="padding: 5px;">`;
                    editBtn.textContent = 'Lưu';
                    editBtn.style.backgroundColor = '#27ae60'; // Green color for save
                } else {
                    const newName = nameCell.querySelector('input').value.trim();
                    if (newName && newName !== originalName) {
                        try {
                            if (isBrand) await api.updateBrand(id, { name: newName }, token);
                            else await api.updateCategory(id, { name: newName }, token);
                            showToast(`Cập nhật ${type} thành công`);
                            nameCell.textContent = newName;
                            nameCell.dataset.originalName = newName;
                        } catch(e) {
                             showToast(e.message, 'error');
                             nameCell.textContent = originalName;
                        }
                    } else {
                        nameCell.textContent = originalName;
                    }
                     editBtn.textContent = 'Sửa';
                     editBtn.style.backgroundColor = ''; // Revert to default
                }
                return;
            }

             if (closest('.user-delete-btn')) {
                if (confirm('Vô hiệu hóa người dùng này?')) {
                    try { 
                        await api.deleteUser(target.dataset.id, token); 
                        showToast('Xóa thành công'); 
                        fetchAndRenderUsers(document.querySelector('#users-pagination-container .active')?.dataset.page || 1);
                        fetchAdminStats();
                    } catch (e) { showToast(e.message, 'error'); }
                }
                return;
            }
        });
        
        document.body.addEventListener('submit', (e) => {
            if (e.target.id === 'product-form') {
                onProductFormSubmit(e);
            }
        });
    }

    async function initializePage() {
        await cacheDropdownData();
        setupEventListeners();
        const viewNameFromHash = window.location.hash.substring(1);
        const initialView = ['dashboard', 'products', 'categories', 'brands', 'orders', 'users'].includes(viewNameFromHash) ? viewNameFromHash : 'dashboard';
        
        const activeLink = document.querySelector(`.admin-nav a[data-target="${initialView}"]`);
        if (activeLink) activeLink.click();
        else document.querySelector('.admin-nav a[data-target="dashboard"]').click();
    }

    initializePage();
});