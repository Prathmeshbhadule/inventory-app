/**
 * NovaSphere Enterprise Client Application
 * Node.js + Express.js + MongoDB Atlas Suite
 * Currency Standard: Indian Rupee (₹ INR)
 * Theme: Light Mode (Default) with Dark Mode Toggle
 */

// Application State
const state = {
  currentTab: 'products',
  theme: 'light', // Default is Light mode
  products: [],
  users: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 10,
  },
  filters: {
    search: '',
    category: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  deleteTarget: {
    type: null,
    id: null,
    title: '',
  },
  isDbConnected: false,
};

// Indian Rupee (INR) Standard Formatter (Lakhs & Crores)
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

// DOM Elements
const el = {
  // Theme Toggle
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeToggleIcon: document.getElementById('themeToggleIcon'),

  // Navigation Tabs
  navTabProducts: document.getElementById('navTabProducts'),
  navTabUsers: document.getElementById('navTabUsers'),
  navTabDiagnostics: document.getElementById('navTabDiagnostics'),
  viewProducts: document.getElementById('viewProducts'),
  viewUsers: document.getElementById('viewUsers'),
  viewDiagnostics: document.getElementById('viewDiagnostics'),

  // Header & Status
  dbHealthBadge: document.getElementById('dbHealthBadge'),
  dbHealthDot: document.getElementById('dbHealthDot'),
  dbHealthText: document.getElementById('dbHealthText'),
  topActionBtn: document.getElementById('topActionBtn'),
  topActionBtnText: document.getElementById('topActionBtnText'),

  // Stats
  statTotalProducts: document.getElementById('statTotalProducts'),
  statTotalStock: document.getElementById('statTotalStock'),
  statLowStock: document.getElementById('statLowStock'),
  statTotalValue: document.getElementById('statTotalValue'),

  // Controls (Products)
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  categoryFilter: document.getElementById('categoryFilter'),
  statusFilter: document.getElementById('statusFilter'),
  sortByFilter: document.getElementById('sortByFilter'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  refreshProductsBtn: document.getElementById('refreshProductsBtn'),

  // Products Table
  productsTableBody: document.getElementById('productsTableBody'),
  paginationInfo: document.getElementById('paginationInfo'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  currentPageIndicator: document.getElementById('currentPageIndicator'),

  // Users Table
  usersTableBody: document.getElementById('usersTableBody'),
  openRegisterUserModalBtn: document.getElementById('openRegisterUserModalBtn'),

  // Product Modal
  productModal: document.getElementById('productModal'),
  modalTitle: document.getElementById('modalTitle'),
  productForm: document.getElementById('productForm'),
  productId: document.getElementById('productId'),
  formName: document.getElementById('formName'),
  formSku: document.getElementById('formSku'),
  formDescription: document.getElementById('formDescription'),
  formCategory: document.getElementById('formCategory'),
  formPrice: document.getElementById('formPrice'),
  formCostPrice: document.getElementById('formCostPrice'),
  formQuantity: document.getElementById('formQuantity'),
  formLowStockThreshold: document.getElementById('formLowStockThreshold'),
  formTags: document.getElementById('formTags'),
  formAlertBox: document.getElementById('formAlertBox'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  saveProductBtn: document.getElementById('saveProductBtn'),
  saveBtnText: document.getElementById('saveBtnText'),

  // User Register Modal
  userModal: document.getElementById('userModal'),
  closeUserModalBtn: document.getElementById('closeUserModalBtn'),
  cancelUserModalBtn: document.getElementById('cancelUserModalBtn'),
  userRegisterForm: document.getElementById('userRegisterForm'),
  formUserName: document.getElementById('formUserName'),
  formUserEmail: document.getElementById('formUserEmail'),
  formUserPassword: document.getElementById('formUserPassword'),
  formUserRole: document.getElementById('formUserRole'),
  formUserAge: document.getElementById('formUserAge'),
  userFormAlertBox: document.getElementById('userFormAlertBox'),
  submitUserBtn: document.getElementById('submitUserBtn'),

  // Delete Modal
  deleteModal: document.getElementById('deleteModal'),
  deleteTargetTitle: document.getElementById('deleteTargetTitle'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

  // Telemetry
  telemetryHost: document.getElementById('telemetryHost'),
  telemetryStatus: document.getElementById('telemetryStatus'),
  telemetryUptime: document.getElementById('telemetryUptime'),

  // Toast
  toastContainer: document.getElementById('toastContainer'),
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initEventListeners();
  checkHealth();
  fetchProducts();
  fetchStats();
  fetchUsers();

  setInterval(checkHealth, 15000);
});

/* ==========================================================================
   THEME TOGGLE: LIGHT (DEFAULT) & DARK
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('novasphere_theme');
  // Default mode is strictly light unless user chose dark
  if (savedTheme === 'dark') {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  el.themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('novasphere_theme', theme);

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    el.themeToggleIcon.className = 'fa-solid fa-sun text-amber-400 text-sm';
    el.themeToggleBtn.title = 'Switch to Light mode (current: Dark)';
  } else {
    document.documentElement.classList.remove('dark');
    el.themeToggleIcon.className = 'fa-solid fa-moon text-slate-700 text-sm';
    el.themeToggleBtn.title = 'Switch to Dark mode (current: Light)';
  }
}

function initEventListeners() {
  // Navigation Tabs
  el.navTabProducts.addEventListener('click', () => switchTab('products'));
  el.navTabUsers.addEventListener('click', () => switchTab('users'));
  el.navTabDiagnostics.addEventListener('click', () => switchTab('diagnostics'));

  // Top Action Button
  el.topActionBtn.addEventListener('click', () => {
    if (state.currentTab === 'users') {
      openUserModal();
    } else {
      openProductModal();
    }
  });

  // Modal Closers
  el.closeModalBtn.addEventListener('click', closeProductModal);
  el.cancelModalBtn.addEventListener('click', closeProductModal);
  el.productModal.addEventListener('click', (e) => {
    if (e.target === el.productModal) closeProductModal();
  });

  el.closeUserModalBtn.addEventListener('click', closeUserModal);
  el.cancelUserModalBtn.addEventListener('click', closeUserModal);
  el.userModal.addEventListener('click', (e) => {
    if (e.target === el.userModal) closeUserModal();
  });

  el.openRegisterUserModalBtn.addEventListener('click', openUserModal);

  // Delete Modal
  el.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  el.deleteModal.addEventListener('click', (e) => {
    if (e.target === el.deleteModal) closeDeleteModal();
  });
  el.confirmDeleteBtn.addEventListener('click', executeDelete);

  // Form Submissions
  el.productForm.addEventListener('submit', handleProductFormSubmit);
  el.userRegisterForm.addEventListener('submit', handleUserRegisterSubmit);

  // Search Filter with Debounce
  let searchTimer = null;
  el.searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    el.clearSearchBtn.classList.toggle('hidden', !val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = val.trim();
      state.pagination.currentPage = 1;
      fetchProducts();
    }, 300);
  });

  el.clearSearchBtn.addEventListener('click', () => {
    el.searchInput.value = '';
    el.clearSearchBtn.classList.add('hidden');
    state.filters.search = '';
    state.pagination.currentPage = 1;
    fetchProducts();
  });

  // Dropdown Filters
  el.categoryFilter.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    state.pagination.currentPage = 1;
    fetchProducts();
  });

  el.statusFilter.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.pagination.currentPage = 1;
    fetchProducts();
  });

  el.sortByFilter.addEventListener('change', (e) => {
    const [field, order] = e.target.value.split('-');
    state.filters.sortBy = field;
    state.filters.sortOrder = order;
    state.pagination.currentPage = 1;
    fetchProducts();
  });

  // Export CSV
  el.exportCsvBtn.addEventListener('click', exportToCSV);

  // Refresh
  el.refreshProductsBtn.addEventListener('click', () => {
    fetchProducts();
    fetchStats();
    checkHealth();
    showToast('Catalog refreshed from MongoDB Atlas', 'info');
  });

  // Pagination
  el.prevPageBtn.addEventListener('click', () => {
    if (state.pagination.currentPage > 1) {
      state.pagination.currentPage--;
      fetchProducts();
    }
  });

  el.nextPageBtn.addEventListener('click', () => {
    if (state.pagination.currentPage < state.pagination.totalPages) {
      state.pagination.currentPage++;
      fetchProducts();
    }
  });
}

/* ==========================================================================
   TAB NAVIGATION
   ========================================================================== */
function switchTab(tabName) {
  state.currentTab = tabName;

  const inactiveTabClass = 'nav-tab flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60 transition';
  const activeTabClass = 'nav-tab active flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 shadow-sm transition';

  [el.navTabProducts, el.navTabUsers, el.navTabDiagnostics].forEach((btn) => {
    btn.className = inactiveTabClass;
  });

  el.viewProducts.classList.add('hidden');
  el.viewUsers.classList.add('hidden');
  el.viewDiagnostics.classList.add('hidden');

  if (tabName === 'products') {
    el.navTabProducts.className = activeTabClass;
    el.viewProducts.classList.remove('hidden');
    el.topActionBtnText.textContent = 'Add Product';
    fetchProducts();
    fetchStats();
  } else if (tabName === 'users') {
    el.navTabUsers.className = activeTabClass;
    el.viewUsers.classList.remove('hidden');
    el.topActionBtnText.textContent = 'Register User';
    fetchUsers();
  } else if (tabName === 'diagnostics') {
    el.navTabDiagnostics.className = activeTabClass;
    el.viewDiagnostics.classList.remove('hidden');
    el.topActionBtnText.textContent = 'Add Product';
    checkHealth();
  }
}

/* ==========================================================================
   API CALLS: PRODUCTS & INVENTORY
   ========================================================================== */

async function fetchStats() {
  try {
    const res = await fetch('/api/products/stats/summary');
    if (!res.ok) return;

    const json = await res.json();
    if (json.success && json.data) {
      const { summary } = json.data;
      el.statTotalProducts.textContent = summary.totalProducts.toLocaleString('en-IN');
      el.statTotalStock.textContent = summary.totalStockQuantity.toLocaleString('en-IN');
      el.statLowStock.textContent = (summary.lowStockCount + summary.outOfStockCount).toLocaleString('en-IN');
      el.statTotalValue.textContent = formatINR(summary.totalInventoryValue);
    }
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

async function fetchProducts() {
  renderProductsLoading();

  try {
    const params = new URLSearchParams({
      page: state.pagination.currentPage,
      limit: state.pagination.limit,
      sortBy: state.filters.sortBy,
      sortOrder: state.filters.sortOrder,
    });

    if (state.filters.search) params.append('search', state.filters.search);
    if (state.filters.category) params.append('category', state.filters.category);
    if (state.filters.status) params.append('status', state.filters.status);

    const res = await fetch(`/api/products?${params.toString()}`);
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Error loading products');

    state.products = json.data || [];
    state.pagination = json.pagination || state.pagination;

    renderProductsTable();
    updatePaginationUI();
  } catch (error) {
    renderProductsError(error.message);
  }
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  clearProductFormErrors();

  const id = el.productId.value;
  const isEditing = Boolean(id);

  const tagsArray = el.formTags.value
    ? el.formTags.value.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const payload = {
    name: el.formName.value.trim(),
    sku: el.formSku.value.trim().toUpperCase(),
    description: el.formDescription.value.trim(),
    category: el.formCategory.value,
    price: parseFloat(el.formPrice.value),
    costPrice: el.formCostPrice.value ? parseFloat(el.formCostPrice.value) : 0,
    quantityInStock: parseInt(el.formQuantity.value, 10),
    lowStockThreshold: el.formLowStockThreshold.value ? parseInt(el.formLowStockThreshold.value, 10) : 10,
    tags: tagsArray,
  };

  el.saveProductBtn.disabled = true;
  el.saveBtnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...';

  try {
    const url = isEditing ? `/api/products/${id}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.details && Array.isArray(json.details)) {
        json.details.forEach((err) => {
          const fieldEl = document.getElementById(`err-${err.field}`);
          if (fieldEl) {
            fieldEl.textContent = err.message;
            fieldEl.classList.remove('hidden');
          }
        });
      } else {
        el.formAlertBox.textContent = json.message || 'Failed to save product';
        el.formAlertBox.classList.remove('hidden');
      }
      return;
    }

    closeProductModal();
    showToast(isEditing ? 'Product updated in MongoDB Atlas' : 'New product created in MongoDB Atlas', 'success');
    fetchProducts();
    fetchStats();
  } catch (err) {
    el.formAlertBox.textContent = err.message || 'Network error';
    el.formAlertBox.classList.remove('hidden');
  } finally {
    el.saveProductBtn.disabled = false;
    el.saveBtnText.textContent = isEditing ? 'Update Product' : 'Save Product';
  }
}

async function quickAdjustStock(id, operation, amount) {
  try {
    const res = await fetch(`/api/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, quantity: amount }),
    });

    const json = await res.json();
    if (!res.ok) {
      showToast(json.message || 'Stock adjustment failed', 'error');
      return;
    }

    showToast(`Inventory updated: ${json.data.quantityInStock} units remaining`, 'success');
    fetchProducts();
    fetchStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ==========================================================================
   API CALLS: USERS MANAGEMENT
   ========================================================================== */

async function fetchUsers() {
  el.usersTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="py-12 text-center text-slate-500 dark:text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-600 dark:text-indigo-400 mb-2 block"></i>
        <span>Querying MongoDB Atlas 'users' collection...</span>
      </td>
    </tr>
  `;

  try {
    const res = await fetch('/api/users');
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Failed to load users');

    state.users = json.data || [];
    renderUsersTable();
  } catch (err) {
    el.usersTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-red-500">
          <i class="fa-solid fa-circle-exclamation text-xl mb-1 block"></i>
          <span>${escapeHtml(err.message)}</span>
        </td>
      </tr>
    `;
  }
}

async function handleUserRegisterSubmit(e) {
  e.preventDefault();
  el.userFormAlertBox.classList.add('hidden');

  const payload = {
    name: el.formUserName.value.trim(),
    email: el.formUserEmail.value.trim(),
    password: el.formUserPassword.value,
    role: el.formUserRole.value,
    age: el.formUserAge.value ? parseInt(el.formUserAge.value, 10) : undefined,
  };

  el.submitUserBtn.disabled = true;
  el.submitUserBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Registering...';

  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      el.userFormAlertBox.textContent = json.message || 'Registration failed';
      el.userFormAlertBox.classList.remove('hidden');
      return;
    }

    closeUserModal();
    showToast(`User "${json.data.name}" registered successfully (201 Created)`, 'success');
    fetchUsers();
  } catch (err) {
    el.userFormAlertBox.textContent = err.message || 'Network error';
    el.userFormAlertBox.classList.remove('hidden');
  } finally {
    el.submitUserBtn.disabled = false;
    el.submitUserBtn.textContent = 'Register in MongoDB';
  }
}

