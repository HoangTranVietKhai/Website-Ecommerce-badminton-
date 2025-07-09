// ===== File: client/js/store.js =====

let state = {
    products: [],
    cart: [],
    shippingAddress: {},
    paymentMethod: '',
    user: null,
    token: null
};

const store = {
    // Products
    setProducts(products) {
        state.products = products;
    },
    getProducts() {
        return state.products;
    },
    findProductById(id) {
        return state.products.find(p => p.id == id);
    },
    addProduct(product) {
        if (!state.products.some(p => p.id === product.id)) {
            state.products.push(product);
        }
    },

    // Cart
    getCart() {
        return state.cart;
    },
    loadCart() {
        state.cart = JSON.parse(localStorage.getItem('cart')) || [];
        state.shippingAddress = JSON.parse(localStorage.getItem('shippingAddress')) || {};
        state.paymentMethod = localStorage.getItem('paymentMethod') || 'Cash on Delivery';
    },
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(state.cart));
    },
    getCartItemId(item) {
        const optionHash = item.stringingInfo ? `${item.stringingInfo.stringId}-${item.stringingInfo.tension}` : 'no-option';
        return `${item.id || item.product}-${optionHash}`;
    },
    addToCart(product, stringingInfo = null) {
    // Chuẩn hóa đối tượng sản phẩm để đảm bảo có các trường cần thiết
    const newItem = {
        id: product.id,
        product: product.id, // Đảm bảo có cả 'id' và 'product' cho nhất quán
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: 1,
        stringingInfo: stringingInfo
    };

    const cartItemId = this.getCartItemId(newItem);
    
    const existingItem = state.cart.find(item => this.getCartItemId(item) === cartItemId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push(newItem);
    }
    this.saveCart();
},
    updateCartItemQuantity(cartItemId, action) {
        const itemIndex = state.cart.findIndex(item => this.getCartItemId(item) === cartItemId);
        if (itemIndex > -1) {
            if (action === 'increase') {
                state.cart[itemIndex].quantity++;
            } else if (action === 'decrease') {
                state.cart[itemIndex].quantity--;
            }
            
            if (state.cart[itemIndex].quantity <= 0) {
                state.cart.splice(itemIndex, 1);
            }
            this.saveCart();
        }
    },
    removeFromCart(cartItemId) {
        state.cart = state.cart.filter(item => this.getCartItemId(item) !== cartItemId);
        this.saveCart();
    },
    clearCart() {
        state.cart = [];
        this.saveCart();
    },
    getCartTotalItems() {
        return state.cart.reduce((sum, item) => sum + item.quantity, 0);
    },
    getCartItemsPrice() {
        return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    getCartStringingPrice() {
        return state.cart.reduce((sum, item) => {
            const stringPrice = item.stringingInfo ? (item.stringingInfo.stringPrice * item.quantity) : 0;
            return sum + stringPrice;
        }, 0);
    },
    getCartTotalPrice() {
        return this.getCartItemsPrice() + this.getCartStringingPrice();
    },

    // Shipping & Payment
    saveShippingAddress(address) {
        state.shippingAddress = address;
        localStorage.setItem('shippingAddress', JSON.stringify(address));
    },
    getShippingAddress() {
        return state.shippingAddress;
    },
    savePaymentMethod(method) {
        state.paymentMethod = method;
        localStorage.setItem('paymentMethod', method);
    },
    getPaymentMethod() {
        return state.paymentMethod;
    },

    // User
    getUser() {
        if (!state.user) {
            state.user = JSON.parse(localStorage.getItem('user'));
        }
        return state.user;
    },
    setUser(userData, token) {
        state.user = userData;
        state.token = token;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    },
    logout() {
        state.user = null;
        state.token = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('shippingAddress');
    },
    getToken() {
        if (!state.token) {
            state.token = localStorage.getItem('token');
        }
        return state.token;
    },
    
    // Utils (Thêm vào store để tiện sử dụng)
    formatCurrency(number) {
        if (typeof number !== 'number' || isNaN(number)) {
            return '0 ₫';
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
    }
};

export default store;