import { loadHeaderFragment } from '../../scripts/scripts.js';

/**
 * AEM Header Web Component
 * Encapsulates the header block as a reusable web component for third-party integration
 */

class AEMHeader extends HTMLElement {
  constructor() {
    super();
    this.fragmentUrl = '';
    this.baseUrl = '';
    this.isLoaded = false;
    this.headerData = null;
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['fragment-url', 'base-url', 'config'];
  }

  connectedCallback() {
    this.loadHeader();
  }

  /**
   * Load required CSS and JS assets
   */
  async loadAssets() {
    // Load CSS into shadow root
    await this.loadStyles();
    
    // Load core AEM utilities if not already loaded
    if (!window.hlx) {
      const baseUrl = this.baseUrl || window.location.origin;
      await this.loadScript(`${baseUrl}/scripts/aem.js`);
    }
  }

  /**
   * Load CSS file
   */
  loadCSS(href, media) {
    return new Promise((resolve, reject) => {
      if (!this.shadowRoot.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        if (media) link.media = media;
        link.onload = resolve;
        link.onerror = reject;
        this.shadowRoot.append(link);
      } else {
        resolve();
      }
    });
  }

  /**
   * Load all required styles with CSS variable inheritance for shadow DOM
   */
  async loadStyles() {
    const baseUrl = this.baseUrl || window.location.origin;
    return Promise.allSettled([
      this.loadCSS(`${baseUrl}/blocks/header/aem-header.css`),
      this.loadCSS(`${baseUrl}/blocks/header/header.css`)
    ]);
  }

  /**
   * Load JS file
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (!document.querySelector(`head > script[src="${src}"]`)) {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'module';
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      } else {
        resolve();
      }
    });
  }

  /**
   * Main header loading function
   */
  async loadHeader() {
    try {
      // Use the shared functions from aem.js
      const headerContent = await loadHeaderFragment();
      if (!headerContent) {
        throw new Error('Failed to load header fragment');
      }

      // Set the header content (parses HTML string into DOM elements)
      this.shadowRoot.innerHTML = headerContent;

      // Load required assets after setting content
      await this.loadAssets();

      // Initialize header functionality
      await this.initializeHeaderBlock();

      this.isLoaded = true;
      this.dispatchEvent(new CustomEvent('aem-header-loaded', {
        detail: { success: true }
      }));

    } catch (error) {
      console.error('Error loading header:', error);
      
      // Clear any existing content
      this.shadowRoot.innerHTML = '';
      
      // Dispatch error event for consuming application to handle
      this.dispatchEvent(new CustomEvent('aem-header-error', {
        detail: { error: error.message }
      }));
    }
  }

  /**
   * Initialize header block functionality
   */
  async initializeHeaderBlock() {
    const headerBlock = this.shadowRoot.querySelector('.header');
    if (!headerBlock) return;

    try {
      // Import and execute header decoration
      const baseUrl = this.baseUrl || window.location.origin;
      const headerModule = await import(`${baseUrl}/blocks/header/header.js`);
      
      if (headerModule.default) {
        await headerModule.default(headerBlock);
      }
    } catch (error) {
      console.error('Error initializing header block:', error);
    }
  }


  /**
   * Handle external events sent to the header
   */
  async handleHeaderEvent(event) {
    const { action, detail } = event.detail || {};
    
    switch (action) {
      case 'refresh':
        await this.loadHeader();
        this.dispatchEvent(new CustomEvent('aem-header-refreshed'));
        break;
        
      default:
        console.warn('Unknown header action:', action);
    }
  }

  /**
   * Refresh header with current configuration
   */
  async refreshHeader() {
    if (this.isLoaded) {
      await this.loadHeader();
    }
  }

}

// Register the custom element
customElements.define('aem-header', AEMHeader);

// Make available globally for script tag usage
if (typeof window !== 'undefined') {
  window.AEMHeader = AEMHeader;
}

// Export for module usage (only when loaded as module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AEMHeader;
} else if (typeof define === 'function' && define.amd) {
  define([], function() { return AEMHeader; });
}
