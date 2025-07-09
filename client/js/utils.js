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
 * Hàm này đã được tối ưu để tự tạo phần tử toast nếu chưa có.
 * @param {string} message - Nội dung thông báo.
 * @param {string} type - Loại thông báo ('success', 'error', hoặc trống).
 * @param {number} duration - Thời gian hiển thị (tính bằng mili giây).
 */
export function showToast(message, type = 'success', duration = 3000) {
    // 1. Tìm phần tử toast MỖI KHI hàm được gọi.
    // Điều này đảm bảo toast đã được load bởi layout.js.
    let toast = document.getElementById('toast-notification');
    let toastMessage = document.getElementById('toast-message');

    // 2. Nếu toast chưa có trên trang, hãy tạo nó động.
    // Đây là một lớp phòng thủ cực kỳ chắc chắn.
    if (!toast) {
        console.warn('Toast element not found. Creating it dynamically.');
        const toastHTML = `<div id="toast-notification" class="toast"><span id="toast-message"></span></div>`;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        
        // Tìm lại các phần tử sau khi đã tạo
        toast = document.getElementById('toast-notification');
        toastMessage = document.getElementById('toast-message');
    }
    
    // 3. Nếu sau khi tạo vẫn không tìm thấy, báo lỗi và thoát.
    // Trường hợp này gần như không bao giờ xảy ra.
    if (!toast || !toastMessage) {
        console.error('Failed to create or find toast element. Toast cannot be shown.');
        // Hiển thị thông báo bằng alert() như một phương án dự phòng
        alert(message);
        return;
    }

    // 4. Logic hiển thị toast
    toastMessage.textContent = message;
    
    // Reset các class cũ trước khi thêm class mới
    toast.className = 'toast'; 
    
    // Dùng setTimeout để đảm bảo trình duyệt có thời gian "đăng ký" class mới
    // trước khi thêm class 'show' để kích hoạt transition.
    setTimeout(() => {
        toast.classList.add('show');
        if (type) {
            toast.classList.add(type);
        }
    }, 10); // Một khoảng trễ rất nhỏ

    // 5. Logic ẩn toast sau một khoảng thời gian
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}


/**
 * Chuyển một chuỗi từ dạng snake_case hoặc kebab-case sang camelCase.
 * VD: 'hello_world' -> 'helloWorld'
 * @param {string} s - Chuỗi đầu vào.
 * @returns {string} Chuỗi đã chuyển đổi.
 */
function toCamel(s) {
    return s.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    }).replace(/^([A-Z])/, (match) => match.toLowerCase());
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
  return Object.keys(o).reduce((acc, key) => {
    const camelKey = toCamel(key);
    acc[camelKey] = keysToCamel(o[key]);
    return acc;
  }, {});
}


/**

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