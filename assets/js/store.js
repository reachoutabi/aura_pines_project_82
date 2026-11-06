/**
 * AURA PINES - Central Data Store & LocalStorage Manager
 * Handles mock backend data, user session, bookings, wishlist,
 * itinerary, transactions, packing checklist, notifications, theme & RTL.
 */

const CampStore = (function() {
  const STORAGE_KEYS = {
    USER: 'aurapines_user',
    BOOKINGS: 'aurapines_bookings',
    WISHLIST: 'aurapines_wishlist',
    CHECKLIST: 'aurapines_checklist',
    NOTIFICATIONS: 'aurapines_notifications',
    TRANSACTIONS: 'aurapines_transactions',
    PAYMENT_METHODS: 'aurapines_payment_methods',
    ITINERARY: 'aurapines_itinerary',
    THEME: 'aurapines_theme',
    DIRECTION: 'aurapines_direction',
    INIT_DONE: 'aurapines_initialized_v6'
  };

  const SEED_DATA = {
    user: {
      isLoggedIn: true,
      email: 'demo@pine.com',
      name: 'Julian Vance',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      phone: '+1 (555) 382-9104',
      emergencyContact: 'Elena Vance (+1 555-902-1849)',
      dietary: 'Gluten-Free, Plant-Based friendly',
      tier: 'Silver Pine Tier (1,850 Pts)',
      points: 1850
    },
    bookings: [
      {
        id: 'AP-90412',
        stayType: 'Luxury Glamping Dome',
        image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80',
        checkIn: '2026-11-18',
        checkOut: '2026-11-21',
        nights: 3,
        guests: '2 Adults',
        status: 'Upcoming',
        totalPrice: 840,
        paid: true,
        paymentMethod: 'Mastercard •••• 8812',
        addons: ['Campfire BBQ Basket ($65)', 'Stargazing Telescope Session ($45)'],
        specialRequests: 'High ridge tent preference with unblocked sunset view.'
      },
      {
        id: 'AP-82710',
        stayType: 'Safari Canvas Tent',
        image: 'https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=600&q=80',
        checkIn: '2026-10-12',
        checkOut: '2026-10-15',
        nights: 3,
        guests: '2 Adults',
        status: 'Completed',
        totalPrice: 520,
        paid: true,
        paymentMethod: 'Visa •••• 4242',
        addons: ['Firewood Bundle ($20)'],
        specialRequests: 'Late arrival at 7:00 PM.'
      },
      {
        id: 'AP-74198',
        stayType: 'Canopy Pine Treehouse',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
        checkIn: '2026-12-05',
        checkOut: '2026-12-08',
        nights: 3,
        guests: '4 Adults',
        status: 'Confirmed',
        totalPrice: 1150,
        paid: true,
        paymentMethod: 'Visa •••• 4242',
        addons: ['Gourmet Breakfast Hamper ($90)', 'Guided Morning Kayak ($120)'],
        specialRequests: 'Extra blankets for winter evening.'
      }
    ],
    wishlist: [],
    checklist: [
      { id: 'c1', text: 'Thermal base layers & merino wool socks', checked: true, category: 'Clothing' },
      { id: 'c2', text: 'Waterproof high-ankle hiking boots', checked: true, category: 'Footwear' },
      { id: 'c3', text: 'Rechargeable LED headlamp (red light mode)', checked: false, category: 'Gear' },
      { id: 'c4', text: 'Biodegradable toiletries & sunscreen', checked: true, category: 'Toiletries' },
      { id: 'c5', text: 'Insulated reusable water bottle (1L+)', checked: true, category: 'Gear' },
      { id: 'c6', text: 'Windproof warm campfire fleece jacket', checked: false, category: 'Clothing' },
      { id: 'c7', text: 'Binoculars or compact DSLR camera', checked: false, category: 'Optics' },
      { id: 'c8', text: 'Personal identification & national park pass', checked: true, category: 'Documents' }
    ],
    itinerary: [
      {
        day: 'Day 1: Arrival & Campfire Welcome',
        events: [
          { time: '03:00 PM', title: 'Check-in & Welcome Herbal Cider', desc: 'Settle into your Glamping Dome, meet your camp host, and review trail map.' },
          { time: '05:30 PM', title: 'Sunset Ridge Panoramic Walk', desc: 'Easy 1.5-mile stroll up Eagle Crag to catch the golden hour over the lake.' },
          { time: '07:30 PM', title: 'Artisan Campfire Feast & Acoustic Night', desc: 'Cast-iron roasted barbecue, craft cider, and acoustic wilderness ballads.' }
        ]
      },
      {
        day: 'Day 2: River Adventures & Astronomy',
        events: [
          { time: '08:00 AM', title: 'Sunrise Forest Bathing & Yoga', desc: 'Guided mindfulness stretch session under the pine canopy.' },
          { time: '10:30 AM', title: 'Glacial Lake Kayak Expedition', desc: 'Paddle across mirror waters with our certified water safety guide.' },
          { time: '01:00 PM', title: 'Wilderness Foraged Picnic Lunch', desc: 'Fresh rustic sandwiches, pine-smoked cheese, and dried berries.' },
          { time: '08:45 PM', title: 'Deep Space Stargazing & Telescopes', desc: 'Explore the Milky Way and Jupiter rings with Dr. Maya Lin.' }
        ]
      },
      {
        day: 'Day 3: Final Trails & Farewell',
        events: [
          { time: '09:00 AM', title: 'Skillet Breakfast & Fresh French Press', desc: 'Fresh farm eggs, organic sourdough, and fire-brewed dark roast.' },
          { time: '11:00 AM', title: 'Check-out & Ranger Souvenir Box', desc: 'Receive your complimentary camp pin, wilderness badge, and departure gift.' }
        ]
      }
    ],
    transactions: [
      { id: 'TXN-90412', date: '2026-11-01', description: 'Luxury Glamping Dome (3 nights)', method: 'Mastercard •••• 8812', amount: 840, status: 'Paid' },
      { id: 'TXN-82710', date: '2026-10-10', description: 'Safari Canvas Tent (3 nights)', method: 'Visa •••• 4242', amount: 520, status: 'Paid' },
      { id: 'TXN-74198', date: '2026-11-03', description: 'Canopy Pine Treehouse (3 nights)', method: 'Visa •••• 4242', amount: 1150, status: 'Paid' }
    ],
    paymentMethods: [
      { id: 'pm-1', type: 'Visa', last4: '4242', expiry: '08/28', isDefault: true },
      { id: 'pm-2', type: 'Mastercard', last4: '8812', expiry: '11/27', isDefault: false }
    ],
    notifications: [
      { id: 'n1', title: 'Stargazing Weather Clear!', message: 'Forecast confirms 0% cloud cover tonight. Telescope session starts at 8:45 PM.', time: '10 mins ago', unread: true },
      { id: 'n2', title: 'Reservation Confirmed (AP-90412)', message: 'Your Luxury Glamping Dome is prepared. Check-in begins at 3:00 PM.', time: '2 hours ago', unread: true },
      { id: 'n3', title: 'Winter Trail Season Open', message: 'The upper alpine ridge trails are now open for guided trekking.', time: '1 day ago', unread: false }
    ]
  };

  function init() {
    if (!localStorage.getItem(STORAGE_KEYS.INIT_DONE) || localStorage.getItem(STORAGE_KEYS.INIT_DONE) !== 'v6') {
      resetToDefault();
    }
  }

  function resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(SEED_DATA.user));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_DATA.bookings));
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(SEED_DATA.checklist));
    localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify(SEED_DATA.itinerary));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEED_DATA.transactions));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(SEED_DATA.paymentMethods));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_DATA.notifications));
    if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
    if (!localStorage.getItem(STORAGE_KEYS.DIRECTION)) {
      localStorage.setItem(STORAGE_KEYS.DIRECTION, 'ltr');
    }
    localStorage.setItem(STORAGE_KEYS.INIT_DONE, 'v6');
  }

  // User Methods
  function getUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || JSON.stringify(SEED_DATA.user));
  }

  function updateUser(userData) {
    const current = getUser();
    const updated = { ...current, ...userData };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  }

  function login(email, password) {
    // Demo login accepts demo credentials or any valid email
    const user = getUser();
    user.isLoggedIn = true;
    user.email = email;
    updateUser(user);
    return true;
  }

  function logout() {
    const user = getUser();
    user.isLoggedIn = false;
    updateUser(user);
    return true;
  }

  // Bookings Methods
  function getBookings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
  }

  function addBooking(bookingData) {
    const bookings = getBookings();
    const newId = 'AP-' + Math.floor(10000 + Math.random() * 90000);
    const newBooking = {
      id: newId,
      status: 'Upcoming',
      paid: true,
      createdAt: new Date().toISOString(),
      ...bookingData
    };
    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Also record transaction
    addTransaction({
      id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
      date: new Date().toISOString().split('T')[0],
      description: `${newBooking.stayType || 'Camp Stay'} (Booking #${newId})`,
      method: bookingData.paymentMethod || 'Credit Card •••• 4242',
      amount: newBooking.totalPrice || 0,
      status: 'Paid'
    });

    // Notify user
    addNotification({
      title: 'New Booking Confirmed',
      message: `Your reservation ${newId} for ${newBooking.stayType} has been successfully secured!`
    });

    return newBooking;
  }

  function cancelBooking(id) {
    const bookings = getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = 'Cancelled';
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      addNotification({
        title: 'Booking Cancelled',
        message: `Reservation ${id} has been cancelled. Any eligible refund will be credited in 3-5 business days.`
      });
      return true;
    }
    return false;
  }

  // Wishlist Methods
  function getWishlist() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
  }

  function toggleWishlist(item) {
    const wishlist = getWishlist();
    const index = wishlist.findIndex(w => w.id === item.id);
    let added = false;
    if (index > -1) {
      wishlist.splice(index, 1);
      added = false;
    } else {
      wishlist.push(item);
      added = true;
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    return added;
  }

  function isInWishlist(id) {
    const wishlist = getWishlist();
    return wishlist.some(w => w.id === id);
  }

  // Checklist Methods
  function getChecklist() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHECKLIST) || '[]');
  }

  function toggleChecklistItem(id) {
    const list = getChecklist();
    const item = list.find(c => c.id === id);
    if (item) {
      item.checked = !item.checked;
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(list));
      return item.checked;
    }
    return false;
  }

  function addChecklistItem(text, category = 'Gear') {
    const list = getChecklist();
    const newItem = {
      id: 'c' + Date.now(),
      text,
      checked: false,
      category
    };
    list.push(newItem);
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(list));
    return newItem;
  }

  // Transactions & Cards
  function getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  }

  function addTransaction(txn) {
    const txns = getTransactions();
    txns.unshift(txn);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txns));
  }

  function getPaymentMethods() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS) || '[]');
  }

  function addPaymentMethod(card) {
    const cards = getPaymentMethods();
    const newCard = {
      id: 'pm-' + Date.now(),
      ...card
    };
    cards.push(newCard);
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(cards));
    return newCard;
  }

  // Notifications
  function getNotifications() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
  }

  function addNotification(notification) {
    const notifs = getNotifications();
    notifs.unshift({
      id: 'n' + Date.now(),
      time: 'Just now',
      unread: true,
      ...notification
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  }

  function markAllNotificationsRead() {
    const notifs = getNotifications();
    notifs.forEach(n => n.unread = false);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    return notifs;
  }

  // Itinerary
  function getItinerary() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ITINERARY) || '[]');
  }

  function saveItinerary(itinerary) {
    localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify(itinerary));
  }

  // Theme & RTL
  function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  function getDirection() {
    return localStorage.getItem(STORAGE_KEYS.DIRECTION) || 'ltr';
  }

  function setDirection(dir) {
    localStorage.setItem(STORAGE_KEYS.DIRECTION, dir);
    document.documentElement.setAttribute('dir', dir);
  }

  // Auto initialize on load
  init();

  return {
    init,
    resetToDefault,
    getUser,
    updateUser,
    login,
    logout,
    getBookings,
    addBooking,
    cancelBooking,
    getWishlist,
    toggleWishlist,
    isInWishlist,
    getChecklist,
    toggleChecklistItem,
    addChecklistItem,
    getTransactions,
    addTransaction,
    getPaymentMethods,
    addPaymentMethod,
    getNotifications,
    addNotification,
    markAllNotificationsRead,
    getItinerary,
    saveItinerary,
    getTheme,
    setTheme,
    getDirection,
    setDirection
  };
})();

// Attach to window
if (typeof window !== 'undefined') {
  window.CampStore = CampStore;
}
