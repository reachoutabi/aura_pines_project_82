/**
 * AURA PINES - Guest Portal Dashboard Application Script
 * Tab switching, Bookings Management, Filters, Modals, Itinerary Builder,
 * Checklist Sync, Chart.js Integration, Notifications Panel & Profile Editing.
 */

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new CampGuestDashboard();
  window.campDashboard = dashboard;
  dashboard.init();
});

class CampGuestDashboard {
  constructor() {
    this.currentTab = 'overview';
    this.chartsInitialized = false;
  }

  init() {
    this.setupSidebar();
    this.setupTabNavigation();
    this.renderOverview();
    this.renderBookings();
    this.renderChecklist();
    this.renderItinerary();
    this.renderTransactions();
    this.renderWishlist();
    this.renderNotifications();
    this.setupNotificationsDropdown();
    this.setupProfileForm();
    this.setupModals();
    this.startCountdown();
    this.initCharts();
  }

  /* ============================================================
     SIDEBAR & RESPONSIVE DRAWER
     ============================================================ */
  setupSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    const mobileTrigger = document.querySelector('.dashboard-mobile-menu-btn');
    const mobileCloseBtn = document.querySelector('.sidebar-mobile-close-btn');
    const backdrop = document.getElementById('sidebarBackdrop');

    const updateToggleBtnState = (isCollapsed) => {
      if (!toggleBtn) return;
      toggleBtn.innerHTML = isCollapsed
        ? '<i class="bi bi-chevron-right"></i>'
        : '<i class="bi bi-chevron-left"></i>';
      toggleBtn.setAttribute('title', isCollapsed ? 'Expand side pane (Click to view full menu)' : 'Collapse side pane (Ctrl+B)');
      toggleBtn.setAttribute('aria-label', isCollapsed ? 'Expand side pane' : 'Collapse side pane');
    };

