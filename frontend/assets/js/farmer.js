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

// Mobile toggle elements
const menuToggleBtn = document.getElementById("menuToggleBtn");
const navLinksContainer = document.getElementById("navLinksContainer");

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

// Store current crops for reference
let allCrops = [];
let editingCropId = null;
let isLoadingProducts = false;
let isSubmittingForm = false;


// ===========================
// NAVBAR & MOBILE TOGGLE FUNCTIONALITY
// ===========================

// Update farmer name in navbar
if (storedUser && storedUser.firstName) {
  farmerNameDisplay.textContent = storedUser.firstName;
}

// Toggle the mobile menu event listener
if (menuToggleBtn) {
    menuToggleBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
        menuToggleBtn.textContent = navLinksContainer.classList.contains('active') ? '✖' : '☰';
    });
}

// Helper function to close the mobile menu
function closeMobileMenu() {
    if(navLinksContainer && navLinksContainer.classList.contains('active')) {
        navLinksContainer.classList.remove('active');
        if (menuToggleBtn) menuToggleBtn.textContent = '☰';
    }
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
  showSection(inventorySection, 'inventory'); 
  setActiveNavLink(navHomeBtn);
  closeMobileMenu();
};

navNotificationBtn.onclick = async (e) => {
  e.preventDefault();
  showSection(notificationsSection, 'notifications'); 
  setActiveNavLink(navNotificationBtn);
  closeMobileMenu();
  
  // Navigate to notification section and mark as read
  markNotificationsAsRead();
};

navOrdersBtn.onclick = (e) => {
  e.preventDefault();
  showSection(ordersSection, 'orders'); 
  setActiveNavLink(navOrdersBtn);
  closeMobileMenu();
  loadFarmerOrders();
};

viewProfileBtn.onclick = (e) => {
  e.preventDefault();
  showSection(profileSection, 'profile'); 
  setActiveNavLink(null);
  profileDropdownMenu.classList.remove('show');
  profileDropdownBtn.classList.remove('active');
  closeMobileMenu();
  loadProfile();
};

// This function now saves the current section to localStorage
function showSection(section, sectionName) {
  [inventorySection, notificationsSection, ordersSection, profileSection].forEach(sec => {
    sec.style.display = "none";
  });
  
  if (section) {
    section.style.display = "block";
    if (sectionName) {
      localStorage.setItem('farmerDashboardSection', sectionName);
    }
  }
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
  // Prevent multiple concurrent requests
  if (isLoadingProducts) {
    console.log('Products already loading, skipping...');
    return;
  }

  isLoadingProducts = true;
  const addBtn = document.getElementById('addCropToggleBtn');
  const originalBtnText = addBtn.textContent;
  
  try {
    // Show loading state
    addBtn.disabled = true;
    addBtn.textContent = '⏳ Loading products... Please wait';
    addBtn.style.opacity = '0.6';
    addBtn.style.cursor = 'not-allowed';

    const res = await fetch(`http://localhost:3000/api/farmer/crops/${userEmail}`);
    const crops = await res.json();

    // Store all crops for reference
    allCrops = crops;

    productsGrid.innerHTML = "";
    if (res.ok && crops.length > 0) {
      const availableCrops = crops.filter(c => c.harvestQuantity > 0);
      if (availableCrops.length > 0) {
        availableCrops.forEach((crop) => addCropToGrid(crop));
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
  } catch (error) {
    console.error('Error loading crops:', error);
    productsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to Load Products</h3>
        <p>Please check your connection and try again</p>
      </div>
    `;
  } finally {
    // Reset button state
    isLoadingProducts = false;
    addBtn.disabled = false;
    addBtn.textContent = originalBtnText;
    addBtn.style.opacity = '1';
    addBtn.style.cursor = 'pointer';
  }
}

cropForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (isSubmittingForm) {
    console.log('Form already submitting, please wait...');
    return;
  }

  isSubmittingForm = true;
  const submitBtn = cropForm.querySelector("button[type='submit']");
  const originalSubmitText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting... Please wait';
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';

    cropError.textContent = "";
    successMsg.textContent = "";

    const formData = new FormData();
    formData.append("productType", document.getElementById("productType").value);
    formData.append("varietySpecies", document.getElementById("varietySpecies").value);
    formData.append("harvestQuantity", document.getElementById("harvestQuantity").value);
    formData.append("unitOfSale", document.getElementById("unitOfSale").value);
    formData.append("targetPrice", document.getElementById("targetPrice").value);
    
    // Only append image if it's a new upload
    const imageInput = document.getElementById("image");
    if (imageInput.files[0]) {
      formData.append("image", imageInput.files[0]);
    }

    const endpoint = editingCropId 
      ? `http://localhost:3000/api/farmer/crops/${userEmail}/${editingCropId}`
      : `http://localhost:3000/api/farmer/crops/${userEmail}`;
    
    const method = editingCropId ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method: method,
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      const action = editingCropId ? "updated" : "added";
      successMsg.textContent = `✅ Product ${action} successfully!`;
      cropForm.reset();
      cropForm.style.display = "none";
      addCropToggleBtn.textContent = "+ Add New Product";
      editingCropId = null;
      
      // Reset image input requirement
      document.getElementById("image").required = true;
      
      loadCrops();
    } else {
      cropError.textContent = data.msg || "Error processing product";
    }
  } catch (err) {
    cropError.textContent = "Network error. Please try again.";
    console.error('Form submission error:', err);
  } finally {
    isSubmittingForm = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalSubmitText;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
  }
});

