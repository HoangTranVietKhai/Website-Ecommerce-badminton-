// js/components.js
import { formatCurrency } from './utils.js';

export function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.productId = product._id; // SỬA Ở ĐÂY: DÙNG _id

    productCard.innerHTML = `
        <div class="image-container">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <h3>${product.name}</h3>
        <p class="price">${formatCurrency(product.price)}</p>
    `;

    return productCard;
}