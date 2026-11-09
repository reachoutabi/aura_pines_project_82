/**
 * AURA PINES - Main Application Script
 * Theme Toggling, RTL Support, Mobile Nav, Lightbox, Toasts, Counters & Common UX
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme & RTL from Store
  initThemeAndDirection();

  // Setup Navbar & Mobile Drawer
  setupNavigation();

  // Reposition Card Badges & Wishlist Buttons below images
  repositionCardBadgesAndWishlist();

  // Setup Global Toasts & Wishlist Toggles
  setupWishlistButtons();

  // Setup Lightbox
  setupLightbox();

  // Setup Accordions
  setupAccordions();

  // Setup Stats Counters
  setupStatsCounters();

  // Setup Quick Search Bar & Date Pickers
  setupBookingSearch();
  setupExpeditionSearch();

  // Setup Newsletter Form
  setupNewsletterForm();

  // Setup Contact Form if present
  setupContactForm();

  // Setup Form Data Type Restrictions & Real-time Keystroke Validation
  setupFormDataTypeRestrictions();

  // Setup Container Animations & Scroll Reveals
  setupCampContainerAnimations();

  // Setup Timeline Motion & Beacon Tracking
  setupTimelineMotion();

  // Setup Interactive Reviews Mouse-Pointer Scrolling & Drag
  setupReviewsPointerScroll();

  // Setup Social Media Links Safeguard & Redirection
  setupSocialLinks();

  // Setup Auth Guarded Navigation (e.g. My Trips, Dashboard) & Dynamic Navbar State
  setupAuthGuardedLinks();
  updateNavAuthState();
});

/* ============================================================
   THEME & DIRECTION (RTL) INITIALIZATION
   ============================================================ */
function initThemeAndDirection() {
  const currentTheme = window.CampStore ? window.CampStore.getTheme() : 'light';
  const currentDir = window.CampStore ? window.CampStore.getDirection() : 'ltr';

  document.documentElement.setAttribute('data-theme', currentTheme);
  document.documentElement.setAttribute('data-bs-theme', currentTheme);
  document.documentElement.setAttribute('dir', currentDir);

  // Update theme toggle buttons UI
  updateThemeToggleUI(currentTheme);
  updateRtlToggleUI(currentDir);

  // Fix punctuation alignment for RTL layout if active
  if (currentDir === 'rtl') {
    fixRtlPunctuation('rtl');
  }

  // Bind Theme Toggle Buttons
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme') || 'light';
      const next = active === 'light' ? 'dark' : 'light';
      if (window.CampStore) window.CampStore.setTheme(next);
      updateThemeToggleUI(next);
      showToast(`Switched to ${next === 'dark' ? 'Midnight Pine (Dark)' : 'Warm Parchment (Light)'} mode`, 'info');
    });
  });

  // Bind RTL Toggle Buttons
  document.querySelectorAll('.rtl-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('dir') || 'ltr';
      const next = active === 'ltr' ? 'rtl' : 'ltr';
      if (window.CampStore) window.CampStore.setDirection(next);
      updateRtlToggleUI(next);
      fixRtlPunctuation(next);

      // Reset reviews interactive scroll position & update scroll thumb
      const reviewsWrapper = document.getElementById('reviewsInteractiveWrapper');
      if (reviewsWrapper) {
        reviewsWrapper.scrollLeft = 0;
      }
      if (typeof window.updateReviewsScrollThumb === 'function') {
        requestAnimationFrame(() => window.updateReviewsScrollThumb());
        setTimeout(window.updateReviewsScrollThumb, 100);
      }

      showToast(`Switched layout to ${next.toUpperCase()}`, 'info');
    });
  });
}

function updateThemeToggleUI(theme) {
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    const icon = btn.querySelector('i');
    if (icon) {
      if (theme === 'light') {
        icon.className = 'bi bi-moon-stars-fill';
        btn.setAttribute('title', 'Switch to Dark Mode');
        btn.setAttribute('aria-label', 'Switch to Dark Mode');
      } else {
        icon.className = 'bi bi-sun-fill';
        btn.setAttribute('title', 'Switch to Light Mode');
        btn.setAttribute('aria-label', 'Switch to Light Mode');
      }
    }
  });
}

function updateRtlToggleUI(dir) {
  document.querySelectorAll('.rtl-toggle-btn').forEach(btn => {
    btn.setAttribute('title', dir === 'rtl' ? 'Switch to LTR' : 'Switch to RTL');
    btn.setAttribute('aria-label', dir === 'rtl' ? 'Switch to LTR' : 'Switch to RTL');
    const label = btn.querySelector('.rtl-label');
    if (label) label.textContent = dir === 'rtl' ? 'LTR' : 'RTL';
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = `bi bi-arrow-left-right ${label ? 'me-1' : ''}`;
    }
  });
}

/* ============================================================
   NAVIGATION & MOBILE DRAWER
   ============================================================ */
function setupNavigation() {
  const navbar = document.querySelector('.main-navbar');
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerOverlay = document.querySelector('.mobile-drawer-overlay');
  const drawerClose = document.querySelector('.mobile-drawer-close');

  // Sticky Navbar Blur & Scrolled Effect
  if (navbar) {
    const handleNavScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();
  }

  // Open Drawer
  if (mobileToggle && mobileDrawer && drawerOverlay) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('active');
      drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close Drawer
  function closeDrawer() {
    if (mobileDrawer && drawerOverlay) {
      mobileDrawer.classList.remove('active');
      drawerOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // Mobile Dropdown Submenus
  document.querySelectorAll('.mobile-dropdown-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const menu = btn.nextElementSibling;
      if (menu && menu.classList.contains('mobile-dropdown-menu')) {
        menu.classList.toggle('show');
        const icon = btn.querySelector('.mobile-chevron');
        if (icon) {
          icon.classList.toggle('rotate-180');
        }
      }
    });
  });

  // Active Link Highlighting
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links-desktop a, .mobile-nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      // If inside dropdown, also activate parent toggle
      const parentDropdown = link.closest('.nav-item-dropdown');
      if (parentDropdown) {
        const toggle = parentDropdown.querySelector('.nav-dropdown-toggle');
        if (toggle) toggle.classList.add('active');
      }
    }
  });
}

