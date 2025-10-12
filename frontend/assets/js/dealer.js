// ===========================
// GLOBAL VARIABLES
// ===========================
let currentUser = JSON.parse(localStorage.getItem("agroChainUser"));
let allProducts = [];
let allVehicles = [];
let selectedOrderId = null;
let cartItems = JSON.parse(localStorage.getItem("dealerCart")) || [];
let orderItems = JSON.parse(localStorage.getItem("dealerOrders")) || [];
let selectedProductId = null;
let selectedFarmerEmail = null;
let currentBidOrderId = null;
let currentReviewProductId = null;
let currentReviewOrderId = null;
let inventory = [];

// ===========================
// AUTHENTICATION CHECK
// ===========================
if (!currentUser || currentUser.role !== 'dealer') {
  alert("Access denied. Please login as dealer.");
  window.location.href = "login.html";
}


// Profile dropdown toggle
document.getElementById('profileBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  const menu = document.getElementById('profileMenu');
  menu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', function() {
  const menu = document.getElementById('profileMenu');
  if (menu.classList.contains('show')) {
    menu.classList.remove('show');
  }
});

document.getElementById('navBrowseBtn').addEventListener('click', function() {
  showSection(document.getElementById('browseSection'), this);
  showSidebar();  // Show filters for browse section
  updateNavButtons(this);
  loadProducts();
});

// NEW: Navbar navigation handlers (replacing old sidebar buttons)
document.getElementById('navInventoryBtn').addEventListener('click', function() {
  showSection(document.getElementById('inventorySection'), this);
  hideSidebar();
  updateNavButtons(this);
  loadInventory();
});

document.getElementById('navOrdersBtn').addEventListener('click', function() {
  showSection(document.getElementById('ordersSection'), this);
  hideSidebar();
  updateNavButtons(this);
  loadOrders();
});

document.getElementById('navVehiclesBtn').addEventListener('click', function() {
  showSection(document.getElementById('vehiclesSection'), this);
  hideSidebar();
  updateNavButtons(this);
  loadVehicles();
});

document.getElementById('navRetailerOrdersBtn').addEventListener('click', function() {
  showSection(document.getElementById('retailerOrdersSection'), this);
  hideSidebar();
  updateNavButtons(this);
  loadRetailerOrders();
});

document.getElementById('navCartBtn').addEventListener('click', function() {
  showSection(document.getElementById('cartSection'), this);
  hideSidebar();
  updateNavButtons(null);
  loadCart();
});

document.getElementById('viewProfileBtn').addEventListener('click', function() {
  showSection(document.getElementById('profileSection'), this);
  hideSidebar();
  updateNavButtons(null);
  loadProfile();
  document.getElementById('profileMenu').classList.remove('show');
});

// NEW: Helper function to show/hide sidebar
function hideSidebar() {
  const sidebar = document.getElementById('sidebarFilters');
  if (sidebar) {
    sidebar.style.display = 'none';
  }
  document.body.classList.add('sidebar-hidden');
  document.body.classList.remove('sidebar-visible');
}

function showSidebar() {
  const sidebar = document.getElementById('sidebarFilters');
  if (sidebar) {
    sidebar.style.display = 'block';
  }
  document.body.classList.add('sidebar-visible');
  document.body.classList.remove('sidebar-hidden');
}


// NEW: Helper function to update active nav buttons
function updateNavButtons(activeBtn) {
  const navButtons = document.querySelectorAll('.navbar-center button');
  navButtons.forEach(btn => btn.classList.remove('active'));
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// NEW: Update cart badge count
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  const count = cartItems ? cartItems.length : 0;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}


// ===========================
// SIDEBAR NAVIGATION
// ===========================
const sections = document.querySelectorAll(".section");
const buttons = document.querySelectorAll(".sidebar button");

function showSection(sectionToShow, activeBtn) {
  const sections = document.querySelectorAll(".section");
  sections.forEach(s => s.classList.remove("active"));
  sectionToShow.classList.add("active");
  
  // Show sidebar only for browse section
  if (sectionToShow.id === 'browseSection') {
    showSidebar();
  } else {
    hideSidebar();
  }
}

