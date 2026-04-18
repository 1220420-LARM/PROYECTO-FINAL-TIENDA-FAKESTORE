class ApiClient {
    constructor(end_point) {
        this.end_point = end_point;
    }

    executeRequest() {
        return fetch(this.end_point)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error de conexión a la API');
                }
                return response.json();
            });
    }
}

const apiClient = new ApiClient('https://fakestoreapi.com/products');
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('miCarrito')) || []; 
let isPriceAsc = true;
let isNameAsc = true;

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    apiClient.executeRequest()
        .then(data => {
            allProducts = data;
            renderProducts(allProducts);
        })
        .catch(error => {
            document.getElementById('product-grid').innerHTML = 
                `<div class="alert alert-danger w-100">Hubo un error al cargar los productos: ${error.message}</div>`;
        });
});

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    products.forEach((product, index) => {
        const hasDiscount = index % 3 === 0; 
        const discountPercentage = hasDiscount ? Math.random() < 0.5 ? 10 : 15 : 0;
        const discountText = hasDiscount ? `-${discountPercentage}%` : '';
        const mainTitle = product.title.split(' ')[0];
        const secondaryText = product.title.split(' ').slice(1, 3).join(' ');
        const cardHtml = `
            <div class="col-sm-6 col-md-6 col-lg-4 col-xl-3 mb-4">
                <div class="product-card h-100 d-flex flex-column">
                    <span class="bullseye-icon"><i class="fas fa-bullseye"></i></span>
                    ${hasDiscount ? `<span class="discount-badge">${discountText}</span>` : ''}
                    <div class="product-img-wrapper" onclick="showProductModal(${product.id})">
                        <img src="${product.image}" alt="${product.title}">
                    </div>
                    <div class="product-details mt-auto">
                        <span class="price-text-magenta d-block mb-1">$${product.price.toFixed(2)}</span>
                        <h6 class="product-title-detail text-truncate" title="${product.title}">${mainTitle}</h6>
                        <p class="product-brand-detail text-truncate" title="${product.title}">${secondaryText}</p>
                        <div class="d-flex justify-content-end mt-2">
                            <button class="btn-cart-add-blue shadow-sm" onclick="addToCart(${product.id})" title="Agregar al carrito">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });
}

function sortProducts(criteria) {
    let sortedProducts = [...allProducts]; 

    if (criteria === 'price') {
        sortedProducts.sort((a, b) => isPriceAsc ? a.price - b.price : b.price - a.price);
        isPriceAsc = !isPriceAsc; 
    } else if (criteria === 'name') {
        sortedProducts.sort((a, b) => isNameAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
        isNameAsc = !isNameAsc;
    }

    renderProducts(sortedProducts);
}

function showProductModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modal-title').innerText = product.title;
    document.getElementById('modal-img').src = product.image;
    document.getElementById('modal-desc').innerText = product.description;
    document.getElementById('modal-price').innerText = `$${product.price.toFixed(2)}`;
    document.getElementById('modal-category').innerText = product.category;
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}
function addToCart(id) {
    const product = allProducts.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCartAndRefresh();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCartAndRefresh();
}

function saveCartAndRefresh() {
    localStorage.setItem('miCarrito', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');

    cartItemsContainer.innerHTML = '';
    let totalAmount = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-muted text-center mt-4">Tu carrito está vacío.</p>';
    } else {
        cart.forEach(item => {
            totalAmount += (item.price * item.quantity);
            totalItems += item.quantity;

            const itemHtml = `
                <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                    <div class="d-flex align-items-center" style="width: 80%;">
                        <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: contain;" class="me-3 bg-white border p-1 rounded">
                        <div class="text-truncate">
                            <small class="d-block fw-bold text-truncate">${item.title}</small>
                            <small class="text-muted">${item.quantity} und. x $${item.price.toFixed(2)}</small>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItemsContainer.innerHTML += itemHtml;
        });
    }

    cartCountBadge.innerText = totalItems;
    cartTotalEl.innerText = `$${totalAmount.toFixed(2)}`;
}