    // Always ensure fully viewable sidebar by default
    if (sidebar) {
      const stored = localStorage.getItem('aurapines_sidebar_collapsed');
      if (stored === 'true') {
        sidebar.classList.add('collapsed');
        updateToggleBtnState(true);
      } else {
        sidebar.classList.remove('collapsed');
        updateToggleBtnState(false);
      }
    }

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = sidebar.classList.toggle('collapsed');
        updateToggleBtnState(isCollapsed);
        localStorage.setItem('aurapines_sidebar_collapsed', isCollapsed ? 'true' : 'false');
      });
    }

    // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (toggleBtn && window.innerWidth >= 992) {
          toggleBtn.click();
        }
      }
    });

    const closeMobileDrawer = () => {
      if (sidebar) sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('show');
    };

    const openMobileDrawer = () => {
      if (sidebar) sidebar.classList.add('mobile-open');
      if (backdrop) backdrop.classList.add('show');
    };

    if (mobileTrigger) {
      mobileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        openMobileDrawer();
      });
    }

    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', closeMobileDrawer);
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeMobileDrawer);
    }

    // Close on click outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth < 992 && sidebar && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && !mobileTrigger.contains(e.target)) {
          closeMobileDrawer();
        }
      }
    });
  }

  /* ============================================================
     TAB SWITCHING
     ============================================================ */
  setupTabNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-link[data-tab]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Also support hash in URL
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
      this.switchTab(hash);
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update sidebar active class
    document.querySelectorAll('.sidebar-link').forEach(link => {
      if (link.dataset.tab === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Show selected panel
    document.querySelectorAll('.dashboard-tab-panel').forEach(panel => {
      panel.style.display = 'none';
    });

    const targetPanel = document.getElementById(`tab-${tabName}`);
    if (targetPanel) {
      targetPanel.style.display = 'block';
    }

    // Refresh charts if opening overview
    if (tabName === 'overview' && !this.chartsInitialized) {
      this.initCharts();
    }

    // Close mobile sidebar if open
    const sidebar = document.querySelector('.dashboard-sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('show');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ============================================================
     OVERVIEW & STATS
     ============================================================ */
  renderOverview() {
    if (!window.CampStore) return;
    const user = window.CampStore.getUser();
    const bookings = window.CampStore.getBookings();
    const transactions = window.CampStore.getTransactions();

    // User greeting & points
    const greetEl = document.getElementById('dashUserGreeting');
    if (greetEl) greetEl.textContent = `Welcome back, ${user.name.split(' ')[0]}!`;

    const pointsEl = document.getElementById('dashLoyaltyPoints');
    if (pointsEl) pointsEl.textContent = user.points.toLocaleString();

    // Total Trips
    const tripsEl = document.getElementById('dashTotalTrips');
    if (tripsEl) tripsEl.textContent = bookings.length;

    // Total Spent
    const totalSpent = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const spentEl = document.getElementById('dashTotalSpent');
    if (spentEl) spentEl.textContent = `$${totalSpent.toLocaleString()}`;

    // Upcoming trip badge
    const upcoming = bookings.find(b => b.status === 'Upcoming' || b.status === 'Confirmed');
    if (upcoming) {
      const upTitle = document.getElementById('upcomingTripTitle');
      const upDates = document.getElementById('upcomingTripDates');
      const upGuests = document.getElementById('upcomingTripGuests');
      if (upTitle) upTitle.textContent = upcoming.stayType;
      if (upDates) upDates.textContent = `${upcoming.checkIn} — ${upcoming.checkOut} (${upcoming.nights} nights)`;
      if (upGuests) upGuests.textContent = upcoming.guests;
    }
  }

  startCountdown() {
    const daysEl = document.getElementById('cdDays');
    const hoursEl = document.getElementById('cdHours');
    const minsEl = document.getElementById('cdMins');
    const secsEl = document.getElementById('cdSecs');

    if (!daysEl || !hoursEl || !minsEl) return;

    // Fixed upcoming target: 12 days, 4 hours, 23 mins, 45 seconds
    let remainingSeconds = 12 * 86400 + 4 * 3600 + 23 * 60 + 45;

    function tick() {
      if (remainingSeconds <= 0) return;
      remainingSeconds--;

      const d = Math.floor(remainingSeconds / 86400);
      const h = Math.floor((remainingSeconds % 86400) / 3600);
      const m = Math.floor((remainingSeconds % 3600) / 60);
      const s = Math.floor(remainingSeconds % 60);

      daysEl.textContent = String(d).padStart(2, '0');
      hoursEl.textContent = String(h).padStart(2, '0');
      minsEl.textContent = String(m).padStart(2, '0');
      if (secsEl) {
        secsEl.textContent = String(s).padStart(2, '0');
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ============================================================
     BOOKINGS MANAGEMENT & TABLE
     ============================================================ */
  renderBookings() {
    const container = document.getElementById('bookingsTableBody');
    if (!container || !window.CampStore) return;

    const bookings = window.CampStore.getBookings();
    const searchInput = document.getElementById('bookingSearchInput');
    const statusFilter = document.getElementById('bookingStatusFilter');

    const filterVal = statusFilter ? statusFilter.value : 'all';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = bookings.filter(b => {
      const matchesStatus = filterVal === 'all' || b.status.toLowerCase() === filterVal.toLowerCase();
      const matchesQuery = b.id.toLowerCase().includes(query) || b.stayType.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <i class="bi bi-inbox" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            No bookings matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = filtered.map(b => {
      let statusBadge = 'badge-ember';
      if (b.status === 'Completed') statusBadge = 'badge-success';
      if (b.status === 'Cancelled') statusBadge = 'badge-danger';
      if (b.status === 'Confirmed') statusBadge = 'badge-teal';

      return `
        <tr>
          <td><strong style="color: var(--accent-primary); font-family: monospace;">${b.id}</strong></td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${b.image}" alt="${b.stayType}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover;">
              <div>
                <strong>${b.stayType}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${b.guests}</div>
              </div>
            </div>
          </td>
          <td>
            <div>${b.checkIn}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">to ${b.checkOut}</div>
          </td>
          <td>$${b.totalPrice}</td>
          <td><span class="camp-badge ${statusBadge}">${b.status}</span></td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn-camp btn-camp-secondary btn-sm" onclick="CampGuestDashboard.viewDetails('${b.id}')" title="View Details">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn-camp btn-camp-secondary btn-sm" onclick="CampGuestDashboard.downloadInvoice('${b.id}')" title="Download Invoice">
                <i class="bi bi-file-earmark-pdf"></i>
              </button>
              ${b.status !== 'Cancelled' && b.status !== 'Completed' ? `
                <button class="btn-camp btn-camp-outline btn-sm" onclick="CampGuestDashboard.openCancelModal('${b.id}')" title="Cancel Reservation" style="color: var(--state-danger); border-color: var(--state-danger);">
                  <i class="bi bi-x-circle"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach search and filter listeners once
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.addEventListener('input', () => this.renderBookings());
    }
    if (statusFilter && !statusFilter.dataset.bound) {
      statusFilter.dataset.bound = 'true';
      statusFilter.addEventListener('change', () => this.renderBookings());
    }
  }

  /* ============================================================
     PACKING CHECKLIST
     ============================================================ */
  renderChecklist() {
    const listEl = document.getElementById('packingChecklistContainer');
    if (!listEl || !window.CampStore) return;

    const items = window.CampStore.getChecklist();

    listEl.innerHTML = items.map(item => `
      <div class="checklist-item ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
        <label class="checklist-label">
          <input type="checkbox" class="checklist-checkbox" ${item.checked ? 'checked' : ''} onchange="CampGuestDashboard.toggleCheck('${item.id}')">
          <span style="font-size: 0.9rem;">${item.text}</span>
        </label>
        <span class="camp-badge badge-teal" style="font-size: 0.7rem;">${item.category}</span>
      </div>
    `).join('');

    // Form to add custom checklist item
    const addForm = document.getElementById('addChecklistForm');
    if (addForm && !addForm.dataset.bound) {
      addForm.dataset.bound = 'true';
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('newChecklistInput');
        const catSelect = document.getElementById('newChecklistCat');
        if (input && input.value.trim()) {
          window.CampStore.addChecklistItem(input.value.trim(), catSelect ? catSelect.value : 'Gear');
          input.value = '';
          this.renderChecklist();
          if (window.showToast) window.showToast('Item added to packing checklist!', 'success');
        }
      });
    }
  }

  /* ============================================================
     ITINERARY BUILDER
     ============================================================ */
  renderItinerary() {
    const container = document.getElementById('dashboardItineraryContainer');
    if (!container || !window.CampStore) return;

    const days = window.CampStore.getItinerary();

    container.innerHTML = days.map((day, dIdx) => `
      <div class="itinerary-day-card">
        <div class="itinerary-day-header">
          <strong style="color: var(--accent-primary);"><i class="bi bi-calendar-event me-2"></i>${day.day}</strong>
          <span class="camp-badge badge-ember">${day.events.length} Planned Events</span>
        </div>
        <div>
          ${day.events.map((evt, eIdx) => `
            <div class="itinerary-event-row">
              <div style="display: flex; gap: 1.25rem; align-items: baseline;">
                <span style="font-family: monospace; font-weight: 700; color: var(--accent-primary); font-size: 0.85rem; min-width: 75px;">${evt.time}</span>
                <div>
                  <strong style="display: block; font-size: 0.95rem; margin-bottom: 0.2rem;">${evt.title}</strong>
                  <div style="font-size: 0.825rem; color: var(--text-muted);">${evt.desc}</div>
                </div>
              </div>
              <div class="itinerary-controls">
                <button class="itinerary-move-btn" onclick="CampGuestDashboard.moveEvent(${dIdx}, ${eIdx}, -1)" title="Move earlier">
                  <i class="bi bi-arrow-up"></i>
                </button>
                <button class="itinerary-move-btn" onclick="CampGuestDashboard.moveEvent(${dIdx}, ${eIdx}, 1)" title="Move later">
                  <i class="bi bi-arrow-down"></i>
                </button>
                <button class="itinerary-move-btn" onclick="CampGuestDashboard.removeEvent(${dIdx}, ${eIdx})" title="Remove item" style="color: var(--state-danger);">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Export / Print button
    const printBtn = document.getElementById('btnPrintItinerary');
    if (printBtn && !printBtn.dataset.bound) {
      printBtn.dataset.bound = 'true';
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  /* ============================================================
     TRANSACTIONS & PAYMENTS
     ============================================================ */
  renderTransactions() {
    const tableBody = document.getElementById('transactionsTableBody');
    const mobileList = document.getElementById('transactionsMobileList');
    if (!window.CampStore) return;

    const txns = window.CampStore.getTransactions();

    // 1. Desktop & Tablet Table (>= 768px)
    if (tableBody) {
      tableBody.innerHTML = txns.map(t => `
        <tr>
          <td><strong style="font-family: monospace; color: var(--accent-primary);">${t.id}</strong></td>
          <td>${t.date}</td>
          <td>${t.description}</td>
          <td><span style="font-size: 0.85rem; color: var(--text-muted);"><i class="bi bi-credit-card me-1"></i>${t.method}</span></td>
          <td><strong>$${t.amount}</strong></td>
          <td><span class="camp-badge badge-success">${t.status}</span></td>
          <td>
            <button class="btn-camp btn-camp-ghost btn-sm" onclick="CampGuestDashboard.downloadReceipt('${t.id}')">
              <i class="bi bi-receipt"></i> Receipt
            </button>
          </td>
        </tr>
      `).join('');
    }

    // 2. Mobile Responsive Transaction Cards (< 768px)
    if (mobileList) {
      if (txns.length === 0) {
        mobileList.innerHTML = `
          <div class="text-center py-4 text-muted">No transactions found.</div>
        `;
      } else {
        mobileList.innerHTML = txns.map(t => `
          <div class="card p-3 mb-3 rounded" style="background: var(--bg-surface); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
              <div>
                <strong style="font-family: monospace; color: var(--accent-primary); font-size: 0.95rem;">${t.id}</strong>
                <span class="camp-badge badge-success ms-2" style="font-size: 0.7rem;">${t.status}</span>
              </div>
              <div style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">$${t.amount}</div>
            </div>

            <div class="mb-2">
              <div style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${t.description}</div>
              <div class="d-flex align-items-center justify-content-between text-muted mt-1" style="font-size: 0.78rem;">
                <span><i class="bi bi-calendar3 me-1"></i> ${t.date}</span>
                <span><i class="bi bi-credit-card me-1"></i> ${t.method}</span>
              </div>
            </div>

            <button class="btn-camp btn-camp-secondary btn-sm w-100 justify-content-center mt-2" onclick="CampGuestDashboard.downloadReceipt('${t.id}')">
              <i class="bi bi-file-earmark-pdf"></i> Download Official Tax Receipt
            </button>
          </div>
        `).join('');
      }
    }
  }

  /* ============================================================
     WISHLIST
     ============================================================ */
  renderWishlist() {
    const container = document.getElementById('dashboardWishlistGrid');
    if (!container || !window.CampStore) return;

    const items = window.CampStore.getWishlist();
    if (!items.length) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="bi bi-heart" style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;"></i>
          Your wilderness wishlist is empty. Tap the heart on any stay or activity to save it!
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="camp-card h-100">
        <div class="camp-card-media">
          <img src="${item.image || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'}" alt="${item.title}" loading="lazy">
        </div>
        <div class="camp-card-body">
          <div class="camp-card-top-bar">
            <span class="camp-badge badge-ember card-badge-top">${item.type}</span>
            <button class="card-wishlist-btn active" data-item-id="${item.id}" data-item-title="${item.title}" aria-label="Remove from wishlist">
              <i class="bi bi-heart-fill"></i>
            </button>
          </div>
          <h4 class="camp-card-title">${item.title}</h4>
          <div class="camp-card-footer mt-auto">
            <div class="price-tag">
              <span class="price-tag-value">${item.price}</span>
            </div>
            <a href="booking.html" class="btn-camp btn-camp-primary btn-sm w-100">Book Now</a>
          </div>
        </div>
      </div>
    `).join('');
  }

  /* ============================================================
     NOTIFICATIONS
     ============================================================ */
  renderNotifications() {
    if (!window.CampStore) return;

    const notifs = window.CampStore.getNotifications();
    const unreadCount = notifs.filter(n => n.unread).length;

    // Update unread badges
    document.querySelectorAll('.notif-badge-count').forEach(badge => {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    });

    // 1. Render in full-page tab (if element exists)
    const listEl = document.getElementById('dashboardNotificationsList');
    if (listEl) {
      if (notifs.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-5" style="color: var(--text-muted);">
            <i class="bi bi-bell-slash mb-2" style="font-size: 2rem; display: block; opacity: 0.5;"></i>
            <p style="margin: 0;">No notifications yet.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = notifs.map(n => `
          <div class="p-3 mb-2 rounded" style="background: var(--bg-surface); border: 1px solid var(--border-color); ${n.unread ? 'border-inline-start: 4px solid var(--accent-primary);' : ''}">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong style="font-size: 0.95rem; color: var(--text-primary);">${n.title}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${n.time}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">${n.message}</p>
          </div>
        `).join('');
      }

      const markAllBtn = document.getElementById('btnMarkAllNotifsRead');
      if (markAllBtn && !markAllBtn.dataset.bound) {
        markAllBtn.dataset.bound = 'true';
        markAllBtn.addEventListener('click', () => {
          window.CampStore.markAllNotificationsRead();
          this.renderNotifications();
          if (window.showToast) window.showToast('All notifications marked as read', 'info');
        });
      }
    }

    // 2. Render inside Topbar Popover Dropdown
    const dropdownList = document.getElementById('topbarNotifList');
    if (dropdownList) {
      if (!notifs || notifs.length === 0) {
        dropdownList.innerHTML = `
          <div class="text-center py-4" style="color: var(--text-muted); font-size: 0.85rem;">
            <i class="bi bi-bell-slash mb-2" style="font-size: 1.5rem; display: block; opacity: 0.5;"></i>
            No notifications yet
          </div>
        `;
      } else {
        dropdownList.innerHTML = notifs.map(n => `
          <div class="topbar-notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
              <span class="topbar-notif-title">${n.title}</span>
              <span class="topbar-notif-time">${n.time}</span>
            </div>
            <p class="topbar-notif-msg mb-0">${n.message}</p>
          </div>
        `).join('');

        // Clicking an individual unread item marks it as read
        dropdownList.querySelectorAll('.topbar-notif-item.unread').forEach(item => {
          item.addEventListener('click', () => {
            const id = item.dataset.id;
            const all = window.CampStore.getNotifications();
            const target = all.find(x => x.id === id);
            if (target) {
              target.unread = false;
              localStorage.setItem('aurapines_notifications', JSON.stringify(all));
              this.renderNotifications();
            }
          });
        });
      }
    }
  }

  /* ============================================================
     TOPBAR NOTIFICATIONS POPOVER DROPDOWN
     ============================================================ */
  setupNotificationsDropdown() {
    const btn = document.getElementById('topbarNotifBtn');
    const dropdown = document.getElementById('topbarNotifDropdown');
    const markAllBtn = document.getElementById('topbarMarkAllReadBtn');
    const viewAllLink = document.getElementById('topbarViewAllNotifsLink');

    if (!btn || !dropdown) return;

    const toggle = (force) => {
      const willShow = force !== undefined ? force : !dropdown.classList.contains('show');
      if (willShow) {
        dropdown.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        dropdown.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
      }
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        toggle(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('show')) {
        toggle(false);
        btn.focus();
      }
    });

    // Mark all as read from popover
    if (markAllBtn) {
      markAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.CampStore) {
          window.CampStore.markAllNotificationsRead();
          this.renderNotifications();
          if (window.showToast) window.showToast('All notifications marked as read', 'info');
        }
      });
    }

    // View in full page
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggle(false);
        this.switchTab('notifications');
      });
    }
  }

  /* ============================================================
     PROFILE SETTINGS FORM
     ============================================================ */
  setupProfileForm() {
    const form = document.getElementById('userProfileForm');
    if (!form || !window.CampStore) return;

    if (typeof window.setupFormDataTypeRestrictions === 'function') {
      window.setupFormDataTypeRestrictions(form);
    }

    const user = window.CampStore.getUser();
    const nameInput = document.getElementById('profName');
    const emailInput = document.getElementById('profEmail');
    const phoneInput = document.getElementById('profPhone');
    const emerInput = document.getElementById('profEmer');
    const dietInput = document.getElementById('profDiet');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (emerInput) emerInput.value = user.emergencyContact || '';
    if (dietInput) dietInput.value = user.dietary || '';

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (window.validateFormDataType && !window.validateFormDataType(form)) {
        return;
      }

      window.CampStore.updateUser({
        name: nameInput?.value.trim() || user.name,
        email: emailInput?.value.trim() || user.email,
        phone: phoneInput?.value.trim() || user.phone,
        emergencyContact: emerInput?.value.trim() || user.emergencyContact,
        dietary: dietInput?.value.trim() || user.dietary
      });

      if (window.showToast) window.showToast('Profile & emergency preferences updated successfully!', 'success');
      this.renderOverview();
    });

    // Reset Demo Data Button in Settings
    const resetBtn = document.getElementById('btnResetDemoData');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all demo data back to fresh seeded defaults? This clears custom bookings and restores sample records.')) {
          window.CampStore.resetToDefault();
          window.location.reload();
        }
      });
    }
  }

  /* ============================================================
     CHARTS (SPEND & ADVENTURES)
     ============================================================ */
  initCharts() {
    if (typeof Chart === 'undefined') return;

    const spendCanvas = document.getElementById('spendTrendChart');
    if (spendCanvas && !this.chartsInitialized) {
      new Chart(spendCanvas, {
        type: 'line',
        data: {
          labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
          datasets: [{
            label: 'Wilderness Adventures Spend ($)',
            data: [320, 480, 750, 620, 910, 520, 840],
            borderColor: '#D2824A',
            backgroundColor: 'rgba(210, 130, 74, 0.12)',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#D2824A'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(169, 184, 160, 0.08)' },
              ticks: { color: '#A9B8A0' }
            },
            y: {
              grid: { color: 'rgba(169, 184, 160, 0.08)' },
              ticks: { color: '#A9B8A0' }
            }
          }
        }
      });
    }

    const activityCanvas = document.getElementById('activityCategoryChart');
    if (activityCanvas && !this.chartsInitialized) {
      new Chart(activityCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Trekking', 'Stargazing', 'Water Kayak', 'Campfire BBQ', 'Forest Yoga'],
          datasets: [{
            data: [35, 25, 20, 15, 5],
            backgroundColor: ['#D2824A', '#4F8F8A', '#E6B65C', '#C9604F', '#7FB58A'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#A9B8A0', boxWidth: 12, font: { size: 11 } }
            }
          }
        }
      });
    }

    this.chartsInitialized = true;
  }

  /* ============================================================
     MODALS
     ============================================================ */
  setupModals() {
    // Pay Now Modal Submission
    const payForm = document.getElementById('demoPayNowForm');
    if (payForm) {
      payForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const modal = bootstrap.Modal.getInstance(document.getElementById('payNowModal'));
        if (modal) modal.hide();
        if (window.showToast) window.showToast('Payment of $840 processed successfully! Invoice updated.', 'success');
      });
    }

    // Cancel Booking Confirmation Modal
    const confirmCancelBtn = document.getElementById('btnConfirmCancelBooking');
    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener('click', () => {
        const id = confirmCancelBtn.dataset.bookingId;
        if (id && window.CampStore) {
          window.CampStore.cancelBooking(id);
          const modal = bootstrap.Modal.getInstance(document.getElementById('cancelBookingModal'));
          if (modal) modal.hide();
          this.renderBookings();
          this.renderOverview();
          if (window.showToast) window.showToast(`Booking ${id} has been cancelled.`, 'info');
        }
      });
    }
  }

  /* ============================================================
     STATIC ACTIONS CALLED FROM TEMPLATE
     ============================================================ */
  static toggleCheck(id) {
    if (window.CampStore) {
      window.CampStore.toggleChecklistItem(id);
      const row = document.querySelector(`.checklist-item[data-item-id="${id}"]`);
      if (row) row.classList.toggle('checked');
    }
  }

  static moveEvent(dayIdx, evtIdx, direction) {
    if (!window.CampStore) return;
    const itinerary = window.CampStore.getItinerary();
    const day = itinerary[dayIdx];
    if (!day) return;

    const newIdx = evtIdx + direction;
    if (newIdx < 0 || newIdx >= day.events.length) return;

    const temp = day.events[evtIdx];
    day.events[evtIdx] = day.events[newIdx];
    day.events[newIdx] = temp;

    window.CampStore.saveItinerary(itinerary);
    const dash = new CampGuestDashboard();
    dash.renderItinerary();
  }

  static removeEvent(dayIdx, evtIdx) {
    if (!window.CampStore) return;
    const itinerary = window.CampStore.getItinerary();
    if (!itinerary[dayIdx]) return;

    itinerary[dayIdx].events.splice(evtIdx, 1);
    window.CampStore.saveItinerary(itinerary);
    const dash = new CampGuestDashboard();
    dash.renderItinerary();
    if (window.showToast) window.showToast('Itinerary event removed', 'info');
  }

  static viewDetails(id) {
    if (!window.CampStore) return;
    const booking = window.CampStore.getBookings().find(b => b.id === id);
    if (!booking) return;

    const modalBody = document.getElementById('bookingDetailsModalContent');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <img src="${booking.image}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 1rem;">
          <h4 style="margin-bottom: 0.25rem;">${booking.stayType}</h4>
          <span class="camp-badge badge-ember">Reservation #${booking.id}</span>
        </div>
        <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border-color); font-size: 0.9rem;">
          <div class="d-flex justify-content-between py-1 border-bottom">
            <span class="text-muted">Check-in:</span>
            <strong>${booking.checkIn}</strong>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom">
            <span class="text-muted">Check-out:</span>
            <strong>${booking.checkOut} (${booking.nights} nights)</strong>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom">
            <span class="text-muted">Guests:</span>
            <strong>${booking.guests}</strong>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom">
            <span class="text-muted">Status:</span>
            <strong>${booking.status}</strong>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom">
            <span class="text-muted">Total Paid:</span>
            <strong style="color: var(--accent-primary);">$${booking.totalPrice}</strong>
          </div>
          <div class="py-2">
            <span class="text-muted d-block mb-1">Add-ons:</span>
            <ul style="padding-left: 1.25rem; margin: 0; color: var(--text-secondary);">
              ${(booking.addons || ['Standard campfire kit']).map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
          <div class="py-1">
            <span class="text-muted d-block">Special Requests:</span>
            <em>${booking.specialRequests || 'None'}</em>
          </div>
        </div>
      `;

      const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
      modal.show();
    }
  }

  static openCancelModal(id) {
    const btn = document.getElementById('btnConfirmCancelBooking');
    if (btn) btn.dataset.bookingId = id;
    const modal = new bootstrap.Modal(document.getElementById('cancelBookingModal'));
    modal.show();
  }

  static downloadInvoice(id) {
    if (window.showToast) {
      window.showToast(`Generating official receipt for Reservation ${id}...`, 'info');
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }

  static downloadReceipt(txnId) {
    if (window.showToast) {
      window.showToast(`Receipt for transaction ${txnId} prepared for print`, 'info');
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
}

// Global expose
window.CampGuestDashboard = CampGuestDashboard;
