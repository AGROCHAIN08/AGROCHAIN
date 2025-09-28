 // Global variables
    let currentUser = JSON.parse(localStorage.getItem("agroChainUser"));
    let allProducts = [];
    let allVehicles = [];
    let currentProduct = null;

    // Check authentication
    if (!currentUser || currentUser.role !== 'dealer') {
      alert("Access denied. Please login as dealer.");
      window.location.href = "login.html";
    }

    // DOM Elements
    const vehiclesBtn = document.getElementById("vehiclesBtn");
    const browseBtn = document.getElementById("browseBtn");
    const ordersBtn = document.getElementById("ordersBtn");
    const profileBtn = document.getElementById("profileBtn");
    const signoutBtn = document.getElementById("signoutBtn");

    const vehiclesSection = document.getElementById("vehiclesSection");
    const browseSection = document.getElementById("browseSection");
    const ordersSection = document.getElementById("ordersSection");
    const profileSection = document.getElementById("profileSection");

    // Navigation
    function showSection(section, btn) {
      // Hide all sections
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
      
      // Show selected section
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
    ordersBtn.onclick = () => {
      showSection(ordersSection, ordersBtn);
      loadOrders();
    };
    profileBtn.onclick = () => {
      showSection(profileSection, profileBtn);
      loadProfile();
    };

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
          headers: {
            'Content-Type': 'application/json',
          },
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
        document.getElementById('vehiclesGrid').innerHTML = `
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
        </div>
      `;
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
        productsGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🌾</div>
            <h3>No Products Found</h3>
            <p>Try adjusting your filters</p>
          </div>
        `;
        return;
      }

      productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
    }

    function createProductCard(product) {
      const statusClass = product.availabilityStatus === 'Available' ? 'status-available' : 'status-inspection-initiated';
      
      return `
        <div class="product-card">
          <img src="${product.imageUrl}" alt="${product.varietySpecies}" class="product-image">
          
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
                <button class="btn-contact" onclick="contactFarmer('${product.farmerEmail}', '${product.farmerMobile}')">
                  📞 Contact Farmer
                </button>
              </div>
            </div>
            
            ${product.availabilityStatus === 'Available' ? `
              <button class="btn-assign" onclick="openAssignModal('${product._id}')">
                🚛 Assign Vehicle
              </button>
            ` : `
              <button class="btn-assign" disabled>
                ⏳ Inspection in Progress
              </button>
            `}
          </div>
        </div>
      `;
    }

    function applyFilters() {
      const productType = document.getElementById('filterProductType').value;
      const variety = document.getElementById('filterVariety').value.toLowerCase();
      const maxPrice = parseFloat(document.getElementById('filterPrice').value) || Infinity;
      const status = document.getElementById('filterStatus').value;

      const filtered = allProducts.filter(product => {
        return (!productType || product.productType === productType) &&
               (!variety || product.varietySpecies.toLowerCase().includes(variety)) &&
               (product.targetPrice <= maxPrice) &&
               (!status || product.availabilityStatus === status);
      });

      displayProducts(filtered);
    }

    function contactFarmer(email, mobile) {
      const message = `Contact Details:\nEmail: ${email}\nMobile: ${mobile}\n\nYou can reach out to discuss the product details.`;
      alert(message);
    }

    // Vehicle Assignment
    function openAssignModal(productId) {
      currentProduct = allProducts.find(p => p._id === productId);
      if (!currentProduct) return;

      // Populate assignment details
      document.getElementById('assignmentDetails').innerHTML = `
        <h4>${currentProduct.varietySpecies}</h4>
        <p><strong>Available Quantity:</strong> ${currentProduct.harvestQuantity} ${currentProduct.unitOfSale}</p>
        <p><strong>Price:</strong> ₹${currentProduct.targetPrice}</p>
        <p><strong>Farmer:</strong> ${currentProduct.farmerName}</p>
      `;

      // Populate available vehicles
      const vehicleSelect = document.getElementById('vehicleSelect');
      const availableVehicles = allVehicles.filter(v => v.currentStatus === 'AVAILABLE');
      
      vehicleSelect.innerHTML = '<option value="">Choose available vehicle...</option>' +
        availableVehicles.map(v => `<option value="${v._id}">${v.vehicleId} - ${v.vehicleType}</option>`).join('');

      document.getElementById('assignModal').style.display = 'block';
    }

    async function confirmAssignment() {
      const vehicleId = document.getElementById('vehicleSelect').value;
      const quantity = parseFloat(document.getElementById('purchaseQuantity').value);

      if (!vehicleId || !quantity) {
        alert('Please select a vehicle and enter quantity');
        return;
      }

      if (quantity > currentProduct.harvestQuantity) {
        alert('Quantity cannot exceed available stock');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/dealer/assign-vehicle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dealerEmail: currentUser.email,
            productId: currentProduct._id,
            vehicleId: vehicleId,
            quantity: quantity,
            farmerEmail: currentProduct.farmerEmail
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          alert('Vehicle assigned successfully!');
          document.getElementById('assignModal').style.display = 'none';
          loadAllProducts();
          loadVehicles();
        } else {
          alert(data.msg || 'Error assigning vehicle');
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
          ordersGrid.innerHTML = orders.map(order => createOrderCard(order)).join('');
        } else {
          ordersGrid.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">📦</div>
              <h3>No Orders Yet</h3>
              <p>Your vehicle assignments will appear here</p>
            </div>
          `;
        }
      } catch (error) {
        document.getElementById('ordersGrid').innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h3>Error Loading Orders</h3>
            <p>Please try again later</p>
          </div>
        `;
      }
    }

    function createOrderCard(order) {
      return `
        <div class="order-card">
          <div class="order-header">
            <h4>${order.productDetails.varietySpecies}</h4>
            <span class="status-tag status-inspection-initiated">Inspection Initiated</span>
          </div>
          <div class="product-details">
            <div class="product-detail-item">
              <div class="product-detail-label">Assigned Vehicle</div>
              <div class="product-detail-value">${order.vehicleDetails.vehicleId}</div>
            </div>
            <div class="product-detail-item">
              <div class="product-detail-label">Purchase Quantity</div>
              <div class="product-detail-value">${order.quantity} ${order.productDetails.unitOfSale}</div>
            </div>
            <div class="product-detail-item">
              <div class="product-detail-label">Total Amount</div>
              <div class="product-detail-value">₹${(order.quantity * order.productDetails.targetPrice).toFixed(2)}</div>
            </div>
            <div class="product-detail-item">
              <div class="product-detail-label">Farmer</div>
              <div class="product-detail-value">${order.farmerDetails.firstName} ${order.farmerDetails.lastName}</div>
            </div>
          </div>
          <div style="margin-top: 15px; font-size: 14px; color: #6b7280;">
            <strong>Pickup Location:</strong> ${order.productDetails.fieldAddress}<br>
            <strong>Assigned Date:</strong> ${new Date(order.assignedDate).toLocaleDateString()}
          </div>
        </div>
      `;
    }

    // Profile
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

    // Utility Functions
    function showMessage(elementId, message, type) {
      const element = document.getElementById(elementId);
      element.innerHTML = `<div class="message ${type}">${message}</div>`;
      setTimeout(() => {
        element.innerHTML = '';
      }, 5000);
    }

    // Modal close functionality
    document.querySelector('.close').onclick = function() {
      document.getElementById('assignModal').style.display = 'none';
    }

    window.onclick = function(event) {
      const modal = document.getElementById('assignModal');
      if (event.target == modal) {
        modal.style.display = 'none';
      }
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
      loadVehicles();
    });