function generateUniqueOrderId() {
  return 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// ===========================
// VEHICLE MANAGEMENT
// ===========================

// Async Function

document.getElementById('vehicleForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const vehicleData = {
    vehicleId: document.getElementById('vehicleId').value,
    vehicleType: document.getElementById('vehicleType').value,
    temperatureCapacity: document.getElementById('temperatureCapacity').value,
    currentStatus: 'AVAILABLE',
    dealerEmail: currentUser.email
  };

  try {
    const response = await fetch(`http://localhost:3000/api/dealer/vehicles/${currentUser.email}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData)
    });

    const data = await response.json();

    if (response.ok) {
      showMessage('vehicleMessage', 'Vehicle added successfully!', 'success');
      document.getElementById('vehicleForm').reset();
      loadVehicles();
    } else {
      showMessage('vehicleMessage', data.msg || 'Error adding vehicle', 'error');
    }
  } catch (error) {
    showMessage('vehicleMessage', 'Network error. Please try again.', 'error');
  }
});


// Async Function

async function loadVehicles() {
  try {
    const response = await fetch(`http://localhost:3000/api/dealer/vehicles/${currentUser.email}`);
    const vehicles = await response.json();

    const vehiclesGrid = document.getElementById('vehiclesGrid');

    if (response.ok && vehicles.length > 0) {
      allVehicles = vehicles;
      vehiclesGrid.innerHTML = vehicles.map(vehicle => createVehicleCard(vehicle)).join('');
    } else {
      vehiclesGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚛</div>
          <h3>No Vehicles Added</h3>
          <p>Add your first vehicle to start managing logistics</p>
        </div>
      `;
    }
  } catch (error) {
    vehiclesGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error Loading Vehicles</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

function createVehicleCard(vehicle) {
  const statusClass = `vehicle-${vehicle.currentStatus.toLowerCase().replace(' ', '-')}`;
  const statusBadgeClass = `status-${vehicle.currentStatus.toLowerCase().replace(' ', '-')}-vehicle`;

  const actionButtons = vehicle.currentStatus !== 'AVAILABLE' ? `
    <div style="display: flex; gap: 10px; margin-top: 10px;">
      <button class="btn-free" onclick="freeVehicle('${vehicle._id}')">
        ✓ Free Vehicle
      </button>
      <button class="btn-delete" onclick="deleteVehicle('${vehicle._id}')">
        🗑️ Delete
      </button>
    </div>
  ` : `
    <div style="display: flex; gap: 10px; margin-top: 10px;">
      <button class="btn-delete" onclick="deleteVehicle('${vehicle._id}')">
        🗑️ Delete
      </button>
    </div>
  `;

  return `
    <div class="vehicle-card ${statusClass}">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #1f2937;">${vehicle.vehicleId}</h3>
        <span class="vehicle-status ${statusBadgeClass}">${vehicle.currentStatus}</span>
      </div>
      <div class="product-details">
        <div class="product-detail-item">
          <div class="product-detail-label">Type</div>
          <div class="product-detail-value">${vehicle.vehicleType}</div>
        </div>
        <div class="product-detail-item">
          <div class="product-detail-label">Temperature</div>
          <div class="product-detail-value">${vehicle.temperatureCapacity}</div>
        </div>
      </div>
      ${vehicle.assignedTo ? `
        <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 6px;">
          <strong>Assigned to:</strong> ${vehicle.assignedTo.productName}<br>
          <strong>Farmer:</strong> ${vehicle.assignedTo.farmerName}
        </div>
      ` : ''}
      ${actionButtons}
    </div>
  `;
}

// Async Function

async function freeVehicle(vehicleId) {
  if (!confirm('Are you sure you want to free this vehicle? The order will be cancelled.')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/dealer/vehicles/free/${currentUser.email}/${vehicleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (response.ok) {
      alert('✓ Vehicle freed successfully!');
      loadVehicles();
    } else {
      alert('✗ Error: ' + (result.msg || 'Failed to free vehicle'));
    }
  } catch (error) {
    console.error('Error freeing vehicle:', error);
    alert('Network error. Please try again.');
  }
}

// Async Function

async function deleteVehicle(vehicleId) {
  if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/dealer/vehicles/${currentUser.email}/${vehicleId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (response.ok) {
      alert('✓ Vehicle deleted successfully!');
      loadVehicles();
    } else {
      alert('✗ Error: ' + (result.msg || 'Failed to delete vehicle'));
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    alert('Network error. Please try again.');
  }
}

// ===========================
// BROWSE PRODUCTS
// ===========================

// Async Function

async function loadProducts() {
  const productsGrid = document.getElementById("productsGrid");
  const browseMessage = document.getElementById("browseMessage");
  productsGrid.innerHTML = `<p>Loading products...</p>`;

  try {
    const response = await fetch("http://localhost:3000/api/dealer/all-products");
    const data = await response.json();

    if (!response.ok) {
      browseMessage.innerHTML = `<p style="color:red;">Error loading products</p>`;
      return;
    }

    if (!data || data.length === 0) {
      productsGrid.innerHTML = `<p>No products available.</p>`;
      return;
    }

    allProducts = data;
    displayProducts(allProducts);

  } catch (error) {
    console.error("Error loading products:", error);
    browseMessage.innerHTML = `<p style="color:red;">Network error loading products</p>`;
  }
}

function displayProducts(products) {
  const productsGrid = document.getElementById('productsGrid');

  const availableProducts = products.filter(p => p.harvestQuantity > 0);

  if (availableProducts.length === 0) {
    productsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌾</div>
        <h3>No Products Available</h3>
        <p>All products are currently out of stock. Check back later!</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = availableProducts.map(product => createProductCard(product)).join('');
}

// ===========================
// QUANTITY VALIDATION FUNCTION
// ===========================
function validateQuantity(productId, maxQuantity) {
  const input = document.getElementById(`qty-${productId}`);
  const errorDiv = document.getElementById(`qty-error-${productId}`);
  const value = parseFloat(input.value);

  if (value > maxQuantity) {
    input.value = maxQuantity;
    errorDiv.textContent = `⚠️ Maximum available: ${maxQuantity}`;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  } else if (value < 0) {
    input.value = 0;
  } else {
    errorDiv.style.display = 'none';
  }
}

function createProductCard(product) {
  if (product.harvestQuantity <= 0) {
    return '';
  }

  let reviewsHTML = '';
  if (product.reviews && product.reviews.length > 0) {
    reviewsHTML = `
      <div class="product-reviews">
        <h4 style="font-size: 14px; margin: 10px 0 5px 0; color: #374151;">⭐ Reviews (${product.reviews.length})</h4>
        ${product.reviews.slice(0, 2).map(review => `
          <div class="review-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="review-quality">${review.quality}</span>
              <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
            </div>
            <p class="review-comment">${review.comments}</p>
            <small class="review-dealer">By: ${review.dealerEmail}</small>
          </div>
        `).join('')}
        ${product.reviews.length > 2 ? `<small style="color: #6b7280;">+${product.reviews.length - 2} more reviews</small>` : ''}
      </div>
    `;
  }

  return `
    <div class="product-card" data-product-id="${product._id}">
      <img src="${product.imageUrl}" alt="${product.varietySpecies}" class="product-image">

      <div class="product-content">
        <div class="product-header">
          <div class="product-title">
            <h3>${product.varietySpecies}</h3>
            <span class="product-type">${product.productType}</span>
          </div>
        </div>

        <div class="product-details">
          <div class="product-detail-item">
            <div class="product-detail-label">Available Stock</div>
            <div class="product-detail-value" style="color: ${product.harvestQuantity < 10 ? '#ef4444' : '#059669'}; font-weight: 600;">
              ${product.harvestQuantity} ${product.unitOfSale}
            </div>
          </div>
          <div class="product-detail-item">
            <div class="product-detail-label">Price</div>
            <div class="product-detail-value">₹${product.targetPrice} per ${product.unitOfSale}</div>
          </div>
        </div>

        ${reviewsHTML}

        <div class="product-actions">
          <button class="btn-secondary" onclick="showFarmerDetails('${product.farmerEmail}')">
            View Farmer Details
          </button>
        </div>

        <div class="order-now-box">
          <input
            type="number"
            id="qty-${product._id}"
            placeholder="Qty"
            min="1"
            max="${product.harvestQuantity}"
            step="0.01"
            style="width:80px;"
            oninput="validateQuantity('${product._id}', ${product.harvestQuantity})">
          <button class="btn-primary" onclick="addToCart('${product._id}')">🛒 Add to Cart</button>
        </div>
        <div id="qty-error-${product._id}" style="color: #ef4444; font-size: 12px; margin-top: 5px; display: none;"></div>
      </div>
    </div>`;
}

function applyFilters() {
  const productType = document.getElementById('filterProductType').value;
  const variety = document.getElementById('filterVariety').value.toLowerCase();
  const maxPrice = parseFloat(document.getElementById('filterPrice').value) || Infinity;

  const filtered = allProducts.filter(product => {
    return (!productType || product.productType === productType) &&
           (!variety || product.varietySpecies.toLowerCase().includes(variety)) &&
           (product.targetPrice <= maxPrice)
  });

  displayProducts(filtered);
}

// ===========================
// FARMER DETAILS MODAL
// ===========================

// Async Function

async function showFarmerDetails(email) {
  const modal = document.getElementById('farmerModal');
  const profileDiv = document.getElementById('farmerProfileDetails');
  profileDiv.innerHTML = `<p>Loading farmer details...</p>`;
  modal.style.display = 'block';

  try {
    const response = await fetch(`http://localhost:3000/api/farmer/profile/${email}`);
    const data = await response.json();

    if (response.ok) {
      profileDiv.innerHTML = `
        <p><b>Name:</b> ${data.firstName} ${data.lastName || ""}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Mobile:</b> ${data.mobile || "N/A"}</p>
        <p><b>Farm Location:</b> ${data.farmLocation || "N/A"}</p>
        <p><b>Latitude:</b> ${data.latitude || "N/A"}</p>
        <p><b>Longitude:</b> ${data.longitude || "N/A"}</p>
        <p><b>Farm Size:</b> ${data.farmSize || "N/A"}</p>
      `;
    } else {
      profileDiv.innerHTML = `<p style="color:red;">Failed to load farmer details: ${data.msg || "Unknown error"}</p>`;
    }
  } catch (error) {
    console.error("Error loading farmer details:", error);
    profileDiv.innerHTML = `<p style="color:red;">Network error loading farmer details.</p>`;
  }
}

const modal = document.getElementById('farmerModal');
const closeBtn = document.getElementById('closeFarmerModal');

closeBtn.onclick = () => {
  modal.style.display = 'none';
};

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
};

// ===========================
// ORDER PLACEMENT
// ===========================

function placeOrder(productId) {
  const qty = parseFloat(document.getElementById(`qty-${productId}`).value);

  if (!qty || qty <= 0) {
    alert('Enter valid quantity');
    return;
  }

  const product = allProducts.find(p => p._id === productId);
  if (!product) return;

  const newOrder = {
    ...product,
    quantity: qty,
    orderId: generateUniqueOrderId(),
    vehicleAssigned: false,
    reviewSubmitted: false,
    bidPlaced: false,
    bidStatus: null
  };

  orderItems.push(newOrder);
  localStorage.setItem("dealerOrders", JSON.stringify(orderItems));
  alert("✅ Product successfully added to My Orders");
}

function loadOrders() {
  const ordersGrid = document.getElementById("ordersGrid");

  if (!orderItems || orderItems.length === 0) {
    ordersGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Place your first order to get started</p>
      </div>`;
    return;
  }

  ordersGrid.innerHTML = orderItems.map(item => {
    console.log('Order item:', item);

    let actionButtons = '';

    if (item.bidStatus === 'Accepted') {
      actionButtons = `
        <span class="bid-accepted">✓ Bid Accepted</span>
        <button class="btn-receipt" onclick="viewReceipt('${item.orderId}')">📄 View Receipt</button>
      `;
    } else if (item.bidStatus === 'Rejected') {
      actionButtons = `<span class="bid-rejected">✗ Bid Cancelled</span>`;
    } else if (item.bidPlaced) {
      actionButtons = `<span class="bid-pending">⏳ Bid Pending</span>`;
    } else if (item.vehicleAssigned && !item.reviewSubmitted) {
      actionButtons = `<button class="btn-review" onclick="openReviewModal('${item._id}', '${item.varietySpecies}', '${item.orderId}')">⭐ Add Review</button>`;
    } else if (item.vehicleAssigned && item.reviewSubmitted && !item.bidPlaced) {
      if (item.orderId) {
        actionButtons = `<button class="btn-bid" onclick="openBidModal('${item._id}', '${item.varietySpecies}', ${item.targetPrice}, '${item.unitOfSale}', '${item.orderId}')">💰 Place Bid</button>`;
      } else {
        actionButtons = `<span style="color: #dc2626;">Error: Order ID missing</span>`;
        console.error('Order item missing orderId:', item);
      }
    } else {
      if (item.orderId) {
        actionButtons = `<button class="btn-assign" onclick="openAssignVehicleModal('${item._id}', '${item.farmerEmail}', '${item.orderId}')">Assign Vehicle</button>`;
      } else {
        actionButtons = `<span style="color: #dc2626;">Error: Order ID missing</span>`;
        console.error('Order item missing orderId:', item);
      }
    }

    return `
      <div class="order-item">
        <img src="${item.imageUrl}" alt="${item.varietySpecies}" class="order-image">
        <div class="order-info">
          <h4>${item.varietySpecies}</h4>
          <p>${item.productType}</p>
          <p>₹${item.targetPrice} per ${item.unitOfSale}</p>
          <p><b>Quantity:</b> ${item.quantity}</p>
          ${item.orderId ? `<p style="font-size: 12px; color: #6b7280;"><b>Order ID:</b> ${item.orderId.substring(0, 8)}...</p>` : ''}
          ${item.bidPrice ? `<p><b>Your Bid:</b> ₹${item.bidPrice} per ${item.unitOfSale}</p>` : ''}
          ${item.reviewSubmitted ? `<p style="color: #10b981; font-size: 12px;">✓ Review Submitted</p>` : ''}
        </div>
        <div class="order-actions">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(productId) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const qty = parseFloat(qtyInput.value);

  if (!qty || qty <= 0) {
    alert("⌛ Please enter a valid quantity");
    return;
  }

  const product = allProducts.find(p => p._id === productId);
  if (!product) {
    alert("⌛ Product not found");
    return;
  }

  if (qty > product.harvestQuantity) {
    alert(`⌛ Only ${product.harvestQuantity} ${product.unitOfSale} available in stock`);
    qtyInput.value = product.harvestQuantity;
    return;
  }

  const existing = cartItems.find(item => item._id === productId);
  if (existing) {
    const totalQty = existing.quantity + qty;
    if (totalQty > product.harvestQuantity) {
      alert(`⌛ Total quantity (${totalQty}) exceeds available stock (${product.harvestQuantity})`);
      return;
    }
    existing.quantity = totalQty;
  } else {
    cartItems.push({ ...product, quantity: qty });
  }

  localStorage.setItem("dealerCart", JSON.stringify(cartItems));
  alert("✅ Product added to cart!");
  qtyInput.value = '';

  updateCartBadge();
}

function loadCart() {
  const cartGrid = document.getElementById("cartGrid");

  if (cartItems.length === 0) {
    cartGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your Cart is Empty</h3>
        <p>Add items from Browse Products</p>
      </div>`;
    return;
  }

  cartGrid.innerHTML = cartItems.map(item => `
    <div class="order-item">
      <img src="${item.imageUrl}" alt="${item.varietySpecies}" class="order-image">
      <div class="order-info">
        <h4>${item.varietySpecies}</h4>
        <p>${item.productType}</p>
        <p>₹${item.targetPrice} per ${item.unitOfSale}</p>
        <p><b>Quantity:</b> ${item.quantity}</p>
      </div>
      <div class="order-actions">
        <button class="btn-remove" onclick="removeFromCart('${item._id}')">⌛ Remove</button>
        <button class="btn-primary" onclick="orderFromCart('${item._id}')">📦 Order Now</button>
      </div>
    </div>
  `).join('');
}

function removeFromCart(productId) {
  cartItems = cartItems.filter(item => item._id !== productId);
  localStorage.setItem("dealerCart", JSON.stringify(cartItems));
  loadCart();
  updateCartBadge(); 
}

function orderFromCart(productId) {
  const cartProduct = cartItems.find(i => i._id === productId);
  if (!cartProduct) {
    alert("⌛ Product not found in cart");
    return;
  }

  const currentProduct = allProducts.find(p => p._id === productId);
  if (!currentProduct) {
    alert("⌛ Product no longer available");
    removeFromCart(productId);
    return;
  }

  if (cartProduct.quantity > currentProduct.harvestQuantity) {
    alert(`⌛ Only ${currentProduct.harvestQuantity} available. Cart has ${cartProduct.quantity}.`);
    return;
  }

  const newOrder = {
    ...currentProduct,
    quantity: cartProduct.quantity,
    orderId: generateUniqueOrderId(),
    vehicleAssigned: false,
    reviewSubmitted: false,
    bidPlaced: false,
    bidStatus: null
  };

  orderItems.push(newOrder);
  localStorage.setItem("dealerOrders", JSON.stringify(orderItems));
  alert("✅ Order placed successfully!");
  removeFromCart(productId);

  if (ordersSection.classList.contains('active')) {
    loadOrders();
  }

  updateCartBadge();
}

// ===========================
// VEHICLE ASSIGNMENT
// ===========================

async function openAssignVehicleModal(productId, farmerEmail, orderId) {
  selectedProductId = productId;
  selectedFarmerEmail = farmerEmail;
  selectedOrderId = orderId;

  const modal = document.getElementById("assignVehicleModal");
  modal.style.display = "block";

  const response = await fetch(`http://localhost:3000/api/dealer/vehicles/${currentUser.email}`);
  let vehicles = [];

  if (response.ok) {
    vehicles = await response.json();
    if (!Array.isArray(vehicles)) vehicles = [];
  }

  const select = document.getElementById("vehicleSelect");
  if (vehicles.length === 0) {
    select.innerHTML = `<option value="">No available vehicles</option>`;
  } else {
    select.innerHTML = vehicles
      .filter(v => v.currentStatus === "AVAILABLE")
      .map(v => `<option value="${v._id}">${v.vehicleType} - ${v.vehicleId}</option>`)
      .join('');
  }
}

function closeAssignVehicleModal() {
  document.getElementById("assignVehicleModal").style.display = "none";
}

// Async Function

async function confirmAssignVehicle() {
  const vehicleId = document.getElementById("vehicleSelect").value;
  const tentativeDate = document.getElementById("tentativeDate").value;

  if (!vehicleId || !tentativeDate) {
    alert("Please select vehicle and tentative date!");
    return;
  }

  if (!selectedOrderId) {
    alert("Error: Order ID is missing. Please refresh and try again.");
    console.error("selectedOrderId is null");
    return;
  }

  const orderItem = orderItems.find(i => i.orderId === selectedOrderId);

  if (!orderItem) {
    alert("Error: Order not found. Please refresh and try again.");
    console.error("Order not found for orderId:", selectedOrderId);
    console.log("Available orders:", orderItems);
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/dealer/assign-vehicle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealerEmail: currentUser.email,
        productId: selectedProductId,
        farmerEmail: selectedFarmerEmail,
        vehicleId,
        quantity: orderItem.quantity,
        tentativeDate
      })
    });

    const result = await response.json();

    if (response.ok) {
      alert("✅ Vehicle Assigned Successfully!");

      orderItem.vehicleAssigned = true;
      orderItem.serverOrderId = result.orderId;

      localStorage.setItem("dealerOrders", JSON.stringify(orderItems));

      closeAssignVehicleModal();
      loadOrders();
      loadVehicles();
    } else {
      alert("⌛ Error assigning vehicle: " + result.msg);
    }
  } catch (error) {
    console.error("Error in confirmAssignVehicle:", error);
    alert("Network error. Please try again.");
  }
}

