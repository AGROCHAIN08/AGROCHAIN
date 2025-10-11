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
let inventory = JSON.parse(localStorage.getItem("dealerInventory")) || [];

// ===========================
// AUTHENTICATION CHECK
// ===========================
if (!currentUser || currentUser.role !== 'dealer') {
  alert("Access denied. Please login as dealer.");
  window.location.href = "login.html";
}

// ===========================
// SIDEBAR NAVIGATION
// ===========================
const sections = document.querySelectorAll(".section");
const buttons = document.querySelectorAll(".sidebar button");

function showSection(sectionToShow, activeBtn) {
  sections.forEach(s => s.classList.remove("active"));
  buttons.forEach(b => b.classList.remove("active"));
  sectionToShow.classList.add("active");
  activeBtn.classList.add("active");
}

function generateUniqueOrderId() {
  return 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}


const vehiclesBtn = document.getElementById("vehiclesBtn");
const browseBtn = document.getElementById("browseBtn");
const cartBtn = document.getElementById("cartBtn");
const ordersBtn = document.getElementById("ordersBtn");
const inventoryBtn = document.getElementById("inventoryBtn");
const profileBtn = document.getElementById("profileBtn");
const signoutBtn = document.getElementById("signoutBtn");

const vehiclesSection = document.getElementById("vehiclesSection");
const browseSection = document.getElementById("browseSection");
const cartSection = document.getElementById("cartSection");
const inventorySection = document.getElementById("inventorySection");
const ordersSection = document.getElementById("ordersSection");
const profileSection = document.getElementById("profileSection");

vehiclesBtn.onclick = () => showSection(vehiclesSection, vehiclesBtn);
browseBtn.onclick = () => { 
  showSection(browseSection, browseBtn); 
  loadProducts();
};
cartBtn.onclick = () => { 
  showSection(cartSection, cartBtn); 
  loadCart();
};
ordersBtn.onclick = () => { 
  showSection(ordersSection, ordersBtn); 
  loadOrders();
};
profileBtn.onclick = () => { 
  showSection(profileSection, profileBtn); 
  loadProfile();
};
inventoryBtn.onclick = () => {
  showSection(inventorySection, inventoryBtn);
  loadInventory();
};

// ===========================
// VEHICLE MANAGEMENT
// ===========================

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
  
  // Filter out products with zero or negative quantity
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
  // Skip products with zero or negative quantity
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
  const status = document.getElementById('filterStatus').value;

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

  // ✅ FIXED: Always create a new order for each placement
  // Each order cycle (assign → review → bid → accept) should be independent
  // This prevents interference between completed orders and new orders of the same product
  const newOrder = { 
    ...product, 
    quantity: qty,
    orderId: generateUniqueOrderId(),  // Unique identifier for this specific order
    vehicleAssigned: false,
    reviewSubmitted: false,
    bidPlaced: false,
    bidStatus: null  // Initialize bidStatus as null
  };
  
  orderItems.push(newOrder);
  localStorage.setItem("dealerOrders", JSON.stringify(orderItems));
  alert("✅ Product successfully added to My Orders");
}

