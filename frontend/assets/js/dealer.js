// Global variables
let currentUser = JSON.parse(localStorage.getItem("agroChainUser"));
let allProducts = [];
let allVehicles = [];
let allOrders = []; 
let allInventory = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentProduct = null;
let currentOrderForBid = null; 
let currentInventoryItem = null;
let currentUserProfile = null; // To store current profile data

// Check authentication
if (!currentUser || currentUser.role !== 'dealer') {
  alert("Access denied. Please login as a dealer.");
  window.location.href = "login.html";
}

// DOM Elements
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
const ordersSection = document.getElementById("ordersSection");
const inventorySection = document.getElementById("inventorySection");
const profileSection = document.getElementById("profileSection");
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');


// Navigation
function showSection(section, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
  section.classList.add('active');
  btn.classList.add('active');
}

vehiclesBtn.onclick = () => {
  showSection(vehiclesSection, vehiclesBtn);
  loadVehicles();
};
browseBtn.onclick = () => {
  showSection(browseSection, browseBtn);
  loadAllProducts();
};
cartBtn.onclick = () => {
    showSection(cartSection, cartBtn);
    loadCart();
};
ordersBtn.onclick = () => {
  showSection(ordersSection, ordersBtn);
  loadOrders();
};
inventoryBtn.onclick = () => {
  showSection(inventorySection, inventoryBtn);
  loadInventory();
};
profileBtn.onclick = () => {
  showSection(profileSection, profileBtn);
  loadProfile();
};
editProfileBtn.onclick = () => openEditProfileModal();

// Vehicle Management
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
      vehiclesGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">🚛</div><h3>No Vehicles Added</h3><p>Add your first vehicle to start managing logistics</p></div>`;
    }
  } catch (error) {
    document.getElementById('vehiclesGrid').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error Loading Vehicles</h3><p>Please try again later</p></div>`;
  }
}

function createVehicleCard(vehicle) {
  const statusClass = `vehicle-${vehicle.currentStatus.toLowerCase().replace(' ', '-')}`;
  const statusBadgeClass = `status-${vehicle.currentStatus.toLowerCase().replace(' ', '-')}-vehicle`;
  const isAssigned = vehicle.currentStatus === 'ASSIGNED';

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
      ${isAssigned ? `
        <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 6px;">
          <strong>Assigned to:</strong> ${vehicle.assignedTo.productName}<br>
          <strong>Farmer:</strong> ${vehicle.assignedTo.farmerName}
        </div>
      ` : ''}
      <div class="vehicle-actions">
        ${isAssigned ? `<button class="btn-free" onclick="freeVehicle('${vehicle._id}')">Free Vehicle</button>` : ''}
        <button class="btn-delete-vehicle" onclick="deleteVehicle('${vehicle._id}')" ${isAssigned ? 'disabled' : ''}>Delete Vehicle</button>
      </div>
    </div>
  `;
}

async function freeVehicle(vehicleId) {
    if (!confirm("Are you sure you want to free this vehicle? This action cannot be undone and may affect an ongoing order.")) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/dealer/vehicles/${currentUser.email}/${vehicleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentStatus: 'AVAILABLE' })
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('vehicleMessage', 'Vehicle has been freed successfully!', 'success');
            loadVehicles();
        } else {
            showMessage('vehicleMessage', data.msg || 'Error freeing vehicle', 'error');
        }
    } catch (error) {
        showMessage('vehicleMessage', 'Network error. Please try again.', 'error');
    }
}

