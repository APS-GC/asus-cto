import { loadFooterFragment, processFooterFragmentContent } from '../../scripts/scripts.js';
import {
  loadAssetsForComponent,
  loadCustomFragment,
  initializeBlockInShadowRoot,
} from '../../scripts/aem-component-utils.js';
import { optimizeFooterImages } from './footer.js';

/**
 * AEM Footer Web Component
 * Encapsulates the footer block as a reusable web component for third-party integration
 */
export default class AEMFooter extends HTMLElement {
  constructor() {
    super();
    this.fragmentUrl = '';
    this.baseUrl = '';
    this.isLoaded = false;
    this.footerData = null;
    this.attachShadow({ mode: 'open' });
    window.asusCto = window.asusCto || {};
  }

  static get observedAttributes() {
    return ['fragment-url', 'base-url', 'config'];
  }

  connectedCallback() {
    this.loadFooter();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'fragment-url') {
      this.fragmentUrl = newValue;
    } else if (name === 'base-url') {
      this.baseUrl = newValue;
      if (window.asusCto && !window.asusCto.baseUrl) {
        window.asusCto.baseUrl = this.baseUrl || window.location.href;
      }
    }

    // Reload footer if already loaded and URL changed
    if (this.isLoaded && (name === 'fragment-url' || name === 'base-url')) {
      this.loadFooter();
    }
  }

  /**
   * Load required CSS and JS assets
   */
  async loadAssets() {
    const baseUrl = this.baseUrl || window.location.origin;
    await loadAssetsForComponent(this.shadowRoot, baseUrl, 'footer');
  }

  /**
   * Load footer fragment from custom URL
   * @returns {Promise<string|null>} Fragment HTML content or null if not found
   */
  async loadCustomFooterFragment() {
    const baseUrl = this.baseUrl || window.location.origin;
    return loadCustomFragment(this.fragmentUrl, baseUrl, loadFooterFragment, processFooterFragmentContent);
  }

  /**
   * Initialize footer block functionality
   */
  async initializeFooterBlock() {
    const baseUrl = this.baseUrl || window.location.origin;
    await initializeBlockInShadowRoot(this.shadowRoot, '.footer', 'footer', baseUrl);
  }

  /**
   * Main footer loading function
   */
  async loadFooter() {
    try {
      // Use custom fragment loading with baseUrl and fragmentUrl
      const footerContent = await this.loadCustomFooterFragment();
      if (!footerContent) {
        throw new Error('Failed to load footer fragment');
      }

      // Set the footer content (parses HTML string into DOM elements)
      this.shadowRoot.innerHTML = footerContent;

      // Load required assets after setting content
      await this.loadAssets();

      // Initialize footer functionality
      await this.initializeFooterBlock();

      // Optimize footer images after HTML is set and footer functionality is initialized
      optimizeFooterImages(this.shadowRoot);

      this.isLoaded = true;
      this.dispatchEvent(new CustomEvent('aem-footer-loaded', {
        detail: { success: true },
      }));

      // Dispatch custom event to match reference
      document.dispatchEvent(new Event('asus-cto-DOMContentLoaded'));
    } catch (error) {
      // Clear any existing content
      this.shadowRoot.innerHTML = '';

      // Dispatch error event for consuming application to handle
      this.dispatchEvent(new CustomEvent('aem-footer-error', {
        detail: { error: error.message },
      }));
    }
  }

  /**
   * Handle external events sent to the footer
   */
  async handleFooterEvent(event) {
    const { action } = event.detail || {};

    switch (action) {
      case 'refresh':
        await this.loadFooter(); // eslint-disable-line no-await-in-loop
        this.dispatchEvent(new CustomEvent('aem-footer-refreshed', {}));
        break;
      default:
    }
  }

  /**
   * Refresh footer with current configuration
   */
  async refreshFooter() {
    if (this.isLoaded) {
      await this.loadFooter();
    }
  }

  /**
   * Public API: Trigger manual refresh
   */
  triggerRefresh() {
    return this.refreshFooter();
  }

  /**
   * Public API: Subscribe to newsletter programmatically
   */
  subscribeToNewsletter(email) {
    const form = this.shadowRoot.querySelector('.newsletter');
    const emailInput = form?.querySelector('input[type="email"]');

    if (emailInput) {
      emailInput.value = email;
      form.dispatchEvent(new Event('submit'));
    }
  }

  /**
   * Cleanup event listeners when component is removed
   */
  disconnectedCallback() {
    // Clean up any global event listeners if needed
    const backToTopButton = this.shadowRoot.querySelector('.back-to-top'); // eslint-disable-line no-unused-vars
    if (backToTopButton) {
      window.removeEventListener('scroll', () => {});
    }
  }
}

// Register the custom element
customElements.define('aem-footer', AEMFooter);

// Make available globally for script tag usage
if (typeof window !== 'undefined') {
  window.AEMFooter = AEMFooter;
}