// Helper function to generate unique order IDs
function generateUniqueOrderId() {
  return 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
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
      // ✅ FIXED: Pass orderId as third parameter to openReviewModal
      actionButtons = `<button class="btn-review" onclick="openReviewModal('${item._id}', '${item.varietySpecies}', '${item.orderId}')">⭐ Add Review</button>`;
    } else if (item.vehicleAssigned && item.reviewSubmitted && !item.bidPlaced) {
      if (item.orderId) {
        actionButtons = `<button class="btn-bid" onclick="openBidModal('${item._id}', '${item.varietySpecies}', ${item.targetPrice}, '${item.unitOfSale}', '${item.orderId}')">💰 Place Bid</button>`;
      } else {
        actionButtons = `<span style="color: #dc2626;">Error: Order ID missing</span>`;
        console.error('Order item missing orderId:', item);
      }
    } else {
      // Pass orderId as third parameter to openAssignVehicleModal
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
    alert("❌ Please enter a valid quantity");
    return;
  }

  const product = allProducts.find(p => p._id === productId);
  if (!product) {
    alert("❌ Product not found");
    return;
  }

  // Validate against available stock
  if (qty > product.harvestQuantity) {
    alert(`❌ Only ${product.harvestQuantity} ${product.unitOfSale} available in stock`);
    qtyInput.value = product.harvestQuantity;
    return;
  }

  const existing = cartItems.find(item => item._id === productId);
  if (existing) {
    const totalQty = existing.quantity + qty;
    if (totalQty > product.harvestQuantity) {
      alert(`❌ Total quantity (${totalQty}) exceeds available stock (${product.harvestQuantity})`);
      return;
    }
    existing.quantity = totalQty;
  } else {
    cartItems.push({ ...product, quantity: qty });
  }

  localStorage.setItem("dealerCart", JSON.stringify(cartItems));
  alert("✅ Product added to cart!");
  qtyInput.value = '';
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
        <button class="btn-remove" onclick="removeFromCart('${item._id}')">❌ Remove</button>
        <button class="btn-primary" onclick="orderFromCart('${item._id}')">📦 Order Now</button>
      </div>
    </div>
  `).join('');
}

function removeFromCart(productId) {
  cartItems = cartItems.filter(item => item._id !== productId);
  localStorage.setItem("dealerCart", JSON.stringify(cartItems));
  loadCart();
}

function orderFromCart(productId) {
  const cartProduct = cartItems.find(i => i._id === productId);
  if (!cartProduct) {
    alert("❌ Product not found in cart");
    return;
  }

  // Validate against current available stock
  const currentProduct = allProducts.find(p => p._id === productId);
  if (!currentProduct) {
    alert("❌ Product no longer available");
    removeFromCart(productId);
    return;
  }

  if (cartProduct.quantity > currentProduct.harvestQuantity) {
    alert(`❌ Only ${currentProduct.harvestQuantity} available. Cart has ${cartProduct.quantity}.`);
    return;
  }

  // Create order directly with cart quantity
  const newOrder = { 
    ...currentProduct,
    quantity: cartProduct.quantity,  // ✅ Use cart quantity
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
}

// ===========================
// VEHICLE ASSIGNMENT
// ===========================

async function openAssignVehicleModal(productId, farmerEmail, orderId) {
  selectedProductId = productId;
  selectedFarmerEmail = farmerEmail;
  selectedOrderId = orderId;  // ✅ Store the specific order ID
  
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

  // ✅ FIXED: Find order by its unique orderId, not by product _id
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
      
      // ✅ CRITICAL FIX: Store server orderId separately, keep local orderId
      orderItem.vehicleAssigned = true;
      orderItem.serverOrderId = result.orderId;  // ✅ Store server ID separately
      // Keep orderItem.orderId as is (local ID)
      
      localStorage.setItem("dealerOrders", JSON.stringify(orderItems));
      
      closeAssignVehicleModal();
      loadOrders();
      loadVehicles();
    } else {
      alert("❌ Error assigning vehicle: " + result.msg);
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
  currentReviewOrderId = orderId;  // ✅ Store the specific order ID
  
  document.getElementById('reviewModalTitle').textContent = `Review: ${productName}`;
  document.getElementById('reviewModal').style.display = 'block';
  
  console.log('Review modal opened for:', { productId, orderId });
}

function closeReviewModal() {
  document.getElementById('reviewModal').style.display = 'none';
  document.getElementById('reviewForm').reset();
  currentReviewProductId = null;
  currentReviewOrderId = null;  // ✅ Clear the order ID
}

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
      
      // ✅ FIXED: Find order by orderId instead of product _id
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
      alert('❌ Error submitting review: ' + result.msg);
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
  
  currentBidOrderId = orderId;  // This is the local orderId
  currentReviewProductId = productId;
  
  if (!orderId) {
    console.error('ERROR: No orderId provided to openBidModal');
    alert('Error: Order ID not found. Please refresh and try again.');
    return;
  }
  
  // Debug: Check if serverOrderId exists
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

document.getElementById('bidForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const bidPrice = parseFloat(document.getElementById('bidPrice').value);

  if (!bidPrice || bidPrice <= 0) {
    alert('Please enter a valid bid price');
    return;
  }

  // ✅ Find the order item to get serverOrderId
  const orderItem = orderItems.find(item => item.orderId === currentBidOrderId);
  
  if (!orderItem || !orderItem.serverOrderId) {
    alert('Error: Server order ID not found. Please refresh and try again.');
    console.error('Missing serverOrderId for order:', currentBidOrderId);
    return;
  }

  console.log('Submitting bid:', {
    orderId: orderItem.serverOrderId,  // ✅ Use serverOrderId for API call
    bidPrice: bidPrice
  });

  try {
    const response = await fetch('http://localhost:3000/api/dealer/place-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderItem.serverOrderId,  // ✅ Use serverOrderId
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
      alert('❌ Error placing bid: ' + (result.msg || 'Unknown error'));
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

function addToInventory(order) {
  // Check if product already exists in inventory
  const existingItem = inventory.find(item =>
    item.productId === order._id && item.farmerEmail === order.farmerEmail
  );

  if (existingItem) {
    // Update quantity if product already exists
    existingItem.quantity += order.quantity;
    existingItem.totalValue = existingItem.quantity * existingItem.unitPrice;
    existingItem.lastUpdated = new Date().toISOString();
  } else {
    // Add new inventory item
    const inventoryItem = {
      inventoryId: 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      productId: order._id,
      productName: order.varietySpecies,
      productType: order.productType,
      farmerEmail: order.farmerEmail,
      farmerName: order.farmerName || 'Unknown Farmer',
      quantity: order.quantity,
      unitOfSale: order.unitOfSale,
      unitPrice: order.bidPrice || order.targetPrice,
      totalValue: order.quantity * (order.bidPrice || order.targetPrice),
      imageUrl: order.imageUrl,
      receiptNumber: order.receiptNumber,
      orderId: order.orderId || order._id,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    inventory.push(inventoryItem);
  }

  localStorage.setItem("dealerInventory", JSON.stringify(inventory));
  console.log('Item added to inventory:', inventory);
}

function changeInventoryPrice(inventoryId) {
  const item = inventory.find(i => i.inventoryId === inventoryId);
  if (!item) {
    alert('Item not found');
    return;
  }

  const newPrice = prompt(`Current unit price: ₹${item.unitPrice}\n\nEnter new unit price (₹):`, item.unitPrice);

  if (newPrice === null) return; // User cancelled

  const price = parseFloat(newPrice);

  if (isNaN(price) || price <= 0) {
    alert('Please enter a valid price');
    return;
  }

  // Update price
  item.unitPrice = price;
  item.totalValue = price * item.quantity;
  item.lastUpdated = new Date().toISOString();

  localStorage.setItem("dealerInventory", JSON.stringify(inventory));
  loadInventory();
  alert(`✓ Price updated to ₹${price.toFixed(2)} per ${item.unitOfSale}`);
}

function loadInventory() {
  const inventoryGrid = document.getElementById("inventoryGrid");

  if (!inventory || inventory.length === 0) {
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

  // Sort by date added (newest first)
  const sortedInventory = [...inventory].sort((a, b) =>
    new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0)
  );

  inventoryGrid.innerHTML = sortedInventory.map(item => {
    // Ensure numeric values exist with safe fallbacks
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    const totalValue = parseFloat(item.totalValue) || (unitPrice * quantity);
    const productName = item.productName || 'Unknown Product';
    const productType = item.productType || 'N/A';
    const unitOfSale = item.unitOfSale || 'units';
    const farmerName = item.farmerName || 'N/A';
    const imageUrl = item.imageUrl || 'https://via.placeholder.com/150';
    const inventoryId = item.inventoryId || 'N/A';
    const dateAdded = item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : 'N/A';
    
    return `
      <div class="inventory-card">
        <div class="inventory-card-header">
          <img src="${imageUrl}" alt="${productName}" class="inventory-image" onerror="this.src='https://via.placeholder.com/150'">
          <div class="inventory-badge">${inventoryId}</div>
        </div>

        <div class="inventory-content">
          <h3>${productName}</h3>
          <p class="inventory-type">${productType}</p>

          <div class="inventory-details">
            <div class="inventory-detail-row">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value">${quantity.toFixed(2)} ${unitOfSale}</span>
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
              <span class="detail-value">${farmerName}</span>
            </div>
            <div class="inventory-detail-row">
              <span class="detail-label">Added:</span>
              <span class="detail-value">${dateAdded}</span>
            </div>
            ${item.receiptNumber ? `
              <div class="inventory-detail-row">
                <span class="detail-label">Receipt:</span>
                <span class="detail-value">${item.receiptNumber}</span>
              </div>
            ` : ''}
          </div>

          <div class="inventory-actions">
            <button class="btn-reduce" onclick="reduceInventoryQuantity('${inventoryId}')">
              ➖ Reduce Quantity
            </button>
            <button class="btn-primary" onclick="changeInventoryPrice('${inventoryId}')" style="background: #3b82f6;">
              💰 Change Price
            </button>
            <button class="btn-remove-inventory" onclick="removeFromInventory('${inventoryId}')">
              🗑️ Remove All
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateInventoryStats();
}