// ===========================
// PRODUCT REVIEW
// ===========================

function openReviewModal(productId, productName, orderId) {
  currentReviewProductId = productId;
  currentReviewOrderId = orderId;

  document.getElementById('reviewModalTitle').textContent = `Review: ${productName}`;
  document.getElementById('reviewModal').style.display = 'block';

  console.log('Review modal opened for:', { productId, orderId });
}

function closeReviewModal() {
  document.getElementById('reviewModal').style.display = 'none';
  document.getElementById('reviewForm').reset();
  currentReviewProductId = null;
  currentReviewOrderId = null;
}

// Async Function

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const quality = document.getElementById('reviewQuality').value;
  const comments = document.getElementById('reviewComments').value;
  const rating = parseInt(document.getElementById('reviewRating').value);

  if (!quality || !comments || !rating) {
    alert('Please complete all fields');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/dealer/submit-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: currentReviewProductId,
        dealerEmail: currentUser.email,
        quality,
        comments,
        rating
      })
    });

    const result = await response.json();

    if (response.ok) {
      alert('✅ Review submitted successfully!');

      const orderItem = orderItems.find(item => item.orderId === currentReviewOrderId);

      if (orderItem) {
        orderItem.reviewSubmitted = true;
        localStorage.setItem('dealerOrders', JSON.stringify(orderItems));
        console.log('Review marked as submitted for order:', currentReviewOrderId);
      } else {
        console.error('Order not found for orderId:', currentReviewOrderId);
      }

      closeReviewModal();
      loadOrders();
      loadProducts();
    } else {
      alert('⌛ Error submitting review: ' + result.msg);
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Network error. Please try again.');
  }
});

