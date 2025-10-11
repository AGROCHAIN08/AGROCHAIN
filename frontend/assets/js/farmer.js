// ===========================
// GLOBAL VARIABLES & AUTH CHECK
// ===========================
const storedUser = JSON.parse(localStorage.getItem("agroChainUser"));
const userEmail = storedUser?.email;

if (!userEmail) {
  alert("Session expired. Please login again.");
  window.location.href = "login.html";
}

// ===========================
// DOM ELEMENTS
// ===========================
// Navbar elements
const navHomeBtn = document.getElementById("navHomeBtn");
const navNotificationBtn = document.getElementById("navNotificationBtn");
const navOrdersBtn = document.getElementById("navOrdersBtn");
const navSignoutBtn = document.getElementById("navSignoutBtn");
const viewProfileBtn = document.getElementById("viewProfileBtn");
const profileDropdownBtn = document.getElementById("profileDropdownBtn");
const profileDropdownMenu = document.getElementById("profileDropdownMenu");
const farmerNameDisplay = document.getElementById("farmerNameDisplay");
const notificationBadge = document.getElementById("notificationBadge");

// Sections
const inventorySection = document.getElementById("inventorySection");
const notificationsSection = document.getElementById("notificationsSection");
const ordersSection = document.getElementById("ordersSection");
const profileSection = document.getElementById("profileSection");

// Other elements
const cropForm = document.getElementById("cropForm");
const productsGrid = document.getElementById("productsGrid");
const cropError = document.getElementById("cropError");
const successMsg = document.getElementById("successMsg");
const addCropToggleBtn = document.getElementById("addCropToggleBtn");

const profileInfo = document.getElementById("profileInfo");
const notificationsList = document.getElementById("notificationsList");
const farmerOrdersGrid = document.getElementById("farmerOrdersGrid");
// markAllReadBtn is no longer needed

// ===========================
// NAVBAR FUNCTIONALITY
// ===========================

// Update farmer name in navbar
if (storedUser && storedUser.firstName) {
  farmerNameDisplay.textContent = storedUser.firstName;
}

// Profile dropdown toggle
profileDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdownMenu.classList.toggle('show');
  profileDropdownBtn.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.profile-dropdown')) {
    profileDropdownMenu.classList.remove('show');
    profileDropdownBtn.classList.remove('active');
  }
});

// Navigation functions
function setActiveNavLink(activeLink) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

navHomeBtn.onclick = (e) => {
  e.preventDefault();
  showSection(inventorySection);
  setActiveNavLink(navHomeBtn);
};

// ** MODIFIED CODE BLOCK **
// This function now handles marking notifications as read automatically.
navNotificationBtn.onclick = async (e) => {
  e.preventDefault();
  showSection(notificationsSection);
  setActiveNavLink(navNotificationBtn);

  // Automatically mark notifications as read when the panel is opened
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/notifications/${userEmail}/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error("Backend failed to mark notifications as read.");
    }
  } catch (error) {
    console.error("Network error while marking notifications as read:", error);
  }

  // Reload notifications, which will now be read and hide the badge
  loadNotifications();
};
// ** END OF MODIFIED CODE BLOCK **

navOrdersBtn.onclick = (e) => {
  e.preventDefault();
  showSection(ordersSection);
  setActiveNavLink(navOrdersBtn);
  loadFarmerOrders();
};

viewProfileBtn.onclick = (e) => {
  e.preventDefault();
  showSection(profileSection);
  setActiveNavLink(null);
  profileDropdownMenu.classList.remove('show');
  profileDropdownBtn.classList.remove('active');
  loadProfile();
};

function showSection(section) {
  [inventorySection, notificationsSection, ordersSection, profileSection].forEach(sec => {
    sec.style.display = "none";
  });
  section.style.display = "block";
}

