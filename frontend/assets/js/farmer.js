// ---------------- Farmer Dashboard JS ----------------
const storedUser = JSON.parse(localStorage.getItem("agroChainUser"));
const userEmail = storedUser?.email;
let allCrops = [];
let currentUserProfile = null; // To store current profile data

// Redirect to login if not found
if (!userEmail) {
  alert("Session expired. Please login again.");
  window.location.href = "login.html";
}

// Sidebar buttons
const inventoryBtn = document.getElementById("inventoryBtn");
const ordersBtn = document.getElementById("ordersBtn");
const historyBtn = document.getElementById("historyBtn");
const profileBtn = document.getElementById("profileBtn");
const signoutBtn = document.getElementById("signoutBtn");

// Sections
const inventorySection = document.getElementById("inventorySection");
const ordersSection = document.getElementById("ordersSection");
const historySection = document.getElementById("historySection");
const profileSection = document.getElementById("profileSection");

// Crop Form Elements
const cropForm = document.getElementById("cropForm");
const productsGrid = document.getElementById("productsGrid");
const cropError = document.getElementById("cropError");
const successMsg = document.getElementById("successMsg");
const addCropToggleBtn = document.getElementById("addCropToggleBtn");
const getLocationBtn = document.getElementById("getLocationBtn");

// Profile Elements
const profileInfo = document.getElementById("profileInfo");
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileModal = document.getElementById("editProfileModal");
const editProfileForm = document.getElementById("editProfileForm");

// Orders Elements
const notificationsList = document.getElementById("notificationsList");
const farmerOrdersGrid = document.getElementById("farmerOrdersGrid");
const farmerHistoryGrid = document.getElementById("farmerHistoryGrid");

// ---------------- Sidebar Navigation ----------------
inventoryBtn.onclick = () => showSection(inventorySection);
ordersBtn.onclick = () => {
  showSection(ordersSection);
  loadFarmerOrders();
  loadNotifications();
};
historyBtn.onclick = () => {
    showSection(historySection);
    loadOrderHistory();
};
profileBtn.onclick = () => showSection(profileSection);

function showSection(section) {
  [inventorySection, ordersSection, historySection, profileSection].forEach(sec => sec.style.display = "none");
  section.style.display = "block";
}

// ---------------- Geolocation Handler ----------------
getLocationBtn.onclick = () => {
  if (navigator.geolocation) {
    getLocationBtn.textContent = "📍 Getting Location...";
    getLocationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        document.getElementById("originLatitude").value = lat.toFixed(6);
        document.getElementById("originLongitude").value = lng.toFixed(6);
        document.getElementById("geotagLocation").value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        getLocationBtn.textContent = "📍 Location Retrieved";
        getLocationBtn.disabled = false;
      },
      (error) => {
        alert("Unable to retrieve location. Please enter manually.");
        getLocationBtn.textContent = "📍 Get Current Location";
        getLocationBtn.disabled = false;
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
};

// ---------------- Load Farmer Profile ----------------
async function loadProfile() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/profile/${userEmail}`);
    const data = await res.json();
    currentUserProfile = data; // Store profile data

    if (res.ok) {
      profileInfo.innerHTML = `
        <div class="profile-grid">
            <div class="profile-item"><span>Name:</span> ${data.firstName} ${data.lastName || ''}</div>
            <div class="profile-item"><span>Email:</span> ${data.email}</div>
            <div class="profile-item"><span>Mobile:</span> ${data.mobile}</div>
            <div class="profile-item"><span>Aadhaar:</span> ${data.aadhaar}</div>
            <div class="profile-item"><span>Farm Location:</span> ${data.farmLocation}</div>
            <div class="profile-item"><span>Farm Size:</span> ${data.farmSize}</div>
            <div class="profile-item" style="grid-column: 1 / -1;"><span>Crops Grown:</span> ${data.cropsGrown.join(', ') || "N/A"}</div>
        </div>
      `;
    } else {
      profileInfo.innerHTML = `<p style="color:red">${data.msg}</p>`;
    }
  } catch {
    profileInfo.innerHTML = `<p style="color:red">Error loading profile.</p>`;
  }
}

// ---------------- Load Crops ----------------
async function loadCrops() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/crops/${userEmail}`);
    const crops = await res.json();
    allCrops = crops;

    productsGrid.innerHTML = "";
    if (res.ok && crops.length > 0) {
      crops.forEach((crop, i) => addCropToGrid(crop, i));
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

// ---------------- Add Crop ----------------
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
  formData.append("geotagLocation", document.getElementById("geotagLocation").value);
  formData.append("originLatitude", document.getElementById("originLatitude").value);
  formData.append("originLongitude", document.getElementById("originLongitude").value);
  formData.append("fieldAddress", document.getElementById("fieldAddress").value);
  formData.append("availabilityStatus", document.getElementById("availabilityStatus").value);
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
      addCropToggleBtn.textContent = "Add New Product";
      loadCrops();
    } else {
      cropError.textContent = data.msg || "Error adding product";
    }
  } catch (err) {
    cropError.textContent = "Network error. Please try again.";
  }
});