/* ==========================================================================
   DELETE OPERATIONS (PRODUCTS & USERS)
   ========================================================================== */

function openDeleteModal(type, id, title) {
  state.deleteTarget = { type, id, title };
  el.deleteTargetTitle.textContent = title;
  el.deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  el.deleteModal.classList.add('hidden');
  state.deleteTarget = { type: null, id: null, title: '' };
}

async function executeDelete() {
  const { type, id } = state.deleteTarget;
  if (!id) return;

  el.confirmDeleteBtn.disabled = true;
  el.confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Deleting...';

  try {
    const endpoint = type === 'user' ? `/api/users/${id}` : `/api/products/${id}`;
    const res = await fetch(endpoint, { method: 'DELETE' });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Delete operation failed');

    closeDeleteModal();
    showToast(json.message || 'Record deleted from MongoDB', 'success');

    if (type === 'user') {
      fetchUsers();
    } else {
      fetchProducts();
      fetchStats();
    }
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    el.confirmDeleteBtn.disabled = false;
    el.confirmDeleteBtn.textContent = 'Confirm Delete';
  }
}

/* ==========================================================================
   HEALTH & TELEMETRY
   ========================================================================== */

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();

    state.isDbConnected = data.database?.connected || false;

    if (state.isDbConnected) {
      el.dbHealthDot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      el.dbHealthText.textContent = `Atlas: ${data.database.databaseName}`;
      if (el.telemetryHost) el.telemetryHost.textContent = data.database.host;
      if (el.telemetryStatus) el.telemetryStatus.textContent = `Connected (${data.database.status})`;
      if (el.telemetryUptime) {
        const mins = Math.floor(data.uptimeSeconds / 60);
        const secs = data.uptimeSeconds % 60;
        el.telemetryUptime.textContent = `${mins}m ${secs}s (Healthy)`;
      }
    } else {
      el.dbHealthDot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
      el.dbHealthText.textContent = 'Atlas: Reconnecting...';
      if (el.telemetryStatus) el.telemetryStatus.textContent = 'Disconnected';
    }
  } catch (err) {
    el.dbHealthDot.className = 'w-2 h-2 rounded-full bg-red-500';
    el.dbHealthText.textContent = 'Server Offline';
  }
}