/* ============================================================
   AUTHENTICATION STATE & ROUTE GUARDS
   ============================================================ */
function setupAuthGuardedLinks() {
  document.addEventListener('click', (e) => {
    const authLink = e.target.closest('a[href*="dashboard.html"], a[title="My Trips"]');
    if (!authLink) return;

    // Check login state
    let isLoggedIn = false;
    if (window.CampStore && typeof window.CampStore.isLoggedIn === 'function') {
      isLoggedIn = window.CampStore.isLoggedIn();
    } else if (window.CampStore && typeof window.CampStore.getUser === 'function') {
      const u = window.CampStore.getUser();
      isLoggedIn = Boolean(u && u.isLoggedIn === true);
    }

    if (!isLoggedIn) {
      e.preventDefault();
      const href = authLink.getAttribute('href') || 'dashboard.html#bookings';
      try {
        sessionStorage.setItem('aurapines_auth_redirect', href);
      } catch (_) {}

      const linkText = (authLink.textContent || '').trim().toLowerCase();
      const linkTitle = (authLink.getAttribute('title') || '').toLowerCase();
      const isTrips = href.includes('#bookings') || linkTitle.includes('trips') || linkText.includes('trips');

      const msg = isTrips
        ? 'Please sign in to view your trips and bookings.'
        : 'Please sign in to access the Guest Dashboard.';

      showToast(msg, 'info', 2400);

      setTimeout(() => {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(href);
      }, 350);
    }
  });
}

function updateNavAuthState() {
  let user = null;
  let isLoggedIn = false;
  if (window.CampStore && typeof window.CampStore.getUser === 'function') {
    user = window.CampStore.getUser();
    isLoggedIn = Boolean(user && user.isLoggedIn === true);
  }

  // Desktop Sign-In / Account Icon
  const desktopSignInBtns = document.querySelectorAll('.nav-signin-btn');
  desktopSignInBtns.forEach(btn => {
    if (isLoggedIn && user) {
      btn.setAttribute('title', `${user.name || 'Julian Vance'} (Signed in - Click to Sign Out)`);
      btn.setAttribute('aria-label', `Signed in as ${user.name || 'Julian Vance'}. Click to Sign Out`);
      btn.innerHTML = '<i class="bi bi-box-arrow-right text-danger"></i>';
      btn.setAttribute('href', 'login.html?logout=true');
      btn.onclick = (e) => {
        e.preventDefault();
        if (window.CampStore) window.CampStore.logout();
        try {
          sessionStorage.removeItem('aurapines_active_tab');
          sessionStorage.removeItem('aurapines_auth_redirect');
        } catch (_) {}
        showToast('You have been signed out safely.', 'info', 2500);
        setTimeout(() => {
          window.location.href = 'login.html?logout=true';
        }, 350);
      };
    } else {
      btn.setAttribute('title', 'Sign In');
      btn.setAttribute('aria-label', 'Sign In');
      btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i>';
      btn.setAttribute('href', 'login.html');
      btn.onclick = null;
    }
  });

  // Mobile Drawer Auth Action
  const mobileDrawerAuth = document.querySelector('.mobile-drawer-auth');
  if (mobileDrawerAuth) {
    if (isLoggedIn && user) {
      const fName = user.name ? user.name.split(' ')[0] : 'Guest';
      mobileDrawerAuth.innerHTML = `
        <a href="login.html?logout=true" id="mobileDrawerLogoutBtn" class="btn-camp btn-camp-secondary w-100 justify-content-center text-danger">
          <i class="bi bi-box-arrow-right me-2"></i> Sign Out (${fName})
        </a>
      `;
      const logoutBtn = document.getElementById('mobileDrawerLogoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.CampStore) window.CampStore.logout();
          try {
            sessionStorage.removeItem('aurapines_active_tab');
            sessionStorage.removeItem('aurapines_auth_redirect');
          } catch (_) {}
          showToast('Signed out safely.', 'info', 2500);
          setTimeout(() => {
            window.location.href = 'login.html?logout=true';
          }, 350);
        });
      }
    } else {
      mobileDrawerAuth.innerHTML = `
        <a href="login.html" class="btn-camp btn-camp-primary w-100 justify-content-center">
          <i class="bi bi-box-arrow-in-right me-2"></i> Sign In / Register
        </a>
      `;
    }
  }
}

/* ============================================================
   TOAST NOTIFICATION ENGINE
   ============================================================ */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `camp-toast toast-${type}`;

  let iconClass = 'bi-info-circle-fill';
  if (type === 'success') iconClass = 'bi-check-circle-fill';
  if (type === 'error') iconClass = 'bi-exclamation-triangle-fill';

  toast.innerHTML = `
    <i class="bi ${iconClass} toast-icon"></i>
    <div style="flex-grow: 1; font-size: 0.875rem;">${message}</div>
    <button type="button" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem;" aria-label="Close">
      <i class="bi bi-x"></i>
    </button>
  `;

  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => toast.remove());

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Global expose
window.showToast = showToast;

/* ============================================================
   REPOSITION CARD BADGES & WISHLIST BUTTONS BELOW IMAGES
   ============================================================ */
function repositionCardBadgesAndWishlist() {
  document.querySelectorAll('.camp-card').forEach(card => {
    const media = card.querySelector('.camp-card-media');
    const body = card.querySelector('.camp-card-body');
    if (!media || !body) return;

    const badge = media.querySelector('.card-badge-top');
    const wishlist = media.querySelector('.card-wishlist-btn');

    if (badge || wishlist) {
      let topBar = body.querySelector('.camp-card-top-bar');
      if (!topBar) {
        topBar = document.createElement('div');
        topBar.className = 'camp-card-top-bar';
        body.insertBefore(topBar, body.firstChild);
      }
      if (badge) topBar.appendChild(badge);
      if (wishlist) topBar.appendChild(wishlist);
    }
  });
}