// ---------------- Helper: Add Crop to Grid ----------------
function addCropToGrid(crop, index) {
  const statusClass = getStatusClass(crop.availabilityStatus);
  const reviewsCount = crop.reviews ? crop.reviews.length : 0;

  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <img src="${crop.imageUrl}" alt="${crop.varietySpecies}" class="product-card-image" onclick="openImagePage('${crop.imageUrl}')">
    <div class="product-card-content">
      <div class="product-header">
        <div class="product-title">
          <h3>${crop.varietySpecies}</h3>
          <span class="product-type">${crop.productType}</span>
        </div>
        <span class="availability-tag ${statusClass}">${crop.availabilityStatus}</span>
      </div>
      <div class="product-details">
        <div class="product-detail-item">
          <div class="product-detail-label">Quantity</div>
          <div class="product-detail-value">${crop.harvestQuantity} ${crop.unitOfSale}</div>
        </div>
        <div class="product-detail-item price-highlight">
          <div class="product-detail-label">Target Price</div>
          <div class="product-detail-value">₹${crop.targetPrice}</div>
        </div>
      </div>
      <div class="product-location">
        <div class="product-location-label">Farm Location</div>
        <div class="product-location-value">${crop.geotagLocation}</div>
        <div class="product-location-value">${crop.fieldAddress}</div>
        <div class="product-coordinates">
          📍 ${crop.originLatitude?.toFixed(4)}, ${crop.originLongitude?.toFixed(4)}
        </div>
      </div>
      <div class="product-actions">
        <button class="action-btn edit-btn" onclick="editCrop('${index}')">
          📝 Edit
        </button>
        <button class="action-btn delete-btn" onclick="deleteCrop('${index}')">
          🗑️ Delete
        </button>
        ${reviewsCount > 0 ? `<button class="action-btn" style="background-color: #4f46e5;" onclick="showReviewDetails('${crop._id}')">⭐ View Reviews (${reviewsCount})</button>` : ''}
      </div>
    </div>
  `;
  productsGrid.appendChild(card);
}

// Helper function to get status CSS class
function getStatusClass(status) {
  switch(status) {
    case 'Available': return 'status-available';
    case 'Out of Stock': return 'status-out-of-stock';
    case 'Coming Soon': return 'status-coming-soon';
    case 'Inspection Initiated': return 'status-inspection-initiated';
    default: return 'status-available';
  }
}

// ---------------- Edit Crop (Placeholder) ----------------
function editCrop(id) {
  alert("Edit functionality coming soon!");
}

// ---------------- Delete Crop ----------------
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

// ---------------- Toggle Add Crop Form ----------------
addCropToggleBtn.onclick = () => {
  const isHidden = cropForm.style.display === "none";
  cropForm.style.display = isHidden ? "block" : "none";
  addCropToggleBtn.textContent = isHidden ? "Cancel" : "Add New Product";

  if (!isHidden) {
    cropForm.reset();
    cropError.textContent = "";
    successMsg.textContent = "";
  }
};

// ---------------- Sign Out ----------------
signoutBtn.onclick = () => {
  if (confirm("Are you sure you want to sign out?")) {
    localStorage.clear();
    window.location.href = "login.html";
  }
};

// ---------------- Initialize ----------------
document.addEventListener('DOMContentLoaded', () => {
  showSection(inventorySection);
  loadProfile();
  loadCrops();
});

// Clear messages when form values change
document.querySelectorAll('#cropForm input, #cropForm select, #cropForm textarea').forEach(field => {
  field.addEventListener('input', () => {
    cropError.textContent = "";
    successMsg.textContent = "";
  });
});

// ---------------- Load Farmer Active Orders ----------------
async function loadFarmerOrders() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/orders/${userEmail}`);
    const allOrders = await res.json();
    if (res.ok) {
        const activeOrders = allOrders.filter(order => order.status !== 'Completed' && order.status !== 'Cancelled');
        if (activeOrders.length > 0) {
            farmerOrdersGrid.innerHTML = activeOrders.map(order => createFarmerOrderCard(order)).join('');
        } else {
          farmerOrdersGrid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No Active Orders</h3><p>New vehicle assignments and bids for your products will appear here.</p></div>`;
        }
    } else {
        farmerOrdersGrid.innerHTML = `<div class="empty-state"><h3>Error loading orders</h3><p>${allOrders.msg || ''}</p></div>`;
    }
  } catch (error) {
    farmerOrdersGrid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error Loading Orders</h3><p>Please try again later</p></div>`;
  }
}