/* ==========================================================================
   RENDERING FUNCTIONS
   ========================================================================== */

function renderProductsLoading() {
  el.productsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="py-12 text-center text-slate-500 dark:text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-xl text-indigo-600 dark:text-indigo-400 mb-2 block"></i>
        <span>Loading inventory from MongoDB Atlas...</span>
      </td>
    </tr>
  `;
}

function renderProductsError(msg) {
  el.productsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="py-8 text-center text-red-500">
        <i class="fa-solid fa-triangle-exclamation text-xl mb-1 block"></i>
        <p class="font-medium text-slate-800 dark:text-slate-200">Database Query Failed</p>
        <p class="text-[11px] text-red-600 dark:text-red-300 mt-1">${escapeHtml(msg)}</p>
      </td>
    </tr>
  `;
}

function renderProductsTable() {
  if (state.products.length === 0) {
    el.productsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-500 dark:text-slate-400">
          <i class="fa-solid fa-box-open text-2xl mb-2 text-slate-400 dark:text-slate-500 block"></i>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching products found</p>
          <p class="text-[11px] text-slate-500 mt-0.5">Adjust your search or add a new SKU to your catalog.</p>
        </td>
      </tr>
    `;
    return;
  }

  el.productsTableBody.innerHTML = state.products
    .map((prod) => {
      // Status pill with light/dark classes
      let statusClass = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      if (prod.status === 'Low Stock') statusClass = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      if (prod.status === 'Out of Stock') statusClass = 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
      if (prod.status === 'Discontinued') statusClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

      // Stock Bar
      const maxVisual = Math.max(prod.lowStockThreshold * 3, 25);
      const stockPercent = Math.min(Math.round((prod.quantityInStock / maxVisual) * 100), 100);
      let barColor = 'bg-emerald-500';
      if (prod.quantityInStock === 0) barColor = 'bg-red-500';
      else if (prod.quantityInStock <= prod.lowStockThreshold) barColor = 'bg-amber-500';

      // Profit margin calculation if cost price exists
      let marginBadge = '';
      if (prod.costPrice && prod.costPrice > 0 && prod.price > prod.costPrice) {
        const margin = Math.round(((prod.price - prod.costPrice) / prod.price) * 100);
        marginBadge = `<span class="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-mono">+${margin}%</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group">
          <!-- Product Title & SKU -->
          <td class="py-3.5 px-6">
            <div class="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition text-xs">
              ${escapeHtml(prod.name)}
            </div>
            <div class="flex items-center space-x-2 mt-1">
              <span class="font-mono text-[11px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                ${escapeHtml(prod.sku)}
              </span>
              ${(prod.tags || [])
                .slice(0, 2)
                .map((t) => `<span class="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">${escapeHtml(t)}</span>`)
                .join('')}
            </div>
          </td>

          <!-- Category -->
          <td class="py-3.5 px-6">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              ${escapeHtml(prod.category)}
            </span>
          </td>

          <!-- Price (Indian Rupee) -->
          <td class="py-3.5 px-6">
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-slate-900 dark:text-white text-xs">${formatINR(prod.price)}</span>
              ${marginBadge}
            </div>
            ${prod.costPrice ? `<div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Cost: ${formatINR(prod.costPrice)}</div>` : ''}
          </td>

          <!-- Stock Level & Quick Adjust -->
          <td class="py-3.5 px-6">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-800 dark:text-slate-200 text-xs">${prod.quantityInStock}</span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">units</span>
              <div class="inline-flex items-center space-x-1 ml-1.5">
                <button onclick="quickAdjustStock('${prod.id}', 'decrement', 1)" title="Reduce 1 unit" class="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] flex items-center justify-center transition border border-slate-200 dark:border-slate-700">
                  -
                </button>
                <button onclick="quickAdjustStock('${prod.id}', 'increment', 1)" title="Add 1 unit" class="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] flex items-center justify-center transition border border-slate-200 dark:border-slate-700">
                  +
                </button>
              </div>
            </div>
            <div class="w-24 bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
              <div class="${barColor} h-full rounded-full" style="width: ${stockPercent}%"></div>
            </div>
          </td>

          <!-- Status -->
          <td class="py-3.5 px-6">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass}">
              <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${barColor}"></span>
              ${escapeHtml(prod.status)}
            </span>
          </td>

          <!-- Actions -->
          <td class="py-3.5 px-6 text-right space-x-1.5">
            <button
              onclick="openEditProductModal('${prod.id}')"
              class="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Edit Product"
            >
              <i class="fa-solid fa-pen-to-square text-xs"></i>
            </button>
            <button
              onclick="openDeleteModal('product', '${prod.id}', '${escapeHtml(prod.name)}')"
              class="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Delete Product"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderUsersTable() {
  if (state.users.length === 0) {
    el.usersTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-500 dark:text-slate-400">
          <i class="fa-solid fa-users text-2xl mb-2 text-slate-400 dark:text-slate-500 block"></i>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">No registered users in MongoDB Atlas</p>
          <p class="text-[11px] text-slate-500 mt-0.5">Click "Register New User" above to add an account.</p>
        </td>
      </tr>
    `;
    return;
  }

  el.usersTableBody.innerHTML = state.users
    .map((user) => {
      let roleClass = 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      if (user.role === 'admin') roleClass = 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      if (user.role === 'moderator') roleClass = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';

      const regDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) : 'Recent';

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
          <td class="py-3.5 px-6">
            <div class="flex items-center space-x-3">
              <div class="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center uppercase">
                ${escapeHtml(user.name.charAt(0))}
              </div>
              <div>
                <div class="font-semibold text-slate-900 dark:text-white text-xs">${escapeHtml(user.name)}</div>
                <div class="font-mono text-[10px] text-slate-400 dark:text-slate-500">ID: ${user.id || user._id}</div>
              </div>
            </div>
          </td>

          <td class="py-3.5 px-6 font-mono text-slate-700 dark:text-slate-300 text-xs">
            ${escapeHtml(user.email)}
          </td>

          <td class="py-3.5 px-6">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${roleClass} uppercase">
              ${escapeHtml(user.role || 'user')}
            </span>
          </td>

          <td class="py-3.5 px-6 text-slate-700 dark:text-slate-300 text-xs">
            ${user.age ? `${user.age} yrs` : '—'}
          </td>

          <td class="py-3.5 px-6 text-slate-500 dark:text-slate-400 text-xs">
            ${regDate}
          </td>

          <td class="py-3.5 px-6 text-right">
            <button
              onclick="openDeleteModal('user', '${user.id || user._id}', '${escapeHtml(user.name)}')"
              class="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Delete User"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function updatePaginationUI() {
  const { currentPage, totalPages, totalProducts, limit } = state.pagination;
  const start = totalProducts === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalProducts);

  el.paginationInfo.textContent = `Showing ${start}-${end} of ${totalProducts} SKUs`;
  el.currentPageIndicator.textContent = `${currentPage} / ${totalPages}`;

  el.prevPageBtn.disabled = currentPage <= 1;
  el.nextPageBtn.disabled = currentPage >= totalPages;
}

/* ==========================================================================
   MODAL CONTROLS
   ========================================================================== */

function openProductModal() {
  clearProductFormErrors();
  el.productForm.reset();
  el.productId.value = '';
  el.modalTitle.innerHTML = '<i class="fa-solid fa-box text-indigo-600 dark:text-indigo-400"></i><span>Add New Product</span>';
  el.saveBtnText.textContent = 'Save Product';
  el.productModal.classList.remove('hidden');
}

function openEditProductModal(id) {
  clearProductFormErrors();
  const p = state.products.find((prod) => prod.id === id);
  if (!p) return;

  el.productId.value = p.id;
  el.formName.value = p.name;
  el.formSku.value = p.sku;
  el.formDescription.value = p.description;
  el.formCategory.value = p.category;
  el.formPrice.value = p.price;
  el.formCostPrice.value = p.costPrice || '';
  el.formQuantity.value = p.quantityInStock;
  el.formLowStockThreshold.value = p.lowStockThreshold || 10;
  el.formTags.value = (p.tags || []).join(', ');

  el.modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo-600 dark:text-indigo-400"></i><span>Edit Product Details</span>';
  el.saveBtnText.textContent = 'Update Product';
  el.productModal.classList.remove('hidden');
}

function closeProductModal() {
  el.productModal.classList.add('hidden');
}

function clearProductFormErrors() {
  document.querySelectorAll('.error-text').forEach((e) => {
    e.textContent = '';
    e.classList.add('hidden');
  });
  el.formAlertBox.textContent = '';
  el.formAlertBox.classList.add('hidden');
}

function openUserModal() {
  el.userRegisterForm.reset();
  el.userFormAlertBox.textContent = '';
  el.userFormAlertBox.classList.add('hidden');
  el.userModal.classList.remove('hidden');
}

function closeUserModal() {
  el.userModal.classList.add('hidden');
}

/* ==========================================================================
   EXPORT TO CSV
   ========================================================================== */
function exportToCSV() {
  if (state.products.length === 0) {
    showToast('No products available to export', 'warning');
    return;
  }

  const headers = ['SKU', 'Name', 'Category', 'Price (INR)', 'Cost (INR)', 'Stock', 'Status'];
  const rows = state.products.map((p) => [
    `"${p.sku}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category}"`,
    p.price,
    p.costPrice || 0,
    p.quantityInStock,
    `"${p.status}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `NovaSphere_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Inventory exported to CSV', 'success');
}

/* ==========================================================================
   TOAST NOTIFICATION COMPONENT
   ========================================================================== */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const borders = {
    success: 'border-emerald-200 dark:border-emerald-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-md',
    error: 'border-red-200 dark:border-red-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-md',
    warning: 'border-amber-200 dark:border-amber-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-md',
    info: 'border-indigo-200 dark:border-indigo-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-md',
  };

  const icons = {
    success: '<i class="fa-solid fa-circle-check text-emerald-500 mr-2 text-xs"></i>',
    error: '<i class="fa-solid fa-circle-xmark text-red-500 mr-2 text-xs"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation text-amber-500 mr-2 text-xs"></i>',
    info: '<i class="fa-solid fa-circle-info text-indigo-500 mr-2 text-xs"></i>',
  };

  toast.className = `toast-slide-in flex items-center p-3 rounded-xl border text-xs shadow-xl ${borders[type] || borders.info}`;
  toast.innerHTML = `
    <div class="flex items-center">
      ${icons[type] || icons.info}
      <span>${escapeHtml(message)}</span>
    </div>
  `;

  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