/* ============================================================
   WISHLIST TOGGLES
   ============================================================ */
function setupWishlistButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-wishlist-btn');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const id = btn.dataset.itemId || 'item-' + Date.now();
    const title = btn.dataset.itemTitle || 'Wilderness Experience';
    const type = btn.dataset.itemType || 'Stay';
    const price = btn.dataset.itemPrice || '$200';
    const image = btn.dataset.itemImage || '';

    if (window.CampStore) {
      const added = window.CampStore.toggleWishlist({ id, title, type, price, image });
      if (added) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="bi bi-heart-fill" style="color: #FFF;"></i>';
        showToast(`Added "${title}" to your Wishlist`, 'success');
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="bi bi-heart"></i>';
        showToast(`Removed "${title}" from your Wishlist`, 'info');
      }
    }
  });

  // Mark already wishlisted items on initial page load (or reset to un-checked)
  if (window.CampStore) {
    document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
      const id = btn.dataset.itemId;
      if (id && window.CampStore.isInWishlist(id)) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="bi bi-heart-fill" style="color: #FFF;"></i>';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="bi bi-heart"></i>';
      }
    });
  }
}

/* ============================================================
   LIGHTBOX (GALLERY & PHOTOS)
   ============================================================ */
let currentLightboxIndex = 0;
let lightboxItems = [];

function setupLightbox() {
  const lightbox = document.getElementById('campLightbox');
  if (!lightbox) return;

  const imgEl = lightbox.querySelector('.lightbox-img');
  const captionEl = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  // Collect all gallery triggers
  const triggers = document.querySelectorAll('[data-lightbox-src]');
  lightboxItems = Array.from(triggers).map(el => ({
    src: el.getAttribute('data-lightbox-src'),
    caption: el.getAttribute('data-lightbox-caption') || ''
  }));

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(index);
    });
  });

  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    if (!lightboxItems[currentLightboxIndex]) return;
    const item = lightboxItems[currentLightboxIndex];
    imgEl.src = item.src;
    captionEl.textContent = `${item.caption} (${currentLightboxIndex + 1} / ${lightboxItems.length})`;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxItems.length;
    updateLightbox();
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      currentLightboxIndex = (currentLightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
      updateLightbox();
    }
    if (e.key === 'ArrowRight') {
      currentLightboxIndex = (currentLightboxIndex + 1) % lightboxItems.length;
      updateLightbox();
    }
  });

  // Background click close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

/* ============================================================
   ACCORDIONS (FAQ & DETAILS)
   ============================================================ */
