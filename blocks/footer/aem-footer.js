import { loadFooterFragment, processFooterFragmentContent, createOptimizedPictureExternal, moveInstrumentation } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

// Footer configuration - calculated once for the entire module
const FooterConfig = {
  get baseUrl() {
    return window.asusCto?.baseUrl;
  },
  get shouldUseExternal() {
    return this.baseUrl && this.baseUrl !== window.location.origin;
  }
};

/**
 * AEM Footer Web Component
 * Encapsulates the footer block as a reusable web component for third-party integration
 */
class AEMFooter extends HTMLElement {
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
    // Load CSS into shadow root
    await this.loadStyles();
    
    // Set up window.hlx.codeBasePath BEFORE loading aem.js to ensure icons use correct baseUrl
    const baseUrl = this.baseUrl || window.location.origin;
    
    // Initialize window.hlx if it doesn't exist
    if (!window.hlx) {
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
      this.loadCSS(`${baseUrl}/blocks/footer/aem-footer.css`),
      this.loadCSS(`${baseUrl}/blocks/footer/footer.css`)
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
   * Load footer fragment from custom URL
   * @returns {Promise<string|null>} Fragment HTML content or null if not found
   */
  async loadCustomFooterFragment() {
    if (!this.fragmentUrl) {
      console.warn('Fragment URL not provided, falling back to default');
      return await loadFooterFragment();
    }
    
    const baseUrl = this.baseUrl || window.location.origin;
    const fullFragmentUrl = `${baseUrl}/${this.fragmentUrl}`;
    
    try {
      const response = await fetch(fullFragmentUrl);
      if (response.ok) {
        const html = await response.text();
        return processFooterFragmentContent(html);
      }
    } catch (error) {
      console.log('Failed to load custom footer fragment:', error);
    }
    
    return null;
  }

  /**
   * Function to optimize footer images using createOptimizedPicture
   * Similar to optimizeLogoImages() from header component
   */
  optimizeFooterImages() {
    // Find all images in footer and optimize them, particularly social media icons
    this.shadowRoot.querySelectorAll('footer img, .footer img, .social img, .social__icons img').forEach((img) => {
      // Skip if already optimized or if it's not in a picture element
      if (img.closest('picture')?.hasAttribute('data-optimized')) {
        return;
      }
      
      let optimizedPic;
      
      // Use FooterConfig for baseUrl and shouldUseExternal
      const { baseUrl, shouldUseExternal } = FooterConfig;
      
      if (shouldUseExternal) {
        // Use createOptimizedPictureExternal with baseUrl when baseUrl is defined and different
        optimizedPic = createOptimizedPictureExternal(
          img.src, 
          img.alt, 
          true, // eager loading for footer images (above fold)
          [{ width: '200' }, { width: '400' }], // responsive breakpoints
          baseUrl
        );
      } else {
        // Use createOptimizedPicture from aem.js when baseUrl is not defined or equals window.location.href
        optimizedPic = createOptimizedPicture(
          img.src, 
          img.alt, 
          true, // eager loading for footer images (above fold)
          [{ width: '200' }, { width: '400' }] // responsive breakpoints
        );
      }
      
      // Move instrumentation from original to optimized image
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      
      // Mark as optimized to prevent re-processing
      optimizedPic.setAttribute('data-optimized', 'true');
      
      // Replace the original picture with optimized version
      const originalPicture = img.closest('picture');
      if (originalPicture) {
        originalPicture.replaceWith(optimizedPic);
      } else {
        // If no picture element, wrap the img and replace
        img.replaceWith(optimizedPic);
      }
    });
  }

  /**
   * Initialize footer block functionality
   */
  async initializeFooterBlock() {
    const footerBlock = this.shadowRoot.querySelector('.footer');
    if (!footerBlock) return;

    try {
      // Import and execute footer decoration
      const baseUrl = this.baseUrl || window.location.origin;
      const footerModule = await import(`${baseUrl}/blocks/footer/footer.js`);
      if (footerModule.default) {
        // Set up FooterConfig baseUrl before running footer.js
        if (!window.asusCto) {
          window.asusCto = {};
        }
        if (!window.asusCto.baseUrl) {
          window.asusCto.baseUrl = this.baseUrl || window.location.origin;
        }
        
        await footerModule.default(footerBlock);
      }
    } catch (error) {
      console.error('Error initializing footer block:', error);
    }
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
      this.optimizeFooterImages();

      this.isLoaded = true;
      this.dispatchEvent(new CustomEvent('aem-footer-loaded', {
        detail: { success: true }
      }));

      // Dispatch custom event to match reference
      document.dispatchEvent(new Event('asus-cto-DOMContentLoaded'));

    } catch (error) {
      console.error('Error loading footer:', error);
      
      // Clear any existing content
      this.shadowRoot.innerHTML = '';
      
      // Dispatch error event for consuming application to handle
      this.dispatchEvent(new CustomEvent('aem-footer-error', {
        detail: { error: error.message }
      }));
    }
  }

  /**
   * Handle external events sent to the footer
   */
  async handleFooterEvent(event) {
    const { action, detail } = event.detail || {};
    
    switch (action) {
      case 'refresh':
        await this.loadFooter();
        this.dispatchEvent(new CustomEvent('aem-footer-refreshed'));
        break;
        
      default:
        console.warn('Unknown footer action:', action);
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
    const backToTopButton = this.shadowRoot.querySelector('.back-to-top');
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

// Export for module usage (only when loaded as module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AEMFooter;
} else if (typeof define === 'function' && define.amd) {
  define([], function() { return AEMFooter; });
}
