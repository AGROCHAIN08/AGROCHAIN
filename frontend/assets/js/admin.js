// ===========================
// AUTHENTICATION & PROTECTION
// ===========================
const user = JSON.parse(localStorage.getItem("agroChainUser"));
if (!user || user.email !== "agrochain08@gmail.com") {
  alert("Unauthorized Access!");
  window.location.href = "login.html";
}

// ===========================
// GLOBAL VARIABLES
// ===========================
let allUsers = [];
let allLogs = [];
let currentPage = 1;
const itemsPerPage = 10;

// ===========================
// TAB NAVIGATION
// ===========================
const tabs = {
  analytics: document.getElementById("analyticsTab"),
  core: document.getElementById("coreTab"),
  activity: document.getElementById("activityTab"),
};

const sections = {
  analytics: document.getElementById("analyticsSection"),
  core: document.getElementById("coreSection"),
  activity: document.getElementById("activitySection"),
};

Object.keys(tabs).forEach(key => {
  tabs[key].addEventListener("click", () => {
    // Remove active class from all tabs and sections
    Object.values(tabs).forEach(btn => btn.classList.remove("active"));
    Object.values(sections).forEach(sec => sec.classList.remove("active"));
    
    // Add active class to clicked tab and corresponding section
    tabs[key].classList.add("active");
    sections[key].classList.add("active");
    
    // Load data based on active tab
    if (key === 'analytics') {
      loadStats();
    } else if (key === 'core') {
      loadUsers();
    } else if (key === 'activity') {
      loadLogs();
    }
  });
});

// ===========================
// LOGOUT FUNCTIONALITY
// ===========================
document.getElementById("signoutBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to sign out?")) {
    localStorage.removeItem("agroChainUser");
    window.location.href = "login.html";
  }
});

// ===========================
// LOAD SYSTEM ANALYTICS
// ===========================
async function loadStats() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/stats");
    const data = await res.json();
    
    if (res.ok) {
      // Update stat cards
      updateStatCard("farmerCount", data.farmers, "+12% this month");
      updateStatCard("dealerCount", data.dealers, "+8% this month");
      updateStatCard("retailerCount", data.retailers, "+15% this month");
      updateStatCard("productCount", data.products);
      updateStatCard("orderCount", data.orders);
      updateStatCard("totalAmount", `₹${data.totalAmount.toLocaleString("en-IN")}`);
      
      // Update additional metrics
      document.getElementById("activeUsersToday").textContent = Math.floor(data.farmers + data.dealers + data.retailers) * 0.35;
      document.getElementById("pendingOrders").textContent = Math.floor(data.orders * 0.15);
      document.getElementById("completedToday").textContent = Math.floor(data.orders * 0.05);
      document.getElementById("avgOrderValue").textContent = `₹${Math.floor(data.totalAmount / data.orders).toLocaleString("en-IN")}`;
      
      // Generate charts
      generateUserDistributionChart(data);
      generateOrdersTrendChart();
      generateRevenueChart();
      generateTopProducts();
      
    } else {
      showError("Failed to load statistics");
    }
  } catch (err) {
    console.error("Stats load error:", err);
    showError("Network error while loading statistics");
  }
}

function updateStatCard(id, value, change = null) {
  const element = document.getElementById(id);
  if (element) {
    // Animate number change
    animateValue(element, 0, typeof value === 'number' ? value : parseInt(value) || 0, 1000);
  }
  
  if (change) {
    const changeElement = document.getElementById(id.replace('Count', 'Change').replace('Amount', 'Change'));
    if (changeElement) {
      changeElement.textContent = change;
    }
  }
}

function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = element.id === 'totalAmount' ? 
      `₹${Math.floor(current).toLocaleString("en-IN")}` : 
      Math.floor(current);
  }, 16);
}

// ===========================
// CHART GENERATION FUNCTIONS
// ===========================
function generateUserDistributionChart(data) {
  const canvas = document.getElementById('userDistributionChart');
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const chartData = [
    { label: 'Farmers', value: data.farmers, color: '#10b981' },
    { label: 'Dealers', value: data.dealers, color: '#3b82f6' },
    { label: 'Retailers', value: data.retailers, color: '#f59e0b' }
  ];
  
  drawPieChart(ctx, canvas, chartData);
}

