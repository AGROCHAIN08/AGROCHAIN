// ===========================
// GLOBAL VARIABLES & AUTH
// ===========================
let currentUser = JSON.parse(localStorage.getItem("agroChainUser"));
let allInventory = [];
let retailerCart = JSON.parse(localStorage.getItem("retailerCart")) || [];
let retailerOrders = []; // Will store fetched orders
let currentPaymentOrder = null; // Holds the order being processed in the modal
let currentReviewOrderId = null; // For review modal

if (!currentUser || currentUser.role !== 'retailer') {
  alert("Access denied. Please login as a retailer.");
  window.location.href = "login.html";
}

// ===========================
// DOM ELEMENTS & NAVIGATION
// ===========================
const browseBtn = document.getElementById("browseBtn");
const cartBtn = document.getElementById("cartBtn");
const ordersBtn = document.getElementById("ordersBtn");
const profileBtn = document.getElementById("profileBtn");
const signoutBtn = document.getElementById("signoutBtn");
const profileDropdownBtn = document.getElementById("profileDropdownBtn");
const profileDropdownMenu = document.getElementById("profileDropdownMenu");
const retailerNameDisplay = document.getElementById("retailerNameDisplay");

const browseSection = document.getElementById("browseSection");
const cartSection = document.getElementById("cartSection");
const ordersSection = document.getElementById("ordersSection");
const profileSection = document.getElementById("profileSection");

// Update retailer name in navbar
if (currentUser && currentUser.firstName) {
  retailerNameDisplay.textContent = currentUser.firstName;
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


function showSection(sectionToShow, activeBtn) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
  sectionToShow.style.display = 'block';
  activeBtn.classList.add('active');
}

browseBtn.onclick = () => showSection(browseSection, browseBtn);
cartBtn.onclick = () => {
    showSection(cartSection, cartBtn);
    displayCart();
};
ordersBtn.onclick = () => {
    showSection(ordersSection, ordersBtn);
    displayOrders();
};
profileBtn.onclick = () => {
  showSection(profileSection, profileBtn);
  loadProfile();
};
signoutBtn.onclick = () => {
    if (confirm("Are you sure you want to sign out?")) {
        localStorage.clear();
        window.location.href = "login.html";
    }
};

// ===========================
// CORE LOGIC (Browse, Cart)
// ===========================

async function loadInventory() {
  const inventoryGrid = document.getElementById("inventoryGrid");
  inventoryGrid.innerHTML = `<p>Loading products...</p>`;
  try {
    const response = await fetch("http://localhost:3000/api/retailer/dealer-inventory");
    const data = await response.json();
    if (response.ok) {
      allInventory = data;
      console.log('📦 Loaded inventory items:', data.length);
      console.log('🔍 Sample item with reviews:', data[0]); // Debug log
      displayInventory(allInventory);
    } else {
      inventoryGrid.innerHTML = `<p style="color:red;">Error: ${data.msg}</p>`;
    }
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    inventoryGrid.innerHTML = `<p style="color:red;">Network error. Please try again later.</p>`;
  }
}