function setupAccordions() {
  document.querySelectorAll('.camp-accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.camp-accordion-item');
      const isAlreadyActive = item.classList.contains('active');

      // Close sibling items in same accordion group
      const parent = item.parentElement;
      if (parent) {
        parent.querySelectorAll('.camp-accordion-item').forEach(sibling => {
          sibling.classList.remove('active');
        });
      }

      if (!isAlreadyActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ============================================================
   ANIMATED STATS COUNTERS
   ============================================================ */
function setupStatsCounters() {
  const counters = document.querySelectorAll('.counter-value');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target')) || 0;
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const duration = 1800; // ms
        const startTime = performance.now();

        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out expo
          const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const currentVal = (target * easeOut).toFixed(decimals);

          el.textContent = `${prefix}${Number(currentVal).toLocaleString()}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
          }
        }

        requestAnimationFrame(updateCounter);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.25 });

  counters.forEach(c => observer.observe(c));
}

/* ============================================================
   BOOKING SEARCH & DATE VALIDATION
   ============================================================ */
function setupBookingSearch() {
  const checkInInput = document.getElementById('searchCheckIn');
  const checkOutInput = document.getElementById('searchCheckOut');
  const searchForm = document.getElementById('campSearchForm');

  if (checkInInput && checkOutInput) {
    const today = new Date().toISOString().split('T')[0];
    checkInInput.setAttribute('min', today);

    // Default dates: tomorrow to +3 days
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkoutDefault = new Date();
    checkoutDefault.setDate(checkoutDefault.getDate() + 4);

    checkInInput.value = tomorrow.toISOString().split('T')[0];
    checkOutInput.value = checkoutDefault.toISOString().split('T')[0];
    checkOutInput.setAttribute('min', checkInInput.value);

    checkInInput.addEventListener('change', () => {
      if (checkInInput.value) {
        const nextDay = new Date(checkInInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutInput.setAttribute('min', nextDay.toISOString().split('T')[0]);
        if (checkOutInput.value <= checkInInput.value) {
          checkOutInput.value = nextDay.toISOString().split('T')[0];
        }
      }
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (checkInInput && !validateFieldDataType(checkInInput, true)) return;
      if (checkOutInput && !validateFieldDataType(checkOutInput, true)) return;

      const checkIn = checkInInput ? checkInInput.value : '';
      const checkOut = checkOutInput ? checkOutInput.value : '';
      const guests = document.getElementById('searchGuests') ? document.getElementById('searchGuests').value : '2 Adults';
      const stayType = document.getElementById('searchStayType') ? document.getElementById('searchStayType').value : 'any';

      // Save to sessionStorage for booking flow
      sessionStorage.setItem('camp_search_checkIn', checkIn);
      sessionStorage.setItem('camp_search_checkOut', checkOut);
      sessionStorage.setItem('camp_search_guests', guests);
      sessionStorage.setItem('camp_search_stayType', stayType);

      window.location.href = `booking.html?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests)}&stayType=${encodeURIComponent(stayType)}`;
    });
  }
}

/* ============================================================
   EXPEDITION SEARCH FORM (HOMEPAGE 2)
   ============================================================ */
function setupExpeditionSearch() {
  const form = document.getElementById('expeditionSearchForm');
  if (!form) return;
  const expCheckIn = document.getElementById('expCheckIn');
  if (expCheckIn) {
    const today = new Date().toISOString().split('T')[0];
    expCheckIn.setAttribute('min', today);
    if (!expCheckIn.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expCheckIn.value = tomorrow.toISOString().split('T')[0];
    }
  }

  form.addEventListener('submit', (e) => {
    if (expCheckIn && !validateFieldDataType(expCheckIn, true)) {
      e.preventDefault();
      return;
    }
  });
}

/* ============================================================
   NEWSLETTER SUBSCRIPTION FORM
   ============================================================ */
function setupNewsletterForm() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input) {
        const isValid = validateFieldDataType(input, true);
        if (isValid && input.value.trim()) {
          const email = input.value.trim();
          input.value = '';
          clearFieldError(input);
          showToast(`Thank you! Wilderness guide & special offers sent to ${email}`, 'success');
        } else {
          showToast('Please enter a valid email address (e.g. name@example.com).', 'error');
        }
      }
    });
  });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function setupContactForm() {
  const form = document.getElementById('campContactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateFormDataType(form)) {
      return;
    }

    const name = form.querySelector('#contactName')?.value.trim() || 'Guest';
    showToast(`Thank you, ${name}! Your inquiry has been dispatched to the Camp Warden. We will reply within 4 hours.`, 'success');
    form.reset();
    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
      el.classList.remove('is-invalid', 'is-valid');
      clearFieldError(el);
    });
  });
}

/* ============================================================
   CAMP CONTAINER ANIMATIONS & SCROLL REVEALS
   ============================================================ */
function setupCampContainerAnimations() {
  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Mark body as motion ready so transition states are enabled progressively
  document.body.classList.add('camp-motion-ready');

  // Select all .camp-container elements, excluding navbar
  const containers = Array.from(document.querySelectorAll('.camp-container')).filter(
    el => !el.closest('.main-navbar')
  );

  if (containers.length === 0) return;

  if (!('IntersectionObserver' in window) || window.innerWidth <= 991) {
    // Fallback or mobile viewport: immediately make all containers visible to prevent mobile blanking
    containers.forEach(el => el.classList.add('camp-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('camp-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '120px 0px 60px 0px',
      threshold: 0.01
    }
  );

  containers.forEach(container => {
    // Hero containers and containers already visible in viewport on initial load
    const rect = container.getBoundingClientRect();
    const isHero = container.closest('.hero-campsite, .hero-expedition, .page-hero-animated, .coming-soon-wrapper, .error-hero-animated');
    if (isHero || rect.top < window.innerHeight) {
      container.classList.add('camp-visible');
    } else {
      observer.observe(container);
    }
  });
}

/* ============================================================
   CAMP TIMELINE SCROLL REVEALS & ACTIVE BEACON MOTION
   ============================================================ */
function setupTimelineMotion() {
  const timelines = document.querySelectorAll('.camp-timeline');
  if (!timelines.length) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  timelines.forEach(timeline => {
    const items = timeline.querySelectorAll('.timeline-item');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => {
        item.classList.add('in-view');
      });
      return;
    }

    // Scroll reveal observer for each timeline item
    const itemObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15
    });

    items.forEach(item => itemObserver.observe(item));

    // Active center-point tracker as user scrolls through the day / journey
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          items.forEach(i => i.classList.remove('is-active'));
          entry.target.classList.add('is-active');
        }
      });
    }, {
      root: null,
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0
    });

    items.forEach(item => activeObserver.observe(item));
  });
}

/* ============================================================
   REVIEWS MOUSE-POINTER DIRECTIONAL SCROLLING & DRAG
   ============================================================ */
function setupReviewsPointerScroll() {
  const wrapper = document.getElementById('reviewsInteractiveWrapper');
  if (!wrapper) return;

  const thumb = document.getElementById('reviewsScrollThumb');
  const track = document.querySelector('.reviews-scrollbar-track');
  const prevBtn = document.querySelector('.reviews-prev-btn');
  const nextBtn = document.querySelector('.reviews-next-btn');

  let isHovered = false;
  let targetVelocity = 0;
  let currentVelocity = 0;
  let isDown = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let hasMoved = false;
  let animId = null;

  // Update progress scrollbar thumb
  function updateScrollThumb() {
    if (!thumb || !wrapper) return;
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
    if (maxScroll <= 0) {
      thumb.style.width = '100%';
      thumb.style.transform = 'translateX(0)';
      return;
    }

    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
    const rawScroll = wrapper.scrollLeft;

    // In modern browsers (Chromium, Firefox, Safari), with dir="rtl",
    // scrollLeft starts at 0 (far right) and becomes negative down to -maxScroll as you scroll left.
    const scrollDist = isRtl ? Math.abs(rawScroll) : Math.max(0, rawScroll);
    const ratio = Math.max(0, Math.min(1, scrollDist / maxScroll));

    // Refined pill width (20% - 32%) so thumb glides visibly across track
    const thumbWidthPercent = Math.max(20, Math.min(32, (wrapper.clientWidth / wrapper.scrollWidth) * 100));
    thumb.style.width = `${thumbWidthPercent}%`;

    const trackWidth = track ? track.clientWidth : (thumb.parentElement ? thumb.parentElement.clientWidth : 260);
    const thumbWidth = thumb.offsetWidth || (trackWidth * thumbWidthPercent / 100);
    const maxTranslate = Math.max(0, trackWidth - thumbWidth);

    const translateVal = ratio * maxTranslate;
    // In RTL, thumb is anchored at right: 0; moving towards end requires negative X translation to move left
    thumb.style.transform = isRtl ? `translateX(-${translateVal}px)` : `translateX(${translateVal}px)`;
  }

  // Expose to window for direction toggling & layout shifts
  window.updateReviewsScrollThumb = updateScrollThumb;

  wrapper.addEventListener('scroll', updateScrollThumb, { passive: true });
  window.addEventListener('resize', updateScrollThumb, { passive: true });
  setTimeout(updateScrollThumb, 300);

  // Click on track to jump position
  if (track) {
    track.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
      const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
      const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

      if (isRtl) {
        // In RTL, clickRatio 0 is at track left (end of reviews), clickRatio 1 is at track right (start)
        const rtlRatio = 1 - clickRatio;
        wrapper.scrollTo({ left: -rtlRatio * maxScroll, behavior: 'smooth' });
      } else {
        wrapper.scrollTo({ left: clickRatio * maxScroll, behavior: 'smooth' });
      }
    });
  }

  // Calculate mouse position relative to wrapper to determine direction and velocity
  function updatePointerVelocity(clientX) {
    const rect = wrapper.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const deadZoneLeft = 0.40;
    const deadZoneRight = 0.60;
    const maxSpeed = 12; // pixels per animation frame

    if (relX < deadZoneLeft) {
      // Mouse is positioned on the left side: scroll towards left
      const intensity = (deadZoneLeft - relX) / deadZoneLeft;
      targetVelocity = -intensity * maxSpeed;
    } else if (relX > deadZoneRight) {
      // Mouse is positioned on the right side: scroll towards right
      const intensity = (relX - deadZoneRight) / (1 - deadZoneRight);
      targetVelocity = intensity * maxSpeed;
    } else {
      // In the middle dead zone: smooth deceleration to stop
      targetVelocity = 0;
    }
  }

  wrapper.addEventListener('mouseenter', (e) => {
    isHovered = true;
    updatePointerVelocity(e.clientX);
    startAnimationLoop();
  });

  wrapper.addEventListener('mousemove', (e) => {
    if (isDown) return;
    updatePointerVelocity(e.clientX);
  });

  wrapper.addEventListener('mouseleave', () => {
    isHovered = false;
    targetVelocity = 0;
  });

  function startAnimationLoop() {
    if (animId) return;

    function step() {
      // Smoothly interpolate current velocity toward target velocity (liquid ease)
      currentVelocity += (targetVelocity - currentVelocity) * 0.1;

      if (Math.abs(currentVelocity) > 0.08) {
        // In both LTR and RTL: negative velocity scrolls left, positive scrolls right
        wrapper.scrollLeft += currentVelocity;
      }

      if (isHovered || Math.abs(currentVelocity) > 0.08) {
        animId = requestAnimationFrame(step);
      } else {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    animId = requestAnimationFrame(step);
  }

  // Mouse Grab & Drag functionality
  wrapper.addEventListener('mousedown', (e) => {
    isDown = true;
    hasMoved = false;
    wrapper.classList.add('is-dragging');
    startX = e.pageX - wrapper.offsetLeft;
    scrollLeftStart = wrapper.scrollLeft;
    targetVelocity = 0;
    currentVelocity = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - wrapper.offsetLeft;
    const walk = (x - startX) * 1.6;
    if (Math.abs(walk) > 4) hasMoved = true;
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
    // In RTL, dragging left (negative walk) decreases scrollLeft (more negative) to follow the pointer
    wrapper.scrollLeft = isRtl ? (scrollLeftStart + walk) : (scrollLeftStart - walk);
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    wrapper.classList.remove('is-dragging');
  });

  // Prevent accidental click triggers on children during drag
  wrapper.addEventListener('click', (e) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Arrow navigation buttons: left button scrolls left, right button scrolls right
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const slide = wrapper.querySelector('.reviews-slide-item');
      const offset = (slide ? slide.offsetWidth : 360) + 24;
      wrapper.scrollBy({ left: -offset, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const slide = wrapper.querySelector('.reviews-slide-item');
      const offset = (slide ? slide.offsetWidth : 360) + 24;
      wrapper.scrollBy({ left: offset, behavior: 'smooth' });
    });
  }

  // Observe dir changes on <html> to instantly reset and reposition scrollbar
  const dirObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
        wrapper.scrollLeft = 0;
        requestAnimationFrame(() => updateScrollThumb());
        setTimeout(updateScrollThumb, 100);
      }
    });
  });
  dirObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
}

/* ============================================================
   SOCIAL MEDIA LINKS REDIRECTION SAFEGUARD
   ============================================================ */
function setupSocialLinks() {
  const SOCIAL_URLS = {
    instagram: 'https://www.instagram.com',
    facebook: 'https://www.facebook.com',
    youtube: 'https://www.youtube.com',
    tripadvisor: 'https://www.tripadvisor.com',
    twitter: 'https://x.com',
    x: 'https://x.com',
    pinterest: 'https://www.pinterest.com'
  };

  // Ensure all social links have correct external destination & target attributes
  document.querySelectorAll('a[aria-label], a[title]').forEach(link => {
    const label = (link.getAttribute('aria-label') || link.getAttribute('title') || '').toLowerCase();
    
    for (const [platform, url] of Object.entries(SOCIAL_URLS)) {
      if (label.includes(platform)) {
        if (!link.getAttribute('href') || link.getAttribute('href') === '#' || link.getAttribute('href').startsWith('javascript:')) {
          link.setAttribute('href', url);
        }
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        break;
      }
    }
  });

  // Global delegated click handler as fallback
  document.addEventListener('click', (e) => {
    const socialLink = e.target.closest('a');
    if (!socialLink) return;

    const label = (socialLink.getAttribute('aria-label') || socialLink.getAttribute('title') || '').toLowerCase();
    for (const [platform, url] of Object.entries(SOCIAL_URLS)) {
      if (label.includes(platform)) {
        const href = socialLink.getAttribute('href');
        if (!href || href === '#' || href === '') {
          e.preventDefault();
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        break;
      }
    }
  });
}

/* ============================================================
   RTL PUNCTUATION POSITIONING FIX
   In BiDi algorithm, neutral punctuation (. ? ! : ; … etc.) at
   the end of an LTR sentence in RTL mode resolves to RTL base level,
   causing it to visually jump to the far left.
   This function ensures all punctuation marks remain firmly at
   the right of the text by appending the invisible Left-to-Right
   Mark (\u200E) to trailing punctuation when in RTL mode.
   ============================================================ */
function fixRtlPunctuation(dir) {
  const isRtl = dir === 'rtl';
  const punctuationRegex = /([.?!,:;…"”'’)}\]—–\-\+\/\%])(\s*)$/;
  const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME']);

  function walk(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (IGNORED_TAGS.has(node.tagName)) return;
      for (let child = node.firstChild; child; child = child.nextSibling) {
        walk(child);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const val = node.nodeValue;
      if (!val || !val.trim()) return;

      if (isRtl) {
        if (punctuationRegex.test(val) && !val.includes('\u200E')) {
          node.nodeValue = val.replace(punctuationRegex, '$1\u200E$2');
        }
      } else {
        if (val.includes('\u200E')) {
          node.nodeValue = val.replace(/\u200E/g, '');
        }
      }
    }
  }

  if (document.body) {
    walk(document.body);
  }
}

// Global expose
window.fixRtlPunctuation = fixRtlPunctuation;

/* ============================================================
   FORM DATA TYPE RESTRICTIONS & REAL-TIME VALIDATION ENGINE
   Strictly enforces data types:
   - Name: Letters, spaces, hyphens, apostrophes ONLY (blocks digits/symbols)
   - Phone: Digits, spaces, hyphens, parens, leading + ONLY (blocks letters)
   - Email: Valid email format, strictly no spaces
   - Card Number: 16 digits formatted in 4-digit groups (blocks letters)
   - Card Expiry: MM/YY format with future date verification
   - Card CVV: 3-4 digits only
   - Coupon: Alphanumeric characters only
   ============================================================ */
function getFieldDataType(input) {
  if (!input) return null;
  if (input.dataset && input.dataset.type) return input.dataset.type.toLowerCase();

  const id = (input.id || '').toLowerCase();
  const name = (input.name || '').toLowerCase();
  const type = (input.type || '').toLowerCase();

  if (type === 'email' || id.includes('email') || name.includes('email')) return 'email';
  if (type === 'tel' || id.includes('phone') || name.includes('phone') || id.includes('mobile')) return 'phone';
  if (id === 'bcardnumber' || id === 'cardnumber' || name.includes('cardnumber')) return 'card';
  if (id === 'bcardexpiry' || id === 'cardexpiry' || id === 'cardexp') return 'expiry';
  if (id === 'bcardcvv' || id === 'cardcvv' || id === 'cardcvc') return 'cvv';
  if (id === 'bcardname' || id === 'cardname') return 'name';
  if (id === 'couponcodeinput' || id.includes('coupon') || id.includes('promo')) return 'coupon';
  if (type === 'date' || id.includes('checkin') || id.includes('checkout') || name.includes('checkin') || name.includes('checkout')) return 'date';
  if (id.includes('diet') || name.includes('diet')) return 'dietary';
  if (id.includes('emer') || name.includes('emer')) return 'emergency';

  // Name fields (e.g. contactName, bGuestName, regFirstName, regLastName, profName)
  if (id.includes('name') && !id.includes('stay') && !id.includes('code') && !id.includes('file')) return 'name';

  return null;
}

function showFieldError(input, message) {
  if (!input) return;
  input.classList.add('is-invalid');
  input.classList.remove('is-valid');
  input.setAttribute('aria-invalid', 'true');

  const id = input.id || input.name;
  let errorEl = id ? document.querySelector(`.camp-field-error[data-for="${id}"]`) : null;

  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'camp-field-error';
    errorEl.setAttribute('role', 'alert');
    if (id) {
      errorEl.setAttribute('data-for', id);
    }
    const wrapper = input.closest('.position-relative');
    if (wrapper && wrapper.parentElement) {
      wrapper.insertAdjacentElement('afterend', errorEl);
    } else if (input.nextElementSibling) {
      input.insertAdjacentElement('afterend', errorEl);
    } else if (input.parentElement) {
      input.parentElement.appendChild(errorEl);
    }
  }

  errorEl.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i><span>${message}</span>`;
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove('is-invalid');
  input.removeAttribute('aria-invalid');

  const id = input.id || input.name;
  let errorEl = null;
  if (id) {
    errorEl = document.querySelector(`.camp-field-error[data-for="${id}"]`);
  }
  if (!errorEl) {
    const parent = input.closest('.position-relative') || input.parentElement;
    if (parent) {
      errorEl = parent.querySelector('.camp-field-error');
    }
  }
  if (errorEl) {
    errorEl.remove();
  }
}