// ===========================
// BIDDING SYSTEM
// ===========================

function openBidModal(productId, productName, originalPrice, unitOfSale, orderId) {
  console.log('Opening bid modal with:', {
    productId,
    productName,
    originalPrice,
    unitOfSale,
    orderId
  });

  currentBidOrderId = orderId;
  currentReviewProductId = productId;

  if (!orderId) {
    console.error('ERROR: No orderId provided to openBidModal');
    alert('Error: Order ID not found. Please refresh and try again.');
    return;
  }

  const orderItem = orderItems.find(item => item.orderId === orderId);
  if (orderItem && !orderItem.serverOrderId) {
    console.error('WARNING: Order missing serverOrderId:', orderItem);
  }

  document.getElementById('bidModal').style.display = 'block';
  document.getElementById('bidProductName').textContent = productName;
  document.getElementById('bidOriginalPrice').textContent = `₹${originalPrice} per ${unitOfSale}`;
  document.getElementById('bidUnitOfSale').textContent = unitOfSale;

  console.log('Current bid order ID set to:', currentBidOrderId);
}

function closeBidModal() {
  document.getElementById('bidModal').style.display = 'none';
  document.getElementById('bidForm').reset();
  currentBidOrderId = null;
}

// Async Function

document.getElementById('bidForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const bidPrice = parseFloat(document.getElementById('bidPrice').value);

  if (!bidPrice || bidPrice <= 0) {
    alert('Please enter a valid bid price');
    return;
  }

  const orderItem = orderItems.find(item => item.orderId === currentBidOrderId);

  if (!orderItem || !orderItem.serverOrderId) {
    alert('Error: Server order ID not found. Please refresh and try again.');
    console.error('Missing serverOrderId for order:', currentBidOrderId);
    return;
  }

  console.log('Submitting bid:', {
    orderId: orderItem.serverOrderId,
    bidPrice: bidPrice
  });

  try {
    const response = await fetch('http://localhost:3000/api/dealer/place-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderItem.serverOrderId,
        bidPrice: bidPrice
      })
    });

    const result = await response.json();
    console.log('Bid response:', result);

    if (response.ok) {
      alert('✅ Bid placed successfully! Waiting for farmer approval.');

      if (orderItem) {
        orderItem.bidPlaced = true;
        orderItem.bidPrice = bidPrice;
        orderItem.bidStatus = 'Pending';
        localStorage.setItem('dealerOrders', JSON.stringify(orderItems));
      }

      closeBidModal();
      loadOrders();
    } else {
      console.error('Bid error:', result);
      alert('⌛ Error placing bid: ' + (result.msg || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error placing bid:', error);
    alert('Network error. Please try again. Check console for details.');
  }
});