function displayInventory(inventory) {
  const inventoryGrid = document.getElementById("inventoryGrid");
  inventoryGrid.innerHTML = "";
  if (!inventory || inventory.length === 0) {
    inventoryGrid.innerHTML = `<div class="empty-state"><h3>No products available from dealers.</h3></div>`;
    return;
  }
  inventory.forEach(item => {
    console.log(`Product: ${item.productName}, Reviews:`, item.retailerReviews);
    const card = document.createElement('div');
    card.className = 'inventory-card';
    card.setAttribute('id', `product-${item._id}`);
    const unitOfSale = item.unitOfSale || 'unit';
    
    // Display reviews if available
    let reviewsHTML = '';
    if (item.retailerReviews && item.retailerReviews.length > 0) {
      const avgRating = (item.retailerReviews.reduce((sum, r) => sum + r.rating, 0) / item.retailerReviews.length).toFixed(1);
      reviewsHTML = `
        <div class="product-reviews" style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="font-size: 14px; margin: 0; color: #374151;">
              ⭐ Reviews (${item.retailerReviews.length})
            </h4>
            <span style="font-size: 14px; font-weight: 600; color: #f59e0b;">
              ${avgRating}/5
            </span>
          </div>
          
          ${item.retailerReviews.slice(0, 2).map(review => `
            <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #228B22;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 600; color: #228B22; font-size: 13px;">${review.quality}</span>
                <span style="color: #f59e0b; font-size: 12px;">${'⭐'.repeat(review.rating)}</span>
              </div>
              <p style="margin: 4px 0; font-size: 12px; color: #374151; line-height: 1.4;">${review.comments}</p>
              <small style="color: #6b7280;">By: ${review.retailerEmail}</small>
            </div>
          `).join('')}
          
          ${item.retailerReviews.length > 2 ? `
            <button class="btn-view-all-reviews" onclick="openViewReviewsModal('${item._id}')" style="width: 100%; margin-top: 10px; padding: 8px; background: #f3e5f5; border: 1px solid #ce93d8; color: #228B22; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.3s ease;">
              View All ${item.retailerReviews.length} Reviews →
            </button>
          ` : ''}
        </div>
      `;
    }
    
    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.productName}" class="inventory-image" onerror="this.src='https://via.placeholder.com/150'">
      <div class="inventory-content">
        <h3>${item.productName}</h3>
        <p class="inventory-type">${item.productType}</p>
        <div class="inventory-details">
          <div class="detail-row"><span class="detail-label">Available:</span><span class="detail-value">${item.quantity} ${unitOfSale}</span></div>
          <div class="detail-row"><span class="detail-label">Price per ${unitOfSale}:</span><span class="detail-value" style="font-weight: bold; color: #228B22;">₹${item.unitPrice.toFixed(2)}</span></div>
        </div>
        ${reviewsHTML}
        <div class="dealer-info">Sold by: ${item.dealerName} | ☎️ ${item.dealerMobile}</div>
        <div class="add-to-cart-section">
            <input type="number" id="qty-${item._id}" placeholder="Qty" min="1" max="${item.quantity}">
            <button class="btn-primary btn-add-cart" onclick="addToCart('${item._id}')">Add to Cart</button>
        </div>
        <div class="card-feedback" id="feedback-${item._id}"></div>
      </div>
    `;
    inventoryGrid.appendChild(card);
  });
}

function addToCart(itemId) {
    const product = allInventory.find(p => p._id === itemId);
    const qtyInput = document.getElementById(`qty-${itemId}`);
    const feedbackDiv = document.getElementById(`feedback-${itemId}`);
    const quantity = parseFloat(qtyInput.value);
    if (!quantity || quantity <= 0) {
        feedbackDiv.textContent = 'Please enter a valid quantity.';
        feedbackDiv.className = 'card-feedback error';
        return;
    }
    if (quantity > product.quantity) {
        feedbackDiv.textContent = `Only ${product.quantity} available.`;
        feedbackDiv.className = 'card-feedback error';
        return;
    }
    const existingItem = retailerCart.find(item => item._id === itemId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        retailerCart.push({ ...product, quantity: quantity });
    }
    localStorage.setItem("retailerCart", JSON.stringify(retailerCart));
    updateCartCount();
    qtyInput.value = '';
    feedbackDiv.textContent = 'Added to cart!';
    feedbackDiv.className = 'card-feedback success';
    setTimeout(() => { feedbackDiv.textContent = ''; }, 2000);
}

function displayCart() {
    const cartGrid = document.getElementById('cartGrid');
    cartGrid.innerHTML = '';
    if (retailerCart.length === 0) {
        cartGrid.innerHTML = `<div class="empty-state"><h3>Your cart is empty.</h3></div>`;
        return;
    }
    let subtotal = 0;
    retailerCart.forEach(item => {
        const itemTotal = item.unitPrice * item.quantity;
        subtotal += itemTotal;
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.productName}" class="cart-item-img">
            <div class="cart-item-info">
                <h4>${item.productName}</h4>
                <p>Quantity: ${item.quantity} x ₹${item.unitPrice.toFixed(2)}</p>
                <p>Sold by: ${item.dealerName}</p>
            </div>
            <div class="cart-item-actions">
                <div class="price">₹${itemTotal.toFixed(2)}</div>
                <button class="btn-remove" onclick="removeFromCart('${item._id}')">Remove</button>
            </div>
        `;
        cartGrid.appendChild(cartItemDiv);
    });
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'cart-summary';
    summaryDiv.innerHTML = `
        <h3>Order Summary</h3>
        <div class="total-row"><span>Total</span><span>₹${subtotal.toFixed(2)}</span></div>
        <button class="btn-primary btn-checkout" onclick="handleCheckout()">Proceed to Checkout</button>
    `;
    cartGrid.appendChild(summaryDiv);
}

