export function loadLayout() {
    const body = document.body;

    if (body.classList.contains('admin-page')) {
        return; // Dừng lại, không làm gì cả.
    }

   
const headerHTML = `
<div class="top-bar">
        <div class="container top-bar-content">
            <div class="top-bar-left">
    <span class="promo-banner-text">GIẢM NGAY 15% CHO ĐƠN HÀNG ĐẦU TIÊN</span>
</div>
            <div class="top-bar-right">
                <a href="/contact.html">Hệ thống cửa hàng</a>
                <a href="/myorders.html">Tra cứu đơn hàng</a>
            </div>
        </div>
    </div>
    <header class="main-header">
        <div class="container header-content">
            <a href="/index.html" class="logo">
                <img src="/images/logo.png" alt="GS Store Logo" style="height: 120px;">
                </a>
            <nav class="main-nav">
                <ul class="nav-list">
                    <li class="has-dropdown">
                        <a href="/products.html?mainCategory=vot-cau-long" id="products-menu-trigger">Vợt Cầu Lông</a>
                        <div class="mega-menu-v2">
                            <div class="mega-menu-column">
                                <h4 class="mega-menu-heading">Vợt Theo Thương Hiệu</h4>
                                <ul class="mega-menu-links">
                                    <li><a href="/products.html?mainCategory=vot-cau-long&brand=Yonex">Yonex</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&brand=Lining">Lining</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&brand=Victor">Victor</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&brand=Mizuno">Mizuno</a></li>
                                </ul>
                            </div>
                            <div class="mega-menu-column">
                                <h4 class="mega-menu-heading">Vợt Theo Lối Chơi</h4>
                                <ul class="mega-menu-links">
                                    <li><a href="/products.html?mainCategory=vot-cau-long&subCategory=tan-cong">Tấn công (Nặng đầu)</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&subCategory=can-bang">Công thủ toàn diện</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&subCategory=phong-thu">Phòng thủ, phản tạt</a></li>
                                </ul>
                            </div>
                            <div class="mega-menu-column">
                                <h4 class="mega-menu-heading">Vợt Theo Mức Giá</h4>
                                <ul class="mega-menu-links">
                                    <li><a href="/products.html?mainCategory=vot-cau-long&maxPrice=1000000">Dưới 1 triệu</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&minPrice=1000000&maxPrice=2000000">Từ 1 - 2 triệu</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&minPrice=2000000&maxPrice=3000000">Từ 2 - 3 triệu</a></li>
                                    <li><a href="/products.html?mainCategory=vot-cau-long&minPrice=3000000">Trên 3 triệu</a></li>
                                </ul>
                            </div>
                            <div class="mega-menu-column mega-menu-banner">
                                <a href="/products.html?mainCategory=vot-cau-long&isPromotional=true">
                                    <img src="/images/products/halbtec9000limited.png" alt="Vợt khuyến mãi">
                                    <span>Xem Ngay Vợt<br>Đang Khuyến Mãi</span>
                                </a>
                            </div>
                        </div>
                    </li>
                    <li><a href="/products.html?mainCategory=quan-ao">Quần áo</a></li>
                    <li><a href="/products.html?mainCategory=giay">Giày</a></li>
                    <li><a href="/products.html?mainCategory=phu-kien">Phụ Kiện</a></li>
                    <li><a href="/about.html">Về Chúng Tôi</a></li>
                    <li><a href="/contact.html">Liên Hệ</a></li>
                </ul>
            </nav>
            <div class="header-actions">
                <form id="search-form" class="header-search">
                    <input type="search" id="search-input" placeholder="Tìm kiếm sản phẩm...">
                    <button type="submit" aria-label="Tìm kiếm"><i class="fas fa-search"></i></button>
                </form>
                <div id="auth-section"></div>
                <button id="view-cart-btn" class="action-btn cart-icon-btn">
                    <i class="fas fa-shopping-bag"></i>
                    <span id="cart-count-main" class="cart-count" style="display: none;">0</span>
                </button>
            </div>
        </div>
    </header>
`;


    const footerHTML = `
        <div class="container">
            <div class="footer-grid">
                <div class="footer-section brand-info">
                    <a href="/index.html" class="logo">
                <img src="/images/logo.png" alt="GS Store Logo" style="height: 120px;">
                </a>
                    <p>Cam kết mang đến sản phẩm chính hãng và trải nghiệm mua sắm tốt nhất cho mọi khách hàng yêu thể thao.</p>
                    <div class="social-links">
                        <a href="https://www.facebook.com/" target="_blank" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://www.instagram.com/" target="_blank" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.youtube.com/@fbshopvn" target="_blank" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-section">
                    <h3>Chính Sách</h3><ul class="footer-links">
                    <li><a href="#">Chính sách giao hàng</a></li>
                    <li><a href="#">Chính sách đổi trả</a>
                    </li><li><a href="#">Chính sách bảo hành</a>
                    </li><li><a href="#">Chính sách bảo mật</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h3>Hỗ Trợ</h3><ul class="footer-links">
                    <li><a href="/contact.html">Liên hệ & Góp ý</a>
                    </li><li><a href="#">Hướng dẫn chọn vợt</a>
                    </li><li><a href="/myorders.html">Kiểm tra đơn hàng</a>
                    </li><li><a href="#">Câu hỏi thường gặp</a></li>
                    </ul>
                </div>
                <div class="footer-section newsletter">
                    <h3>Đăng ký nhận tin</h3>
                    <p>Nhận thông tin về sản phẩm mới và các chương trình khuyến mãi.</p>
                    <form id="newsletter-form">
                    <input type="email" placeholder="Email của bạn" required>
                    <button type="submit" aria-label="Đăng ký">
                    <i class="fas fa-paper-plane"></i>
                    </button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom"><p>© ${new Date().getFullYear()} KhảiHoàng. All Rights Reserved.</p><div class="footer-certs"><a href="#" target="_blank" rel="noopener noreferrer"><img src ="images/logo-congthuong/logo2.png" alt="Đã thông báo Bộ Công Thương"></a></div></div>
        </div>
    `;

    const popupsHTML = `
        <button id="scroll-to-top-btn" class="scroll-to-top-btn" aria-label="Cuộn lên đầu trang"><i class="fas fa-arrow-up"></i></button>
        <button id="open-contact-modal-btn" class="floating-contact-btn" aria-label="Mở tùy chọn liên hệ"><i class="fas fa-headset"></i></button>
        <div id="page-overlay" class="page-overlay"></div>

        <!-- Cart Drawer -->
        <div id="cart-drawer" class="cart-drawer" role="dialog" aria-modal="true">
            <div class="cart-header"><h2 id="cart-drawer-title">Giỏ Hàng Của Bạn</h2><button class="close-cart-btn" aria-label="Đóng">×</button></div>
            <div id="cart-content" class="cart-content">
                <div id="cart-items-container" class="cart-items-container"></div>
                <div id="empty-cart-view" class="empty-cart-view" style="display: none;">
                    <div class="empty-cart-content"><i class="fas fa-shopping-bag"></i><h4>Giỏ hàng của bạn đang trống</h4><p>Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!</p><a href="/products.html" class="btn primary-btn continue-shopping-btn">Tiếp tục mua sắm</a></div>
                </div>
            </div>
            <div class="cart-footer" style="display: none;">
                <div class="cart-summary"><span>Tạm tính</span><span id="cart-total">0 VNĐ</span></div>
                <a href="/shipping.html" class="btn primary-btn checkout-btn"><span>Thanh Toán</span><i class="fas fa-arrow-right"></i></a>
            </div>
        </div>
        
        <!-- Auth Modal -->
        <div id="auth-modal" class="auth-modal">
            <button class="close-auth-modal">×</button>
            <div class="auth-modal-tabs">
                <button id="login-tab-btn" class="auth-tab-btn active" data-form="login-form">Đăng Nhập</button>
                <button id="register-tab-btn" class="auth-tab-btn" data-form="register-form">Đăng Ký</button>
            </div>
            <div class="auth-modal-content">
                <form id="login-form" class="auth-form">
                    <h3>Chào mừng trở lại!</h3>
                    <div class="form-group"><label for="login-email">Email</label><input type="email" id="login-email" name="email" required></div>
                    <div class="form-group"><label for="login-password">Mật khẩu</label><input type="password" id="login-password" name="password" required></div>
                    <button type="submit" class="btn primary-btn">Đăng Nhập</button><p id="login-error" class="form-error"></p>
                </form>
                
                <!-- ****** THAY ĐỔI Ở ĐÂY ****** -->
                <form id="register-form" class="auth-form" style="display: none;">
                    <h3>Tạo tài khoản mới</h3>
                    <div class="form-group"><label for="register-name">Họ và Tên</label><input type="text" id="register-name" name="name" required></div>
                    <div class="form-group"><label for="register-email">Email</label><input type="email" id="register-email" name="email" required></div>
                    <div class="form-group"><label for="register-password">Mật khẩu</label><input type="password" id="register-password" name="password" required></div>
                    <div class="form-group"><label for="register-confirm-password">Xác nhận mật khẩu</label><input type="password" id="register-confirm-password" name="confirmPassword" required></div>
                    <button type="submit" class="btn primary-btn">Đăng Ký</button><p id="register-error" class="form-error"></p>
                </form>
                <!-- ****** KẾT THÚC THAY ĐỔI ****** -->

            </div>
        </div>

        <!-- Contact Modal -->
        <div id="contact-modal" class="contact-modal">
            <button class="close-auth-modal" id="close-contact-modal">×</button>
            <h3 style="margin-bottom: 2rem;">Hỗ Trợ Nhanh</h3>
            <div class="contact-modal-options" style="display: flex; flex-direction: column; gap: 1rem;">
                <a href="tel:19001234" class="btn primary-btn" style="display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="fas fa-phone-alt"></i><span>Hotline: 1900 1234</span></a>
                <a href="https://chat.zalo.me/" target="_blank" class="btn" style="background-color: #0068ff; color: white; display: flex; align-items: center; justify-content: center; gap: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48"><path fill="currentColor" d="M34.621 34.527c-1.16-.12-2.31-.35-3.41-.71a1.373 1.373 0 0 0-1.28.36c-1.09 1.13-2.37 2.4-4.21 2.3-1.72-.09-3.26-.88-5.93-3.55c-2.67-2.67-3.46-4.21-3.55-5.93c-.1-1.84 1.17-3.12 2.3-4.21c.42-.4.5-.96.36-1.28c-.36-1.1-.59-2.25-.71-3.41a1.373 1.373 0 0 0-1.4-1.25c-1.41-.01-2.93.15-4.29.56c-1.86.56-3.23 2-3.15 4.34c.06 1.83.56 3.63 1.48 5.37c2.53 4.74 6.33 8.54 11.07 11.07c1.74.92 3.54 1.42 5.37 1.48c2.34.08 3.78-1.29 4.34-3.15c.41-1.36.57-2.88.56-4.29c-.03-.53-.41-1.13-1.25-1.4Z" /><path fill="currentColor" d="M22.422 13.911c.1-.11.21-.21.32-.32a13.36 13.36 0 0 1 15.68 4.3a1.403 1.403 0 0 0 1.95-.59a15.24 15.24 0 0 0-5.1-17.75a1.37 1.37 0 0 0-1.92.51c-1 1.6-1.6 3.4-1.94 5.25c-.2.99.73 1.87 1.73 1.58c1.9-.56 3.65-1.4 5.22-2.45c-2.23-1.66-4.8-2.69-7.53-2.95a1.37 1.37 0 0 0-1.48 1.25a16.14 16.14 0 0 0-2.45 10.1c.3 1 .9 1.4 1.6 1.01c.7-.4 1.3-.87 1.9-1.34Z"/></svg><span>Chat qua Zalo</span></a>
                <a href="/contact.html" class="link-like-btn" style="margin-top: 1rem;">Xem trang Liên hệ</a>
            </div>
        </div>
        
        <!-- Filter Drawer -->
        <aside id="filter-drawer" class="products-sidebar-v2">
            <div class="filter-drawer-header">
                <h3>Bộ Lọc Sản Phẩm</h3>
                <button id="close-filter-btn" class="close-auth-modal">×</button>
            </div>
            
            <div class="filter-drawer-content">
                <div class="filter-card">
                    <h3 class="filter-title">Thương hiệu</h3>
                    <div id="brand-filter-options" class="filter-options-v2 filter-pills-wrapper"></div>
                </div>

                <div class="filter-card">
                    <h3 class="filter-title">Khoảng giá</h3>
                    <div id="price-slider-container">
                        <div id="price-slider"></div>
                        <div class="price-slider-values" style="display: flex; justify-content: space-between; margin-top: 10px;">
                            <span id="price-lower-value"></span>
                            <span id="price-upper-value"></span>
                        </div>
                    </div>
                </div>

                <div id="racquet-filters" class="filter-card" style="display: none;">
                    <h3 class="filter-title">Thông số vợt</h3>
                    <div class="sub-filter-group" style="margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">Trọng lượng (U)</h4>
                        <div id="weight-filter-options" class="filter-options-v2 filter-pills-wrapper">
                            <label><input type="checkbox" name="weight" value="4U"><span>4U</span></label>
                            <label><input type="checkbox" name="weight" value="3U"><span>3U</span></label>
                            <label><input type="checkbox" name="weight" value="5U"><span>5U</span></label>
                        </div>
                    </div>
                    <div class="sub-filter-group">
                        <h4 style="margin-bottom: 0.5rem;">Điểm cân bằng</h4>
                        <div id="balance-filter-options" class="filter-options-v2 filter-pills-wrapper">
                            <label><input type="checkbox" name="balance" value="Nặng đầu"><span>Nặng đầu</span></label>
                            <label><input type="checkbox" name="balance" value="Cân bằng"><span>Cân bằng</span></label>
                            <label><input type="checkbox" name="balance" value="Nhẹ đầu"><span>Nhẹ đầu</span></label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="filter-drawer-footer">
                <button id="apply-filters-btn" class="btn primary-btn" style="width: 100%;">Áp dụng</button>
            </div>
        </aside>

        <!-- Toast Notification -->
        <div id="toast-notification" class="toast"><span id="toast-message"></span></div>
    `;

    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'header-wrapper';
    headerWrapper.innerHTML = headerHTML;

    const footerElement = document.createElement('footer');
    footerElement.className = 'footer';
    footerElement.innerHTML = footerHTML;

    body.prepend(headerWrapper);
    body.appendChild(footerElement);
    body.insertAdjacentHTML('beforeend', popupsHTML)}