function viewReceipt(orderId) {
  const orderItem = orderItems.find(item => item.orderId === orderId);

  if (!orderItem || !orderItem.receiptNumber) {
    alert('Receipt not available yet');
    return;
  }

  const modal = document.getElementById('receiptModal');
  const receiptContent = document.getElementById('receiptContent');

  receiptContent.innerHTML = `
    <div style="text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #1f2937;">ORDER RECEIPT</h2>
      <p style="margin: 5px 0; color: #6b7280;">AgroChain Platform</p>
    </div>

    <div style="margin-bottom: 20px;">
      <p><strong>Receipt Number:</strong> ${orderItem.receiptNumber}</p>
      <p><strong>Date:</strong> ${new Date(orderItem.receiptDate || Date.now()).toLocaleDateString()}</p>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #1f2937;">Product Details</h3>
      <p><strong>Product:</strong> ${orderItem.varietySpecies}</p>
      <p><strong>Type:</strong> ${orderItem.productType}</p>
      <p><strong>Quantity:</strong> ${orderItem.quantity} ${orderItem.unitOfSale}</p>
      <p><strong>Original Price:</strong> ₹${orderItem.targetPrice} per ${orderItem.unitOfSale}</p>
      <p><strong>Agreed Price:</strong> ₹${orderItem.bidPrice} per ${orderItem.unitOfSale}</p>
      <p style="font-size: 18px; font-weight: bold; color: #059669;"><strong>Total Amount:</strong> ₹${(orderItem.bidPrice * orderItem.quantity).toFixed(2)}</p>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #1f2937;">Farmer Details</h3>
      <p><strong>Name:</strong> ${orderItem.farmerName}</p>
      <p><strong>Email:</strong> ${orderItem.farmerEmail}</p>
      <p><strong>Mobile:</strong> ${orderItem.farmerMobile}</p>
      <p><strong>Location:</strong> ${orderItem.farmerLocation || 'N/A'}</p>
    </div>

    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
      <h3 style="margin-top: 0; color: #1f2937;">Dealer Details</h3>
      <p><strong>Name:</strong> ${currentUser.businessName || currentUser.firstName}</p>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p><strong>Mobile:</strong> ${currentUser.mobile}</p>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #1f2937;">
      <p style="color: #6b7280; font-size: 14px;">Thank you for your business!</p>
      <p style="color: #6b7280; font-size: 12px;">This is a computer-generated receipt</p>
    </div>
  `;

  modal.style.display = 'block';
}

function closeReceiptModal() {
  document.getElementById('receiptModal').style.display = 'none';
}

function printReceipt() {
  window.print();
}

// ===========================
// INVENTORY MANAGEMENT
// ===========================

// Async Function

