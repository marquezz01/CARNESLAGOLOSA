

// Encapsulate all application logic within an IIFE (Immediately Invoked Function Expression)
// to avoid polluting the global scope, which is a good practice for modularity.
(function() {
  // --- Data ---
  // Sample product data (can be extended with more items, images, categories, etc.)
  const products = [
    {id:1, name:'Caja de galletas navideñas', price:12000, desc:'Galletas artesanales con decoraciones festivas'},
    {id:2, name:'Set de mug + cocoa', price:25000, desc:'Mug temático y chocolate en polvo premium'},
    {id:3, name:'Tarjeta personalizada', price:6000, desc:'Tarjeta hecha a mano con mensaje'},
    {id:4, name:'Adorno para árbol (pack 3)', price:18000, desc:'Adornos de cerámica pintados a mano'},
    {id:5, name:'Velas aromáticas', price:15000, desc:'Aroma canela y naranja, ideal para ambiente navideño'},
    {id:6, name:'Guirnalda LED', price:22000, desc:'Luces cálidas para decorar tu hogar'},
    {id:7, name:'Calcetín navideño grande', price:10000, desc:'Para colgar en la chimenea o pared'},
    {id:8, name:'Muñeco de nieve decorativo', price:30000, desc:'Figura de mesa con detalles brillantes'},
  ];
  // Cart state (persisted in localStorage for a better user experience across sessions)
  let cart = JSON.parse(localStorage.getItem('tienda_cart') || '{}');
  // --- DOM Elements ---
  // Cache frequently accessed DOM elements for performance
  const productGrid = document.getElementById('productGrid');
  const cartCount = document.getElementById('cartCount');
  const cartPanel = document.getElementById('cartPanel');
  const cartList = document.getElementById('cartList');
  const totalEl = document.getElementById('total');
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort');
  const openCartBtn = document.getElementById('openCart');
  const closeCartBtn = document.getElementById('closeCart');
  const emptyCartBtn = document.getElementById('emptyBtn');
  const clearHeaderCartBtn = document.getElementById('clearBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // --- Utility Functions ---

  /**
   * Formats a number as currency (e.g., 12000 -> $12.000).
   * @param {number} n - The number to format.
   * @returns {string} The formatted currency string.
   */
  function formatMoney(n) {
    return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Escapes HTML special characters in a string to prevent XSS vulnerabilities.
   * @param {string} s - The string to escape.
   * @returns {string} The escaped string.
   */
  function escapeHtml(s) {
    return (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /**
   * Displays a small, temporary alert message at the bottom of the screen.
   * @param {string} text - The message to display.
   */
  function showMiniAlert(text) {
    const alertDiv = document.createElement('div');
    alertDiv.textContent = text;
    alertDiv.style.cssText = `
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 90px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      z-index: 9999;
      opacity: 0; /* Start invisible for fade-in */
      transition: opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(alertDiv);

    // Trigger fade-in
    setTimeout(() => alertDiv.style.opacity = '1', 10);

    // Trigger fade-out and remove after a delay
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      // Remove element after transition ends
      alertDiv.addEventListener('transitionend', () => alertDiv.remove());
    }, 1300);
  }

  // --- Product Rendering ---

  /**
   * Renders the list of products to the product grid.
   * @param {Array<Object>} list - The list of products to render.
   */
  function renderProducts(list) {
    productGrid.innerHTML = ''; // Clear existing products
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="thumb" aria-hidden="true">🎁</div>
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="small">${escapeHtml(p.desc)}</div>
        <div class="meta">
          <div class="price">${formatMoney(p.price)}</div>
          <div>
            <button class="add" data-id="${p.id}" aria-label="Añadir ${escapeHtml(p.name)} al carrito">Añadir</button>
          </div>
        </div>
      `;
      productGrid.appendChild(card);
    });
    attachAddProductListeners();
  }

  /** Attaches event listeners to all 'Añadir' buttons for adding products to the cart. */
  function attachAddProductListeners() {
    document.querySelectorAll('.add').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        addToCart(id);
      });
    });
  }

  // --- Cart Management ---

  /**
   * Adds a product to the cart or increments its quantity if already present.
   * @param {number} id - The ID of the product to add.
   */
  function addToCart(id) {
    const product = products.find(x => x.id === id);
    if (!product) return; // Product not found

    if (!cart[id]) {
      cart[id] = {...product, qty: 0}; // Add new product to cart
    }
    cart[id].qty += 1; // Increment quantity
    persistCart();
    renderCart();
    showMiniAlert(`${escapeHtml(product.name)} agregado`);
  }

  /** Saves the current cart state to localStorage. */
  function persistCart() {
    localStorage.setItem('tienda_cart', JSON.stringify(cart));
  }

  /** Renders the cart contents in the cart panel and updates the total. */
  function renderCart() {
    // Update cart item count in the header badge
    const count = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = count;

    // Render cart list items
    cartList.innerHTML = ''; // Clear existing cart items
    let total = 0;
    Object.values(cart).forEach(item => {
      total += item.qty * item.price;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:700">${escapeHtml(item.name)}</div>
          <div class="small">${item.qty} x ${formatMoney(item.price)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div class="qty">
            <button data-op="minus" data-id="${item.id}" aria-label="Disminuir cantidad de ${escapeHtml(item.name)}">-</button>
            <div class="small">${item.qty}</div>
            <button data-op="plus" data-id="${item.id}" aria-label="Aumentar cantidad de ${escapeHtml(item.name)}">+</button>
          </div>
          <button data-op="remove" data-id="${item.id}" aria-label="Eliminar ${escapeHtml(item.name)} del carrito">Eliminar</button>
        </div>
      `;
      cartList.appendChild(div);
    });
    totalEl.textContent = formatMoney(total);

    attachCartItemListeners();
  }

  /** Attaches event listeners for quantity changes and item removal in the cart panel. */
  function attachCartItemListeners() {
    cartList.querySelectorAll('button[data-op]').forEach(button => {
      button.addEventListener('click', (e) => {
        const op = e.currentTarget.dataset.op;
        const id = parseInt(e.currentTarget.dataset.id);

        if (op === 'plus') {
          cart[id].qty++;
        } else if (op === 'minus') {
          cart[id].qty--;
          if (cart[id].qty <= 0) {
            delete cart[id]; // Remove item if quantity drops to 0 or less
          }
        } else if (op === 'remove') {
          delete cart[id]; // Remove item directly
        }
        persistCart();
        renderCart();
      });
    });
  }

  // --- Event Listeners Setup ---

  /** Initializes all global event listeners for UI controls. */
  function setupEventListeners() {
    // Open/Close cart panel
    openCartBtn.addEventListener('click', () => { cartPanel.style.display = 'block'; });
    closeCartBtn.addEventListener('click', () => { cartPanel.style.display = 'none'; });
    // Empty cart buttons
    emptyCartBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = {};
        persistCart();
        renderCart();
        showMiniAlert('Carrito vaciado');
      }
    });
    clearHeaderCartBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = {};
        persistCart();
        renderCart();
        showMiniAlert('Carrito vaciado');
      }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)
      );
      renderProducts(filteredProducts);
    });

    // Sort functionality
    sortSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      let sortedList = [...products]; // Create a shallow copy to avoid modifying the original 'products' array
      if (value === 'price-asc') sortedList.sort((a, b) => a.price - b.price);
      if (value === 'price-desc') sortedList.sort((a, b) => b.price - a.price);
      renderProducts(sortedList);
    });

    // Checkout process: generate summary and WhatsApp link
    checkoutBtn.addEventListener('click', () => {
      const items = Object.values(cart);
      if (items.length === 0) {
        alert('El carrito está vacío. Por favor, añade algunos productos antes de comprar.');
        return;
      }

      const now = new Date().toLocaleString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });

      // Construct HTML for the summary page
      let htmlContent = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resumen de pedido</title><link rel="stylesheet" href="style.css"></head><body class="checkout-summary">`;
      htmlContent += `<h1>Resumen de pedido — Tienda Navideña</h1><p class="small">Fecha: ${now}</p><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Subtotal</th></tr></thead><tbody>`;
      let total = 0;
      items.forEach(it => {
        const subtotal = it.qty * it.price;
        htmlContent += `<tr><td>${escapeHtml(it.name)}</td><td>${it.qty}</td><td>${formatMoney(it.price)}</td><td>${formatMoney(subtotal)}</td></tr>`;
        total += subtotal;
      });
      htmlContent += `</tbody><tfoot><tr><td colspan="3">Total</td><td>${formatMoney(total)}</td></tr></tfoot></table>`;
      htmlContent += `<p>Gracias por su compra. Para enviar este pedido por WhatsApp haga clic en el botón abajo.</p>`;

      // Construct WhatsApp message
      let waText = `¡Hola! Me gustaría hacer un pedido de la Tienda Navideña:%0A%0A`;
      waText += `*Resumen del Pedido:*%0A`;
      items.forEach(it => {
        waText += `${encodeURIComponent(it.qty + ' x ' + it.name + ' - ' + formatMoney(it.price * it.qty))}%0A`;
      });
      waText += `%0A*Total:* ${encodeURIComponent(formatMoney(total))}%0A`;
      waText += `%0APor favor, confírmame la disponibilidad y los detalles de entrega. ¡Gracias!`;
      const waUrl = 'https://wa.me/573237918080?text=' + waText; // Replace with actual WhatsApp number

      // Open summary in a new window
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(htmlContent + `<p><a id='wa-link' href='${waUrl}' target='_blank' class="button">Enviar pedido por WhatsApp</a></p><p><button id='close-summary-window' class="button">Cerrar Resumen</button></p></body></html>`);
        newWindow.document.close();

        // Add event listener to close button in the new window
        newWindow.document.getElementById('close-summary-window').addEventListener('click', () => newWindow.close());

        // Attempt to open WhatsApp directly (may be blocked by popup blocker)
        // It's often better to let the user click the link in the summary for better UX.
        // setTimeout(() => { window.open(waUrl); }, 300);
      } else {
        alert('Por favor, permite las ventanas emergentes para ver el resumen de tu pedido y enviar por WhatsApp.');
        window.open(waUrl); // Fallback: try to open WhatsApp directly if popup is blocked
      }
    });
  }

  // --- Initialization ---
  /** Initializes the application by rendering products, cart, and setting up event listeners. */
  function init() {
    renderProducts(products);
    renderCart();
    setupEventListeners();
  }

  // Run initialization when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', init);
})();