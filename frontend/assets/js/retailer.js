// ===========================
// COMPLETE FIXED retailer.js
// ===========================
let currentUser = JSON.parse(localStorage.getItem("agroChainUser"));
let allProducts = [];
let cartItems = JSON.parse(localStorage.getItem("retailerCart")) || [];
let orders = JSON.parse(localStorage.getItem("retailerOrders")) || [];

// ✅ Requirement 2: Form Validation
if (!currentUser || currentUser.role !== "retailer") {
  alert("Please login as Retailer");
  window.location.href = "login.html";
}

// Sidebar navigation
const sections = document.querySelectorAll(".section");
const buttons = document.querySelectorAll(".sidebar button");

function showSection(section, button) {
  sections.forEach(s => s.classList.remove("active"));
  buttons.forEach(b => b.classList.remove("active"));
  section.classList.add("active");
  button.classList.add("active");
}

const browseBtn = document.getElementById("browseBtn");
const cartBtn = document.getElementById("cartBtn");
const ordersBtn = document.getElementById("ordersBtn");
const profileBtn = document.getElementById("profileBtn");
const signoutBtn = document.getElementById("signoutBtn");

browseBtn.onclick = () => { showSection(browseSection, browseBtn); loadProducts(); };
cartBtn.onclick = () => { showSection(cartSection, cartBtn); loadCart(); };
ordersBtn.onclick = () => { showSection(ordersSection, ordersBtn); loadOrders(); };
profileBtn.onclick = () => { showSection(profileSection, profileBtn); loadProfile(); };
signoutBtn.onclick = () => { localStorage.clear(); window.location.href = "login.html"; };

// ✅ Requirement 4: Async Data Handling with Fetch API
async function loadProducts() {
  const grid = document.getElementById("productsGrid");
  
  // ✅ Requirement 3: Dynamic HTML - Loading state
  grid.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 48px;">⏳</div>
      <p style="color: #6b7280; margin-top: 10px;">Loading products...</p>
    </div>
  `;

  try {
    const res = await fetch("http://localhost:3000/api/retailer/all-dealer-products");
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.msg || "Error fetching products");
    
    allProducts = data;
    displayProducts(data);
    
  } catch (err) {
    // ✅ Requirement 3: Dynamic HTML - Error state
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 48px; color: #ef4444;">⚠️</div>
        <h3 style="color: #dc2626; margin-top: 10px;">Error Loading Products</h3>
        <p style="color: #6b7280;">${err.message}</p>
        <button class="btn-primary" onclick="loadProducts()" style="margin-top: 20px;">
          🔄 Retry
        </button>
      </div>
    `;
  }
}