async function handleCheckout() {
    if (retailerCart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    if (!confirm('Are you sure you want to place this order?')) return;
    try {
        const response = await fetch('http://localhost:3000/api/retailer/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                retailerEmail: currentUser.email,
                cartItems: retailerCart
            })
        });
        const result = await response.json();
        if (response.ok) {
            alert('✅ Order placed successfully!');
            retailerCart = [];
            localStorage.setItem('retailerCart', JSON.stringify(retailerCart));
            updateCartCount();
            showSection(ordersSection, ordersBtn);
            displayOrders();
        } else {
            alert(`❌ Error: ${result.msg}`);
        }
    } catch (error) {
        console.error('Checkout failed:', error);
        alert('A network error occurred. Please try again.');
    }
}

// ===========================
// ORDER & PAYMENT LOGIC
// ===========================

async function displayOrders() {
    const ordersGrid = document.getElementById('ordersGrid');
    ordersGrid.innerHTML = `<p>Loading your orders...</p>`;
    try {
        const response = await fetch(`http://localhost:3000/api/retailer/orders/${currentUser.email}`);
        const orders = await response.json();
        retailerOrders = orders;
        if (response.ok) {
            if (orders.length === 0) {
                ordersGrid.innerHTML = `<div class="empty-state"><h3>You have no orders.</h3></div>`;
                return;
            }
            // Clear the grid before adding new cards
            ordersGrid.innerHTML = ''; 
            orders.forEach(order => {
                const orderCard = createOrderCard(order);
                ordersGrid.innerHTML += orderCard;
            });
        } else {
            ordersGrid.innerHTML = `<p style="color:red;">Error loading orders: ${orders.msg}</p>`;
        }
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        ordersGrid.innerHTML = `<p style="color:red;">Network error while fetching orders.</p>`;
    }
}

function createOrderCard(order) {
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    const totalQuantity = order.products.reduce((sum, p) => sum + p.quantity, 0);
    const productNames = order.products.map(p => p.productName).join(', ');
    const statusClass = order.orderStatus.toLowerCase();

    let actionPanelHTML = '';
    if (order.paymentDetails.status === 'Completed') {
        actionPanelHTML = `
            <div class="order-action-panel completed">
                <h4>✓ Payment Completed</h4>
                <p><strong>Payment Method:</strong> ${order.paymentDetails.method}</p>
                <p><strong>Total Paid:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                ${!order.reviewSubmitted 
                    ? `<button class="btn-primary" onclick="openReviewModal('${order._id}')" style="background:#10b981; margin-right: 10px;">⭐ Add Review</button>` 
                    : `<p style="color: #065f46; font-weight: bold; margin-top: 10px;">✓ Review Submitted</p>`}
                <button class="btn-secondary" onclick="openReceiptModal('${order._id}')" style="margin-top: 15px;">View Receipt</button>
            </div>
        `;
    } else {
        actionPanelHTML = `
            <div class="order-action-panel pending">
                <h4>⌛ Payment Pending</h4>
                <p>Your order is confirmed. Please complete the payment to proceed.</p>
                <button class="btn-primary" onclick="openPaymentModal('${order._id}')">Pay Now</button>
            </div>
        `;
    }

    return `
        <div class="retailer-order-card">
            <span class="order-status-badge status-${statusClass}">${order.orderStatus}</span>
            <div class="order-product-info">
                <h3>${productNames}</h3>
                <p>${order.products.length} item(s) in this order</p>
            </div>
            <div class="order-details-grid">
                <div class="order-detail-item">
                    <div class="order-detail-label">Total Quantity</div>
                    <div class="order-detail-value">${totalQuantity} units</div>
                </div>
                 <div class="order-detail-item">
                    <div class="order-detail-label">Dealer</div>
                    <div class="order-detail-value">${order.dealerInfo.businessName}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">Total Amount</div>
                    <div class="order-detail-value">₹${order.totalAmount.toFixed(2)}</div>
                </div>
                <div class="order-detail-item">
                    <div class="order-detail-label">Order Date</div>
                    <div class="order-detail-value">${orderDate}</div>
                </div>
            </div>
            <div class="dealer-info-panel">
                <span><strong>Contact:</strong> ${order.dealerInfo.email}</span>
            </div>
            ${actionPanelHTML}
        </div>
    `;
}