// ---------------- Load Order History ----------------
async function loadOrderHistory() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/orders/${userEmail}`);
    const allOrders = await res.json();
    if (res.ok) {
        const pastOrders = allOrders.filter(order => order.status === 'Completed' || order.status === 'Cancelled');
        if (pastOrders.length > 0) {
            farmerHistoryGrid.innerHTML = pastOrders.map(order => createFarmerOrderCard(order)).join('');
        } else {
            farmerHistoryGrid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📜</div><h3>No Order History</h3><p>Your completed and cancelled orders will appear here.</p></div>`;
        }
    } else {
      farmerHistoryGrid.innerHTML = `<div class="empty-state"><h3>Error loading history</h3><p>${allOrders.msg || ''}</p></div>`;
    }
  } catch (error) {
    farmerHistoryGrid.innerHTML = `<div class="empty-state"><h3>Network error loading history</h3></div>`;
  }
}

function createFarmerOrderCard(order) {
  const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
  const statusBadgeClass = `status-${statusClass}`;
  
  let actionButtons = '';
  let bidDetails = '';

  if (order.status === 'Bid Placed') {
      actionButtons = `
        <div class="product-actions" style="margin-top: 15px;">
          <button class="action-btn" style="background-color: #16a34a; flex: 1;" onclick="respondToBid('${order._id}', 'Accepted')">
            ✔ Accept Bid
          </button>
          <button class="action-btn delete-btn" style="flex: 1;" onclick="respondToBid('${order._id}', 'Rejected')">
            ✖ Reject Bid
          </button>
        </div>
      `;
      bidDetails = `
        <div class="order-detail-item" style="background: #fefce8; border-color: #facc15; grid-column: 1 / -1;">
          <div class="order-detail-label" style="color: #ca8a04;">DEALER'S BID</div>
          <div class="order-detail-value">
             ${order.quantity} ${order.productDetails.unitOfSale} at ₹${order.bidPrice.toFixed(2)}/unit = <strong>₹${order.negotiatedTotalAmount.toFixed(2)} Total</strong>
          </div>
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
        ${bidDetails}
        <div class="order-detail-item">
          <div class="order-detail-label">Quantity</div>
          <div class="order-detail-value">${order.quantity} ${order.productDetails.unitOfSale}</div>
        </div>
        <div class="order-detail-item">
          <div class="order-detail-label">Vehicle</div>
          <div class="order-detail-value">${order.vehicleDetails.vehicleId}</div>
        </div>
        <div class="order-detail-item">
          <div class="order-detail-label">Final Amount</div>
          <div class="order-detail-value">₹${(order.negotiatedTotalAmount || order.totalAmount).toFixed(2)}</div>
        </div>
        <div class="order-detail-item">
          <div class="order-detail-label">Order Date</div>
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
      ${actionButtons}
    </div>
  `;
}

// ---------------- Respond to Bid ----------------
async function respondToBid(orderId, response) {
    const confirmationText = response === 'Accepted'
        ? "Are you sure you want to accept this bid? This will update your inventory and complete the order."
        : "Are you sure you want to reject this bid?";
    
    if (!confirm(confirmationText)) return;

    try {
        const res = await fetch('http://localhost:3000/api/farmer/respond-bid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, response })
        });
        const data = await res.json();
        if (res.ok) {
            alert(`Success: ${data.msg}`);
            loadFarmerOrders(); // Refresh the active orders list
            loadCrops(); // Refresh inventory to show reduced quantity
        } else {
            alert(`Error: ${data.msg}`);
        }
    } catch (error) {
        alert("A network error occurred. Please try again.");
    }
}

