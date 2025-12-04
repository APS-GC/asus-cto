import { loadHeaderFragment, processFragmentContent } from '../../scripts/scripts.js';
import { 
  loadAssetsForComponent,
  loadCustomFragment,
  initializeBlockInShadowRoot
} from '../../scripts/aem-component-utils.js';
import { replaceLocaleInUrl } from '../../scripts/configs.js';
import {callSSOValidation} from '../../scripts/api-service.js'

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
    window.asusCto = {};
    this.lastLoginState = null;
    this.storageListener = null;
  }

  static get observedAttributes() {
    return ['fragment-url', 'base-url', 'config'];
  }

  connectedCallback() {
    this.loadHeader();
    this.setupLoginStateMonitoring();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'fragment-url') {
      this.fragmentUrl = newValue;
    } else if (name === 'base-url') {
      this.baseUrl = newValue;
      if (window.asusCto && !window.asusCto.baseUrl) {
        window.asusCto.baseUrl = this.baseUrl || window.location.origin;
      }
    }
    
    // Reload header if already loaded and URL changed
    if (this.isLoaded && (name === 'fragment-url' || name === 'base-url')) {
      this.loadHeader();
    }
  }

  /**
   * Load required CSS and JS assets
   */
  async loadAssets() {
    const baseUrl = this.baseUrl || window.location.origin;
    await loadAssetsForComponent(this.shadowRoot, baseUrl, 'header');
  }


  /**
   * Load header fragment from custom URL
   * @returns {Promise<string|null>} Fragment HTML content or null if not found
   */
  async loadCustomHeaderFragment() {
    const baseUrl = this.baseUrl || window.location.origin;
    const fragmentUrl = await replaceLocaleInUrl(this.fragmentUrl);
    
    return await loadCustomFragment(fragmentUrl, baseUrl, loadHeaderFragment, processFragmentContent);
  }

  /**
   * Main header loading function
   */
  async loadHeader() {
    try {
      // Use custom fragment loading with baseUrl and fragmentUrl
      const headerContent = await this.loadCustomHeaderFragment();
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
    const baseUrl = this.baseUrl || window.location.origin;
    await initializeBlockInShadowRoot(this.shadowRoot, '.header', 'header', baseUrl);
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

  /**
   * Setup monitoring for login state changes
   */
  setupLoginStateMonitoring() {
    // Track initial login state
    this.lastLoginState = localStorage.getItem('isLoggedIn');
    
    // Listen for storage changes (login/logout events)
    this.storageListener = (e) => {
      if (e.key === 'isLoggedIn' || e.key === 'userName') {
        const currentLoginState = localStorage.getItem('isLoggedIn');
        if (currentLoginState !== this.lastLoginState) {
          this.lastLoginState = currentLoginState;
          console.log('Login state changed, refreshing header...');
          this.refreshHeader();
        }
      }
    };
    
    window.addEventListener('storage', this.storageListener);
    
    // Also listen for storage changes in same window
    this.setupSameWindowStorageListener();
  }

  /**
   * Setup monitoring for storage changes in same window
   */
  setupSameWindowStorageListener() {
    // Override localStorage methods to detect changes in same window
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    
    const checkLoginStateChange = () => {
      const currentLoginState = localStorage.getItem('isLoggedIn');
      if (currentLoginState !== this.lastLoginState) {
        this.lastLoginState = currentLoginState;
        console.log('Login state changed (same window), refreshing header...');
        setTimeout(() => this.refreshHeader(), 100); // Small delay to ensure state is fully updated
      }
    };
    
    localStorage.setItem = function(key, value) {
      const result = originalSetItem.call(this, key, value);
      if (key === 'isLoggedIn' || key === 'userName') {
        checkLoginStateChange();
      }
      return result;
    };
    
    localStorage.removeItem = function(key) {
      const result = originalRemoveItem.call(this, key);
      if (key === 'isLoggedIn' || key === 'userName') {
        checkLoginStateChange();
      }
      return result;
    };
  }

  /**
   * Public API: Set user state (for external integration)
   */
  setUserState(isLoggedIn, userName = '') {
    const currentState = localStorage.getItem('isLoggedIn');
    const newState = isLoggedIn ? 'true' : null;
    
    if (newState !== currentState) {
      if (isLoggedIn) {
        localStorage.setItem('isLoggedIn', 'true');
        if (userName) {
          localStorage.setItem('userName', userName);
        }
      } else {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
      }
    }
  }

  /**
   * Public API: Trigger manual refresh
   */
  triggerRefresh() {
    return this.refreshHeader();
  }

  /**
   * Cleanup event listeners when component is removed
   */
  disconnectedCallback() {
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
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

callSSOValidation();