function openPaymentModal(orderId) {
    const order = retailerOrders.find(o => o._id === orderId);
    if (!order) {
        alert('Order not found!');
        return;
    }
    currentPaymentOrder = JSON.parse(JSON.stringify(order));
    renderPaymentStep1();
    document.getElementById('paymentModal').style.display = 'block';
    goToPaymentStep(1);
}

function renderPaymentStep1() {
    const summaryDiv = document.getElementById('payment-order-summary');
    const order = currentPaymentOrder;
    const itemsHTML = order.products.map(p => `
        <div class="payment-order-item">
            <span>${p.productName} (₹${p.unitPrice.toFixed(2)} each)</span>
            <div>
                <input type="number" value="${p.quantity}" min="1" onchange="updatePaymentQuantity('${p.productId}', this.value)">
            </div>
            <strong>₹${(p.quantity * p.unitPrice).toFixed(2)}</strong>
        </div>
    `).join('');
    summaryDiv.innerHTML = `
        <div class="dealer-info" style="background-color:#f3e5f5; border: 1px solid #e1bee7;">
            <p><strong>Order From:</strong> ${order.dealerInfo.businessName}</p>
            <p><strong>Dealer Address:</strong> ${order.dealerInfo.warehouseAddress}</p>
        </div>
        <h4>Products (edit quantity if needed)</h4>
        <div id="payment-order-items">${itemsHTML}</div>
        <div class="total-row" style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
            <h3>Total:</h3>
            <h3 id="payment-total">₹${order.totalAmount.toFixed(2)}</h3>
        </div>
    `;
}

function updatePaymentQuantity(productId, newQuantity) {
    const qty = parseInt(newQuantity);
    if (isNaN(qty) || qty < 1) {
        alert("Quantity must be at least 1.");
        renderPaymentStep1();
        return;
    }
    const product = currentPaymentOrder.products.find(p => p.productId === productId);
    if (product) {
        product.quantity = qty;
    }
    currentPaymentOrder.totalAmount = currentPaymentOrder.products.reduce((total, p) => total + (p.quantity * p.unitPrice), 0);
    document.getElementById('payment-total').textContent = `₹${currentPaymentOrder.totalAmount.toFixed(2)}`;
    renderPaymentStep1();
}

function goToPaymentStep(stepNum) {
    document.getElementById('paymentStep1').style.display = (stepNum === 1) ? 'block' : 'none';
    document.getElementById('paymentStep2').style.display = (stepNum === 2) ? 'block' : 'none';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    currentPaymentOrder = null;
}