// ---------------- Load Notifications ----------------
async function loadNotifications() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/notifications/${userEmail}`);
    const notifications = await res.json();
    if (res.ok && notifications.length > 0) {
      notificationsList.innerHTML = notifications.map(notification => createNotificationItem(notification)).join('');
    } else {
      notificationsList.innerHTML = `<div style="text-align: center; color: #6b7280; padding: 20px;"><div style="font-size: 24px; margin-bottom: 10px;">🔔</div><p>No new notifications</p></div>`;
    }
  } catch (error) {
    notificationsList.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px;"><p>Error loading notifications</p></div>`;
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
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// ---------------- Review Section ----------------
function showReviewDetails(productId) {
  const product = allCrops.find(p => p._id === productId);
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

// ---------------- Profile Edit Functionality ----------------
editProfileBtn.onclick = () => openEditProfileModal();
document.querySelector('.close-edit-profile').onclick = () => editProfileModal.style.display = 'none';

function openEditProfileModal() {
    if (!currentUserProfile) {
        alert("Profile data not loaded yet. Please wait.");
        return;
    }
    // Populate the form
    document.getElementById('editFirstName').value = currentUserProfile.firstName || '';
    document.getElementById('editLastName').value = currentUserProfile.lastName || '';
    document.getElementById('editMobile').value = currentUserProfile.mobile || '';
    document.getElementById('editAadhaar').value = currentUserProfile.aadhaar || '';
    document.getElementById('editFarmLocation').value = currentUserProfile.farmLocation || '';
    document.getElementById('editFarmSize').value = currentUserProfile.farmSize || '';
    document.getElementById('editCropsGrown').value = currentUserProfile.cropsGrown ? currentUserProfile.cropsGrown.join(', ') : '';

    editProfileModal.style.display = 'block';
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
        aadhaar: document.getElementById('editAadhaar').value,
        farmLocation: document.getElementById('editFarmLocation').value,
        farmSize: document.getElementById('editFarmSize').value,
        cropsGrown: document.getElementById('editCropsGrown').value.split(',').map(s => s.trim()).filter(s => s),
    };

    try {
        const response = await fetch(`http://localhost:3000/api/farmer/profile/${userEmail}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const result = await response.json();
        const messageEl = document.getElementById('editProfileMessage');

        if (response.ok) {
            messageEl.innerHTML = `<p style="color:green">Profile updated successfully!</p>`;
            await loadProfile(); // Reload profile data
            setTimeout(() => {
                editProfileModal.style.display = 'none';
                messageEl.innerHTML = '';
            }, 2000);
        } else {
            messageEl.innerHTML = `<p style="color:red">${result.msg || 'Failed to update profile.'}</p>`;
        }
    } catch (error) {
        document.getElementById('editProfileMessage').innerHTML = `<p style="color:red">A network error occurred.</p>`;
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
});

// ---------------- Modal Close Handlers ----------------
window.addEventListener('click', function(event) {
    const viewReviewModal = document.getElementById('viewReviewModal');
    if (event.target == viewReviewModal) viewReviewModal.style.display = 'none';
    if (event.target == editProfileModal) editProfileModal.style.display = 'none';
});

document.querySelector('.close-view-review').onclick = function() { document.getElementById('viewReviewModal').style.display = 'none'; };