async function loadInventory() {
  const inventoryGrid = document.getElementById("inventoryGrid");
  inventoryGrid.innerHTML = `<p>Loading inventory...</p>`;

  try {
    const response = await fetch(`http://localhost:3000/api/dealer/profile/${currentUser.email}`);
    const dealerData = await response.json();

    if (!response.ok) {
      throw new Error(dealerData.msg || 'Failed to fetch inventory data');
    }

    const serverInventory = dealerData.inventory || [];
    inventory = serverInventory;

    if (inventory.length === 0) {
      inventoryGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No Inventory Yet</h3>
          <p>Products from confirmed orders will appear here</p>
        </div>
      `;
      updateInventoryStats();
      return;
    }

    const sortedInventory = [...inventory].sort((a, b) =>
      new Date(b.addedDate || 0) - new Date(a.addedDate || 0)
    );

    inventoryGrid.innerHTML = sortedInventory.map(item => createInventoryCard(item)).join('');
    updateInventoryStats();

  } catch (error) {
    console.error("Error loading inventory:", error);
    inventoryGrid.innerHTML = `<div class="empty-state"><h3>Error loading inventory. Please refresh.</h3></div>`;
  }
}

function createInventoryCard(item) {
  const unitPrice = parseFloat(item.unitPrice) || 0;
  const quantity = parseFloat(item.quantity) || 0;
  const totalValue = parseFloat(item.totalValue) || (unitPrice * quantity);
  const dateAdded = item.addedDate ? new Date(item.addedDate).toLocaleDateString() : 'N/A';

  // Build reviews section
  let reviewsHTML = '';
  if (item.retailerReviews && item.retailerReviews.length > 0) {
    const avgRating = (item.retailerReviews.reduce((sum, r) => sum + r.rating, 0) / item.retailerReviews.length).toFixed(1);
    reviewsHTML = `
      <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="font-size: 14px; margin: 0; color: #374151;">
            ⭐ Reviews (${item.retailerReviews.length})
          </h4>
          <span style="font-size: 14px; font-weight: 600; color: #f59e0b;">
            ${avgRating}/5
          </span>
        </div>
        
        ${item.retailerReviews.slice(0, 2).map(review => `
          <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 600; color: #10b981; font-size: 13px;">${review.quality}</span>
              <span style="color: #f59e0b; font-size: 12px;">${'⭐'.repeat(review.rating)}</span>
            </div>
            <p style="margin: 4px 0; font-size: 12px; color: #374151; line-height: 1.4;">${review.comments}</p>
            <small style="color: #6b7280;">By: ${review.retailerEmail}</small>
          </div>
        `).join('')}
        
        ${item.retailerReviews.length > 2 ? `
          <button class="btn-view-all-reviews" onclick="openViewReviewsModal('${item._id}')" style="width: 100%; margin-top: 10px; padding: 8px; background: #ecfdf5; border: 1px solid #6ee7b7; color: #10b981; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.3s ease;">
            View All ${item.retailerReviews.length} Reviews →
          </button>
        ` : ''}
      </div>
    `;
  }

  return `
    <div class="inventory-card">
        <div class="inventory-card-header">
            <img src="${item.imageUrl}" alt="${item.productName}" class="inventory-image" onerror="this.src='https://via.placeholder.com/150'">
        </div>
        <div class="inventory-content">
            <h3>${item.productName}</h3>
            <p class="inventory-type">${item.productType}</p>
            <div class="inventory-details">
                <div class="inventory-detail-row">
                    <span class="detail-label">Quantity:</span>
                    <span class="detail-value">${quantity.toFixed(2)} ${item.unitOfSale || ''}</span>
                </div>
                <div class="inventory-detail-row">
                    <span class="detail-label">Unit Price:</span>
                    <span class="detail-value">₹${unitPrice.toFixed(2)}</span>
                </div>
                <div class="inventory-detail-row">
                    <span class="detail-label">Total Value:</span>
                    <span class="detail-value" style="font-weight: bold; color: #059669;">₹${totalValue.toFixed(2)}</span>
                </div>
                <div class="inventory-detail-row">
                    <span class="detail-label">Farmer:</span>
                    <span class="detail-value">${item.farmerName}</span>
                </div>
                <div class="inventory-detail-row">
                    <span class="detail-label">Added:</span>
                    <span class="detail-value">${dateAdded}</span>
                </div>
                <div class="inventory-detail-row">
                    <span class="detail-label">Receipt:</span>
                    <span class="detail-value">${item.receiptNumber}</span>
                </div>
            </div>
            
            ${reviewsHTML}
            
            <div class="inventory-actions">
                <button class="btn-reduce" onclick="reduceInventoryQuantity('${item._id}')">➖ Reduce Quantity</button>
                <button class="btn-primary" onclick="changeInventoryPrice('${item._id}')" style="background: #3b82f6;">💰 Change Price</button>
                <button class="btn-remove-inventory" onclick="removeFromInventory('${item._id}')">🗑️ Remove All</button>
            </div>
        </div>
    </div>
    `;
}

function addToInventory(order) {
  console.log('An order was completed. Refreshing inventory to see new item.');
  loadInventory();
}

// Async Function
async function changeInventoryPrice(inventoryId) {
    const item = inventory.find(i => i._id === inventoryId);
    if (!item) {
        alert('Item not found');
        return;
    }

    const newPrice = prompt(`Current unit price: ₹${item.unitPrice}\n\nEnter new unit price (₹):`, item.unitPrice);

    if (newPrice === null) return;

    const price = parseFloat(newPrice);

    if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/dealer/inventory/update-price`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dealerEmail: currentUser.email,
                inventoryId: inventoryId,
                newPrice: price
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert(`✅ Price updated successfully to ₹${price.toFixed(2)}`);
            loadInventory();
        } else {
            alert('❌ Error: ' + (result.msg || 'Failed to update price'));
        }
    } catch (error) {
        console.error('Error updating price:', error);
        alert('Network error. Please try again.');
    }
}

// Async Function

