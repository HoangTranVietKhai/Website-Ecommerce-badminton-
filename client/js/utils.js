// ===== File: client/js/utils.js (PHIÊN BẢN HOÀN CHỈNH) =====

/**
 * Định dạng một số thành chuỗi tiền tệ Việt Nam (VNĐ).
 * @param {number} number - Số cần định dạng.
 * @returns {string} Chuỗi tiền tệ đã định dạng (VD: '1.200.000 ₫').
 */
export function formatCurrency(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}


/**
 * Hiển thị một thông báo nhanh (toast) trên màn hình.
 * @param {string} message - Nội dung thông báo.
 * @param {string} type - Loại thông báo ('success', 'error', hoặc 'info').
 * @param {number} duration - Thời gian hiển thị (tính bằng mili giây).
 */
export function showToast(message, type = 'success', duration = 3000) {
    let toast = document.getElementById('toast-notification');
    let toastMessage = document.getElementById('toast-message');

    if (!toast) {
        const toastHTML = `<div id="toast-notification" class="toast"><span id="toast-message"></span></div>`;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        toast = document.getElementById('toast-notification');
        toastMessage = document.getElementById('toast-message');
    }
    
    if (!toast || !toastMessage) {
        alert(message);
        return;
    }

    toastMessage.textContent = message;
    toast.className = 'toast'; 
    
    setTimeout(() => {
        toast.classList.add('show');
        if (type) toast.classList.add(type);
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}


/**
 * Chuyển đổi đệ quy tất cả các key của một object (hoặc một mảng các object)
 * từ dạng snake_case/kebab-case sang camelCase.
 * @param {object | Array} o - Object hoặc Array đầu vào.
 * @returns {object | Array} Object hoặc Array đã được chuyển đổi.
 */
export function keysToCamel(o) {
  if (o === null || typeof o !== 'object') {
    return o;
  }
  if (Array.isArray(o)) {
    return o.map(v => keysToCamel(v));
  }
  const toCamel = (s) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
  return Object.keys(o).reduce((acc, key) => {
    const camelKey = toCamel(key);
    acc[camelKey] = keysToCamel(o[key]);
    return acc;
  }, {});
}


/**
 * Hàm debounce giúp trì hoãn việc thực thi một hàm cho đến khi người dùng ngừng kích hoạt sự kiện trong một khoảng thời gian nhất định.
 * @param {Function} func - Hàm cần được debounce.
 * @param {number} delay - Thời gian trì hoãn (tính bằng mili giây).
 * @returns {Function} Hàm đã được debounced.
 */
export function debounce(func, delay = 500) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}