async function deleteVehicle(vehicleId) {
    if (!confirm("Are you sure you want to permanently delete this vehicle?")) {
        return;
    }
    try {
        const response = await fetch(`http://localhost:3000/api/dealer/vehicles/${currentUser.email}/${vehicleId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('vehicleMessage', 'Vehicle deleted successfully!', 'success');
            loadVehicles();
        } else {
            showMessage('vehicleMessage', data.msg || 'Error deleting vehicle', 'error');
        }
    } catch (error) {
        showMessage('vehicleMessage', 'Network error. Please try again.', 'error');
    }
}


// Browse Products
async function loadAllProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/dealer/all-products');
    const data = await response.json();
    if (response.ok) {
      allProducts = data;
      displayProducts(allProducts);
    } else {
      showMessage('browseMessage', 'Error loading products', 'error');
    }
  } catch (error) {
    showMessage('browseMessage', 'Network error loading products', 'error');
  }
}

function displayProducts(products) {
  const productsGrid = document.getElementById('productsGrid');
  if (products.length === 0) {
    productsGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">🌾</div><h3>No Products Found</h3><p>Try adjusting your filters</p></div>`;
    return;
  }
  productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
  const statusClass = product.availabilityStatus === 'Available' ? 'status-available' : 'status-inspection-initiated';
  const reviewsCount = product.reviews ? product.reviews.length : 0;

  return `
    <div class="product-card">
      <img src="${product.imageUrl}" alt="${product.varietySpecies}" class="product-image" onclick="openImagePage('${product.imageUrl}')">
      <div class="product-content">
        <div class="product-header">
          <div class="product-title">
            <h3>${product.varietySpecies}</h3>
            <span class="product-type">${product.productType}</span>
          </div>
          <span class="status-tag ${statusClass}">${product.availabilityStatus}</span>
        </div>
        <div class="product-details">
          <div class="product-detail-item">
            <div class="product-detail-label">Quantity</div>
            <div class="product-detail-value">${product.harvestQuantity} ${product.unitOfSale}</div>
          </div>
          <div class="product-detail-item">
            <div class="product-detail-label">Target Price</div>
            <div class="product-detail-value">₹${product.targetPrice}</div>
          </div>
        </div>
        <div class="farmer-contact">
          <div class="farmer-info">
            <h4>👨‍🌾 ${product.farmerName}</h4>
            <div class="contact-details">
              <span>📧 ${product.farmerEmail}</span>
              <span>📱 ${product.farmerMobile}</span>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn-contact" onclick="contactFarmer('${product.farmerEmail}', '${product.farmerMobile}')">📞 Contact Farmer</button>
                ${reviewsCount > 0 ? `<button class="btn-contact" style="background-color: #4f46e5;" onclick="showReviewDetails('${product._id}')">⭐ View Reviews (${reviewsCount})</button>` : ''}
            </div>
          </div>
        </div>
        ${product.availabilityStatus === 'Available' ? `<button class="btn-add-to-cart" onclick="addToCart('${product._id}')">🛒 Add to Cart</button>` : `<button class="btn-add-to-cart" disabled>⏳ Inspection in Progress</button>`}
      </div>
    </div>
  `;
}

function applyFilters() {
  const productType = document.getElementById('filterProductType').value;
  const variety = document.getElementById('filterVariety').value.toLowerCase();
  const maxPrice = parseFloat(document.getElementById('filterPrice').value) || Infinity;

  const filtered = allProducts.filter(product => {
    return (!productType || product.productType === productType) &&
           (!variety || product.varietySpecies.toLowerCase().includes(variety)) &&
           (product.targetPrice <= maxPrice);
  });
  displayProducts(filtered);
}

function contactFarmer(email, mobile) {
  alert(`Contact Details:\nEmail: ${email}\nMobile: ${mobile}`);
}

// Cart Management
function addToCart(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (cart.find(item => item._id === productId)) {
        return alert("Product already in cart.");
    }
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Product added to cart!");
}

function loadCart() {
    const cartGrid = document.getElementById('cartGrid');
    if (cart.length === 0) {
        cartGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><h3>Your Cart is Empty</h3><p>Add products from the browse page to get started.</p></div>`;
        return;
    }
    cartGrid.innerHTML = cart.map(item => createCartItemCard(item)).join('');
}

function createCartItemCard(item) {
    return `
        <div class="cart-item-card">
            <div class="product-content">
                <div class="product-header">
                    <div class="product-title">
                        <h3>${item.varietySpecies}</h3>
                        <span class="product-type">${item.productType}</span>
                    </div>
                </div>
                <div class="product-details">
                    <div class="product-detail-item">
                        <div class="product-detail-label">Quantity</div>
                        <div class="product-detail-value">${item.harvestQuantity} ${item.unitOfSale}</div>
                    </div>
                    <div class="product-detail-item">
                        <div class="product-detail-label">Target Price</div>
                        <div class="product-detail-value">₹${item.targetPrice}</div>
                    </div>
                </div>
                <div class="farmer-contact">
                    <div class="farmer-info">
                        <h4>👨‍🌾 ${item.farmerName}</h4>
                    </div>
                </div>
                <button class="btn-primary" onclick="openAssignModal('${item._id}')">Start Inspection</button>
            </div>
        </div>
    `;
}

// Vehicle Assignment (from Cart)
function openAssignModal(productId) {
  currentProduct = cart.find(p => p._id === productId);
  if (!currentProduct) return alert("Error: Product not found in cart");
  document.getElementById('assignmentDetails').innerHTML = `<h4>${currentProduct.varietySpecies}</h4><p><strong>Available Quantity:</strong> ${currentProduct.harvestQuantity} ${currentProduct.unitOfSale}</p><p><strong>Price:</strong> ₹${currentProduct.targetPrice}</p><p><strong>Farmer:</strong> ${currentProduct.farmerName}</p>`;
  const vehicleSelect = document.getElementById('vehicleSelect');
  const availableVehicles = allVehicles.filter(v => v.currentStatus === 'AVAILABLE');
  vehicleSelect.innerHTML = '<option value="">Choose available vehicle...</option>' + availableVehicles.map(v => `<option value="${v._id}">${v.vehicleId} - ${v.vehicleType}</option>`).join('');
  document.getElementById('assignModal').style.display = 'block';
}

async function confirmAssignment() {
  const vehicleId = document.getElementById('vehicleSelect').value;
  const quantity = parseFloat(document.getElementById('purchaseQuantity').value);
  if (!vehicleId || !quantity) return alert('Please select a vehicle and enter quantity');
  if (quantity > currentProduct.harvestQuantity) return alert('Quantity cannot exceed available stock');
  const assignmentPayload = {
    dealerEmail: currentUser.email,
    productId: currentProduct._id,
    vehicleId: vehicleId,
    quantity: quantity,
    farmerEmail: currentProduct.farmerEmail
  };
  try {
    const response = await fetch('http://localhost:3000/api/dealer/assign-vehicle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentPayload)
    });
    const data = await response.json();
    if (response.ok) {
      alert('Vehicle assigned successfully!');
      // Remove from cart
      cart = cart.filter(item => item._id !== currentProduct._id);
      localStorage.setItem("cart", JSON.stringify(cart));
      loadCart();
      document.getElementById('assignModal').style.display = 'none';
      document.getElementById('vehicleSelect').value = '';
      document.getElementById('purchaseQuantity').value = '';
      loadAllProducts();
      loadVehicles();
    } else {
      alert(`Error: ${data.msg || 'Error assigning vehicle'}`);
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

// Orders
async function loadOrders() {
  try {
    const response = await fetch(`http://localhost:3000/api/dealer/orders/${currentUser.email}`);
    const orders = await response.json();
    const ordersGrid = document.getElementById('ordersGrid');
    if (response.ok && orders.length > 0) {
      allOrders = orders;
      ordersGrid.innerHTML = orders.map(order => createOrderCard(order)).join('');
    } else {
      ordersGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h3>No Orders Yet</h3><p>Your vehicle assignments will appear here</p></div>`;
    }
  } catch (error) {
    document.getElementById('ordersGrid').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error Loading Orders</h3><p>Please try again later</p></div>`;
  }
}

function createOrderCard(order) {
    let actionButtonHtml = `<button class="btn-primary" style="margin-left: 10px;" disabled>${order.status}</button>`;
    switch(order.status) {
        case 'Vehicle Assigned':
            actionButtonHtml = `<button class="btn-primary" style="margin-left: 10px;" onclick="openReviewModal('${order._id}')">Inspect & Review</button>`;
            break;
        case 'Inspection Complete':
            actionButtonHtml = `<button class="btn-primary" style="margin-left: 10px; background-color: #059669;" onclick="openBidModal('${order._id}')">✔ Place Order Bid</button>`;
            break;
        case 'Bid Placed':
            actionButtonHtml = `<button class="btn-primary" style="margin-left: 10px; background-color: #f59e0b;" disabled>⏳ Bid Pending</button>`;
            break;
        case 'Completed':
             actionButtonHtml = `<button class="btn-primary" style="margin-left: 10px; background-color: #16a34a;" disabled>✔ Completed</button>`;
             break;
        case 'Cancelled':
             actionButtonHtml = `<button class="btn-primary" style="margin-left: 10px; background-color: #ef4444;" disabled>✖ Cancelled</button>`;
             break;
    }
  return `
    <div class="order-card">
      <div class="order-header">
        <h4>${order.productDetails.varietySpecies}</h4>
        <div>
          <span class="status-tag status-${order.status.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span>
          ${actionButtonHtml}
        </div>
      </div>
      <div class="product-details">
        <div class="product-detail-item"><div class="product-detail-label">Assigned Vehicle</div><div class="product-detail-value">${order.vehicleDetails.vehicleId}</div></div>
        <div class="product-detail-item"><div class="product-detail-label">Purchase Quantity</div><div class="product-detail-value">${order.quantity} ${order.productDetails.unitOfSale}</div></div>
        <div class="product-detail-item"><div class="product-detail-label">Final Amount</div><div class="product-detail-value">₹${(order.negotiatedTotalAmount || order.totalAmount).toFixed(2)}</div></div>
        <div class="product-detail-item"><div class="product-detail-label">Farmer</div><div class="product-detail-value">${order.farmerDetails.firstName} ${order.farmerDetails.lastName}</div></div>
      </div>
      <div style="margin-top: 15px; font-size: 14px; color: #6b7280;"><strong>Pickup Location:</strong> ${order.productDetails.fieldAddress}<br><strong>Assigned Date:</strong> ${new Date(order.assignedDate).toLocaleDateString()}</div>
    </div>
  `;
}

// Inventory
async function loadInventory() {
    try {
        const response = await fetch(`http://localhost:3000/api/dealer/inventory/${currentUser.email}`);
        const inventory = await response.json();
        const inventoryGrid = document.getElementById('inventoryGrid');
        if(response.ok) {
            allInventory = inventory;
            if (inventory.length > 0) {
                inventoryGrid.innerHTML = inventory.map(item => createInventoryCard(item)).join('');
            } else {
                inventoryGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>Inventory is Empty</h3><p>Your purchased products will appear here.</p></div>`;
            }
        }
    } catch (error) {
        document.getElementById('inventoryGrid').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Error Loading Inventory</h3><p>Please try again later</p></div>`;
    }
}

function createInventoryCard(item) {
    return `
        <div class="inventory-card">
            <img src="${item.imageUrl}" alt="${item.productName}" class="product-image" onclick="openImagePage('${item.imageUrl}')">
            <div class="product-content">
                <h3>${item.productName}</h3>
                <div class="product-details">
                    <div class="product-detail-item">
                        <div class="product-detail-label">Quantity</div>
                        <div class="product-detail-value">${item.quantity} ${item.unitOfSale}</div>
                    </div>
                    <div class="product-detail-item">
                        <div class="product-detail-label">Purchase Price</div>
                        <div class="product-detail-value">₹${item.purchasePrice}</div>
                    </div>
                </div>
                <div class="inventory-actions">
                    <button class="btn-edit" onclick="openInventoryModal('${item._id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteInventoryItem('${item._id}')">Delete</button>
                </div>
            </div>
        </div>
    `;
}

function openInventoryModal(itemId) {
    const modal = document.getElementById('inventoryModal');
    const title = document.getElementById('inventoryModalTitle');
    const form = document.getElementById('inventoryForm');
    form.reset();
    if (itemId) {
        currentInventoryItem = allInventory.find(item => item._id === itemId);
        if(!currentInventoryItem) return;
        title.textContent = 'Edit Inventory Item';
        document.getElementById('inventoryItemId').value = currentInventoryItem._id;
        document.getElementById('inventoryProductName').value = currentInventoryItem.productName;
        document.getElementById('inventoryQuantity').value = currentInventoryItem.quantity;
        document.getElementById('inventoryUnitOfSale').value = currentInventoryItem.unitOfSale;
        document.getElementById('inventoryPurchasePrice').value = currentInventoryItem.purchasePrice;
    } else {
        currentInventoryItem = null;
        title.textContent = 'Add to Inventory';
    }
    modal.style.display = 'block';
}

document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = document.getElementById('inventoryItemId').value;
    const itemData = {
        productName: document.getElementById('inventoryProductName').value,
        quantity: document.getElementById('inventoryQuantity').value,
        unitOfSale: document.getElementById('inventoryUnitOfSale').value,
        purchasePrice: document.getElementById('inventoryPurchasePrice').value,
    };

    const url = itemId ? `http://localhost:3000/api/dealer/inventory/${currentUser.email}/${itemId}` : `http://localhost:3000/api/dealer/inventory/${currentUser.email}`;
    const method = itemId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        if(response.ok) {
            document.getElementById('inventoryModal').style.display = 'none';
            loadInventory();
        }
    } catch (error) {
        console.error('Error saving inventory item:', error);
    }
});

async function deleteInventoryItem(itemId) {
    if(!confirm('Are you sure you want to delete this item?')) return;
    try {
        const response = await fetch(`http://localhost:3000/api/dealer/inventory/${currentUser.email}/${itemId}`, {
            method: 'DELETE'
        });
        if(response.ok) {
            loadInventory();
        }
    } catch (error) {
        console.error('Error deleting inventory item:', error);
    }
}

document.getElementById('addInventoryBtn').onclick = () => openInventoryModal(null);
document.querySelector('.close-inventory').onclick = () => document.getElementById('inventoryModal').style.display = 'none';

// Profile
async function loadProfile() {
  try {
    const response = await fetch(`http://localhost:3000/api/dealer/profile/${currentUser.email}`);
    const data = await response.json();
    currentUserProfile = data; // Store data

    if (response.ok) {
      document.getElementById('profileInfo').innerHTML = `
        <div class="product-details">
          <div class="product-detail-item"><div class="product-detail-label">Name</div><div class="product-detail-value">${data.firstName} ${data.lastName || ''}</div></div>
          <div class="product-detail-item"><div class="product-detail-label">Email</div><div class="product-detail-value">${data.email}</div></div>
          <div class="product-detail-item"><div class="product-detail-label">Mobile</div><div class="product-detail-value">${data.mobile}</div></div>
          <div class="product-detail-item"><div class="product-detail-label">Business Name</div><div class="product-detail-value">${data.businessName || 'Not specified'}</div></div>
          <div class="product-detail-item"><div class="product-detail-label">GSTIN</div><div class="product-detail-value">${data.gstin || 'Not specified'}</div></div>
          <div class="product-detail-item"><div class="product-detail-label">Warehouse Address</div><div class="product-detail-value">${data.warehouseAddress || 'Not specified'}</div></div>
          <div class="product-detail-item" style="grid-column: 1 / -1;"><div class="product-detail-label">Preferred Commodities</div><div class="product-detail-value">${data.preferredCommodities?.join(', ') || 'Not specified'}</div></div>
        </div>
      `;
    } else {
      document.getElementById('profileInfo').innerHTML = `<p style="color:red">${data.msg}</p>`;
    }
  } catch {
    document.getElementById('profileInfo').innerHTML = `<p style="color:red">Error loading profile.</p>`;
  }
}

// Utility Functions
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => { element.innerHTML = ''; }, 5000);
}