// ===========================
// PROFILE MANAGEMENT
// ===========================
async function loadProfile() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/profile/${userEmail}`);
    const data = await res.json();

    if (res.ok) {
      profileInfo.innerHTML = `
        <p><b>Name:</b> ${data.firstName} ${data.lastName || ''}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Mobile:</b> ${data.mobile}</p>
        <p><b>Aadhaar:</b> ${data.aadhaar || 'N/A'}</p>
        <p><b>Farm Location:</b> ${data.farmLocation || "N/A"}</p>
        <p><b>Latitude:</b> ${data.latitude || "N/A"}</p>
        <p><b>Longitude:</b> ${data.longitude || "N/A"}</p>
        <p><b>Farm Size:</b> ${data.farmSize || "N/A"}</p>
        <button id="editProfileBtnInCard" class="add-btn" style="margin-top: 20px;">✏️ Edit Additional Details</button>
      `;

      document.getElementById("editProfileBtnInCard").onclick = () => enableProfileEdit(data);
    } else {
      profileInfo.innerHTML = `<p style="color:red">${data.msg}</p>`;
    }
  } catch {
    profileInfo.innerHTML = `<p style="color:red">Error loading profile.</p>`;
  }
}

function enableProfileEdit(data) {
  document.getElementById("editProfileForm").style.display = "block";
  document.getElementById("editFarmLocation").value = data.farmLocation || "";
  document.getElementById("editLatitude").value = data.latitude || "";
  document.getElementById("editLongitude").value = data.longitude || "";
  document.getElementById("editFarmSize").value = data.farmSize || "";
}

document.getElementById("cancelEditBtn").onclick = () => {
  document.getElementById("editProfileForm").style.display = "none";
};

document.getElementById("getGeoBtn").onclick = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.getElementById("editLatitude").value = position.coords.latitude.toFixed(6);
        document.getElementById("editLongitude").value = position.coords.longitude.toFixed(6);
        alert("📍 Location updated successfully!");
      },
      () => alert("Unable to fetch location. Please allow access.")
    );
  } else {
    alert("Geolocation not supported in this browser.");
  }
};

document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const updatedDetails = {
    farmLocation: document.getElementById("editFarmLocation").value.trim(),
    latitude: document.getElementById("editLatitude").value.trim(),
    longitude: document.getElementById("editLongitude").value.trim(),
    farmSize: document.getElementById("editFarmSize").value.trim(),
  };

  try {
    const res = await fetch(`http://localhost:3000/api/farmer/profile/${userEmail}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDetails),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Profile updated successfully!");
      document.getElementById("editProfileForm").style.display = "none";
      loadProfile();
    } else {
      alert(`❌ ${data.msg || "Failed to update profile"}`);
    }
  } catch (err) {
    alert("Network error. Please try again.");
  }
});

// ===========================
// PRODUCT/CROP MANAGEMENT
// ===========================

async function loadCrops() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/crops/${userEmail}`);
    const crops = await res.json();

    productsGrid.innerHTML = "";
    if (res.ok && crops.length > 0) {
      const availableCrops = crops.filter(c => c.harvestQuantity > 0);
      if (availableCrops.length > 0) {
        availableCrops.forEach((crop, i) => addCropToGrid(crop, i));
      } else {
        productsGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🌾</div>
            <h3>All products sold out!</h3>
            <p>Add a new product to continue selling.</p>
          </div>
        `;
      }
    } else {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🌱</div>
          <h3>No Products Added Yet</h3>
          <p>Start by adding your first product to showcase your harvest</p>
          <button class="add-btn" onclick="document.getElementById('addCropToggleBtn').click()">
            Add Your First Product
          </button>
        </div>
      `;
    }
  } catch {
    productsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to Load Products</h3>
        <p>Please check your connection and try again</p>
      </div>
    `;
  }
}

cropForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  cropError.textContent = "";
  successMsg.textContent = "";

  const formData = new FormData();
  formData.append("productType", document.getElementById("productType").value);
  formData.append("varietySpecies", document.getElementById("varietySpecies").value);
  formData.append("harvestQuantity", document.getElementById("harvestQuantity").value);
  formData.append("unitOfSale", document.getElementById("unitOfSale").value);
  formData.append("targetPrice", document.getElementById("targetPrice").value);
  formData.append("image", document.getElementById("image").files[0]);

  try {
    const res = await fetch(`http://localhost:3000/api/farmer/crops/${userEmail}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      successMsg.textContent = "✅ Product added successfully!";
      cropForm.reset();
      cropForm.style.display = "none";
      addCropToggleBtn.textContent = "+ Add New Product";
      loadCrops();
    } else {
      cropError.textContent = data.msg || "Error adding product";
    }
  } catch (err) {
    cropError.textContent = "Network error. Please try again.";
  }
});

const unitSelect = document.getElementById("unitOfSale");
const priceUnitLabel = document.getElementById("priceUnitLabel");

unitSelect.addEventListener("change", () => {
  const unit = unitSelect.value;
  priceUnitLabel.textContent = unit ? `per ${unit}` : "";
});

function addCropToGrid(crop, index) {
  if (crop.harvestQuantity <= 0) {
    removeCropCardIfOutOfStock(crop._id);
    return;
  }

  let reviewsHTML = '';
  if (crop.reviews && crop.reviews.length > 0) {
    const avgRating = (crop.reviews.reduce((sum, r) => sum + r.rating, 0) / crop.reviews.length).toFixed(1);
    reviewsHTML = `
      <div class="product-reviews-section">
        <h4 class="reviews-header">⭐ Reviews (${crop.reviews.length}) - Avg: ${avgRating}/5</h4>
        <div class="reviews-list">
          ${crop.reviews.slice(0, 2).map(review => `
            <div class="review-card">
              <div class="review-header-row">
                <span class="review-quality-badge">${review.quality}</span>
                <span class="review-rating-stars">${'⭐'.repeat(review.rating)}</span>
              </div>
              <p class="review-text">${review.comments}</p>
              <div class="review-footer">
                <small>By: ${review.dealerEmail}</small>
                <small>${new Date(review.date).toLocaleDateString()}</small>
              </div>
            </div>
          `).join('')}
          ${crop.reviews.length > 2 ? `<small class="more-reviews">+${crop.reviews.length - 2} more reviews</small>` : ''}
        </div>
      </div>
    `;
  }

  const card = document.createElement("div");
  card.className = "product-card";
  card.setAttribute("data-crop-id", crop._id);

  card.innerHTML = `
    <img src="${crop.imageUrl}" alt="${crop.varietySpecies}" class="product-card-image">
    
    <div class="product-card-content">
      <div class="product-header">
        <div class="product-title">
          <h3>${crop.varietySpecies}</h3>
          <span class="product-type">${crop.productType}</span>
        </div>
      </div>
      
      <div class="product-details">
        <div class="product-detail-item">
          <div class="product-detail-label">Quantity</div>
          <div class="product-detail-value">${crop.harvestQuantity} ${crop.unitOfSale}</div>
        </div>
        <div class="product-detail-item price-highlight">
          <div class="product-detail-label">Target Price</div>
          <div class="product-detail-value">₹${crop.targetPrice} per ${crop.unitOfSale}</div>
        </div>
      </div>

      ${reviewsHTML}
      
      <div class="product-actions">
        <button class="action-btn edit-btn" onclick="editCrop('${index}')">
          📝 Edit
        </button>
        <button class="action-btn delete-btn" onclick="deleteCrop('${index}')">
          🗑️ Delete
        </button>
      </div>
    </div>
  `;

  productsGrid.appendChild(card);
}

function removeCropCardIfOutOfStock(cropId) {
  const card = document.querySelector(`.product-card[data-crop-id='${cropId}']`);
  if (card) {
    card.remove();
  }
}

function editCrop(id) {
  alert("Edit functionality coming soon!");
}

async function deleteCrop(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/crops/${userEmail}/${id}`, { 
      method: "DELETE" 
    });
    
    const data = await res.json();
    
    if (res.ok) {
      successMsg.textContent = "🗑️ Product deleted successfully!";
      loadCrops();
    } else {
      cropError.textContent = data.msg || "Error deleting product";
    }
  } catch {
    cropError.textContent = "Network error. Please try again.";
  }
}

addCropToggleBtn.onclick = () => {
  const isHidden = cropForm.style.display === "none";
  cropForm.style.display = isHidden ? "block" : "none";
  addCropToggleBtn.textContent = isHidden ? "Cancel" : "+ Add New Product";
  
  if (!isHidden) {
    cropForm.reset();
    cropError.textContent = "";
    successMsg.textContent = "";
  }
};

document.querySelectorAll('#cropForm input, #cropForm select, #cropForm textarea').forEach(field => {
  field.addEventListener('input', () => {
    cropError.textContent = "";
    successMsg.textContent = "";
  });
});

// ===========================
// ORDERS & NOTIFICATIONS
// ===========================

