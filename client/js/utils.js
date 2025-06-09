// client/js/utils.js

/**
 * Định dạng số thành tiền tệ Việt Nam.
 * @param {number} number - Số tiền cần định dạng.
 * @returns {string} - Chuỗi tiền tệ đã định dạng (ví dụ: "3.500.000 ₫").
 */
export function formatCurrency(number) {
    // Kiểm tra để đảm bảo đầu vào là một con số hợp lệ
    if (typeof number !== 'number' || isNaN(number)) {
        return '';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

/**
 * Hiển thị một thông báo nhanh (toast).
 * @param {string} message - Nội dung thông báo.
 * @param {number} duration - Thời gian hiển thị (mili giây).
 * @param {string} type - Loại thông báo ('success', 'error', 'info').
 */
export function showToast(message, duration = 3000, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) {
        console.error("Toast notification elements not found in the DOM.");
        return;
    }

    toastMessage.textContent = message;
    
    // Reset classes and add the necessary ones
    toast.className = 'toast'; // Start with a clean slate
    toast.classList.add('show');
    if (type) {
        toast.classList.add(type);
    }

    // Hide the toast after the duration
    setTimeout(() => {
        toast.className = 'toast';
    }, duration);
}