// Modal close functionality
document.querySelector('.close').onclick = function() { document.getElementById('assignModal').style.display = 'none'; }
document.querySelector('.close-review').onclick = function() { document.getElementById('reviewModal').style.display = 'none'; document.getElementById('reviewForm').reset(); }
document.querySelector('.close-bid').onclick = () => document.getElementById('bidModal').style.display = 'none';
document.querySelector('.close-view-review').onclick = function() { document.getElementById('viewReviewModal').style.display = 'none'; };
document.querySelector('.close-edit-profile').onclick = function() { document.getElementById('editProfileModal').style.display = 'none'; };


window.onclick = function(event) {
  const assignModal = document.getElementById('assignModal');
  const reviewModal = document.getElementById('reviewModal');
  const bidModal = document.getElementById('bidModal');
  const inventoryModal = document.getElementById('inventoryModal');
  const viewReviewModal = document.getElementById('viewReviewModal');
  const editProfileModal = document.getElementById('editProfileModal');
  if (event.target == assignModal) assignModal.style.display = 'none';
  if (event.target == reviewModal) reviewModal.style.display = 'none';
  if (event.target == bidModal) bidModal.style.display = 'none';
  if (event.target == inventoryModal) inventoryModal.style.display = 'none';
  if (event.target == viewReviewModal) viewReviewModal.style.display = 'none';
  if (event.target == editProfileModal) editProfileModal.style.display = 'none';

}

