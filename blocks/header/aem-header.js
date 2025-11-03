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
  }

  static get observedAttributes() {
    return ['fragment-url', 'base-url', 'config'];
  }

  connectedCallback() {
    this.fragmentUrl = this.getAttribute('fragment-url') || '/fragments/head.plain.html';
    this.baseUrl = this.getAttribute('base-url') || '';
    
    // Set up event listeners for external API
    this.addEventListener('aem-header', this.handleHeaderEvent.bind(this));
    
    // Initialize the header
    this.loadHeader();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'fragment-url':
          this.fragmentUrl = newValue;
          if (this.isLoaded) this.loadHeader();
          break;
        case 'base-url':
          this.baseUrl = newValue;
          break;
        case 'config':
          try {
            this.headerData = JSON.parse(newValue);
            if (this.isLoaded) this.refreshHeader();
          } catch (e) {
            console.error('Invalid config JSON:', e);
          }
          break;
      }
    }
  }

  /**
   * Load required CSS and JS assets
   */
  async loadAssets() {
    const baseUrl = this.baseUrl || window.location.origin;
    
    // Load CSS
    await this.loadCSS(`${baseUrl}/blocks/header/header.css`);
    await this.loadCSS(`${baseUrl}/styles/styles.css`);
    
    // Load core AEM utilities if not already loaded
    if (!window.hlx) {
      await this.loadScript(`${baseUrl}/scripts/aem.js`);
    }
  }

  /**
   * Load CSS file
   */
  loadCSS(href) {
    return new Promise((resolve, reject) => {
      if (!document.querySelector(`head > link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.append(link);
      } else {
        resolve();
      }
    });
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
   * Fetch header fragment content
   */
  async fetchHeaderFragment() {
    try {
      const response = await fetch(this.fragmentUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch header fragment: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching header fragment:', error);
      return null;
    }
  }

  /**
   * Process fragment HTML and extract header block
   */
  processFragmentContent(html) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Look for header block
      const headerBlock = tempDiv.querySelector('.header.block, .header');
      if (headerBlock) {
        return headerBlock.outerHTML;
      }

      return null;
    } catch (error) {
      console.error('Error processing fragment content:', error);
      return null;
    }
  }

  /**
   * Main header loading function
   */
  async loadHeader() {
    try {
      // Load required assets first
      await this.loadAssets();

      // Fetch and process header content
      const fragmentHtml = await this.fetchHeaderFragment();
      if (!fragmentHtml) {
        throw new Error('Failed to fetch header fragment');
      }

      const headerContent = this.processFragmentContent(fragmentHtml);
      if (!headerContent) {
        throw new Error('Failed to process header fragment content');
      }

      // Set the header content
      this.innerHTML = headerContent;

      // Initialize header functionality
      await this.initializeHeaderBlock();

      this.isLoaded = true;
      this.dispatchEvent(new CustomEvent('aem-header-loaded', {
        detail: { success: true }
      }));

    } catch (error) {
      console.error('Error loading header:', error);
      
      // Clear any existing content
      this.innerHTML = '';
      
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
    const headerBlock = this.querySelector('.header');
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
   * Render fallback header when fragment loading fails
   */
  renderFallbackHeader() {
    this.innerHTML = `
      <div class="header-wrapper">
        <header class="experiencefragment">
          <div class="cmp-experiencefragment">
            <div class="cmp-container cmp-header container">
              <div class="navigation">
                <nav class="cmp-navigation">
                  <div class="cmp-navigation__item--logo">
                    <div class="logo-item logo-item--asus">
                      <div class="logo-wrapper">
                        <a href="#" aria-label="ASUS Logo">
                          <span class="logo-placeholder">ASUS</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </nav>
              </div>
              <div class="sitenavigation">
                <nav class="cmp-sitenavigation">
                  <ul class="cmp-sitenavigation__group cmp-sitenavigation__group--main">
                    <li class="cmp-sitenavigation__item">
                      <a class="cmp-sitenavigation__item-link" href="#">Home</a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </header>
      </div>
    `;
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
        
      case 'update-config':
        if (detail && detail.config) {
          this.headerData = detail.config;
          await this.refreshHeader();
        }
        break;
        
      case 'set-user-state':
        if (detail && typeof detail.isLoggedIn === 'boolean') {
          this.updateUserState(detail.isLoggedIn, detail.userName);
        }
        break;
        
      case 'update-cart':
        if (detail && typeof detail.itemCount === 'number') {
          this.updateCartCount(detail.itemCount);
        }
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
   * Update user login state
   */
  updateUserState(isLoggedIn, userName = '') {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
      if (userName) {
        localStorage.setItem('userName', userName);
      }
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
    }

    // Trigger header refresh to update UI
    const headerBlock = this.querySelector('.header');
    if (headerBlock && headerBlock.refreshHeader) {
      headerBlock.refreshHeader(headerBlock);
    }
  }

  /**
   * Update cart item count
   */
  updateCartCount(itemCount) {
    const cartToggle = this.querySelector('.mini-cart-toggle');
    if (cartToggle) {
      if (itemCount > 0) {
        cartToggle.setAttribute('data-cart-count', itemCount);
      } else {
        cartToggle.removeAttribute('data-cart-count');
      }
    }
  }

  /**
   * Get current header configuration
   */
  getConfig() {
    return {
      fragmentUrl: this.fragmentUrl,
      baseUrl: this.baseUrl,
      isLoaded: this.isLoaded,
      headerData: this.headerData
    };
  }

  /**
   * Public API methods
   */
  
  // Refresh the header
  refresh() {
    this.dispatchEvent(new CustomEvent('aem-header', {
      detail: { action: 'refresh' }
    }));
  }

  // Set user login state
  setUserState(isLoggedIn, userName = '') {
    this.dispatchEvent(new CustomEvent('aem-header', {
      detail: { 
        action: 'set-user-state', 
        detail: { isLoggedIn, userName }
      }
    }));
  }

  // Update cart count
  setCartCount(itemCount) {
    this.dispatchEvent(new CustomEvent('aem-header', {
      detail: { 
        action: 'update-cart', 
        detail: { itemCount }
      }
    }));
  }

  // Update configuration
  updateConfig(config) {
    this.dispatchEvent(new CustomEvent('aem-header', {
      detail: { 
        action: 'update-config', 
        detail: { config }
      }
    }));
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