// ✅ Requirement 3: Dynamic HTML Implementation
function displayProducts(products) {
  const grid = document.getElementById("productsGrid");
  
  if (!products.length) {
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
        <div style="font-size: 64px;">📦</div>
        <h3 style="color: #374151; margin-top: 15px;">No Products Available</h3>
        <p style="color: #6b7280;">Check back later for dealer inventory</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card" data-product-id="${p._id}">
      <img src="${p.imageUrl}" alt="${p.productName}" class="product-image" 
           onerror="this.src='https://via.placeholder.com/270x180?text=No+Image'">
      <h3>${p.productName}</h3>
      <p>Type: ${p.productType}</p>
      <p><strong>Dealer:</strong> ${p.dealerName || "N/A"}</p>
      <p style="color: #059669; font-weight: bold;">₹${p.unitPrice} per ${p.unitOfSale}</p>
      <p><strong>Available:</strong> ${p.quantity} ${p.unitOfSale}</p>
      
      <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
        <input 
          id="qty-${p._id}" 
          type="number" 
          placeholder="Qty" 
          min="1" 
          max="${p.quantity}" 
          step="0.01"
          style="width:80px; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;"
          oninput="validateRetailerQuantity('${p._id}', ${p.quantity})">
        <button class="btn-primary" onclick="addToCart('${p._id}')">Add to Cart</button>
      </div>
      
      <div id="qty-error-${p._id}" style="color: #ef4444; font-size: 12px; margin-top: 5px; display: none;"></div>
    </div>
  `).join("");
}

// ✅ Requirement 2: Form Validation using DOM
function validateRetailerQuantity(productId, maxQuantity) {
  const input = document.getElementById(`qty-${productId}`);
  const errorDiv = document.getElementById(`qty-error-${productId}`);
  const value = parseFloat(input.value);

  // Clear previous errors
  errorDiv.style.display = 'none';
  input.style.borderColor = '#d1d5db';

  // Validation checks
  if (isNaN(value) || value === '') {
    return; // Allow empty for user to type
  }

  if (value <= 0) {
    input.value = 1;
    errorDiv.textContent = '⚠️ Quantity must be at least 1';
    errorDiv.style.display = 'block';
    input.style.borderColor = '#ef4444';
    setTimeout(() => {
      errorDiv.style.display = 'none';
      input.style.borderColor = '#d1d5db';
    }, 3000);
    return;
  }

  if (value > maxQuantity) {
    input.value = maxQuantity;
    errorDiv.textContent = `⚠️ Maximum available: ${maxQuantity}`;
    errorDiv.style.display = 'block';
    input.style.borderColor = '#f59e0b';
    setTimeout(() => {
      errorDiv.style.display = 'none';
      input.style.borderColor = '#d1d5db';
    }, 3000);
    return;
  }

  // Valid input
  input.style.borderColor = '#10b981';
}

function applyFilters() {
  const type = document.getElementById("filterProductType").value;
  const variety = document.getElementById("filterVariety").value.toLowerCase();
  const maxPrice = parseFloat(document.getElementById("filterPrice").value) || Infinity;
  
  const filtered = allProducts.filter(p =>
    (!type || p.productType === type) &&
    (!variety || p.productName.toLowerCase().includes(variety)) &&
    p.unitPrice <= maxPrice
  );
  
  displayProducts(filtered);
}

// ✅ Requirement 2: Cart Validation
function addToCart(id) {
  const p = allProducts.find(x => x._id === id);
  const qtyInput = document.getElementById(`qty-${id}`);
  const qty = parseFloat(qtyInput.value);
  
  // Validation
  if (!p) {
    alert("❌ Product not found");
    return;
  }
  
  if (!qty || isNaN(qty) || qty <= 0) {
    alert("❌ Please enter a valid quantity");
    qtyInput.focus();
    qtyInput.style.borderColor = '#ef4444';
    return;
  }
  
  if (qty > p.quantity) {
    alert(`❌ Only ${p.quantity} ${p.unitOfSale} available`);
    qtyInput.value = p.quantity;
    return;
  }

  // Check if already in cart
  const existing = cartItems.find(item => item._id === id);
  if (existing) {
    const totalQty = existing.quantity + qty;
    if (totalQty > p.quantity) {
      alert(`❌ Total quantity (${totalQty}) exceeds stock (${p.quantity})`);
      return;
    }
    existing.quantity = totalQty;
  } else {
    cartItems.push({ ...p, quantity: qty });
  }

  localStorage.setItem("retailerCart", JSON.stringify(cartItems));
  
  // ✅ Requirement 3: Dynamic feedback
  const btn = qtyInput.nextElementSibling;
  const originalText = btn.textContent;
  btn.textContent = "✓ Added!";
  btn.style.background = "#059669";
  qtyInput.value = '';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = "#10b981";
  }, 2000);
}

// ✅ Requirement 3: Dynamic HTML in Cart
function loadCart() {
  const grid = document.getElementById("cartGrid");
  
  if (!cartItems.length) {
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
        <div style="font-size: 64px;">🛒</div>
        <h3 style="color: #374151; margin-top: 15px;">Your Cart is Empty</h3>
        <p style="color: #6b7280;">Add items from Browse Products</p>
      </div>
    `;
    return;
  }

  const totalValue = cartItems.reduce((sum, item) => 
    sum + (item.unitPrice * item.quantity), 0
  );

  grid.innerHTML = `
    <div style="grid-column: 1/-1; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0;">Cart Summary</h3>
      <p style="margin: 5px 0;"><strong>Total Items:</strong> ${cartItems.length}</p>
      <p style="margin: 5px 0; color: #059669; font-size: 20px;"><strong>Total Value:</strong> ₹${totalValue.toFixed(2)}</p>
    </div>
  ` + cartItems.map(i => `
    <div class="order-item">
      <img src="${i.imageUrl}" class="product-image" 
           onerror="this.src='https://via.placeholder.com/150'">
      <h4>${i.productName}</h4>
      <p>${i.productType}</p>
      <p>₹${i.unitPrice} per ${i.unitOfSale}</p>
      <p><strong>Qty:</strong> ${i.quantity}</p>
      <p style="color: #059669; font-weight: bold;">Subtotal: ₹${(i.unitPrice * i.quantity).toFixed(2)}</p>
      <button class="btn-remove" onclick="removeFromCart('${i._id}')">Remove</button>
      <button class="btn-primary" onclick="placeOrder('${i._id}')">Order Now</button>
    </div>
  `).join("");
}

