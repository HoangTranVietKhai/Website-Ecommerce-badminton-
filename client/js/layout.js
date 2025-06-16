const headerHTML = `
    <header class="main-header">
        <div class="container header-content">
            <div class="logo">
                <a href="/index.html" aria-label="Trang chủ UMT Musical Instruments">
                    <img src="/images/logoguitar.png" alt="UMT Musical Instruments Logo">
                </a>
            </div>
            <form id="search-form" class="search-form">
                <input type="search" id="search-input" placeholder="Tìm kiếm sản phẩm...">
                <button type="submit" aria-label="Tìm kiếm"><i class="fas fa-search"></i></button>
            </form>
            <nav class="main-navigation">
                <ul id="main-nav-list">
                    <li><a href="/index.html">Trang Chủ</a></li>
                    <li><a href="/products.html">Sản Phẩm</a></li>
                    <li><a href="/about.html">Câu Chuyện</a></li>
                    <li><a href="/contact.html">Liên Hệ</a></li>
                </ul>
            </nav>
            <div class="header-actions">
                <!-- Khu vực cho Đăng nhập / Thông tin người dùng -->
                <div id="auth-section">
                    <!-- Nút này sẽ hiển thị khi người dùng chưa đăng nhập -->
                    <button id="login-btn" class="btn secondary-btn">Đăng Nhập</button>
                    <div id="user-info" style="display: none;">
                        <span id="user-name"></span>
                        <button id="logout-btn" class="btn secondary-btn">Đăng Xuất</button>
                    </div>
                </div>
                <button id="view-cart-btn" class="cart-icon-btn" aria-label="Xem giỏ hàng">
                    <i class="fas fa-shopping-bag"></i>
                    <span id="cart-count-main" class="cart-count" style="display: none;">0</span>
                </button>
                <button id="mobile-nav-toggle" class="mobile-nav-toggle" aria-controls="main-nav-list" aria-expanded="false">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
    </header>
    <nav class="sub-navigation">
        <div class="container">
            <ul>
                <li><a href="/products.html?mainCategory=piano">Piano</a></li>
                <li><a href="/products.html?mainCategory=guitar">Guitar</a></li>
                <li><a href="/products.html?mainCategory=drums">Trống</a></li>
                <!-- === DROPDOWN MENU MỚI CHO CÁC NHẠC CỤ KHÁC === -->
                <li class="nav-dropdown">
                    <a href="#">Khác <i class="fas fa-caret-down"></i></a>
                    <div class="dropdown-menu">
                        <a href="/products.html?mainCategory=ukulele">Ukulele</a>
                        <a href="/products.html?mainCategory=violin">Violin</a>
                        <a href="/products.html?mainCategory=wind">Nhạc Cụ Hơi</a>
                    </div>
                </li>
            </ul>
        </div>
    </nav>
`;

const footerHTML = `
    <div class="container footer-content">
        <div class="footer-col">
            <img src="images/logoguitar.png" alt="UMT Logo" class="footer-logo">
            <p>Nơi mỗi nhạc cụ không chỉ là một vật thể, mà là một người bạn đồng hành.</p>
        </div>
        <div class="footer-col">
            <h3>Khám Phá</h3>
            <ul class="footer-links">
                <li><a href="products.html">Sản Phẩm</a></li>
                <li><a href="about.html">Câu Chuyện</a></li>
                <li><a href="contact.html">Liên Hệ</a></li>
            </ul>
        </div>
        <div class="footer-col">
            <h3>Kết Nối</h3>
            <div class="social-links">
                <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <p class="copyright-text">© <span id="current-year"></span> UMT Instruments. All Rights Reserved.</p>
    </div>
`;

const cartDrawerHTML = `
    <div id="cart-overlay" class="cart-overlay" aria-hidden="true"></div>
    <div id="cart-drawer" class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <div class="cart-header">
            <h2 id="cart-drawer-title">Giỏ Hàng Của Bạn</h2>
            <button class="close-cart-btn" aria-label="Đóng giỏ hàng"><i class="fas fa-times"></i></button>
        </div>
        <div id="cart-items-container" class="cart-items-container"></div>
        <div id="empty-cart-view" class="empty-cart-view" style="display: none;">
             <i class="fas fa-shopping-bag"></i>
             <p>Giỏ hàng của bạn đang trống.</p>
             <a href="products.html" class="btn secondary-btn">Bắt đầu mua sắm</a>
        </div>
        <div class="cart-footer" style="display: none;">
            <div class="cart-summary">
                <span>Tạm tính</span>
                <span id="cart-total" class="total-price">0 VNĐ</span>
            </div>
            <a href="shipping.html" class="btn primary-btn checkout-btn">Tiến hành thanh toán</a>
        </div>
    </div>
    <div id="toast-notification" class="toast"><span id="toast-message"></span></div>
`;

const authModalHTML = `
    <div id="auth-modal-overlay" class="auth-modal-overlay" style="display: none;"></div>
    <div id="auth-modal" class="auth-modal" style="display: none;">
        <button id="close-auth-modal" class="close-auth-modal">×</button>
        <div class="auth-modal-tabs">
            <button id="login-tab-btn" class="auth-tab-btn active" data-form="login-form">Đăng Nhập</button>
            <button id="register-tab-btn" class="auth-tab-btn" data-form="register-form">Đăng Ký</button>
        </div>
        <div class="auth-modal-content">
            <form id="login-form" class="auth-form">
                <h3>Chào mừng trở lại!</h3>
                <div class="form-group"><label for="login-email">Email</label><input type="email" id="login-email" name="email" required></div>
                <div class="form-group"><label for="login-password">Mật khẩu</label><input type="password" id="login-password" name="password" required></div>
                <button type="submit" class="btn primary-btn">Đăng Nhập</button>
                <p id="login-error" class="form-error"></p>
            </form>
            <form id="register-form" class="auth-form" style="display: none;">
                <h3>Tạo tài khoản mới</h3>
                <div class="form-group"><label for="register-name">Họ và Tên</label><input type="text" id="register-name" name="name" required></div>
                <div class="form-group"><label for="register-email">Email</label><input type="email" id="register-email" name="email" required></div>
                <div class="form-group"><label for="register-password">Mật khẩu</label><input type="password" id="register-password" name="password" required></div>
                <button type="submit" class="btn primary-btn">Đăng Ký</button>
                <p id="register-error" class="form-error"></p>
            </form>
        </div>
    </div>
`;

export function loadLayout() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', authModalHTML);
    document.body.insertAdjacentHTML('beforeend', cartDrawerHTML);

    const newFooter = document.createElement('footer');
    newFooter.className = 'main-footer';
    newFooter.innerHTML = footerHTML;
    document.body.append(newFooter);
}