function validateFieldDataType(input, showError = true) {
  if (!input) return true;
  const dataType = getFieldDataType(input);
  const val = (input.value || '').trim();
  const isRequired = input.required || input.hasAttribute('required');

  // If empty and not required, clear error and return valid
  if (!val) {
    if (isRequired) {
      if (showError) showFieldError(input, 'This field is required.');
      return false;
    }
    clearFieldError(input);
    return true;
  }

  // Type specific validation
  if (dataType === 'name') {
    // Letters, spaces, hyphens, and apostrophes only; minimum 2 letters; NO numbers or symbols
    const nameRegex = /^[\p{L}\s'\-]{2,50}$/u;
    const hasAtLeastTwoLetters = (val.match(/\p{L}/gu) || []).length >= 2;
    if (!hasAtLeastTwoLetters || !nameRegex.test(val)) {
      if (showError) {
        showFieldError(input, 'Letters and spaces only (minimum 2 letters; numbers and symbols not allowed).');
      }
      return false;
    }
  } else if (dataType === 'phone') {
    // Strict phone number: Digits, spaces, hyphens, parens, leading + ONLY. NO alphabetic characters!
    const hasLetters = /[a-zA-Z\p{L}]/u.test(val);
    const validPhoneChars = /^[\d+\s\-()]+$/.test(val);
    const digitsOnly = val.replace(/\D/g, '');
    if (hasLetters || !validPhoneChars || digitsOnly.length < 7 || digitsOnly.length > 15) {
      if (showError) {
        showFieldError(input, 'Please enter a valid phone number (7 to 15 digits; letters are not allowed).');
      }
      return false;
    }
  } else if (dataType === 'email') {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(val) || val.includes(' ')) {
      if (showError) {
        showFieldError(input, 'Please enter a valid email address (e.g. name@example.com).');
      }
      return false;
    }
  } else if (dataType === 'card') {
    // Digits only, 15 or 16 digits (Amex/Visa/MC)
    const hasLetters = /[a-zA-Z\p{L}]/u.test(val);
    const digitsOnly = val.replace(/\D/g, '');
    if (hasLetters || digitsOnly.length < 15 || digitsOnly.length > 16) {
      if (showError) {
        showFieldError(input, 'Please enter a valid 15 or 16-digit card number (numbers only; letters not allowed).');
      }
      return false;
    }
  } else if (dataType === 'expiry') {
    const match = val.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
    if (!match) {
      if (showError) {
        showFieldError(input, 'Enter expiration date as MM/YY with valid month 01-12 (e.g. 08/28).');
      }
      return false;
    }
    const expMonth = parseInt(match[1], 10);
    const expYear = parseInt('20' + match[2], 10);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    if (expYear < curYear || (expYear === curYear && expMonth < curMonth)) {
      if (showError) {
        showFieldError(input, 'Card expiration date cannot be in the past.');
      }
      return false;
    }
  } else if (dataType === 'cvv') {
    if (!/^\d{3,4}$/.test(val)) {
      if (showError) {
        showFieldError(input, 'Security code (CVV) must be 3 or 4 digits (numbers only).');
      }
      return false;
    }
  } else if (dataType === 'coupon') {
    if (!/^[A-Za-z0-9]{3,15}$/.test(val)) {
      if (showError) {
        showFieldError(input, 'Promo code must be 3-15 alphanumeric characters (no spaces or symbols).');
      }
      return false;
    }
  } else if (dataType === 'dietary') {
    if (!/^[\p{L}\s,\-\/]+$/u.test(val)) {
      if (showError) {
        showFieldError(input, 'Letters and dietary terms only (e.g. Vegan, Gluten-Free).');
      }
      return false;
    }
  } else if (dataType === 'emergency') {
    const hasLetters = (val.match(/\p{L}/gu) || []).length >= 2;
    const digitsOnly = val.replace(/\D/g, '');
    if (!hasLetters || digitsOnly.length < 7) {
      if (showError) {
        showFieldError(input, 'Please enter emergency contact name and phone (e.g. Elena Vance +1 555-902-1849).');
      }
      return false;
    }
  } else if (dataType === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      if (showError) showFieldError(input, 'Please enter a valid date (YYYY-MM-DD).');
      return false;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const idLower = input.id.toLowerCase();
    const nameLower = (input.name || '').toLowerCase();
    if (idLower.includes('checkin') || nameLower.includes('checkin')) {
      if (val < todayStr) {
        if (showError) showFieldError(input, 'Check-in date cannot be in the past.');
        return false;
      }
    }
    if (idLower.includes('checkout') || nameLower.includes('checkout')) {
      let checkInId = 'checkIn';
      if (input.id === 'bCheckOut') checkInId = 'bCheckIn';
      else if (input.id === 'searchCheckOut') checkInId = 'searchCheckIn';
      const checkInEl = document.getElementById(checkInId);
      if (checkInEl && checkInEl.value && val <= checkInEl.value) {
        if (showError) showFieldError(input, 'Check-out date must be after check-in date.');
        return false;
      }
    }
  }

  clearFieldError(input);
  return true;
}