async function confirmPayment() {
    if (!currentPaymentOrder) return;
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    try {
        const response = await fetch(`http://localhost:3000/api/retailer/orders/${currentPaymentOrder._id}/complete-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                products: currentPaymentOrder.products,
                totalAmount: currentPaymentOrder.totalAmount,
                paymentMethod: selectedMethod
            })
        });
        const result = await response.json();
        if (response.ok) {
            alert('✅ Payment successful! Dealer inventory has been updated.');
            closePaymentModal();
            displayOrders();
        } else {
            alert(`❌ Error: ${result.msg}`);
        }
    } catch (error) {
        console.error('Payment confirmation failed:', error);
        alert('A network error occurred. Please try again.');
    }
}

// ===========================
// REVIEW SYSTEM
// ===========================

function openReviewModal(orderId) {
    currentReviewOrderId = orderId;
    const order = retailerOrders.find(o => o._id === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    document.getElementById('reviewModalTitle').textContent = `Review Order from ${order.dealerInfo.businessName}`;
    document.getElementById('reviewModal').style.display = 'block';
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('reviewForm').reset();
    currentReviewOrderId = null;
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
    
    if (rating < 1 || rating > 5) {
        alert('Rating must be between 1 and 5');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/retailer/submit-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: currentReviewOrderId,
                retailerEmail: currentUser.email,
                quality,
                comments,
                rating
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('✅ Review submitted successfully!');
            closeReviewModal();
            
            // Update local order data to mark review as submitted
            const order = retailerOrders.find(o => o._id === currentReviewOrderId);
            if (order) {
                order.reviewSubmitted = true;
            }
            
            // Refresh both views to show updated reviews
            displayOrders();
            loadInventory();
        } else {
            alert('❌ Error submitting review: ' + result.msg);
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Network error. Please try again.');
    }
});

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
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #228B22;">${reviews.length}</p>
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

function openReceiptModal(orderId) {
    const order = retailerOrders.find(o => o._id === orderId);
    if (!order) return;
    const receiptContent = document.getElementById('receiptContent');
    receiptContent.innerHTML = `
        <div style="text-align:center; border-bottom: 1px solid #ccc; margin-bottom: 20px;">
            <h2>Payment Receipt</h2>
            <p>Order ID: ${order._id}</p>
        </div>
        <p><strong>Billed To:</strong> ${currentUser.shopName || currentUser.firstName}</p>
        <p><strong>Date:</strong> ${new Date(order.updatedAt).toLocaleDateString()}</p>
        <hr>
        <h4>Order from: ${order.dealerInfo.businessName}</h4>
        <p><strong>Dealer Address:</strong> ${order.dealerInfo.warehouseAddress}</p>
        <div class="inventory-details">
            ${order.products.map(p => `<div class="detail-row"><span>${p.productName} (x${p.quantity})</span><span>₹${(p.quantity * p.unitPrice).toFixed(2)}</span></div>`).join('')}
        </div>
        <div class="total-row" style="margin-top:20px; padding-top:10px; border-top:1px solid #ccc; display:flex; justify-content:space-between;">
            <h4>Total Paid:</h4>
            <h4>₹${order.totalAmount.toFixed(2)}</h4>
        </div>
        <p><strong>Payment Method:</strong> ${order.paymentDetails.method}</p>
        <p style="color:green; font-weight:bold;">Status: PAID</p>
    `;
    document.getElementById('receiptModal').style.display = 'block';
}

function closeReceiptModal() {
    document.getElementById('receiptModal').style.display = 'none';
}

// ===========================
// OTHER FUNCTIONS
// ===========================

function removeFromCart(itemId) {
    retailerCart = retailerCart.filter(item => item._id !== itemId);
    localStorage.setItem("retailerCart", JSON.stringify(retailerCart));
    updateCartCount();
    displayCart();
}

function updateCartCount() {
    const count = retailerCart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function applyFilters() {
  const nameFilter = document.getElementById('filterName').value.toLowerCase();
  const priceFilter = parseFloat(document.getElementById('filterPrice').value);
  const typeFilter = document.getElementById('filterType').value;
  const errorDiv = document.getElementById('filterError');
  if (priceFilter < 0) {
    errorDiv.textContent = 'Price must be a positive number.';
    errorDiv.style.display = 'block'; 
    return; 
  } else {
    errorDiv.style.display = 'none'; 
  }
  const filteredInventory = allInventory.filter(item => {
    const nameMatch = !nameFilter || item.productName.toLowerCase().includes(nameFilter);
    const priceMatch = isNaN(priceFilter) || item.unitPrice <= priceFilter;
    const typeMatch = !typeFilter || item.productType === typeFilter;
    return nameMatch && priceMatch && typeMatch;
  });
  displayInventory(filteredInventory);
}

async function loadProfile() {
    const profileInfo = document.getElementById('profileInfo');
    try {
        const response = await fetch(`http://localhost:3000/api/auth/profile/${currentUser.email}`);
        const data = await response.json();
        if (response.ok) {
            profileInfo.innerHTML = `
                <p><strong>Name:</strong> ${data.firstName} ${data.lastName || ''}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Mobile:</strong> ${data.mobile}</p>
                <p><strong>Shop Name:</strong> ${data.shopName || 'N/A'}</p>
                <p><strong>Shop Address:</strong> ${data.shopAddress || 'N/A'}</p>
            `;
        } else {
            profileInfo.innerHTML = `<p style="color:red;">Could not load profile.</p>`;
        }
    } catch (error) {
        profileInfo.innerHTML = `<p style="color:red;">Error loading profile.</p>`;
    }
}

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  loadInventory();
  updateCartCount();
  showSection(browseSection, browseBtn);
});