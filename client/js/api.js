// Sứ Giả Giao Tiếp với Server -Trừu tượng hóa-Xử lý lỗi chung

const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
    }
    // Handle cases where response might be empty (e.g., DELETE request)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {};
}

// Product APIs
export const fetchProducts = (queryParams = '') => request(`/products?${queryParams}`);
export const fetchProductById = (id) => request(`/products/${id}`);
export const fetchRelatedProducts = (id) => request(`/products/${id}/related`);
export const submitReview = (productId, reviewData, token) => {
    return request(`/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
    });
};

// User APIs
export const loginUser = (credentials) => {
    return request('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
};

export const registerUser = (userData) => {
    return request('/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
};