function removeFromCart(id) {
  const item = cartItems.find(i => i._id === id);
  if (!item) return;
  
  if (confirm(`Remove ${item.productName} from cart?`)) {
    cartItems = cartItems.filter(i => i._id !== id);
    localStorage.setItem("retailerCart", JSON.stringify(cartItems));
    loadCart();
  }
}

// ✅ Requirement 4: Async Order Placement
async function placeOrder(id) {
  const item = cartItems.find(i => i._id === id);
  if (!item) return;
  
  const newOrder = {
    ...item,
    orderId: "ORD-" + Date.now(),
    status: "Placed",
    orderDate: new Date().toISOString()
  };
  
  orders.push(newOrder);
  localStorage.setItem("retailerOrders", JSON.stringify(orders));
  removeFromCart(id);
  
  // ✅ Dynamic success message
  const grid = document.getElementById("cartGrid");
  const successMsg = document.createElement('div');
  successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999;';
  successMsg.textContent = `✓ Order placed for ${item.productName}`;
  document.body.appendChild(successMsg);
  
  setTimeout(() => successMsg.remove(), 3000);
  
  loadOrders();
}

function loadOrders() {
  const grid = document.getElementById("ordersGrid");
  
  if (!orders.length) {
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
        <div style="font-size: 64px;">📦</div>
        <h3 style="color: #374151; margin-top: 15px;">No Orders Yet</h3>
        <p style="color: #6b7280;">Your orders will appear here</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = orders.map(o => `
    <div class="order-item">
      <img src="${o.imageUrl}" class="product-image" 
           onerror="this.src='https://via.placeholder.com/150'">
      <h4>${o.productName}</h4>
      <p>${o.productType}</p>
      <p><strong>Qty:</strong> ${o.quantity} ${o.unitOfSale}</p>
      <p><strong>Status:</strong> <span style="color: #10b981;">${o.status}</span></p>
      <p><strong>Order ID:</strong> ${o.orderId}</p>
      <p style="font-size: 12px; color: #6b7280;">${new Date(o.orderDate).toLocaleDateString()}</p>
    </div>
  `).join("");
}

// ✅ Requirement 4: Async Profile Loading
async function loadProfile() {
  const profileDiv = document.getElementById("profileInfo");
  
  profileDiv.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 32px;">⏳</div>
      <p>Loading profile...</p>
    </div>
  `;
  
  try {
    const res = await fetch(`http://localhost:3000/api/auth/profile/${currentUser.email}`);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.msg || "Failed to load profile");
    
    profileDiv.innerHTML = `
      <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="margin-top: 0; color: #1f2937;">Profile Information</h2>
        <div style="display: grid; gap: 15px;">
          <div style="padding: 10px; background: #f9fafb; border-radius: 6px;">
            <strong style="color: #6b7280;">Name:</strong>
            <p style="margin: 5px 0;">${data.firstName} ${data.lastName || ''}</p>
          </div>
          <div style="padding: 10px; background: #f9fafb; border-radius: 6px;">
            <strong style="color: #6b7280;">Email:</strong>
            <p style="margin: 5px 0;">${data.email}</p>
          </div>
          <div style="padding: 10px; background: #f9fafb; border-radius: 6px;">
            <strong style="color: #6b7280;">Mobile:</strong>
            <p style="margin: 5px 0;">${data.mobile}</p>
          </div>
          <div style="padding: 10px; background: #f9fafb; border-radius: 6px;">
            <strong style="color: #6b7280;">Shop Name:</strong>
            <p style="margin: 5px 0;">${data.shopName || "N/A"}</p>
          </div>
          <div style="padding: 10px; background: #f9fafb; border-radius: 6px;">
            <strong style="color: #6b7280;">Address:</strong>
            <p style="margin: 5px 0;">${data.shopAddress || "N/A"}</p>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    profileDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #dc2626;">
        <div style="font-size: 32px;">⚠️</div>
        <p>${err.message}</p>
        <button class="btn-primary" onclick="loadProfile()">Retry</button>
      </div>
    `;
  }
}

// ✅ Auto-refresh products every 30 seconds
setInterval(() => {
  if (browseSection.classList.contains('active')) {
    loadProducts();
  }
}, 30000);