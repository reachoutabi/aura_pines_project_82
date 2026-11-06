/**
 * AURA PINES - Multi-Step Booking Engine
 * Controls Step Navigation, Dynamic Calculations, Addons, Coupon Codes,
 * LocalStorage reservation creation and printable booking confirmation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const bookingEngine = new CampBookingEngine();
  bookingEngine.init();
});

class CampBookingEngine {
  constructor() {
    this.currentStep = 1;
    this.maxSteps = 5;

    // Pricing rates per night
    this.stayRates = {
      'glamping-dome': { name: 'Luxury Glamping Dome', price: 280, capacity: 2, image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80' },
      'safari-tent': { name: 'Safari Canvas Tent', price: 175, capacity: 2, image: 'https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=600&q=80' },
      'treehouse': { name: 'Canopy Pine Treehouse', price: 380, capacity: 4, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80' },
      'riverside-pitch': { name: 'Riverside Pitch Deck', price: 95, capacity: 4, image: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=600&q=80' },
      'family-cabin': { name: 'Cedarwood Family Cabin', price: 340, capacity: 6, image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=600&q=80' },
      'backpacker-pitch': { name: 'Alpine Backpacker Pitch', price: 55, capacity: 2, image: 'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?auto=format&fit=crop&w=600&q=80' }
    };

    // Addons rates
    this.addonsRates = {
      'bbq-basket': { name: 'Gourmet Artisan BBQ Basket', price: 65 },
      'stargazing': { name: 'Guided Stargazing & Telescope', price: 45 },
      'kayak-rental': { name: 'Half-Day Lake Kayak Rental', price: 50 },
      'firewood-bundle': { name: 'Cedar Firewood & Kindling Pack', price: 20 },
      'morning-yoga': { name: 'Forest Sunrise Yoga Session', price: 30 }
    };

    // State
    this.bookingState = {
      checkIn: '',
      checkOut: '',
      nights: 2,
      adults: 2,
      children: 0,
      selectedStayId: 'glamping-dome',
      selectedAddons: ['bbq-basket'],
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      dietary: 'None',
      arrivalTime: '15:00',
      specialRequests: '',
      discountPercent: 0,
      discountCode: '',
      paymentMethod: 'Credit Card'
    };
  }

  init() {
    this.parseURLParams();
    this.bindInputs();
    this.bindStepButtons();
    this.bindCouponForm();
    this.bindAddons();
    this.bindStaySelection();
    this.calculatePricing();
    this.updateUI();
  }

  parseURLParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkIn')) this.bookingState.checkIn = params.get('checkIn');
    if (params.get('checkOut')) this.bookingState.checkOut = params.get('checkOut');
    if (params.get('stayType') && this.stayRates[params.get('stayType')]) {
      this.bookingState.selectedStayId = params.get('stayType');
    }

    // Fallback default dates if not provided
    if (!this.bookingState.checkIn) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.bookingState.checkIn = tomorrow.toISOString().split('T')[0];
    }
    if (!this.bookingState.checkOut) {
      const day3 = new Date();
      day3.setDate(day3.getDate() + 3);
      this.bookingState.checkOut = day3.toISOString().split('T')[0];
    }

    this.calculateNights();
  }

  calculateNights() {
    const d1 = new Date(this.bookingState.checkIn);
    const d2 = new Date(this.bookingState.checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.bookingState.nights = diffDays > 0 ? diffDays : 1;
  }

  bindInputs() {
    const checkInEl = document.getElementById('bCheckIn');
    const checkOutEl = document.getElementById('bCheckOut');
    const adultsEl = document.getElementById('bAdults');
    const childrenEl = document.getElementById('bChildren');

    if (checkInEl && checkOutEl) {
      checkInEl.value = this.bookingState.checkIn;
      checkOutEl.value = this.bookingState.checkOut;

      const today = new Date().toISOString().split('T')[0];
      checkInEl.setAttribute('min', today);
      checkOutEl.setAttribute('min', checkInEl.value);

      checkInEl.addEventListener('change', () => {
        this.bookingState.checkIn = checkInEl.value;
        const nextDay = new Date(checkInEl.value);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextStr = nextDay.toISOString().split('T')[0];
        checkOutEl.setAttribute('min', nextStr);
        if (checkOutEl.value <= checkInEl.value) {
          checkOutEl.value = nextStr;
          this.bookingState.checkOut = nextStr;
        }
        this.calculateNights();
        this.calculatePricing();
      });

      checkOutEl.addEventListener('change', () => {
        this.bookingState.checkOut = checkOutEl.value;
        this.calculateNights();
        this.calculatePricing();
      });
    }

    if (adultsEl) {
      adultsEl.addEventListener('change', () => {
        this.bookingState.adults = parseInt(adultsEl.value, 10) || 1;
        this.calculatePricing();
      });
    }

    if (childrenEl) {
      childrenEl.addEventListener('change', () => {
        this.bookingState.children = parseInt(childrenEl.value, 10) || 0;
        this.calculatePricing();
      });
    }

    // Pre-fill user data if available in store
    if (window.CampStore) {
      const user = window.CampStore.getUser();
      if (user && user.isLoggedIn) {
        const nameInput = document.getElementById('bGuestName');
        const emailInput = document.getElementById('bGuestEmail');
        const phoneInput = document.getElementById('bGuestPhone');
        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
      }
    }

    // Toggle Credit Card Details Box based on Payment Method radio
    const payRadios = document.querySelectorAll('input[name="payMethod"]');
    const ccDetails = document.getElementById('creditCardDetails');
    payRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (ccDetails) {
          ccDetails.style.display = radio.value === 'Credit Card' ? 'block' : 'none';
        }
      });
    });

    // Ensure restrictions are active for booking inputs
    if (typeof window.setupFormDataTypeRestrictions === 'function') {
      window.setupFormDataTypeRestrictions(document);
    }
  }

  bindStaySelection() {
    document.querySelectorAll('.stay-select-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.stay-select-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.bookingState.selectedStayId = card.dataset.stayId;
        this.calculatePricing();
      });
    });
  }

  bindAddons() {
    document.querySelectorAll('.addon-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const addonId = chk.value;
        if (chk.checked) {
          if (!this.bookingState.selectedAddons.includes(addonId)) {
            this.bookingState.selectedAddons.push(addonId);
          }
        } else {
          this.bookingState.selectedAddons = this.bookingState.selectedAddons.filter(id => id !== addonId);
        }
        this.calculatePricing();
      });
    });
  }

  bindCouponForm() {
    const couponBtn = document.getElementById('btnApplyCoupon');
    const couponInput = document.getElementById('couponCodeInput');

    if (couponBtn && couponInput) {
      couponBtn.addEventListener('click', () => {
        const code = couponInput.value.trim().toUpperCase();
        if (code === 'EMBER10' || code === 'WILDERNESS') {
          this.bookingState.discountPercent = 0.10; // 10%
          this.bookingState.discountCode = code;
          if (window.showToast) window.showToast('Coupon applied: 10% Wilderness discount!', 'success');
          this.calculatePricing();
        } else if (code === 'VIPCAMP') {
          this.bookingState.discountPercent = 0.15; // 15%
          this.bookingState.discountCode = code;
          if (window.showToast) window.showToast('VIP coupon applied: 15% discount!', 'success');
          this.calculatePricing();
        } else {
          if (window.showToast) window.showToast('Invalid coupon code. Try EMBER10', 'error');
        }
      });
    }
  }

  bindStepButtons() {
    // Next buttons
    document.querySelectorAll('.btn-next-step').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.validateStep(this.currentStep)) {
          this.goToStep(this.currentStep + 1);
        }
      });
    });

    // Prev buttons
    document.querySelectorAll('.btn-prev-step').forEach(btn => {
      btn.addEventListener('click', () => {
        this.goToStep(this.currentStep - 1);
      });
    });

    // Confirm & Pay button
    const confirmBtn = document.getElementById('btnConfirmReservation');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.submitReservation();
      });
    }
  }

  validateStep(step) {
    if (step === 1) {
      const checkInEl = document.getElementById('bCheckIn');
      const checkOutEl = document.getElementById('bCheckOut');
      let isDateValid = true;

      if (window.validateFieldDataType) {
        if (!window.validateFieldDataType(checkInEl, true)) isDateValid = false;
        if (!window.validateFieldDataType(checkOutEl, true)) isDateValid = false;
      }

      if (!isDateValid) return false;

      if (!this.bookingState.checkIn || !this.bookingState.checkOut) {
        if (window.showToast) window.showToast('Please select valid check-in and check-out dates.', 'error');
        return false;
      }
      if (this.bookingState.nights < 1) {
        if (window.showToast) window.showToast('Stay must be at least 1 night.', 'error');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!this.bookingState.selectedStayId) {
        if (window.showToast) window.showToast('Please select your preferred stay accommodation.', 'error');
        return false;
      }
      return true;
    }

    if (step === 4) {
      const nameEl = document.getElementById('bGuestName');
      const emailEl = document.getElementById('bGuestEmail');
      const phoneEl = document.getElementById('bGuestPhone');
      const dietaryEl = document.getElementById('bDietary');

      let isDataValid = true;
      if (window.validateFieldDataType) {
        if (!window.validateFieldDataType(nameEl, true)) isDataValid = false;
        if (!window.validateFieldDataType(emailEl, true)) isDataValid = false;
        if (!window.validateFieldDataType(phoneEl, true)) isDataValid = false;
        if (dietaryEl && dietaryEl.value.trim() && !window.validateFieldDataType(dietaryEl, true)) isDataValid = false;
      }

      if (!isDataValid) {
        if (window.showToast) window.showToast('Please correct guest contact information with respective data types.', 'error');
        return false;
      }

      const name = nameEl?.value.trim();
      const email = emailEl?.value.trim();
      const phone = phoneEl?.value.trim();

      if (!name || !email || !phone) {
        if (window.showToast) window.showToast('Please complete all contact details.', 'error');
        return false;
      }

      this.bookingState.guestName = name;
      this.bookingState.guestEmail = email;
      this.bookingState.guestPhone = phone;
      this.bookingState.dietary = document.getElementById('bDietary')?.value || 'None';
      this.bookingState.arrivalTime = document.getElementById('bArrivalTime')?.value || '15:00';
      this.bookingState.specialRequests = document.getElementById('bSpecialRequests')?.value.trim() || '';

      // Pre-fill card name with guest name if blank
      const cardNameEl = document.getElementById('bCardName');
      if (cardNameEl && !cardNameEl.value) {
        cardNameEl.value = name;
      }

      this.updateReviewScreen();
      return true;
    }

    return true;
  }

  goToStep(step) {
    if (step < 1 || step > this.maxSteps) return;
    this.currentStep = step;

    // Switch step content views
    document.querySelectorAll('.booking-step-content').forEach(view => {
      view.style.display = 'none';
    });
    const targetView = document.getElementById(`stepView${step}`);
    if (targetView) targetView.style.display = 'block';

    if (typeof window.setupFormDataTypeRestrictions === 'function') {
      window.setupFormDataTypeRestrictions(document);
    }

    // Update wizard progress indicator
    document.querySelectorAll('.wizard-step-node').forEach(node => {
      const nodeStep = parseInt(node.dataset.step, 10);
      node.classList.remove('active', 'completed');
      if (nodeStep === step) {
        node.classList.add('active');
      } else if (nodeStep < step) {
        node.classList.add('completed');
      }
    });

    window.scrollTo({ top: 150, behavior: 'smooth' });
  }

  calculatePricing() {
    const stay = this.stayRates[this.bookingState.selectedStayId] || this.stayRates['glamping-dome'];
    const stayBaseTotal = stay.price * this.bookingState.nights;

    // Addons calculation
    let addonsTotal = 0;
    this.bookingState.selectedAddons.forEach(addonId => {
      if (this.addonsRates[addonId]) {
        addonsTotal += this.addonsRates[addonId].price;
      }
    });

    const subtotal = stayBaseTotal + addonsTotal;
    const discountAmount = Math.round(subtotal * this.bookingState.discountPercent);
    const discountedSubtotal = subtotal - discountAmount;
    const taxesAndConservation = Math.round(discountedSubtotal * 0.08); // 8% national park eco fee
    const grandTotal = discountedSubtotal + taxesAndConservation;

    this.bookingState.calculated = {
      stayBaseTotal,
      addonsTotal,
      subtotal,
      discountAmount,
      taxesAndConservation,
      grandTotal
    };

    // Update sidebar summary elements
    this.updateSummaryText('summaryStayName', stay.name);
    this.updateSummaryText('summaryDates', `${this.bookingState.checkIn} to ${this.bookingState.checkOut} (${this.bookingState.nights} nights)`);
    this.updateSummaryText('summaryGuests', `${this.bookingState.adults} Adults${this.bookingState.children ? `, ${this.bookingState.children} Kids` : ''}`);
    this.updateSummaryText('summaryStayTotal', `$${stayBaseTotal.toLocaleString()}`);
    this.updateSummaryText('summaryAddonsTotal', `$${addonsTotal.toLocaleString()}`);
    this.updateSummaryText('summaryDiscount', `-$${discountAmount.toLocaleString()}`);
    this.updateSummaryText('summaryTaxes', `$${taxesAndConservation.toLocaleString()}`);
    this.updateSummaryText('summaryGrandTotal', `$${grandTotal.toLocaleString()}`);
  }

  updateSummaryText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  updateReviewScreen() {
    const stay = this.stayRates[this.bookingState.selectedStayId];
    this.updateSummaryText('revStayTitle', stay.name);
    this.updateSummaryText('revNights', `${this.bookingState.nights} Nights (${this.bookingState.checkIn} → ${this.bookingState.checkOut})`);
    this.updateSummaryText('revGuests', `${this.bookingState.adults} Adults, ${this.bookingState.children} Children`);
    this.updateSummaryText('revGuestContact', `${this.bookingState.guestName} (${this.bookingState.guestEmail}, ${this.bookingState.guestPhone})`);
    this.updateSummaryText('revSpecial', this.bookingState.specialRequests || 'None');

    const revAddonsList = document.getElementById('revAddonsList');
    if (revAddonsList) {
      if (this.bookingState.selectedAddons.length) {
        revAddonsList.innerHTML = this.bookingState.selectedAddons
          .map(id => `<li>${this.addonsRates[id]?.name} (+$${this.addonsRates[id]?.price})</li>`)
          .join('');
      } else {
        revAddonsList.innerHTML = '<li>No optional add-ons selected</li>';
      }
    }
  }

  submitReservation() {
    const payMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'Credit Card';
    let lastFour = '4242';

    if (payMethod === 'Credit Card') {
      const cardName = document.getElementById('bCardName');
      const cardNumber = document.getElementById('bCardNumber');
      const cardExpiry = document.getElementById('bCardExpiry');
      const cardCvv = document.getElementById('bCardCvv');

      let isCardValid = true;
      if (window.validateFieldDataType) {
        if (!window.validateFieldDataType(cardName, true)) isCardValid = false;
        if (!window.validateFieldDataType(cardNumber, true)) isCardValid = false;
        if (!window.validateFieldDataType(cardExpiry, true)) isCardValid = false;
        if (!window.validateFieldDataType(cardCvv, true)) isCardValid = false;
      }

      if (!isCardValid) {
        if (window.showToast) window.showToast('Please correct payment card details before confirming.', 'error');
        return;
      }

      if (cardNumber && cardNumber.value) {
        const rawDigits = cardNumber.value.replace(/\D/g, '');
        lastFour = rawDigits.slice(-4) || '4242';
      }
    }

    const stay = this.stayRates[this.bookingState.selectedStayId];
    const calc = this.bookingState.calculated;

    const addonsList = this.bookingState.selectedAddons.map(id => `${this.addonsRates[id]?.name} ($${this.addonsRates[id]?.price})`);

    const bookingPayload = {
      stayType: stay.name,
      image: stay.image,
      checkIn: this.bookingState.checkIn,
      checkOut: this.bookingState.checkOut,
      nights: this.bookingState.nights,
      guests: `${this.bookingState.adults} Adults${this.bookingState.children ? `, ${this.bookingState.children} Children` : ''}`,
      totalPrice: calc.grandTotal,
      paid: true,
      paymentMethod: payMethod === 'Credit Card' ? `Credit Card •••• ${lastFour}` : 'Apple Pay / Google Pay',
      addons: addonsList,
      specialRequests: this.bookingState.specialRequests || 'Standard check-in'
    };

    let createdBooking = null;
    if (window.CampStore) {
      createdBooking = window.CampStore.addBooking(bookingPayload);
    }

    const bookingId = createdBooking ? createdBooking.id : 'AP-' + Math.floor(10000 + Math.random() * 90000);

    // Show Confirmation Screen
    document.querySelectorAll('.booking-step-content').forEach(view => view.style.display = 'none');
    const wizardEl = document.querySelector('.booking-wizard-steps');
    if (wizardEl) wizardEl.style.display = 'none';

    const confirmationScreen = document.getElementById('bookingConfirmationScreen');
    if (confirmationScreen) {
      confirmationScreen.style.display = 'block';

      document.getElementById('confBookingId').textContent = bookingId;
      document.getElementById('confStayName').textContent = stay.name;
      document.getElementById('confDates').textContent = `${this.bookingState.checkIn} to ${this.bookingState.checkOut}`;
      document.getElementById('confTotal').textContent = `$${calc.grandTotal.toLocaleString()}`;
      document.getElementById('confGuest').textContent = `${this.bookingState.guestName} (${this.bookingState.guestEmail})`;
    }

    if (window.showToast) {
      window.showToast(`Reservation ${bookingId} confirmed! Check your email for wilderness passes.`, 'success', 6000);
    }

    window.scrollTo({ top: 100, behavior: 'smooth' });
  }

  updateUI() {
    // Select default radio card
    const defaultCard = document.querySelector(`.stay-select-card[data-stay-id="${this.bookingState.selectedStayId}"]`);
    if (defaultCard) {
      defaultCard.classList.add('selected');
      const radio = defaultCard.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
  }
}
