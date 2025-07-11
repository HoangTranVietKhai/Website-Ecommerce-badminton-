// ===== File: client/js/api.js (PHIÊN BẢN HOÀN CHỈNH - ĐÃ XỬ LÝ LỖI TOKEN) =====

const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/index.html';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            const text = await response.text();
            errorData = { message: text || 'An unknown error occurred' };
        }
        throw new Error(errorData.message || 'Something went wrong');
    }

    const text = await response.text();
    if (!text) return {}; 
    
    return JSON.parse(text);
}

// Product APIs
export const fetchProducts = (queryParams = '') => request(`/products?${queryParams}`);
export const fetchProductById = (id) => request(`/products/${id}`);
export const fetchRelatedProducts = (id) => request(`/products/${id}/related`);
export const submitReview = (productId, reviewData, token) => {
    return request(`/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(reviewData)
    });
};
export const createProduct = (productData, token) => {
    return request('/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
    });
};
export const updateProduct = (id, productData, token) => {
    return request(`/products/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
    });
};
export const deleteProduct = (id, token) => {
    return request(`/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

// Brand APIs
export const fetchBrands = () => request(`/brands`);
export const createBrand = (brandData, token) => request('/brands', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(brandData)
});
export const updateBrand = (id, brandData, token) => request(`/brands/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(brandData)
});
export const deleteBrand = (id, token) => request(`/brands/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
});

// Category APIs
export const fetchCategories = () => request(`/categories`);
export const createCategory = (categoryData, token) => request('/categories', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(categoryData)
});
export const updateCategory = (id, categoryData, token) => request(`/categories/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(categoryData)
});
export const deleteCategory = (id, token) => request(`/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
});

// User APIs
export const loginUser = (credentials) => {
    return request('/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
};
export const registerUser = (userData) => {
    return request('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};
export const updateUserProfile = (userData, token) => {
    return request('/users/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(userData)
    });
};
export const checkFirstOrderDiscount = (token) => {
    return request('/users/check-discount', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};
// Order APIs
export const createOrder = (orderData, token) => {
    return request('/orders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderData)
    });
};
export const fetchMyOrders = (token) => {
    return request('/orders/myorders', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};
export const fetchOrderById = (id, token) => {
    return request(`/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

// Dashboard API
export const fetchDashboardStats = (token) => {
    return request(`/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

// ADMIN APIs
export const fetchAllUsers = (token, queryParams = '') => {
    return request(`/users?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};
export const getUserById = (id, token) => {
    return request(`/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};
export const deleteUser = (id, token) => {
    return request(`/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
};
export const fetchAllOrders = (token, queryParams = '') => {
    return request(`/orders?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};
export const updateUserByAdmin = (id, userData, token) => {
    return request(`/users/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(userData)
    });
};

// THÊM MỚI
export const updateUserRoleByAdmin = (id, role, token) => {
    return request(`/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role })
    });
};


// api zalop pay
export const createZaloPayPaymentUrl = (orderId, token) => {
    return request(`/orders/${orderId}/create-zalopay-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
};