async function loadFarmerOrders() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/orders/${userEmail}`);
    const orders = await res.json();

    if (res.ok && orders.length > 0) {
      farmerOrdersGrid.innerHTML = orders.map(order => createFarmerOrderCard(order)).join('');
    } else {
      farmerOrdersGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>Vehicle assignments for your products will appear here</p>
        </div>
      `;
    }
  } catch (error) {
    farmerOrdersGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Error Loading Orders</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

function createFarmerOrderCard(order) {
  const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
  const statusBadgeClass = `status-${statusClass}`;
  
  let bidSection = '';
  if (order.status === 'Bid Placed' && order.bidStatus === 'Pending') {
    bidSection = `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 15px;">
        <h4 style="margin-top: 0; color: #d97706;">💰 New Bid Received</h4>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div>
            <p style="margin: 5px 0;"><strong>Original Price:</strong> ₹${order.originalPrice} per ${order.productDetails.unitOfSale}</p>
            <p style="margin: 5px 0;"><strong>Bid Price:</strong> ₹${order.bidPrice} per ${order.productDetails.unitOfSale}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="acceptBid('${order._id}')" style="flex: 1; background: #10b981; color: white; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            ✓ Accept Bid
          </button>
          <button onclick="rejectBid('${order._id}')" style="flex: 1; background: #ef4444; color: white; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            ✗ Reject Bid
          </button>
        </div>
      </div>
    `;
  } else if (order.status === 'Bid Accepted' && order.receiptNumber) {
    bidSection = `
      <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin-top: 15px;">
        <h4 style="margin-top: 0; color: #059669;">✓ Bid Accepted</h4>
        <p style="margin: 5px 0;"><strong>Final Price:</strong> ₹${order.bidPrice} per ${order.productDetails.unitOfSale}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Receipt Number:</strong> ${order.receiptNumber}</p>
        <button onclick="viewFarmerReceipt('${order._id}')" style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px;">
          📄 View Receipt
        </button>
      </div>
    `;
  } else if (order.status === 'Bid Rejected') {
    bidSection = `
      <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; margin-top: 15px;">
        <h4 style="margin-top: 0; color: #dc2626;">✗ Bid Rejected</h4>
        <p style="margin: 5px 0;">You rejected the dealer's bid of ₹${order.bidPrice}</p>
      </div>
    `;
  }
  
  return `
    <div class="farmer-order-card ${statusClass}">
      <span class="order-status-badge ${statusBadgeClass}">${order.status}</span>
      
      <div class="order-product-info">
        <div class="order-product-name">${order.productDetails.varietySpecies}</div>
        <div style="color: #6b7280; font-size: 14px;">${order.productDetails.productType}</div>
      </div>
      
      <div class="order-details-grid">
        <div class="order-detail-item">
          <div class="order-detail-label">Quantity</div>
          <div class="order-detail-value">${order.quantity} ${order.productDetails.unitOfSale}</div>
        </div>
        <div class="order-detail-item">
          <div class="order-detail-label">Vehicle</div>
          <div class="order-detail-value">${order.vehicleDetails.vehicleId}</div>
        </div>
        <div class="order-detail-item">
          <div class="order-detail-label">Total Amount</div>
          <div class="order-detail-value">₹${order.totalAmount.toFixed(2)}</div>
        </div>
        <div class="order-detail-item">
          <div class="order-detail-label">Assigned Date</div>
          <div class="order-detail-value">${new Date(order.assignedDate).toLocaleDateString()}</div>
        </div>
      </div>
      
      <div class="dealer-info-panel">
        <div class="dealer-info-title">🏢 Dealer Information</div>
        <div class="dealer-contact-info">
          <span><strong>Name:</strong> ${order.dealerDetails.businessName || `${order.dealerDetails.firstName} ${order.dealerDetails.lastName}`}</span>
          <span><strong>Mobile:</strong> ${order.dealerDetails.mobile}</span>
          <span><strong>Email:</strong> ${order.dealerDetails.email}</span>
        </div>
      </div>

      ${bidSection}
    </div>
  `;
}

// ===========================
// BID ACCEPTANCE/REJECTION
// ===========================

async function acceptBid(orderId) {
  if (!confirm('Are you sure you want to accept this bid?')) return;
  
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/accept-bid/${userEmail}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ Bid accepted! Receipt Number: ${data.receiptNumber}`);
      loadFarmerOrders();
      loadCrops();
      loadNotifications();
    } else {
      alert(`❌ ${data.msg || 'Error accepting bid'}`);
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}

async function rejectBid(orderId) {
  if (!confirm('Are you sure you want to reject this bid? The product will become available again.')) return;
  
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/reject-bid/${userEmail}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Bid rejected successfully.');
      loadFarmerOrders();
      loadCrops();
    } else {
      alert(`❌ ${data.msg || 'Error rejecting bid'}`);
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}

// ===========================
// RECEIPT VIEWING
// ===========================

async function viewFarmerReceipt(orderId) {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/orders/${userEmail}`);
    const orders = await res.json();
    
    const order = orders.find(o => o._id === orderId);
    
    if (!order || !order.receiptNumber) {
      alert('Receipt not available');
      return;
    }
    
    const modal = document.getElementById('farmerReceiptModal');
    const receiptContent = document.getElementById('farmerReceiptContent');
    
    receiptContent.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1f2937;">ORDER RECEIPT</h2>
        <p style="margin: 5px 0; color: #6b7280;">AgroChain Platform</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p><strong>Receipt Number:</strong> ${order.receiptNumber}</p>
        <p><strong>Date:</strong> ${new Date(order.receiptGeneratedAt).toLocaleDateString()}</p>
      </div>
      
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #1f2937;">Product Details</h3>
        <p><strong>Product:</strong> ${order.productDetails.varietySpecies}</p>
        <p><strong>Type:</strong> ${order.productDetails.productType}</p>
        <p><strong>Quantity:</strong> ${order.quantity} ${order.productDetails.unitOfSale}</p>
        <p><strong>Original Price:</strong> ₹${order.originalPrice} per ${order.productDetails.unitOfSale}</p>
        <p><strong>Agreed Price:</strong> ₹${order.bidPrice} per ${order.productDetails.unitOfSale}</p>
        <p style="font-size: 18px; font-weight: bold; color: #059669;"><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
      </div>
      
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #1f2937;">Dealer Details</h3>
        <p><strong>Name:</strong> ${order.dealerDetails.businessName || `${order.dealerDetails.firstName} ${order.dealerDetails.lastName}`}</p>
        <p><strong>Email:</strong> ${order.dealerDetails.email}</p>
        <p><strong>Mobile:</strong> ${order.dealerDetails.mobile}</p>
      </div>
      
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
        <h3 style="margin-top: 0; color: #1f2937;">Farmer Details</h3>
        <p><strong>Name:</strong> ${storedUser.firstName} ${storedUser.lastName || ''}</p>
        <p><strong>Email:</strong> ${storedUser.email}</p>
        <p><strong>Mobile:</strong> ${storedUser.mobile}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #1f2937;">
        <p style="color: #6b7280; font-size: 14px;">Thank you for your business!</p>
        <p style="color: #6b7280; font-size: 12px;">This is a computer-generated receipt</p>
      </div>
    `;
    
    modal.style.display = 'block';
  } catch (error) {
    alert('Error loading receipt');
  }
}

function closeFarmerReceiptModal() {
  document.getElementById('farmerReceiptModal').style.display = 'none';
}

function printFarmerReceipt() {
  window.print();
}

// ===========================
// NOTIFICATIONS
// ===========================

async function loadNotifications() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/notifications/${userEmail}`);
    const notifications = await res.json();

    if (res.ok && notifications.length > 0) {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      updateNotificationBadge(unreadCount);
      
      notificationsList.innerHTML = notifications.map(notification => createNotificationItem(notification)).join('');
    } else {
      updateNotificationBadge(0);
      notificationsList.innerHTML = `
        <div style="text-align: center; color: #6b7280; padding: 60px 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">🔔</div>
          <h3 style="color: #1f2937; margin-bottom: 10px;">No Notifications</h3>
          <p>You're all caught up! New notifications will appear here.</p>
        </div>
      `;
    }
  } catch (error) {
    notificationsList.innerHTML = `
      <div style="text-align: center; color: #ef4444; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h3 style="color: #1f2937; margin-bottom: 10px;">Error Loading Notifications</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

function updateNotificationBadge(count) {
  if (count > 0) {
    notificationBadge.textContent = count > 99 ? '99+' : count;
    notificationBadge.style.display = 'block';
  } else {
    notificationBadge.style.display = 'none';
  }
}

function createNotificationItem(notification) {
  const timeAgo = getTimeAgo(new Date(notification.timestamp));
  
  return `
    <div class="notification-item ${notification.isRead ? '' : 'unread'}">
      <div class="notification-header">
        <span class="notification-title">${notification.title}</span>
        <span class="notification-time">${timeAgo}</span>
      </div>
      <div class="notification-message">${notification.message}</div>
      <div class="notification-details">
        <strong>Vehicle:</strong> ${notification.orderDetails.vehicleId}<br>
        <strong>Dealer Contact:</strong> ${notification.orderDetails.dealerContact}
      </div>
    </div>
  `;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// ** REMOVED "Mark all as read" button logic **

// ===========================
// SIGN OUT
// ===========================
navSignoutBtn.onclick = (e) => {
  e.preventDefault();
  const confirmLogout = confirm("Are you sure you want to sign out?");
  if (confirmLogout) {
    localStorage.clear();
    window.location.href = "login.html";
  }
};

// ===========================
// INITIALIZATION & AUTO-REFRESH
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  showSection(inventorySection);
  setActiveNavLink(navHomeBtn);
  loadProfile();
  loadCrops();
  loadNotifications(); // Load initial notification count
  
  // Auto-refresh notifications every 30 seconds
  setInterval(() => {
    // Only refresh if the notification section isn't currently displayed
    if (notificationsSection.style.display === "none") {
      loadNotifications();
    }
  }, 30000);
});