async function reduceInventoryQuantity(inventoryId) {
    const item = inventory.find(i => i._id === inventoryId);
    if (!item) return;

    const newQuantity = prompt(`Current quantity: ${item.quantity} ${item.unitOfSale}\n\nEnter new quantity:`, item.quantity);

    if (newQuantity === null) return;

    const qty = parseFloat(newQuantity);

    if (isNaN(qty) || qty < 0) {
        alert('Please enter a valid quantity');
        return;
    }

    if (qty > item.quantity) {
        alert('New quantity cannot exceed current inventory');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/dealer/inventory/update-quantity`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dealerEmail: currentUser.email,
                inventoryId: inventoryId,
                newQuantity: qty
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert(`✅ Quantity updated successfully to ${qty}`);
            
            if (qty === 0) {
                if (confirm('Quantity is 0. Remove this item from inventory?')) {
                    await removeFromInventory(inventoryId);
                } else {
                    loadInventory();
                }
            } else {
                loadInventory();
            }
        } else {
            alert('❌ Error: ' + (result.msg || 'Failed to update quantity'));
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Network error. Please try again.');
    }
}

// Async Function

async function removeFromInventory(inventoryId) {
    const item = inventory.find(i => i._id === inventoryId);
    if (!item) return;

    if (!confirm(`Remove ${item.productName} from inventory? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/dealer/inventory/remove`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dealerEmail: currentUser.email,
                inventoryId: inventoryId
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ Product removed successfully from inventory');
            loadInventory();
        } else {
            alert('❌ Error: ' + (result.msg || 'Failed to remove product'));
        }
    } catch (error) {
        console.error('Error removing inventory item:', error);
        alert('Network error. Please try again.');
    }
}

function updateInventoryStats() {
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const productTypes = new Set(inventory.map(item => item.productType)).size;

  document.getElementById('totalItems').textContent = totalItems.toFixed(2);
  document.getElementById('totalValue').textContent = '₹' + totalValue.toFixed(2);
  document.getElementById('productTypes').textContent = productTypes.toString();
}

// ===========================
// VIEW REVIEWS MODAL (Add this to BOTH dealer.js and retailer.js)
// ===========================

function openViewReviewsModal(productId) {
    console.log("Opening reviews modal for product:", productId);
    
    // Find product in the appropriate inventory
    let product = null;
    
    if (typeof allInventory !== 'undefined' && allInventory.length > 0) {
        // Retailer side
        product = allInventory.find(p => p._id === productId);
        console.log("Searching in allInventory (retailer)");
    } else if (typeof inventory !== 'undefined' && inventory.length > 0) {
        // Dealer side
        product = inventory.find(p => p._id === productId);
        console.log("Searching in inventory (dealer)");
    }
    
    if (!product) {
        console.error("Product not found with ID:", productId);
        alert('Product not found');
        return;
    }
    
    console.log("Product found:", product.productName);
    console.log("Reviews:", product.retailerReviews);
    
    const reviews = product.retailerReviews || [];
    
    // Build reviews HTML
    let reviewsHTML = '';
    if (reviews.length === 0) {
        reviewsHTML = '<p style="color: #6b7280; text-align: center; padding: 30px 20px;">No reviews yet</p>';
    } else {
        reviewsHTML = reviews.map((review, index) => `
            <div style="margin-bottom: 15px; padding: 12px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #10b981;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #10b981; font-size: 14px;">${review.quality}</span>
                    <span style="color: #f59e0b; font-size: 14px;">${'⭐'.repeat(review.rating)}</span>
                </div>
                <p style="margin: 8px 0; font-size: 13px; color: #374151; line-height: 1.6;">${review.comments}</p>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-top: 8px;">
                    <span><strong>By:</strong> ${review.retailerEmail}</span>
                    <span>${new Date(review.date).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }
    
    // Calculate average rating
    let avgRatingHTML = '';
    if (reviews.length > 0) {
        const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
        const roundedRating = Math.round(avgRating);
        avgRatingHTML = `
            <div style="text-align: right;">
                <div style="font-size: 28px; color: #f59e0b; margin-bottom: 5px;">
                    ${'⭐'.repeat(roundedRating)}
                </div>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                    Average: ${avgRating}/5.0
                </p>
            </div>
        `;
    }
    
    // Create modal dynamically
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'viewReviewsModal';
    modal.style.display = 'block';
    modal.style.zIndex = '1000';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeViewReviewsModal();
        }
    };
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 650px; max-height: 80vh; overflow-y: auto;">
            <span class="close" onclick="closeViewReviewsModal()" style="cursor: pointer; font-size: 28px; font-weight: bold; color: #6b7280; float: right; padding: 5px 10px; transition: color 0.2s;">&times;</span>
            
            <div style="clear: both; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${product.productName}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">${product.productType}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
                <div>
                    <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">Total Reviews</h4>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #4a148c;">${reviews.length}</p>
                </div>
                ${avgRatingHTML}
            </div>
            
            <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 14px;">All Reviews</h4>
            
            <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                ${reviewsHTML}
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <button class="btn-secondary" onclick="closeViewReviewsModal()" style="padding: 10px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log("Modal opened successfully");
}

function closeViewReviewsModal() {
    console.log("Closing reviews modal");
    const modal = document.getElementById('viewReviewsModal');
    
    if (modal) {
        modal.remove();
        console.log("Modal removed");
    }
}

// ===========================
// RETAILER ORDER MANAGEMENT
// ===========================

// Async Function