const unitSelect = document.getElementById("unitOfSale");
const priceUnitLabel = document.getElementById("priceUnitLabel");

unitSelect.addEventListener("change", () => {
  const unit = unitSelect.value;
  priceUnitLabel.textContent = unit ? `per ${unit}` : "";
});

function addCropToGrid(crop) {
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
        <button class="action-btn edit-btn" onclick="editCrop('${crop._id}')">
          📝 Edit
        </button>
        <button class="action-btn delete-btn" onclick="deleteCrop('${crop._id}')">
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

function editCrop(cropId) {
  const crop = allCrops.find(c => c._id === cropId);
  if (!crop) {
    alert("Product not found");
    return;
  }

  // Populate form with crop data
  document.getElementById("productType").value = crop.productType;
  document.getElementById("varietySpecies").value = crop.varietySpecies;
  document.getElementById("harvestQuantity").value = crop.harvestQuantity;
  document.getElementById("unitOfSale").value = crop.unitOfSale;
  document.getElementById("targetPrice").value = crop.targetPrice;
  
  // Make image optional for editing
  document.getElementById("image").required = false;
  
  // Update button text
  addCropToggleBtn.textContent = "Cancel";
  
  // Set editing mode
  editingCropId = cropId;
  
  // Show form
  cropForm.style.display = "block";
  
  // Scroll to form
  cropForm.scrollIntoView({ behavior: "smooth" });
  
  // Update submit button text
  const submitBtn = cropForm.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.textContent = "💾 Update Product";
  }
}

