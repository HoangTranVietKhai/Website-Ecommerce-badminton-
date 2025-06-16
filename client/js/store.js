// Kho Dữ Liệu Trung Tâm

// private state
let state = {
    products: [],
    cart: [],
    user: null
};

// Public methods to interact with the state
const store = {
    // --- Products ---
    setProducts(products) {
        state.products = products;
    },
    getProducts() {
        return state.products;
    },
    findProductById(id) {
        return state.products.find(p => p._id === id);
    },
    addProduct(product) {
        if (!state.products.some(p => p._id === product._id)) {
            state.products.push(product);
        }
    },

    // --- Cart ---
    getCart() {
        return state.cart;
    },
    loadCart() {
        state.cart = JSON.parse(localStorage.getItem('cart')) || [];
        return state.cart;
    },
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(state.cart));
    },
    addToCart(product) {
        const existingItem = state.cart.find(item => item._id === product._id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            state.cart.push({ ...product, quantity: 1 });
        }
        this.saveCart();
    },
    updateCartItemQuantity(productId, newQuantity) {
        const item = state.cart.find(i => i._id === productId);
        if (item) {
            item.quantity = newQuantity;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
            }
        }
    },
    removeFromCart(productId) {
        state.cart = state.cart.filter(item => item._id !== productId);
        this.saveCart();
    },
    getCartTotalItems() {
        return state.cart.reduce((sum, item) => sum + item.quantity, 0);
    },
    getCartTotalPrice() {
        return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },


    // --- User ---
    getUser() {
        if (!state.user) {
            state.user = JSON.parse(localStorage.getItem('user'));
        }
        return state.user;
    },
    setUser(userData, token) {
        state.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    },
    logout() {
        state.user = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    },
    getToken() {
        return localStorage.getItem('token');
    }
};

export default store;