function reduceInventoryQuantity(inventoryId) {
  const item = inventory.find(i => i.inventoryId === inventoryId);
  if (!item) return;

  const newQuantity = prompt(`Current quantity: ${item.quantity} ${item.unitOfSale}\n\nEnter new quantity:`, item.quantity);

  if (newQuantity === null) return; // User cancelled

  const qty = parseFloat(newQuantity);

  if (isNaN(qty) || qty < 0) {
    alert('Please enter a valid quantity');
    return;
  }

  if (qty === 0) {
    if (confirm('Quantity is 0. Remove this item from inventory?')) {
      removeFromInventory(inventoryId);
    }
    return;
  }

  if (qty > item.quantity) {
    alert('Quantity cannot exceed current inventory');
    return;
  }

  // Update inventory
  item.quantity = qty;
  item.totalValue = qty * item.unitPrice;
  item.lastUpdated = new Date().toISOString();

  localStorage.setItem("dealerInventory", JSON.stringify(inventory));
  loadInventory();
  alert(`✓ Quantity updated to ${qty} ${item.unitOfSale}`);
}

function removeFromInventory(inventoryId) {
  const item = inventory.find(i => i.inventoryId === inventoryId);
  if (!item) return;

  if (!confirm(`Remove ${item.productName} (${item.quantity} ${item.unitOfSale}) from inventory?`)) {
    return;
  }

  inventory = inventory.filter(i => i.inventoryId !== inventoryId);
  localStorage.setItem("dealerInventory", JSON.stringify(inventory));
  loadInventory();
  alert('✓ Product removed from inventory');
}