async function deleteCrop(cropId) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/crops/${userEmail}/${cropId}`, { 
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

addCropToggleBtn.onclick = function() {
  if (isLoadingProducts) {
    alert('⏳ Products are still loading. Please wait...');
    return;
  }
  
  const isHidden = cropForm.style.display === "none";
  cropForm.style.display = isHidden ? "block" : "none";
  addCropToggleBtn.textContent = isHidden ? "Cancel" : "+ Add New Product";
  
  if (!isHidden) {
    cropForm.reset();
    cropError.textContent = "";
    successMsg.textContent = "";
    editingCropId = null;
    document.getElementById("image").required = true;
    
    // Reset submit button text
    const submitBtn = cropForm.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.textContent = "✨ List Product";
    }
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
    
    const data = await res.json(); 

    if (!res.ok) {
        farmerOrdersGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">❌</div>
            <h3>Failed to Load Orders</h3>
            <p>Server Error: ${data.msg || 'The server returned an unexpected error.'}</p>
          </div>
        `;
        console.error("Server Error on Orders Fetch:", data);
        return;
    }
    
    const orders = data; 

    if (orders && orders.length > 0) {
      farmerOrdersGrid.innerHTML = orders.map(order => createFarmerOrderCard(order)).join('');
    } else {
      farmerOrdersGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>Orders assigned to you by dealers will appear here.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Orders Fetch Network/Parsing Error:", error);
    farmerOrdersGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Error Loading Orders</h3>
        <p>A network error occurred or the server response was unreadable. Please try refreshing.</p>
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
          <div>
            <p style="margin: 5px 0;"><strong>Original Price:</strong> ₹${order.originalPrice} per ${order.productDetails.unitOfSale}</p>
            <p style="margin: 5px 0;"><strong>Bid Price:</strong> ₹${order.bidPrice} per ${order.productDetails.unitOfSale}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
          <button onclick="acceptBid('${order._id}')" style="flex: 1; min-width: 150px; background: #10b981; color: white; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            ✓ Accept Bid
          </button>
          <button onclick="rejectBid('${order._id}')" style="flex: 1; min-width: 150px; background: #ef4444; color: white; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
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
    const contentType = res.headers.get("content-type");
    let orders;
    if (contentType && contentType.indexOf("application/json") !== -1) {
        orders = await res.json();
    } else {
        throw new Error("Received non-JSON response from orders API.");
    }
    
    const order = orders.find(o => o._id === orderId);
    
    if (!order || !order.receiptNumber) {
      alert('Receipt not available');
      return;
    }
    
    const modal = document.getElementById('farmerReceiptModal');
    const receiptContent = document.getElementById('farmerReceiptContent');
    
    receiptContent.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #4caf50;">AgroChain Sale Receipt</h2>
        <p style="font-size: 1.2em;">Receipt No: <strong>${order.receiptNumber}</strong></p>
      </div>
      
      <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background-color: #f9f9f9;">
        <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Transaction Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0;"><strong>Product:</strong></td><td style="text-align: right;">${order.productDetails.varietySpecies}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>Quantity Sold:</strong></td><td style="text-align: right;">${order.quantity} ${order.productDetails.unitOfSale}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>Price per Unit:</strong></td><td style="text-align: right;">₹${order.bidPrice || order.originalPrice}</td></tr>
          <tr><td style="padding: 8px 0; border-top: 1px solid #ccc;"><strong>TOTAL AMOUNT:</strong></td><td style="text-align: right; border-top: 1px solid #ccc; font-size: 1.1em; font-weight: bold;">₹${order.totalAmount.toFixed(2)}</td></tr>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background-color: #fff;">
          <h4 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #3b82f6;">Sold To (Dealer)</h4>
          <p><strong>Name:</strong> ${order.dealerDetails.businessName || `${order.dealerDetails.firstName} ${order.dealerDetails.lastName}`}</p>
          <p><strong>Email:</strong> ${order.dealerDetails.email}</p>
          <p><strong>Mobile:</strong> ${order.dealerDetails.mobile}</p>
        </div>
        <div style="flex: 1; min-width: 250px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background-color: #fff;">
          <h4 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #3b82f6;">Seller (Farmer)</h4>
          <p><strong>Name:</strong> ${storedUser.firstName} ${storedUser.lastName}</p>
          <p><strong>Email:</strong> ${storedUser.email}</p>
          <p><strong>Mobile:</strong> ${storedUser.mobile}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #6b7280; padding-top: 15px; border-top: 1px solid #e0e0e0;">
        <p>This transaction was securely recorded on ${new Date(order.assignedDate).toLocaleDateString()}.</p>
      </div>
    `;
    modal.style.display = 'block';
  } catch (error) {
    alert("Error fetching receipt.");
    console.error(error);
  }
}

// Function to print the contents of the modal
function printFarmerReceipt() {
  window.print();
}

function closeFarmerReceiptModal() {
  document.getElementById('farmerReceiptModal').style.display = 'none';
}

// ===========================
// NOTIFICATIONS UTILITY FUNCTIONS
// ===========================

// Helper function to mark notifications as read
async function markNotificationsAsRead() {
  try {
    await loadNotifications();
    
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

  loadNotifications();
}

async function loadNotifications() {
  try {
    const res = await fetch(`http://localhost:3000/api/farmer/notifications/${userEmail}`);
    const notifications = await res.json();

    notificationsList.innerHTML = "";
    let unreadCount = 0;

    if (res.ok && notifications.length > 0) {
      notifications.forEach(n => {
        if (!n.read) {
          unreadCount++;
        }
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${n.read ? 'read' : 'unread'}`;
        
        notificationItem.innerHTML = `
          <div class="notification-icon">${getNotificationIcon(n.type)}</div>
          <div class="notification-content">
            <p class="notification-message">${n.message}</p>
            <small class="notification-time">${formatTimeAgo(new Date(n.timestamp))}</small>
          </div>
        `;
        notificationsList.appendChild(notificationItem);
      });
      
    } else {
      notificationsList.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <div class="empty-state-icon">🔔</div>
          <h3>No New Notifications</h3>
          <p>You're all caught up!</p>
        </div>
      `;
    }

    notificationBadge.textContent = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';

  } catch (error) {
    notificationsList.innerHTML = `<p style="color:red; padding: 20px;">Error loading notifications.</p>`;
  }
}

function getNotificationIcon(type) {
  switch(type) {
    case 'OrderAssigned':
      return '🚚';
    case 'BidPlaced':
      return '💰';
    case 'BidAccepted':
      return '✅';
    case 'BidRejected':
      return '❌';
    case 'ReviewReceived':
      return '⭐';
    default:
      return 'ℹ️';
  }
}

function formatTimeAgo(date) {
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
  const lastSectionName = localStorage.getItem('farmerDashboardSection');
  let activeSection;
  let activeNavButton;

  // 1. Determine which section to show based on localStorage
  switch (lastSectionName) {
    case 'orders':
      activeSection = ordersSection;
      activeNavButton = navOrdersBtn;
      loadFarmerOrders(); 
      break;
    case 'notifications':
      activeSection = notificationsSection;
      activeNavButton = navNotificationBtn;
      markNotificationsAsRead(); 
      break;
    case 'profile':
      activeSection = profileSection;
      activeNavButton = null; 
      loadProfile();
      break;
    case 'inventory':
    default:
      activeSection = inventorySection;
      activeNavButton = navHomeBtn;
      loadCrops();
      break;
  }
  
  // 2. Show the determined section and set the active state
  showSection(activeSection, lastSectionName || 'inventory');
  setActiveNavLink(activeNavButton);

  // 3. Load general data and set up refresh
  loadNotifications();
  setInterval(loadNotifications, 60000); 
});