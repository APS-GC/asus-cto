import A11yDialog from 'a11y-dialog';
import { MiniCart } from '../../mini-cart/js/_mini-cart';

class MobileMenu {
  constructor(dialogId) {
    this.dialogElement = document.getElementById(dialogId);
    this.body = document.body;
    this.scrollY = 0;
  }

  init() {
    if (!this.dialogElement) {
      return; // Do nothing if dialog element is missing
    }

    // Initialize A11yDialog
    this.dialog = new A11yDialog(this.dialogElement);

    // Add event listeners for show/hide events
    this.dialog.on('show', () => this.onShow());
    this.dialog.on('hide', () => this.onHide());

    // Handle hamburger button animation and close functionality
    const hamburgerBtn = document.getElementById('header-hamburger-menu-toggle');

    hamburgerBtn?.addEventListener('click', () => {
      if (this.dialog.shown) {
        this.dialog.hide();
      } else {
        this.dialog.show();
      }
      hamburgerBtn.setAttribute('aria-expanded', this.dialog.shown);
    });

    // Close menu when clicking on menu links
    this.dialogElement.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        this.dialog.hide();
      }
    });
  }

  onShow() {
    this.body.classList.add('mobile-menu-open');
    this._disableScroll();
  }

  onHide() {
    this.body.classList.remove('mobile-menu-open');
    this._enableScroll();
  }

  _disableScroll() {
    this.scrollY = window.scrollY;
    this.body.style.position = 'fixed';
    this.body.style.top = `-${this.scrollY}px`;
    this.body.style.width = '100%';
  }

  _enableScroll() {
    this.body.style.position = '';
    this.body.style.top = '';
    this.body.style.width = '';
    window.scrollTo(0, this.scrollY);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Set header height for spacing in CSS
  document.documentElement.style.setProperty(
    '--header-height',
    document.querySelector('.header-wrapper').offsetHeight + 'px',
  );

  // Check if user is logged in
  // For testing we are adding local storage check
  // TODO: BE team needs to integrate the login status check API
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const mobileMenu = new MobileMenu('mobile-menu-dialog');
  mobileMenu.init();

  const miniCart = new MiniCart();
  await miniCart.init(isLoggedIn);

  const profileDropdown = document.querySelector('.profile-dropdown');
  const toggleBtn = document.querySelector('.profile-toggle');

  if (profileDropdown && toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      profileDropdown.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', profileDropdown.classList.contains('open'));
    });

    // Close dropdown only when clicking the close button
    const closeBtn = document.querySelector('.profile-menu__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        profileDropdown.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  // Mobile Account Submenu functionality
  const mobileAccountToggle = document.querySelector('.mobile-account-toggle');
  const mobileAccountSubmenu = document.querySelector('.mobile-account-submenu');
  const backButton = document.querySelector('.back-button');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');

  if (mobileAccountToggle && mobileAccountSubmenu) {
    mobileAccountToggle.addEventListener('click', (e) => {
      e.preventDefault();
      mobileAccountSubmenu.classList.add('active');
      mobileMenuOverlay.classList.add('submenu-active');
      mobileAccountToggle.setAttribute('aria-expanded', 'true');
    });
  }

  if (backButton && mobileAccountSubmenu) {
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      mobileAccountSubmenu.classList.remove('active');
      mobileMenuOverlay.classList.remove('submenu-active');
      mobileAccountToggle.setAttribute('aria-expanded', 'false');
    });
  }
});

// TODO: Refactor this code and move to separate file
/**
 * Helper function to set the height of an element.
 * Handles number and string values.
 */
function setHeight(el, val) {
  // If val is a function, execute it to get the height value
  if (typeof val === 'function') val = val();

  // If the value is a string (e.g., '100px' or 'auto'), set it directly
  if (typeof val === 'string') {
    el.style.height = val;
  }
  // Otherwise, assume it's a number and append 'px'
  else {
    el.style.height = val + 'px';
  }
}

/**
 * Sets equal height for elements that are on the same visual row.
 * @param {string} containerSelector - The CSS selector for the elements to be resized (e.g., '.featured-product-card').
 */
function equalheight(containerSelector) {
  // Use let/const for proper scoping
  let currentTallest = 0;
  let currentRowStart = 0;
  let rowDivs = []; // Use array literal for better practice

  const elements = document.querySelectorAll(containerSelector);

  if (elements.length === 0) return;

  // 1. Reset height of all elements to 'auto' for accurate measurement
  elements.forEach((el) => {
    el.style.height = 'auto';
  });

  // 2. Iterate and group elements by row
  elements.forEach((el) => {
    // Get the top position relative to the nearest positioned ancestor (or the document body)
    const topPosition = el.offsetTop;

    // Get the element's current computed height as a number
    // We use offsetHeight which is generally more reliable for element sizing
    // and includes padding/border if box-sizing: border-box is used.
    const elementHeight = el.offsetHeight;

    // Check if a new row has started
    if (currentRowStart !== topPosition) {
      // 3. If a new row starts, apply the max height to the ENDED row
      if (rowDivs.length > 0) {
        rowDivs.forEach((div) => {
          setHeight(div, currentTallest);
        });
      }

      // Reset for the new row
      rowDivs = [];
      currentRowStart = topPosition;
      currentTallest = elementHeight;
      rowDivs.push(el);
    } else {
      // 4. Still in the same row
      rowDivs.push(el);
      // Update the tallest height in the current row
      if (elementHeight > currentTallest) {
        currentTallest = elementHeight;
      }
    }
  });

  // 5. Apply the max height to the LAST row, which is outside the loop
  if (rowDivs.length > 0) {
    rowDivs.forEach((div) => {
      setHeight(div, currentTallest);
    });
  }
}

// --- Usage Example ---
document.addEventListener('DOMContentLoaded', () => {
  // Replace '.featured-product-card' with your target selector
  equalheight('.featured-product-card');
});

window.addEventListener('resize', () => {
  // Debounce the resize function for performance
  clearTimeout(window.equalHeightTimer);
  window.equalHeightTimer = setTimeout(() => {
    equalheight('.featured-product-card');
  }, 150);
});