function updateInventoryStats() {
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const productTypes = new Set(inventory.map(item => item.productType)).size;

  document.getElementById('totalItems').textContent = totalItems.toString();
  document.getElementById('totalValue').textContent = '₹' + totalValue.toFixed(2);
  document.getElementById('productTypes').textContent = productTypes.toString();
}

// Poll for bid updates every 10 seconds
setInterval(checkBidUpdates, 10000);

// Also check immediately when orders section is opened
const originalOrdersOnClick = ordersBtn.onclick;
ordersBtn.onclick = async () => {
  originalOrdersOnClick();
  await checkBidUpdates();
};

// ===========================
// PROFILE
// ===========================

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

async function checkBidUpdates() {
  try {
    const response = await fetch(`http://localhost:3000/api/dealer/orders/${currentUser.email}`);
    const serverOrders = await response.json();
    
    if (response.ok && Array.isArray(serverOrders)) {
      let hasUpdates = false;
      
      // Update local orders with server bid status
      orderItems.forEach(localOrder => {
        if (localOrder.serverOrderId) {
          const serverOrder = serverOrders.find(so => so._id === localOrder.serverOrderId);
          
          if (serverOrder) {
            // Check if bid status changed
            if (serverOrder.bidStatus !== localOrder.bidStatus) {
              console.log(`Bid status changed for order ${localOrder.orderId}: ${localOrder.bidStatus} -> ${serverOrder.bidStatus}`);
              
              localOrder.bidStatus = serverOrder.bidStatus;
              localOrder.status = serverOrder.status;
              
              // Add receipt info if bid accepted
              if (serverOrder.bidStatus === 'Accepted' && serverOrder.receiptNumber) {
                localOrder.receiptNumber = serverOrder.receiptNumber;
                localOrder.receiptDate = serverOrder.receiptGeneratedAt;
                localOrder.farmerName = serverOrder.farmerDetails?.firstName + ' ' + (serverOrder.farmerDetails?.lastName || '');
                localOrder.farmerMobile = serverOrder.farmerDetails?.mobile;
                
                // ADD TO INVENTORY when bid is accepted
                addToInventory(localOrder);
              }
              
              hasUpdates = true;
            }
          }
        }
      });
      
      if (hasUpdates) {
        localStorage.setItem("dealerOrders", JSON.stringify(orderItems));
        
        // Reload orders view if currently active
        if (ordersSection.classList.contains('active')) {
          loadOrders();
        }
      }
    }
  } catch (error) {
    console.error("Error checking bid updates:", error);
  }
}
// Poll for bid updates every 10 seconds
setInterval(checkBidUpdates, 10000);

// Also check immediately when orders section is opened
ordersBtn.onclick = async () => {
  originalOrdersOnClick();
  await checkBidUpdates();
};

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
// SIGN OUT
// ===========================
signoutBtn.onclick = () => {
  if (confirm("Are you sure you want to sign out?")) {
    localStorage.clear();
    window.location.href = "login.html";
  }
};

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  loadVehicles();
  loadProducts();
});