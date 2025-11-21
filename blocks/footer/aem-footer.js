import { loadFooterFragment, processFooterFragmentContent, createOptimizedPictureExternal, moveInstrumentation } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { 
  loadAssetsForComponent,
  loadCustomFragment,
  initializeBlockInShadowRoot
} from '../../scripts/aem-component-utils.js';

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
    const baseUrl = this.baseUrl || window.location.origin;
    await loadAssetsForComponent(this.shadowRoot, baseUrl, 'footer');
  }


  /**
   * Load footer fragment from custom URL
   * @returns {Promise<string|null>} Fragment HTML content or null if not found
   */
  async loadCustomFooterFragment() {
    const baseUrl = this.baseUrl || window.location.origin;
    return await loadCustomFragment(this.fragmentUrl, baseUrl, loadFooterFragment, processFooterFragmentContent);
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
