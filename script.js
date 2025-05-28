document.addEventListener('DOMContentLoaded', () => {

    
    let currentDetailProductId = null;
    // --- SELECTORES DEL DOM (EXISTENTES Y NUEVOS) ---
    const pages = document.querySelectorAll('.page');
    // Excluir el botón de icono de los navLinks generales para evitar doble manejo de pageId
    const navLinks = document.querySelectorAll('.nav-link:not(#user-icon-button)');
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    const userMenuContainer = document.querySelector('.user-menu-container'); // Necesario para cerrar dropdown

    // User Menu (NUEVO sistema de menú)
    const userIconButton = document.getElementById('user-icon-button');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownLogin = document.getElementById('dropdown-login');
    const dropdownAccount = document.getElementById('dropdown-account');
    const dropdownLogout = document.getElementById('dropdown-logout');

    // Selectores de Login (originales, algunos serán reemplazados en updateUserUI)
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const availableUsersList = document.getElementById('available-users');
    // const navLogin = document.getElementById('nav-login'); // Obsoleto con el nuevo menú
    // const navUser = document.getElementById('nav-user'); // Obsoleto con el nuevo menú
    // const userGreeting = document.getElementById('user-greeting'); // Obsoleto con el nuevo menú
    // const logoutButton = document.getElementById('logout-button'); // Obsoleto con el nuevo menú

    // Productos y Filtros
    const productListContainer = document.getElementById('product-list');
    const featuredProductsContainer = document.getElementById('featured-products-container'); // Para "Más Productos"
    const productDetailContainer = document.getElementById('product-detail-content');
    // const productDetailPage = document.getElementById('product-detail-page'); // Ya se maneja con showPage
    const backToProductsButton = document.getElementById('back-to-products');
    const searchBar = document.getElementById('search-bar');
    const categoryFilter = document.getElementById('category-filter');

    // Carousel (NUEVO)
    const bestsellersCarouselTrack = document.getElementById('bestsellers-carousel-track');
    const carouselPrevBtn = document.getElementById('carousel-prev');
    const carouselNextBtn = document.getElementById('carousel-next');

    // Carrito
    const cartCountElement = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartShippingElement = document.getElementById('cart-shipping');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');
    const emptyCartMessage = document.getElementById('empty-cart-message');

    // Checkout
    const checkoutForm = document.getElementById('checkout-form');
    const orderConfirmation = document.getElementById('order-confirmation');
    const checkoutName = document.getElementById('checkout-name');
    const checkoutEmail = document.getElementById('checkout-email');

    // Account Page (NUEVO)
    const accountUserName = document.getElementById('account-user-name');
    const accountUserEmail = document.getElementById('account-user-email');
    const favoriteProductsListContainer = document.getElementById('favorite-products-list');
    const noFavoritesMessage = document.getElementById('no-favorites-message');

    // Footer Year (NUEVO)
    const currentYearSpan = document.getElementById('current-year');

    // --- DATOS ---
    let allProducts = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let reqresUsers = [];
    let productCategories = [];
    let favoriteProductIds = JSON.parse(localStorage.getItem('favoriteProductIds')) || []; // NUEVO
    let currentCarouselIndex = 0; // NUEVO

const USERS_API_URL = 'https://cors-anywhere.herokuapp.com/https://reqres.in/api/users?page=2';
    const PRODUCTS_API_URL = 'https://fakestoreapi.com/products';
    const BESTSELLERS_COUNT = 5; // Número de productos para el carrusel (NUEVO)

    // --- NAVEGACIÓN SPA SIMPLE (MODIFICADA) ---
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            console.warn(`Page with id "${pageId}-page" not found. Defaulting to home.`);
            document.getElementById('home-page').classList.add('active'); // Fallback
        }

        // Actualizar link activo en navbar principal
        navLinks.forEach(link => {
            link.classList.remove('active-link');
            if (link.dataset.page === pageId) {
                link.classList.add('active-link');
            }
        });

        if (navMenu.classList.contains("active")) {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
        }
        // Cerrar dropdown de usuario si está abierto
        if (userDropdown && userDropdown.classList.contains("show")) {
            userDropdown.classList.remove("show");
        }
        window.scrollTo(0, 0);

        // Cargar datos específicos de la página si es necesario (NUEVO para account)
        if (pageId === 'account' && currentUser) { // Solo renderizar si está logueado
            renderAccountPage();
        } else if (pageId === 'account' && !currentUser) {
            showPage('login'); // Si intenta ir a cuenta sin loguear, va a login
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.closest('.nav-link').dataset.page;
            if (pageId) showPage(pageId);
        });
    });

    document.body.addEventListener('click', function(event) {
        if (event.target.dataset.pageTarget) {
            event.preventDefault();
            const pageId = event.target.dataset.pageTarget;
            showPage(pageId);
        }
    });

    if(backToProductsButton) {
        backToProductsButton.addEventListener('click', () => showPage('products'));
    }

    // --- USER MENU DROPDOWN (NUEVO) ---
    if (userIconButton) {
        userIconButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
    }
    // Cerrar dropdown si se hace clic fuera
    window.addEventListener('click', (e) => {
        if (userDropdown && userDropdown.classList.contains('show') && userMenuContainer && !userMenuContainer.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });
    // Navegación desde el dropdown
    [dropdownLogin, dropdownAccount].forEach(item => {
        if (item) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                showPage(item.dataset.page);
                // userDropdown.classList.remove('show'); // showPage ya lo cierra
            });
        }
    });

    // --- LÓGICA DE LOGIN FICTICIO ---
    async function fetchReqresUsers() {
        try {
            const response = await fetch(USERS_API_URL);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            reqresUsers = data.data;
            renderAvailableUsers();
        } catch (error) {
            console.error("Error fetching users:", error);
            if(availableUsersList) availableUsersList.innerHTML = '<li>michael.lawson@reqres.in</li><li>tobias.funke@reqres.in</li>';
        }
    }

    function updateDetailStockDisplay() {
        if (!currentDetailProductId) return;
    
        const product = allProducts.find(p => p.id === currentDetailProductId);
        if (!product) return;
    
        const totalStock = product.rating?.count || 0;
        const cartItem = cart.find(item => item.id === currentDetailProductId);
        const inCart = cartItem ? cartItem.quantity : 0;
        const stockAvailable = Math.max(totalStock - inCart, 0);
    
        // Actualizar texto
        const stockDisplay = document.getElementById('stock-display');
        if (stockDisplay) {
            stockDisplay.textContent = `${stockAvailable} unidades`;
        }
    
        // Actualizar input
        const quantityInput = document.getElementById('detail-quantity');
        if (quantityInput) {
            quantityInput.max = stockAvailable;
            if (stockAvailable === 0) {
                quantityInput.value = 0;
                quantityInput.readOnly = true;
            } else {
                if (quantityInput.value == 0) quantityInput.value = 1;
                quantityInput.readOnly = false;
            }
        }
    
        // Actualizar botón
        const addToCartBtn = document.querySelector('.add-to-cart-from-detail');
        if (addToCartBtn) {
            addToCartBtn.disabled = stockAvailable === 0;
            addToCartBtn.textContent = stockAvailable === 0 ? 'Agotado' : 'Añadir al Carrito';
        }
    }

    function renderAvailableUsers() {
        if (!availableUsersList) return;
        availableUsersList.innerHTML = '';
        if (reqresUsers.length > 0) {
            reqresUsers.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `${user.first_name} ${user.last_name} (${user.email})`;
                availableUsersList.appendChild(li);
            });
        } else {
            availableUsersList.innerHTML = '<li>No hay usuarios de ejemplo disponibles.</li>';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const email = emailInput.value;
            const foundUser = reqresUsers.find(user => user.email === email);

            if (foundUser) {
                currentUser = { id: foundUser.id, email: foundUser.email, name: foundUser.first_name }; // Añadido ID
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showPage('home');
                if(loginMessage) loginMessage.textContent = '';
                emailInput.value = ''; // Limpiar input
            } else {
                if(loginMessage) loginMessage.textContent = 'Email no encontrado. Intenta con uno de la lista.';
                loginMessage.style.color = 'var(--error-color)';
                currentUser = null;
                localStorage.removeItem('currentUser');
            }
            updateUserUI();
        });
    }

    // --- updateUserUI (MODIFICADO para nuevo menú) ---
    function updateUserUI() {
        if (!dropdownLogin || !dropdownAccount || !dropdownLogout) return; // Safety check

        if (currentUser) {
            dropdownLogin.style.display = 'none';
            dropdownAccount.style.display = 'block';
            dropdownLogout.style.display = 'block';
            if(checkoutName) checkoutName.value = currentUser.name;
            if(checkoutEmail) checkoutEmail.value = currentUser.email;
        } else {
            dropdownLogin.style.display = 'block';
            dropdownAccount.style.display = 'none';
            dropdownLogout.style.display = 'none';
            if(checkoutName) checkoutName.value = ''; // Limpiar en logout
            if(checkoutEmail) checkoutEmail.value = ''; // Limpiar en logout
        }
    }

    // Logout desde el dropdown (NUEVO)
    if (dropdownLogout) {
        dropdownLogout.addEventListener('click', (e) => {
            e.preventDefault();
            currentUser = null;
            localStorage.removeItem('currentUser');
            //limpiar favoritos al hacer logout
            favoriteProductIds = []; 
            localStorage.removeItem('favoriteProductIds');
            updateUserUI();
            showPage('login');
        });
    }

    // --- LÓGICA DE PRODUCTOS DESDE API ---
    async function fetchProducts() {
        if (allProducts.length > 0) return allProducts; // Cache simple

        try {
            const response = await fetch(PRODUCTS_API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            // Asegurar que el ID es número y añadirlo si no existe (FakeStoreAPI tiene 'id')
            allProducts = data.map((p) => ({ ...p, id: Number(p.id) })); 
            
            renderProductsUI(); // Nueva función para centralizar renderizado
            populateCategories(allProducts);
            return allProducts;
        } catch (error) {
            console.error("Error fetching products:", error);
            const errorMessage = '<p class="error-message">Error al cargar los productos. Intenta recargar la página.</p>';
            if (productListContainer) productListContainer.innerHTML = errorMessage;
            if (featuredProductsContainer) featuredProductsContainer.innerHTML = errorMessage;
            if (bestsellersCarouselTrack) bestsellersCarouselTrack.innerHTML = errorMessage;
            return [];
        }
    }
    
    // NUEVA función para centralizar el renderizado de productos en diferentes secciones
    function renderProductsUI() {
        if (!allProducts || allProducts.length === 0) return;
        // Carrusel con los primeros N productos
        if (bestsellersCarouselTrack) renderProducts(allProducts.slice(0, BESTSELLERS_COUNT), bestsellersCarouselTrack, true);
        // "Más Productos" con los siguientes (ej. 4 productos)
        if (featuredProductsContainer) renderProducts(allProducts.slice(BESTSELLERS_COUNT, BESTSELLERS_COUNT + 3), featuredProductsContainer);
        // Lista completa en la página de productos
        if (productListContainer) renderProducts(allProducts, productListContainer);
    }

    // renderProducts (MODIFICADO para carrusel y favoritos)
    function renderProducts(productsToRender = [], container, isCarouselSlide = false) {
        if (!container) return;
        container.innerHTML = '';
        if (productsToRender.length === 0 && !isCarouselSlide) {
            container.innerHTML = '<p>No hay productos que coincidan.</p>';
            return;
        }
        productsToRender.forEach(product => {
            // Asegurar que product.id es un número
            const productIdNum = Number(product.id);
            const isFavorite = favoriteProductIds.includes(productIdNum);

            // Crear el elemento principal (div para carrusel, article para el resto)
            const productElement = document.createElement(isCarouselSlide ? 'div' : 'article');
            productElement.className = isCarouselSlide ? 'carousel-slide' : 'product-card';
            
            // El contenido interno siempre será como una product-card
            // Truncar el título para mejor visualización
            const productTitle = product.title.length > 50 ? product.title.substring(0, 47) + "..." : product.title;

            productElement.innerHTML = `
                <div class="${isCarouselSlide ? 'product-card' : ''}"> 
                    
                    <img src="${product.image}" alt="${product.title}" data-product-id="${productIdNum}">
                    <h3>${productTitle}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <button class="favorite-btn" data-product-id="${productIdNum}" aria-label="Añadir/quitar de favoritos">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class=" fas fa-shopping-cart add-to-cart-btn" data-product-id="${productIdNum}"></button>
                </div>
            `;
            if (!isCarouselSlide) {
                productElement.innerHTML = `
                    
                    <img src="${product.image}" alt="${product.title}" data-product-id="${productIdNum}">
                    <h3>${productTitle}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <button class="favorite-btn" data-product-id="${productIdNum}" aria-label="Añadir/quitar de favoritos">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="fas fa-shopping-cart  add-to-cart-btn" data-product-id="${productIdNum}"></button>
                `;
            }


            productElement.querySelector('img').addEventListener('click', () => showProductDetail(productIdNum));
            productElement.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                addToCart(productIdNum);
            });
            productElement.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(productIdNum, e.currentTarget);
            });
            container.appendChild(productElement);
        });
         if (isCarouselSlide) updateCarousel(); // Actualizar carrusel después de añadir slides
    }
    
    // showProductDetail (MODIFICADO para favoritos y obtener producto de allProducts primero)
    async function showProductDetail(productId) {
        productId = Number(productId); // Asegurar que es número
        showPage('product-detail');
        if (!productDetailContainer) return;
        productDetailContainer.innerHTML = '<p>Cargando detalles del producto...</p>';

        try {
            let product = allProducts.find(p => p.id === productId);

            if (!product) { // Si no está en allProducts (ej. link directo), fetch individual
                const response = await fetch(`${PRODUCTS_API_URL}/${productId}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                product = await response.json();
                if (product) product.id = Number(product.id); // Asegurar ID numérico
            }
            
            if (!product) {
                productDetailContainer.innerHTML = '<p class="error-message">Producto no encontrado.</p>';
                return;
            }
            
            const isFavorite = favoriteProductIds.includes(product.id);
            const totalStock = (product.rating && typeof product.rating.count === 'number') ? product.rating.count : 0;
            const cartItem = cart.find(item => item.id === product.id);
            const inCart = cartItem ? cartItem.quantity : 0;
            const stockAvailable = Math.max(totalStock - inCart, 0);

            productDetailContainer.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <div id="product-detail-info">
                    <button class="favorite-btn" data-product-id="${product.id}" aria-label="Añadir/quitar de favoritos">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <h2>${product.title}</h2>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="description">${product.description || 'No description available.'}</p>
                    <p><strong>Categoría:</strong> ${product.category}</p>
                    <p><strong>Stock:</strong> <span id="stock-display">${stockAvailable} unidades</span></p>
                    <div class="quantity-selector">
                        <label for="detail-quantity">Cantidad:</label>
                        <input type="number" id="detail-quantity" value="1" min="1" 
                                ${stockAvailable === 0 ? 'max="0" readonly' : `max="${stockAvailable}"`}>
                    </div>
                    <button class="btn btn-primary add-to-cart-from-detail" data-product-id="${product.id}" ${stockAvailable === 0 ? 'disabled' : ''}>
                        ${stockAvailable === 0 ? 'Agotado' : 'Añadir al Carrito'}
                        
                    </button>
                    
                </div>
            `;

            productDetailContainer.querySelector('.add-to-cart-from-detail').addEventListener('click', () => {
                const quantityInput = document.getElementById('detail-quantity');
                const quantity = parseInt(quantityInput.value);

                if (quantity > 0 && product.rating.count >= quantity) {
                    addToCart(product.id, quantity);
            
                    // Restar stock localmente
                    product.rating.count -= quantity;
            
                    // Actualizar visualmente el stock
                    const stockDisplay = document.getElementById('stock-display');
                    if (stockDisplay) {
                        stockDisplay.textContent = `${product.rating.count} unidades`;
                    }
            
                    // Actualizar input de cantidad máxima permitida
                    quantityInput.max = product.rating.count;
                    if (product.rating.count <= 0) {
                        quantityInput.value = 0;
                        quantityInput.readOnly = true;
                        productDetailContainer.querySelector('.add-to-cart-from-detail').disabled = true;
                        productDetailContainer.querySelector('.add-to-cart-from-detail').textContent = 'Agotado';
                    }
                } else {
                    alert('Cantidad inválida o stock insuficiente.');
                }

                 /*/if (quantity > 0 && stockAvailable >= quantity) { // Solo añadir si hay stock y cantidad > 0
                    addToCart(product.id, quantity);

                    // Restar del stock local
                    product.stock -= quantity;
                    const stockDisplay = document.getElementById('stock-display');
                    if (stockDisplay) {
                        stockDisplay.textContent = `Stock disponible: ${stockAvailable}`;
                    } else {
                        alert('Cantidad inválida o stock insuficiente.');
                    }
                }*/
            });
            productDetailContainer.querySelector('.favorite-btn').addEventListener('click', (e) => {
                toggleFavorite(product.id, e.currentTarget);
            });

        } catch (error) {
            console.error("Error fetching product detail:", error);
            if (productDetailContainer) productDetailContainer.innerHTML = '<p class="error-message">Error al cargar los detalles del producto.</p>';
        }
    }

    // --- FAVORITOS (NUEVO) ---
    function toggleFavorite(productId, buttonElement) {
        productId = Number(productId); // Asegurar que es número
        const heartIcon = buttonElement.querySelector('i');
        const index = favoriteProductIds.indexOf(productId);

        if (index > -1) { // Ya es favorito, quitarlo
            favoriteProductIds.splice(index, 1);
            if (heartIcon) {
                heartIcon.classList.remove('fas');
                heartIcon.classList.add('far');
            }
        } else { // No es favorito, añadirlo
            favoriteProductIds.push(productId);
            if (heartIcon) {
                heartIcon.classList.remove('far');
                heartIcon.classList.add('fas');
            }
        }
        localStorage.setItem('favoriteProductIds', JSON.stringify(favoriteProductIds));

        // Re-renderizar la lista de favoritos si estamos en la página de cuenta
        if (document.getElementById('account-page')?.classList.contains('active')) {
            renderAccountPage();
        }
        // Actualizar el estado del botón en la lista principal de productos si está visible
        const mainProductCardButton = productListContainer?.querySelector(`.favorite-btn[data-product-id="${productId}"] i`);
        if (mainProductCardButton) {
            if (isFavorite) { // Estado antes del toggle
                 mainProductCardButton.classList.remove('fas'); mainProductCardButton.classList.add('far');
            } else {
                 mainProductCardButton.classList.remove('far'); mainProductCardButton.classList.add('fas');
            }
        }
        // Podrías hacer lo mismo para featuredProducts y carrusel si es necesario una actualización instantánea allí
    }


    // --- LÓGICA DEL CARRUSEL (NUEVO) ---
    function updateCarousel() {
        if (!bestsellersCarouselTrack || bestsellersCarouselTrack.children.length === 0) return;
        const firstSlide = bestsellersCarouselTrack.querySelector('.carousel-slide');
        if (!firstSlide) return; // No hay slides para medir
        
        const slideWidth = firstSlide.offsetWidth;
        if (slideWidth > 0) {
          bestsellersCarouselTrack.style.transform = `translateX(-${currentCarouselIndex * slideWidth}px)`;
        }
    }

    if (carouselPrevBtn) {
        carouselPrevBtn.addEventListener('click', () => {
            const numSlides = bestsellersCarouselTrack.children.length;
            if (numSlides === 0) return;
            currentCarouselIndex = (currentCarouselIndex - 1 + numSlides) % numSlides;
            updateCarousel();
        });
    }
    if (carouselNextBtn) {
        carouselNextBtn.addEventListener('click', () => {
            const numSlides = bestsellersCarouselTrack.children.length;
            if (numSlides === 0) return;
            currentCarouselIndex = (currentCarouselIndex + 1) % numSlides;
            updateCarousel();
        });
    }
    // Considerar recalcular en resize para responsividad avanzada del carrusel
    // window.addEventListener('resize', updateCarousel);

    // --- FILTROS Y BÚSQUEDA ---
    function populateCategories(products) {
        if (!categoryFilter || !products) return;
        productCategories = ['all', ...new Set(products.map(p => p.category))];
        categoryFilter.innerHTML = productCategories.map(cat => 
            `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
        ).join('');
    }
    
    function filterAndSearchProducts() {
        if (!allProducts) return; // Asegurarse que allProducts está cargado
        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';

        const filteredProducts = allProducts.filter(product => {
            const matchesSearch = product.title.toLowerCase().includes(searchTerm) || 
                                (product.description && product.description.toLowerCase().includes(searchTerm));
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        renderProducts(filteredProducts, productListContainer);
    }

    if (searchBar) searchBar.addEventListener('input', filterAndSearchProducts);
    if (categoryFilter) categoryFilter.addEventListener('change', filterAndSearchProducts);

    // --- LÓGICA DE CARRITO ---
    function addToCart(productId, quantity = 1) {
        productId = Number(productId);
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            console.error("Producto no encontrado para añadir al carrito:", productId);
            return;
        }
    
        const totalStock = product.rating?.count || 0;
    
        // Cantidad que ya hay en el carrito
        const cartItem = cart.find(item => item.id === productId);
        const currentInCart = cartItem ? cartItem.quantity : 0;
    
        // Cantidad total que habría si se añade
        const newTotal = currentInCart + quantity;
    
        if (newTotal > totalStock) {
            alert(`Solo quedan ${totalStock - currentInCart} unidades disponibles. Ya tienes ${currentInCart} en tu carrito.`);
            return;
        }
    
        if (cartItem) {
            cartItem.quantity = newTotal;
        } else {
            cart.push({ ...product, quantity });
        }
    
        saveCart();
        updateCartUI();
        alert(`${quantity} "${product.title}" añadido(s) al carrito!`);
    }

    function removeFromCart(productId) {
        productId = Number(productId);
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartUI();
    }

    function updateCartQuantity(productId, quantity) {
        productId = Number(productId);
        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity)) return; // Evitar NaN

        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            if (parsedQuantity <= 0) {
                removeFromCart(productId);
            } else {
                cartItem.quantity = parsedQuantity;
                saveCart();
                updateCartUI();
            }
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartUI() {
        // No renderizar si los contenedores no existen (ej. en tests o si el HTML no cargó)
        if (cartItemsContainer) renderCartItems();
        if (cartSubtotalElement && cartShippingElement && cartTotalElement) updateCartSummary();
        if (cartCountElement) updateCartCount();

        const hasItems = cart.length > 0;
        if (cartItemsContainer) cartItemsContainer.style.display = hasItems ? 'block' : 'none';
        const cartSummaryEl = document.getElementById('cart-summary');
        if (cartSummaryEl) cartSummaryEl.style.display = hasItems ? 'block' : 'none';
        if (emptyCartMessage) emptyCartMessage.style.display = hasItems ? 'none' : 'block';
        if (checkoutButton) checkoutButton.disabled = !hasItems;
    }

    function renderCartItems() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            const itemSubtotal = (item.price * item.quantity).toFixed(2);
            cartItemElement.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>Precio: $${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <input type="number" value="${item.quantity}" min="1" class="cart-item-quantity" data-product-id="${item.id}">
                    <span>Subtotal: $${itemSubtotal}</span>
                    <button class="remove-from-cart-btn" data-product-id="${item.id}" aria-label="Eliminar del carrito"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            cartItemElement.querySelector('.remove-from-cart-btn').addEventListener('click', () => {
                removeFromCart(item.id);
            });
            cartItemElement.querySelector('.cart-item-quantity').addEventListener('change', (e) => { 
                updateCartQuantity(item.id, e.target.value);
            });
            cartItemsContainer.appendChild(cartItemElement);
        });
    }

    function updateCartSummary() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 0 ? 5.00 : 0; 
        const total = subtotal + shipping;

        if (cartSubtotalElement) cartSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (cartShippingElement) cartShippingElement.textContent = `$${shipping.toFixed(2)}`;
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountElement) cartCountElement.textContent = count;
    }
    
    // --- PÁGINA DE MI CUENTA (NUEVO) ---
    function renderAccountPage() {
        if (!currentUser) {
            showPage('login'); 
            return;
        }
        if (accountUserName) accountUserName.textContent = currentUser.name || 'N/A';
        if (accountUserEmail) accountUserEmail.textContent = currentUser.email || 'N/A';

        renderFavoriteProducts();
    }

    function renderFavoriteProducts() {
        if (!favoriteProductsListContainer || !allProducts) return;
        
        const favoriteProducts = allProducts.filter(p => favoriteProductIds.includes(Number(p.id)));

        if (favoriteProducts.length === 0) {
            favoriteProductsListContainer.innerHTML = ''; // Limpiar si había algo antes
            if (noFavoritesMessage) noFavoritesMessage.style.display = 'block';
        } else {
            if (noFavoritesMessage) noFavoritesMessage.style.display = 'none';
            // Usar renderProducts para mostrar las tarjetas de favoritos
            renderProducts(favoriteProducts, favoriteProductsListContainer, false); // false porque no es carrusel
        }
    }

    // --- LÓGICA DE CHECKOUT SIMULADO ---
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (!currentUser) { // NUEVA verificación de login
                alert("Por favor, inicia sesión para proceder al pago.");
                showPage('login');
                return;
            }
            if (cart.length > 0) {
                showPage('checkout');
            } else {
                alert("Tu carrito está vacío.");
            }
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const checkoutAddress = document.getElementById('checkout-address');
            console.log("Pedido simulado:", {
                user: currentUser,
                items: cart,
                total: parseFloat(cartTotalElement.textContent.slice(1)), // Obtener el total del elemento
                address: checkoutAddress ? checkoutAddress.value : "N/A"
            });
            
            cart = []; 
            saveCart();
            updateCartUI();
            
            if(checkoutForm) checkoutForm.style.display = 'none';
            if(orderConfirmation) orderConfirmation.style.display = 'block';
            if (checkoutAddress) checkoutAddress.value = ''; // Limpiar textarea
        });
    }
    
    // --- HAMBURGER MENU ---
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
    }


    // --- INICIALIZACIÓN (MODIFICADA) ---
    async function init() {
        await fetchReqresUsers(); // Cargar usuarios para el login
        updateUserUI(); // Actualizar UI según si hay usuario logueado

        // Cargar productos. renderProductsUI() se llama dentro de fetchProducts si tiene éxito.
        await fetchProducts(); 
        
        // Determinar la página inicial (puedes mejorar esto con routing por hash más robusto)
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash + '-page')) {
            showPage(hash);
        } else {
            showPage(currentUser ? 'home' : 'login');
        }
        
        updateCartUI(); // Actualizar carrito desde localStorage
        updateDetailStockDisplay();
    }

    init();
});