// Sign out
signoutBtn.onclick = () => {
  if (confirm("Are you sure you want to sign out?")) {
    localStorage.clear();
    window.location.href = "login.html";
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  showSection(vehiclesSection, vehiclesBtn);
  loadVehicles();
});

// Review Modal Functions
function openReviewModal(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return alert("Order not found!");
    document.getElementById('reviewProductId').value = order.productDetails._id;
    document.getElementById('reviewOrderId').value = order._id;
    document.getElementById('reviewFarmerId').value = order.farmerDetails._id;
    document.getElementById('reviewProductInfo').innerHTML = `<p><strong>Reviewing:</strong> ${order.productDetails.varietySpecies}</p><p><strong>Farmer:</strong> ${order.farmerDetails.firstName} ${order.farmerDetails.lastName}</p>`;
    document.getElementById('reviewModal').style.display = 'block';
}

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const reviewBtn = e.target.querySelector('button[type="submit"]');
      reviewBtn.disabled = true;
      reviewBtn.textContent = 'Submitting...';
      const formData = new FormData();
      formData.append('productId', document.getElementById('reviewProductId').value);
      formData.append('orderId', document.getElementById('reviewOrderId').value);
      formData.append('farmerId', document.getElementById('reviewFarmerId').value);
      formData.append('dealerId', currentUser.id);
      formData.append('qualityGrade', document.getElementById('qualityGrade').value);
      formData.append('color', document.getElementById('reviewColor').value);
      formData.append('damageLevel', document.getElementById('damageLevel').value);
      formData.append('pestInfection', document.getElementById('pestInfection').value);
      formData.append('remarks', document.getElementById('remarks').value);
      const files = document.getElementById('attachments').files;
      for (let i = 0; i < files.length; i++) {
          formData.append('attachments', files[i]);
      }
      try {
          const response = await fetch('http://localhost:3000/api/reviews', { method: 'POST', body: formData });
          const data = await response.json();
          if (response.ok) {
              showMessage('reviewMessage', 'Review submitted successfully!', 'success');
              setTimeout(() => {
                  document.getElementById('reviewModal').style.display = 'none';
                  document.getElementById('reviewForm').reset();
                  loadOrders();
                  loadAllProducts();
              }, 2000);
          } else {
              showMessage('reviewMessage', data.msg || 'Error submitting review', 'error');
          }
      } catch (error) {
          showMessage('reviewMessage', 'Network error. Please try again.', 'error');
      } finally {
          reviewBtn.disabled = false;
          reviewBtn.textContent = 'Submit Review';
      }
});