async function loadRetailerOrders() {
    const grid = document.getElementById('retailerOrdersGrid');
    grid.innerHTML = `<p>Loading orders from retailers...</p>`;

    try {
        console.log('📥 Fetching retailer orders for:', currentUser.email);
        const response = await fetch(`http://localhost:3000/api/dealer/retailer-orders/${currentUser.email}`);
        const orders = await response.json();

        console.log('📊 Response status:', response.status);
        console.log('📦 Orders received:', orders);

        if (response.ok) {
            if (!Array.isArray(orders)) {
                console.error('❌ Expected array but got:', typeof orders);
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <h3>Error: Invalid data format</h3>
                        <p>Please refresh the page and try again.</p>
                    </div>`;
                return;
            }

            if (orders.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🛒</div>
                        <h3>No orders received from retailers yet.</h3>
                        <p>Orders will appear here once retailers place orders from your inventory.</p>
                    </div>`;
                return;
            }

            grid.innerHTML = orders.map(order => `
                <div class="inventory-card" style="border-left: 4px solid ${order.paymentDetails.status === 'Completed' ? '#10b981' : '#f59e0b'};">
                    <div class="inventory-content">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 15px;">
                            <div>
                                <h3>Order from: ${order.retailerEmail}</h3>
                                <p class="inventory-type">Status: <strong>${order.orderStatus}</strong></p>
                                <p class="inventory-type">Payment: <span style="color: ${order.paymentDetails.status === 'Completed' ? '#10b981' : '#f59e0b'}; font-weight: bold;">${order.paymentDetails.status}</span></p>
                            </div>
                            <p style="font-size: 20px; font-weight: bold; color: #059669;">₹${order.totalAmount.toFixed(2)}</p>
                        </div>
                        
                        <div class="inventory-details" style="margin-bottom: 15px;">
                            <h4 style="margin-bottom: 10px; color: #374151;">Products Sold:</h4>
                            ${order.products.map(p => `
                                <div class="detail-row" style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                    <span style="font-weight: 500;">${p.productName} <small>(x${p.quantity})</small></span>
                                    <span style="font-weight: 600; color: #059669;">₹${(p.quantity * p.unitPrice).toFixed(2)}</span>
                                </div>`).join('')}
                        </div>
                        
                        <div class="dealer-info" style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                            <p style="margin: 5px 0;"><strong>Retailer's Shipping Address:</strong></p>
                            <p style="margin: 5px 0; color: #6b7280;">${order.shippingAddress}</p>
                        </div>

                        ${order.paymentDetails.method ? `
                            <div style="margin-top: 10px; padding: 10px; background: #ecfdf5; border-radius: 6px; border-left: 3px solid #10b981;">
                                <p style="margin: 0; color: #065f46;"><strong>Payment Method:</strong> ${order.paymentDetails.method}</p>
                            </div>
                        ` : ''}
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                            <small style="color: #6b7280;">Order placed: ${new Date(order.createdAt).toLocaleString()}</small>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            console.error('❌ Error response:', orders);
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Error loading orders</h3>
                    <p style="color:red">${orders.msg || 'Unknown error occurred'}</p>
                    <button class="btn-primary" onclick="loadRetailerOrders()" style="margin-top: 15px;">
                        🔄 Retry
                    </button>
                </div>`;
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Network Error</h3>
                <p style="color:red;">Failed to connect to server. Please check your connection and try again.</p>
                <button class="btn-primary" onclick="loadRetailerOrders()" style="margin-top: 15px;">
                    🔄 Retry
                </button>
            </div>`;
    }
}

// ===========================
// PROFILE
// ===========================

// Async Function

async function loadProfile() {
  try {
    const response = await fetch(`http://localhost:3000/api/dealer/profile/${currentUser.email}`);
    const data = await response.json();

    if (response.ok) {
      document.getElementById('profileInfo').innerHTML = `
        <div class="product-details">
          <div class="product-detail-item">
            <div class="product-detail-label">Name</div>
            <div class="product-detail-value">${data.firstName} ${data.lastName || ''}</div>
          </div>
          <div class="product-detail-item">
            <div class="product-detail-label">Email</div>
            <div class="product-detail-value">${data.email}</div>
          </div>
          <div class="product-detail-item">
            <div class="product-detail-label">Mobile</div>
            <div class="product-detail-value">${data.mobile}</div>
          </div>
          <div class="product-detail-item">
            <div class="product-detail-label">Business Name</div>
            <div class="product-detail-value">${data.businessName || 'Not specified'}</div>
          </div>
          <div class="product-detail-item">
            <div class="product-detail-label">GSTIN</div>
            <div class="product-detail-value">${data.gstin || 'Not specified'}</div>
          </div>
          <div class="product-detail-item">
            <div class="product-detail-label">Warehouse Address</div>
            <div class="product-detail-value">${data.warehouseAddress || 'Not specified'}</div>
          </div>
        </div>
      `;
    } else {
      document.getElementById('profileInfo').innerHTML = `<p style="color:red">${data.msg}</p>`;
    }
  } catch {
    document.getElementById('profileInfo').innerHTML = `<p style="color:red">Error loading profile.</p>`;
  }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => {
    element.innerHTML = '';
  }, 5000);
}

// ===========================
// POLLING FOR BID UPDATES
// ===========================

// Async Function

async function checkBidUpdates() {
  try {
    const response = await fetch(`http://localhost:3000/api/dealer/orders/${currentUser.email}`);
    const serverOrders = await response.json();

    if (response.ok && Array.isArray(serverOrders)) {
      let hasUpdates = false;

      orderItems.forEach(localOrder => {
        if (localOrder.serverOrderId) {
          const serverOrder = serverOrders.find(so => so._id === localOrder.serverOrderId);

          if (serverOrder) {
            if (serverOrder.bidStatus !== localOrder.bidStatus) {
              console.log(`Bid status changed for order ${localOrder.orderId}: ${localOrder.bidStatus} -> ${serverOrder.bidStatus}`);

              localOrder.bidStatus = serverOrder.bidStatus;
              localOrder.status = serverOrder.status;

              if (serverOrder.bidStatus === 'Accepted' && serverOrder.receiptNumber) {
                localOrder.receiptNumber = serverOrder.receiptNumber;
                localOrder.receiptDate = serverOrder.receiptGeneratedAt;
                localOrder.farmerName = serverOrder.farmerDetails?.firstName + ' ' + (serverOrder.farmerDetails?.lastName || '');
                localOrder.farmerMobile = serverOrder.farmerDetails?.mobile;

                loadInventory();
              }

              hasUpdates = true;
            }
          }
        }
      });

      if (hasUpdates) {
        localStorage.setItem("dealerOrders", JSON.stringify(orderItems));

        if (ordersSection.classList.contains('active')) {
          loadOrders();
        }
      }
    }
  } catch (error) {
    console.error("Error checking bid updates:", error);
  }
}

setInterval(checkBidUpdates, 10000);

// Async Function

setInterval(async () => {
  if (browseSection.classList.contains('active')) {
    try {
      const response = await fetch("http://localhost:3000/api/dealer/all-products");
      const data = await response.json();

      if (response.ok) {
        const currentProductIds = allProducts.map(p => p._id);
        const newProductIds = data.map(p => p._id);

        const productsChanged = currentProductIds.length !== newProductIds.length ||
                               allProducts.some(oldProduct => {
                                 const newProduct = data.find(p => p._id === oldProduct._id);
                                 return !newProduct || newProduct.harvestQuantity !== oldProduct.harvestQuantity;
                               });

        if (productsChanged) {
          allProducts = data;
          displayProducts(allProducts);
        }
      }
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  }
}, 15000);

// ===========================
// INITIALIZATION
// ===========================
window.addEventListener('DOMContentLoaded', function() {
  showSection(document.getElementById('browseSection'), null);
  showSidebar();
  loadProducts();
  loadVehicles();
  updateCartBadge();
  
  // Set profile name
  if (currentUser) {
    const profileName = currentUser.businessName || currentUser.firstName || 'DEALER';
    document.getElementById('profileName').textContent = profileName.toUpperCase();
  }
});