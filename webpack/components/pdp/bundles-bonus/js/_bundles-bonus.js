/**
 * Bundles and Bonus Section Controller
 * Manages the visibility of bonus sections based on bundle selection
 */
class BundlesBonusController {
  constructor() {
    this.bundleRadios = null;
    this.bonusContainer = null;
    this.noBundlesBonusSection = null;
    this.bundlesWrapper = null;
    this.bonusesWrapper = null;
    this.mainContainer = null;
    this.initialized = false;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize the controller
   */
  init() {
    try {
      this.cacheElements();
      this.bindEvents();
      this.setInitialState();
      this.initialized = true;
    } catch (error) {
      console.debug('Error initializing BundlesBonusController:', error);
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.bundleRadios = document.querySelectorAll('.bundles-radio');
    this.bonusContainer = document.querySelector('.cmp-bonus-container');
    this.noBundlesBonusSection = document.querySelector('.cmp-no-bundles-bonus');
    this.bundlesWrapper = document.querySelector('.cmp-bundles-wrapper');
    this.bonusesWrapper = document.querySelector('.cmp-bonuses-wrapper');
    this.mainContainer = document.querySelector('.cmp-bundles-bonuses');

    // Check if we have bundles and bonuses
    this.hasBundles = this.bundleRadios.length > 0;
    this.hasBonuses = document.querySelectorAll('.cmp-bonus-section').length > 0;

    if (!this.noBundlesBonusSection) {
      throw new Error('No bundles bonus section not found');
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.bundleRadios.forEach((radio) => {
      // Handle change events
      radio.addEventListener('change', (e) => this.handleBundleSelection(e));

      // Handle keyboard events for accessibility
      radio.addEventListener('keydown', (e) => this.handleKeydown(e));
    });
  }

  /**
   * Set initial state based on any pre-selected bundles
   */
  setInitialState() {
    // Check if we have any content to show
    if (!this.hasBundles && !this.hasBonuses) {
      this.showNoBundlesBonusSection();
      return;
    }

    // Hide no-bundles-bonus section if we have content
    this.hideNoBundlesBonusSection();

    // Handle normal bundle/bonus logic
    if (this.hasBundles) {
      const selectedRadio = document.querySelector('.bundles-radio:checked');
      if (selectedRadio) {
        this.updateBonusVisibility(selectedRadio);
      } else {
        // Hide bonus section initially if no selection
        this.hideBonusSection();
      }
    } else {
      // If no bundles, hide bonus section
      this.hideBonusSection();
    }
  }

  /**
   * Handle bundle selection change
   * @param {Event} event - The change event
   */
  handleBundleSelection(event) {
    const selectedRadio = event.target;
    this.updateBonusVisibility(selectedRadio);
    this.announceStateChange(selectedRadio);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeydown(event) {
    // Handle Enter and Space keys for better accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.target.checked = true;
      event.target.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Update bonus section visibility based on selected bundle
   * @param {HTMLInputElement} selectedRadio - The selected radio button
   */
  updateBonusVisibility(selectedRadio) {
    const isJustThisItem = selectedRadio.hasAttribute('data-just-this-item');
    const bundleName = selectedRadio.getAttribute('data-bundle-name');

    if (isJustThisItem && bundleName === 'Just this item') {
      this.showBonusSection();
    } else {
      this.hideBonusSection();
    }
  }

  /**
   * Show the bonus section with accessibility support
   */
  showBonusSection() {
    if (!this.bonusContainer) return;

    // Remove hidden attribute and update data attribute
    this.bonusContainer.removeAttribute('hidden');
    this.bonusContainer.setAttribute('data-bonus-visibility', 'visible');

    // Add ARIA attributes for screen readers
    this.bonusContainer.setAttribute('aria-hidden', 'false');

    // Focus management - focus the first interactive element in bonus section
    setTimeout(() => {
      const firstFocusable = this.bonusContainer.querySelector(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);
  }

  /**
   * Hide the bonus section with accessibility support
   */
  hideBonusSection() {
    if (!this.bonusContainer) return;

    // Add hidden attribute and update data attribute
    this.bonusContainer.setAttribute('hidden', '');
    this.bonusContainer.setAttribute('data-bonus-visibility', 'hidden');

    // Add ARIA attributes for screen readers
    this.bonusContainer.setAttribute('aria-hidden', 'true');
  }

  /**
   * Show the no bundles/bonus section
   */
  showNoBundlesBonusSection() {
    if (!this.noBundlesBonusSection) return;

    // Show no-bundles-bonus section
    this.noBundlesBonusSection.removeAttribute('hidden');
    this.noBundlesBonusSection.setAttribute('data-no-content-visibility', 'visible');
    this.noBundlesBonusSection.setAttribute('aria-hidden', 'false');

    // Hide bundles and bonuses sections
    if (this.bundlesWrapper) {
      this.bundlesWrapper.setAttribute('hidden', '');
      this.bundlesWrapper.setAttribute('aria-hidden', 'true');
    }
    if (this.bonusesWrapper) {
      this.bonusesWrapper.setAttribute('hidden', '');
      this.bonusesWrapper.setAttribute('aria-hidden', 'true');
    }

    // Update main container data attributes
    if (this.mainContainer) {
      this.mainContainer.setAttribute('data-has-bundles', 'false');
      this.mainContainer.setAttribute('data-has-bonuses', 'false');
    }
  }

  /**
   * Hide the no bundles/bonus section
   */
  hideNoBundlesBonusSection() {
    if (!this.noBundlesBonusSection) return;

    // Hide no-bundles-bonus section
    this.noBundlesBonusSection.setAttribute('hidden', '');
    this.noBundlesBonusSection.setAttribute('data-no-content-visibility', 'hidden');
    this.noBundlesBonusSection.setAttribute('aria-hidden', 'true');

    // Show bundles and bonuses sections
    if (this.bundlesWrapper && this.hasBundles) {
      this.bundlesWrapper.removeAttribute('hidden');
      this.bundlesWrapper.setAttribute('aria-hidden', 'false');
    }
    if (this.bonusesWrapper && this.hasBonuses) {
      this.bonusesWrapper.removeAttribute('hidden');
      this.bonusesWrapper.setAttribute('aria-hidden', 'false');
    }

    // Update main container data attributes
    if (this.mainContainer) {
      this.mainContainer.setAttribute('data-has-bundles', this.hasBundles.toString());
      this.mainContainer.setAttribute('data-has-bonuses', this.hasBonuses.toString());
    }
  }

  /**
   * Announce state changes to screen readers
   * @param {HTMLInputElement} selectedRadio - The selected radio button
   */
  announceStateChange(selectedRadio) {
    const bundleName = selectedRadio.getAttribute('data-bundle-name');
    const isJustThisItem = selectedRadio.hasAttribute('data-just-this-item');

    // Create or update live region for announcements
    let liveRegion = document.getElementById('bundle-bonus-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'bundle-bonus-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }

    // Announce the change
    const message =
      isJustThisItem && bundleName === 'Just this item'
        ? `${bundleName} selected. Bonus section is now available.`
        : `${bundleName} selected. Bonus section is hidden.`;

    liveRegion.textContent = message;
  }

  /**
   * Public method to get current state
   * @returns {Object} Current state information
   */
  getState() {
    const selectedRadio = document.querySelector('.bundles-radio:checked');
    return {
      initialized: this.initialized,
      hasBundles: this.hasBundles,
      hasBonuses: this.hasBonuses,
      selectedBundle: selectedRadio ? selectedRadio.getAttribute('data-bundle-name') : null,
      bonusVisible: this.bonusContainer
        ? this.bonusContainer.getAttribute('data-bonus-visibility') === 'visible'
        : false,
      noBundlesBonusVisible: this.noBundlesBonusSection
        ? this.noBundlesBonusSection.getAttribute('data-no-content-visibility') === 'visible'
        : false,
    };
  }

  /**
   * Public method to manually trigger state update
   */
  refresh() {
    if (this.initialized) {
      this.setInitialState();
    }
  }

  /**
   * Public method to simulate no bundles/bonuses scenario for testing
   * @param {boolean} noBundles - Set to true to simulate no bundles
   * @param {boolean} noBonuses - Set to true to simulate no bonuses
   */
  simulateNoBundlesBonuses(noBundles = true, noBonuses = true) {
    if (!this.initialized) return;

    // Override the has flags
    this.hasBundles = !noBundles;
    this.hasBonuses = !noBonuses;

    // Trigger state update
    this.setInitialState();
  }
}

// Initialize the controller
const bundlesBonusController = new BundlesBonusController();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BundlesBonusController;
} else if (typeof window !== 'undefined') {
  window.BundlesBonusController = BundlesBonusController;
  window.bundlesBonusController = bundlesBonusController;
}