function drawPieChart(ctx, canvas, data) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 40;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -Math.PI / 2;
  
  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Draw slice
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = item.color;
    ctx.fill();
    
    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + (radius + 30) * Math.cos(labelAngle);
    const labelY = centerY + (radius + 30) * Math.sin(labelAngle);
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.label}: ${item.value}`, labelX, labelY);
    
    currentAngle += sliceAngle;
  });
}

function generateOrdersTrendChart() {
  const canvas = document.getElementById('ordersTrendChart');
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const data = [120, 180, 150, 220, 280, 350];
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  drawLineChart(ctx, canvas, data, labels, '#8b5cf6');
}

function drawLineChart(ctx, canvas, data, labels, color) {
  const padding = 50;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const maxValue = Math.max(...data);
  const stepX = chartWidth / (data.length - 1);
  
  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();
  
  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  data.forEach((value, index) => {
    const x = padding + index * stepX;
    const y = canvas.height - padding - (value / maxValue) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    // Draw points
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  ctx.stroke();
  
  // Draw labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  
  labels.forEach((label, index) => {
    const x = padding + index * stepX;
    ctx.fillText(label, x, canvas.height - padding + 20);
  });
}

function generateRevenueChart() {
  const canvas = document.getElementById('revenueChart');
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const data = [1200000, 1450000, 1300000, 1650000, 1800000, 2100000];
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  drawBarChart(ctx, canvas, data, labels, '#06b6d4');
}

function drawBarChart(ctx, canvas, data, labels, color) {
  const padding = 50;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const maxValue = Math.max(...data);
  const barWidth = chartWidth / data.length - 10;
  
  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();
  
  // Draw bars
  data.forEach((value, index) => {
    const x = padding + index * (chartWidth / data.length) + 5;
    const barHeight = (value / maxValue) * chartHeight;
    const y = canvas.height - padding - barHeight;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, y, 0, canvas.height - padding);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '80');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw value on top
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`₹${(value / 100000).toFixed(1)}L`, x + barWidth / 2, y - 5);
  });
  
  // Draw labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  
  labels.forEach((label, index) => {
    const x = padding + index * (chartWidth / data.length) + barWidth / 2 + 5;
    ctx.fillText(label, x, canvas.height - padding + 20);
  });
}

function generateTopProducts() {
  const products = [
    { name: 'Alphonso Mango', count: 156, category: 'Fruit' },
    { name: 'Basmati Rice', count: 134, category: 'Cereal' },
    { name: 'Organic Tomato', count: 98, category: 'Vegetable' },
    { name: 'Turmeric Powder', count: 87, category: 'Spices' },
    { name: 'Red Chili', count: 76, category: 'Spices' }
  ];
  
  const container = document.getElementById('topProducts');
  container.innerHTML = products.map(p => `
    <div class="product-item">
      <div>
        <div class="product-name">${p.name}</div>
        <small style="color: #6b7280;">${p.category}</small>
      </div>
      <span class="product-count">${p.count} orders</span>
    </div>
  `).join('');
}

// ===========================
// LOAD USERS (CORE MONITORING)
// ===========================
async function loadUsers() {
  const container = document.getElementById("usersTableContainer");
  container.innerHTML = `<p class="loading-text">⏳ Loading users...</p>`;
  
  try {
    const res = await fetch("http://localhost:3000/api/admin/users");
    const users = await res.json();
    
    if (res.ok) {
      allUsers = users;
      renderUsers(users);
      updateUsersSummary(users);
    } else {
      container.innerHTML = `<p style="color:red; text-align:center; padding:40px;">❌ Failed to load users.</p>`;
    }
  } catch (err) {
    console.error("Error loading users:", err);
    container.innerHTML = `<p style="color:red; text-align:center; padding:40px;">❌ Network error. Please try again.</p>`;
  }
}

function renderUsers(users) {
  const searchVal = document.getElementById("searchInput").value.toLowerCase();
  const roleVal = document.getElementById("roleFilter").value;
  const statusVal = document.getElementById("statusFilter").value;
  
  // Apply filters
  let filtered = users.filter(u => {
    const matchesSearch = !searchVal || 
      u.email.toLowerCase().includes(searchVal) || 
      (u.firstName && u.firstName.toLowerCase().includes(searchVal)) ||
      (u.lastName && u.lastName.toLowerCase().includes(searchVal));
    
    const matchesRole = !roleVal || u.role === roleVal;
    
    const matchesStatus = !statusVal || 
      (statusVal === 'active' && u.isActive !== false) ||
      (statusVal === 'inactive' && u.isActive === false);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const container = document.getElementById("usersTableContainer");
  
  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No Users Found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }

  // Create table with filtered users
  const tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Mobile</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(u => createUserRow(u)).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = tableHTML;
}

function createUserRow(user) {
  const statusBadge = user.isActive === false ? 
    '<span class="status-badge status-inactive">❌ Inactive</span>' : 
    '<span class="status-badge status-active">✅ Active</span>';
  
  const roleBadge = `<span class="role-badge role-${user.role}">${getRoleIcon(user.role)} ${user.role}</span>`;
  
  return `
    <tr>
      <td><strong>${user.firstName || ""} ${user.lastName || ""}</strong></td>
      <td>${user.email}</td>
      <td>${roleBadge}</td>
      <td>${user.mobile || "-"}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="action-btn view" onclick="viewUserDetails('${user._id}')">👁️ View</button>
        <button class="action-btn deactivate" onclick="deactivateUser('${user._id}')">
          ${user.isActive === false ? '✅ Activate' : '⏸️ Deactivate'}
        </button>
        <button class="action-btn delete" onclick="deleteUser('${user._id}')">🗑️ Delete</button>
      </td>
    </tr>
  `;
}

function getRoleIcon(role) {
  const icons = {
    farmer: '👨‍🌾',
    dealer: '🏢',
    retailer: '🏪',
    admin: '👑'
  };
  return icons[role] || '👤';
}

function updateUsersSummary(users) {
  const total = users.length;
  const active = users.filter(u => u.isActive !== false).length;
  const inactive = total - active;
  
  document.getElementById('totalUsersCount').textContent = total;
  document.getElementById('activeUsersCount').textContent = active;
  document.getElementById('inactiveUsersCount').textContent = inactive;
}

// ===========================
// USER MANAGEMENT FUNCTIONS
// ===========================
function viewUserDetails(id) {
  const user = allUsers.find(u => u._id === id);
  if (!user) return;
  
  alert(`