function showReviewDetails(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (!product || !product.reviews || product.reviews.length === 0) {
    return;
  }

  const reviewDetailsContent = document.getElementById('reviewDetailsContent');
  reviewDetailsContent.innerHTML = product.reviews.map(review => `
    <div class="review-item">
      <div class="review-header">
        <strong>Grade: ${review.qualityGrade}</strong>
        <span>by ${review.dealerId?.businessName || 'a Dealer'} on ${new Date(review.inspectionDate).toLocaleDateString()}</span>
      </div>
      <p><strong>Remarks:</strong> ${review.remarks || 'N/A'}</p>
      <div class="product-details">
        <div class="product-detail-item">
          <div class="product-detail-label">Color</div>
          <div class="product-detail-value">${review.parameters.color || 'N/A'}</div>
        </div>
        <div class="product-detail-item">
          <div class="product-detail-label">Damage Level</div>
          <div class="product-detail-value">${review.parameters.damageLevel || 'N/A'}</div>
        </div>
        <div class="product-detail-item">
          <div class="product-detail-label">Pest Infection</div>
          <div class="product-detail-value">${review.parameters.pestInfection || 0}%</div>
        </div>
      </div>
      ${review.attachments && review.attachments.length > 0 ? `
        <div class="review-attachments">
          <strong>Attachments:</strong>
          <div>
            ${review.attachments.map(url => `<img src="${url}" width="100" alt="Attachment" onclick="openImagePage('${url}')">`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');

  document.getElementById('viewReviewModal').style.display = 'block';
}

function openImagePage(imageUrl) {
  window.open(`image-view.html?url=${encodeURIComponent(imageUrl)}`, '_blank');
}


// BIDDING MODAL FUNCTIONS
function openBidModal(orderId) {
    currentOrderForBid = allOrders.find(o => o._id === orderId);
    if (!currentOrderForBid) return alert("Error: Order details not found.");
    const order = currentOrderForBid;
    document.getElementById('bidOrderId').value = order._id;
    document.getElementById('bidProductInfo').innerHTML = `<p><strong>Product:</strong> ${order.productDetails.varietySpecies}</p><p><strong>Farmer:</strong> ${order.farmerDetails.firstName}</p><p><strong>Approved Quantity:</strong> ${order.quantity} ${order.productDetails.unitOfSale}</p>`;
    const quantityInput = document.getElementById('bidQuantity');
    const priceInput = document.getElementById('bidPricePerUnit');
    quantityInput.value = order.quantity;
    quantityInput.max = order.quantity;
    priceInput.value = order.productDetails.targetPrice;
    document.getElementById('bidDeliveryDate').min = new Date().toISOString().split("T")[0];
    document.getElementById('bidDeliveryAddress').value = currentUser.warehouseAddress || '';
    calculateTotalPrice();
    document.getElementById('bidModal').style.display = 'block';
}

function calculateTotalPrice() {
    const quantity = parseFloat(document.getElementById('bidQuantity').value) || 0;
    const price = parseFloat(document.getElementById('bidPricePerUnit').value) || 0;
    document.getElementById('bidTotalPrice').value = (quantity * price).toFixed(2);
}

document.getElementById('bidQuantity').addEventListener('input', calculateTotalPrice);
document.getElementById('bidPricePerUnit').addEventListener('input', calculateTotalPrice);
document.getElementById('bidForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Bid...';
    const bidData = {
        orderId: document.getElementById('bidOrderId').value,
        orderedQuantity: document.getElementById('bidQuantity').value,
        bidPrice: document.getElementById('bidPricePerUnit').value,
        totalPrice: document.getElementById('bidTotalPrice').value,
        deliveryDate: document.getElementById('bidDeliveryDate').value,
        paymentMethod: document.getElementById('bidPaymentMethod').value,
        deliveryAddress: document.getElementById('bidDeliveryAddress').value,
    };
    try {
        const response = await fetch('http://localhost:3000/api/dealer/place-bid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bidData)
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('bidMessage', 'Bid submitted successfully!', 'success');
            setTimeout(() => {
                document.getElementById('bidModal').style.display = 'none';
                e.target.reset();
                loadOrders();
            }, 2000);
        } else {
            showMessage('bidMessage', data.msg || 'Error submitting bid', 'error');
        }
    } catch (error) {
        showMessage('bidMessage', 'Network error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Bid';
    }
});

function openEditProfileModal() {
    if (!currentUserProfile) {
        alert("Profile data not loaded yet. Please wait.");
        return;
    }
    // Populate the form
    document.getElementById('editFirstName').value = currentUserProfile.firstName || '';
    document.getElementById('editLastName').value = currentUserProfile.lastName || '';
    document.getElementById('editMobile').value = currentUserProfile.mobile || '';
    document.getElementById('editBusinessName').value = currentUserProfile.businessName || '';
    document.getElementById('editGstin').value = currentUserProfile.gstin || '';
    document.getElementById('editWarehouseAddress').value = currentUserProfile.warehouseAddress || '';
    document.getElementById('editPreferredCommodities').value = currentUserProfile.preferredCommodities ? currentUserProfile.preferredCommodities.join(', ') : '';

    document.getElementById('editProfileModal').style.display = 'block';
}

editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = editProfileForm.querySelector('button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const updatedData = {
        firstName: document.getElementById('editFirstName').value,
        lastName: document.getElementById('editLastName').value,
        mobile: document.getElementById('editMobile').value,
        businessName: document.getElementById('editBusinessName').value,
        gstin: document.getElementById('editGstin').value,
        warehouseAddress: document.getElementById('editWarehouseAddress').value,
        preferredCommodities: document.getElementById('editPreferredCommodities').value.split(',').map(s => s.trim()).filter(s => s),
    };

    try {
        const response = await fetch(`http://localhost:3000/api/dealer/profile/${currentUser.email}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();
        const messageEl = document.getElementById('editProfileMessage');

        if (response.ok) {
            showMessage('editProfileMessage', 'Profile updated successfully!', 'success');
            await loadProfile(); // Reload profile data
            setTimeout(() => {
                document.getElementById('editProfileModal').style.display = 'none';
                messageEl.innerHTML = '';
            }, 2000);
        } else {
            showMessage('editProfileMessage', result.msg || 'Failed to update profile.', 'error');
        }
    } catch (error) {
        document.getElementById('editProfileMessage').innerHTML = `<p style="color:red">A network error occurred.</p>`;
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
});