function validateFormDataType(form) {
  if (!form) return true;
  const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'));
  let isValid = true;
  let firstInvalidEl = null;

  inputs.forEach(input => {
    // Skip inputs inside hidden containers (e.g. non-active tabs or steps)
    if (input.offsetParent === null && input.type !== 'date') return;
    if (input.disabled) return;

    const passes = validateFieldDataType(input, true);
    if (!passes) {
      isValid = false;
      if (!firstInvalidEl) firstInvalidEl = input;
    }
  });

  if (!isValid && firstInvalidEl) {
    firstInvalidEl.focus();
    if (typeof showToast === 'function') {
      showToast('Please correct the highlighted fields with their respective data types.', 'error');
    }
  }

  return isValid;
}

function setupFormDataTypeRestrictions(container = document) {
  const inputs = container.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="hidden"])');

  inputs.forEach(input => {
    if (input.dataset.dataTypeBound) return;
    input.dataset.dataTypeBound = 'true';

    const dataType = getFieldDataType(input);
    if (!dataType) return;

    // Apply HTML5 inputmode and autocomplete attributes
    if (dataType === 'name') {
      input.setAttribute('inputmode', 'text');
      input.setAttribute('autocomplete', input.autocomplete || 'name');
      input.setAttribute('title', 'Letters and spaces only (no numbers or symbols)');
    } else if (dataType === 'phone') {
      input.setAttribute('inputmode', 'tel');
      input.setAttribute('autocomplete', input.autocomplete || 'tel');
      input.setAttribute('title', 'Digits and phone symbols only (no letters)');
    } else if (dataType === 'email') {
      input.setAttribute('inputmode', 'email');
      input.setAttribute('autocomplete', input.autocomplete || 'email');
      input.setAttribute('title', 'Valid email address (e.g. name@example.com)');
    } else if (dataType === 'card' || dataType === 'cvv') {
      input.setAttribute('inputmode', 'numeric');
    } else if (dataType === 'expiry') {
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('placeholder', input.placeholder || 'MM/YY');
    }

    // 1. KEYDOWN INTERCEPTION - Prevents cross data-type keystrokes before they appear
    input.addEventListener('keydown', (e) => {
      // Allow control keys, navigation, and key combinations (Ctrl+A, Ctrl+C, Ctrl+V, etc.)
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key.startsWith('Arrow') ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }

      // Restrict printable keys based on data type
      if (e.key.length === 1) {
        if (dataType === 'name') {
          // Block digits 0-9 and special symbols; accept only letters, spaces, hyphens, and apostrophes
          const isAllowedNameChar = /^[\p{L}\s'\-]$/u.test(e.key);
          if (!isAllowedNameChar) {
            e.preventDefault();
          }
        } else if (dataType === 'phone') {
          // Block all letters and non-phone symbols; accept digits, space, hyphen, parens, and leading +
          const isPhoneChar = /^[\d\s\-()]$/.test(e.key);
          const isPlus = e.key === '+';
          if (isPlus) {
            // Plus only allowed at index 0 and if not already present
            if (input.selectionStart !== 0 || input.value.includes('+')) {
              e.preventDefault();
            }
          } else if (!isPhoneChar) {
            e.preventDefault();
          }
        } else if (dataType === 'email') {
          // Block space character in email
          if (e.key === ' ') {
            e.preventDefault();
          }
        } else if (dataType === 'card' || dataType === 'cvv') {
          // Accept digits only
          if (!/^\d$/.test(e.key)) {
            e.preventDefault();
          }
        } else if (dataType === 'expiry') {
          // Accept digits and slash only
          if (!/[\d/]/.test(e.key)) {
            e.preventDefault();
          }
        } else if (dataType === 'coupon') {
          // Accept alphanumeric only
          if (!/^[a-zA-Z0-9]$/.test(e.key)) {
            e.preventDefault();
          }
        } else if (dataType === 'dietary') {
          // Accept letters, spaces, commas, hyphens, slashes
          if (!/^[\p{L}\s,\-\/]$/u.test(e.key)) {
            e.preventDefault();
          }
        }
      }
    });

    // 2. PASTE SANITIZATION - Prevents pasting cross data types
    input.addEventListener('paste', (e) => {
      const pasteText = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      if (!pasteText) return;
      let sanitized = pasteText;
      if (dataType === 'name') {
        sanitized = pasteText.replace(/[^\p{L}\s'\-]/gu, '');
      } else if (dataType === 'phone') {
        sanitized = pasteText.replace(/[^\d+\s\-()]/g, '');
      } else if (dataType === 'email') {
        sanitized = pasteText.replace(/\s+/g, '');
      } else if (dataType === 'card' || dataType === 'cvv') {
        sanitized = pasteText.replace(/\D/g, '');
      } else if (dataType === 'expiry') {
        sanitized = pasteText.replace(/[^\d\/]/g, '');
      } else if (dataType === 'coupon') {
        sanitized = pasteText.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      } else if (dataType === 'dietary') {
        sanitized = pasteText.replace(/[^\p{L}\s,\-\/]/gu, '');
      }
      if (sanitized !== pasteText) {
        e.preventDefault();
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const current = input.value;
        input.value = current.substring(0, start) + sanitized + current.substring(end);
        input.selectionStart = input.selectionEnd = start + sanitized.length;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 3. INPUT SANITIZATION & AUTO-FORMATTING (handles mobile keyboards, IME, autofill)
    input.addEventListener('input', () => {
      const originalVal = input.value;
      let sanitized = originalVal;

      if (dataType === 'name') {
        sanitized = originalVal.replace(/[^\p{L}\s'\-]/gu, '');
        if (sanitized !== originalVal) input.value = sanitized;
      } else if (dataType === 'phone') {
        let cleaned = originalVal.replace(/[^\d+\s\-()]/g, '');
        const hasLeadingPlus = cleaned.startsWith('+');
        cleaned = (hasLeadingPlus ? '+' : '') + cleaned.replace(/\+/g, '');
        if (cleaned !== originalVal) input.value = cleaned;
      } else if (dataType === 'email') {
        sanitized = originalVal.replace(/\s+/g, '');
        if (sanitized !== originalVal) input.value = sanitized;
      } else if (dataType === 'card') {
        const digits = originalVal.replace(/\D/g, '').substring(0, 16);
        const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        if (formatted !== originalVal) input.value = formatted;
      } else if (dataType === 'expiry') {
        const digits = originalVal.replace(/\D/g, '').substring(0, 4);
        let formatted = digits;
        if (digits.length >= 2) {
          formatted = digits.substring(0, 2) + '/' + digits.substring(2);
        }
        if (formatted !== originalVal) input.value = formatted;
      } else if (dataType === 'cvv') {
        const digits = originalVal.replace(/\D/g, '').substring(0, 4);
        if (digits !== originalVal) input.value = digits;
      } else if (dataType === 'coupon') {
        sanitized = originalVal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 15);
        if (sanitized !== originalVal) input.value = sanitized;
      } else if (dataType === 'dietary') {
        sanitized = originalVal.replace(/[^\p{L}\s,\-\/]/gu, '');
        if (sanitized !== originalVal) input.value = sanitized;
      }

      // If field was previously marked invalid, re-validate silently to remove error when fixed
      if (input.classList.contains('is-invalid')) {
        validateFieldDataType(input, false);
      }
    });

    // 4. BLUR VALIDATION - Shows clear error feedback when user finishes editing
    input.addEventListener('blur', () => {
      if (input.value.trim() || input.required) {
        validateFieldDataType(input, true);
      } else {
        clearFieldError(input);
      }
    });
  });
}

// Global Exports
window.getFieldDataType = getFieldDataType;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.validateFieldDataType = validateFieldDataType;
window.validateFormDataType = validateFormDataType;
window.setupFormDataTypeRestrictions = setupFormDataTypeRestrictions;