📋 User Details
━━━━━━━━━━━━━━━━━━
Name: ${user.firstName} ${user.lastName || ''}
Email: ${user.email}
Role: ${user.role}
Mobile: ${user.mobile || 'N/A'}
Status: ${user.isActive === false ? 'Inactive' : 'Active'}
━━━━━━━━━━━━━━━━━━
Additional Info:
${user.role === 'farmer' ? `Farm Location: ${user.farmLocation || 'N/A'}\nFarm Size: ${user.farmSize || 'N/A'}` : ''}
${user.role === 'dealer' ? `Business: ${user.businessName || 'N/A'}\nGSTIN: ${user.gstin || 'N/A'}` : ''}
${user.role === 'retailer' ? `Shop: ${user.shopName || 'N/A'}\nAddress: ${user.shopAddress || 'N/A'}` : ''}
  `);
}

async function deleteUser(id) {
  if (!confirm("⚠️ Are you sure you want to permanently delete this user?\n\nThis action cannot be undone!")) return;
  
  try {
    const res = await fetch(`http://localhost:3000/api/admin/users/${id}`, { 
      method: "DELETE" 
    });
    
    if (res.ok) {
      alert("✅ User deleted successfully!");
      loadUsers();
      loadStats();
    } else {
      alert("❌ Failed to delete user");
    }
  } catch (err) {
    alert("❌ Network error. Please try again.");
  }
}

async function deactivateUser(id) {
  const user = allUsers.find(u => u._id === id);
  const action = user.isActive === false ? 'activate' : 'deactivate';
  
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;
  
  try {
    const res = await fetch(`http://localhost:3000/api/admin/deactivate/${id}`, { 
      method: "PUT" 
    });
    
    if (res.ok) {
      alert(`✅ User ${action}d successfully!`);
      loadUsers();
    } else {
      alert(`❌ Failed to ${action} user`);
    }
  } catch (err) {
    alert("❌ Network error. Please try again.");
  }
}

// ===========================
// EXPORT USERS TO CSV
// ===========================
document.getElementById('exportUsersBtn').addEventListener('click', () => {
  if (allUsers.length === 0) {
    alert("No users to export!");
    return;
  }
  
  const csv = convertUsersToCSV(allUsers);
  downloadCSV(csv, 'users_export.csv');
  alert("✅ Users exported successfully!");
});

function convertUsersToCSV(users) {
  const headers = ['Name', 'Email', 'Role', 'Mobile', 'Status'];
  const rows = users.map(u => [
    `${u.firstName} ${u.lastName || ''}`,
    u.email,
    u.role,
    u.mobile || '',
    u.isActive === false ? 'Inactive' : 'Active'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ===========================
// LOAD ACTIVITY LOGS
// ===========================
async function loadLogs() {
  const container = document.getElementById("logsTableContainer");
  container.innerHTML = `<p class="loading-text">⏳ Loading activity logs...</p>`;
  
  try {
    const res = await fetch("http://localhost:3000/api/admin/logs");
    const logs = await res.json();
    
    if (res.ok) {
      allLogs = logs;
      renderLogs(logs);
      updateLogsStats(logs);
    } else {
      container.innerHTML = `<p style="color:red; text-align:center; padding:40px;">❌ Failed to load logs.</p>`;
    }
  } catch (err) {
    console.error("Error loading logs:", err);
    container.innerHTML = `<p style="color:red; text-align:center; padding:40px;">❌ Network error. Please try again.</p>`;
  }
}

function renderLogs(logs) {
  const userFilter = document.getElementById("logUserFilter").value.toLowerCase();
  const dateFilter = document.getElementById("logDateFilter").value;
  const actionFilter = document.getElementById("logActionFilter").value;

  // Apply filters
  const filtered = logs.filter(log => {
    const matchesUser = !userFilter || log.userEmail.toLowerCase().includes(userFilter);
    const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);
    const matchesAction = !actionFilter || log.actionType === actionFilter;
    return matchesUser && matchesDate && matchesAction;
  });

  const container = document.getElementById("logsTableContainer");
  
  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No Activity Logs Found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <table>
      <thead>
        <tr>
          <th>User Email</th>
          <th>Action</th>
          <th>Details</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(log => createLogRow(log)).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = tableHTML;
}

function createLogRow(log) {
  const actionBadge = `<span class="log-action log-${log.actionType}">${getActionIcon(log.actionType)} ${log.actionType}</span>`;
  const timestamp = new Date(log.timestamp).toLocaleString();
  
  return `
    <tr>
      <td><strong>${log.userEmail}</strong></td>
      <td>${actionBadge}</td>
      <td>${log.details || "-"}</td>
      <td>${timestamp}</td>
    </tr>
  `;
}

function getActionIcon(action) {
  const icons = {
    login: '🔐',
    addProduct: '➕',
    orderPlaced: '🛒',
    updateProfile: '✏️',
    deleteUser: '🗑️',
    other: '📋'
  };
  return icons[action] || '📋';
}

function updateLogsStats(logs) {
  const total = logs.length;
  const uniqueUsers = new Set(logs.map(l => l.userEmail)).size;
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.timestamp.startsWith(today)).length;
  
  document.getElementById('totalLogsCount').textContent = total;
  document.getElementById('uniqueUsersCount').textContent = uniqueUsers;
  document.getElementById('todayLogsCount').textContent = todayLogs;
}

// ===========================
// LOG REFRESH & EXPORT
// ===========================
document.getElementById('refreshLogsBtn').addEventListener('click', () => {
  loadLogs();
});

document.getElementById('exportLogsBtn').addEventListener('click', () => {
  if (allLogs.length === 0) {
    alert("No logs to export!");
    return;
  }
  
  const csv = convertLogsToCSV(allLogs);
  downloadCSV(csv, 'activity_logs_export.csv');
  alert("✅ Logs exported successfully!");
});

function convertLogsToCSV(logs) {
  const headers = ['User Email', 'Action', 'Details', 'Timestamp'];
  const rows = logs.map(l => [
    l.userEmail,
    l.actionType,
    l.details || '',
    new Date(l.timestamp).toLocaleString()
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

// ===========================
// FILTER EVENT LISTENERS
// ===========================
document.getElementById("searchInput").addEventListener("input", () => {
  renderUsers(allUsers);
});

document.getElementById("roleFilter").addEventListener("change", () => {
  renderUsers(allUsers);
});

document.getElementById("statusFilter").addEventListener("change", () => {
  renderUsers(allUsers);
});

document.getElementById("logUserFilter").addEventListener("input", () => {
  renderLogs(allLogs);
});

document.getElementById("logDateFilter").addEventListener("change", () => {
  renderLogs(allLogs);
});

document.getElementById("logActionFilter").addEventListener("change", () => {
  renderLogs(allLogs);
});

// ===========================
// ERROR HANDLING
// ===========================
function showError(message) {
  alert(`❌ Error: ${message}`);
}

// ===========================
// INITIAL LOAD
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  
  // Auto-refresh stats every 30 seconds
  setInterval(() => {
    if (sections.analytics.classList.contains('active')) {
      loadStats();
    }
  }, 30000);
});