/**
 * Common utilities for AEM Web Components
 * Shared functions to avoid code duplication between header and footer components
 */

/**
 * Load CSS file into shadow root
 * @param {ShadowRoot} shadowRoot - The shadow root to append the CSS to
 * @param {string} href - URL to the CSS file
 * @param {string} [media] - Media query for the CSS file
 * @returns {Promise} Promise that resolves when CSS is loaded
 */
export function loadCSSToShadowRoot(shadowRoot, href, media) {
  return new Promise((resolve, reject) => {
    if (!shadowRoot.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      if (media) link.media = media;
      link.onload = resolve;
      link.onerror = reject;
      shadowRoot.append(link);
    } else {
      resolve();
    }
  });
}

/**
 * Load JS file into document head
 * @param {string} src - URL to the JS file
 * @returns {Promise} Promise that resolves when script is loaded
 */
export function loadScriptToHead(src) {
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
 * Load all required styles for a component with CSS variable inheritance for shadow DOM
 * @param {ShadowRoot} shadowRoot - The shadow root to load styles into
 * @param {string} baseUrl - Base URL for loading assets
 * @param {string} componentName - Name of the component (header/footer)
 * @returns {Promise} Promise that resolves when all styles are loaded
 */
export function loadStylesForComponent(shadowRoot, baseUrl, componentName) {
  return Promise.allSettled([
    loadCSSToShadowRoot(shadowRoot, `${baseUrl}/blocks/${componentName}/aem-${componentName}.css`),
    loadCSSToShadowRoot(shadowRoot, `${baseUrl}/blocks/${componentName}/${componentName}.css`)
  ]);
}

/**
 * Load component assets (CSS and JS)
 * @param {ShadowRoot} shadowRoot - The shadow root to load assets into
 * @param {string} baseUrl - Base URL for loading assets
 * @param {string} componentName - Name of the component (header/footer)
 * @returns {Promise} Promise that resolves when all assets are loaded
 */
export async function loadAssetsForComponent(shadowRoot, baseUrl, componentName) {
  // Load CSS into shadow root
  await loadStylesForComponent(shadowRoot, baseUrl, componentName);
  
  // Initialize window.hlx if it doesn't exist
  if (!window.hlx) {
    await loadScriptToHead(`${baseUrl}/scripts/aem.js`);
  }
}

/**
 * Load custom fragment from URL with fallback
 * @param {string} fragmentUrl - Custom fragment URL
 * @param {string} baseUrl - Base URL for the application
 * @param {Function} fallbackLoader - Fallback loader function
 * @param {Function} processor - Fragment content processor function
 * @returns {Promise<string|null>} Fragment HTML content or null if not found
 */
export async function loadCustomFragment(fragmentUrl, baseUrl, fallbackLoader, processor) {
  if (!fragmentUrl) {
    console.warn('Fragment URL not provided, falling back to default');
    return await fallbackLoader();
  }
  
  const fullFragmentUrl = `${baseUrl}/${fragmentUrl}`;
  
  try {
    const response = await fetch(fullFragmentUrl);
    if (response.ok) {
      const html = await response.text();
      return processor(html);
    }
  } catch (error) {
    console.log('Failed to load custom fragment:', error);
  }
  
  return null;
}

/**
 * Initialize a block within a shadow root
 * @param {ShadowRoot} shadowRoot - The shadow root containing the block
 * @param {string} blockSelector - CSS selector for the block element
 * @param {string} componentName - Name of the component (header/footer)
 * @param {string} baseUrl - Base URL for loading the block module
 * @returns {Promise} Promise that resolves when block is initialized
 */
export async function initializeBlockInShadowRoot(shadowRoot, blockSelector, componentName, baseUrl) {
  const block = shadowRoot.querySelector(blockSelector);
  if (!block) return;

  try {
    // Import and execute block decoration
    const blockModule = await import(`${baseUrl}/blocks/${componentName}/${componentName}.js`);
    if (blockModule.default) {
      // Set up global config before running block module
      if (!window.asusCto) {
        window.asusCto = {};
      }
      if (!window.asusCto.baseUrl) {
        window.asusCto.baseUrl = baseUrl || window.location.origin;
      }
      
      await blockModule.default(block);
    }
  } catch (error) {
    console.error(`Error initializing ${componentName} block:`, error);
  }
}

/**
 * Handle component events (refresh, etc.)
 * @param {HTMLElement} component - The web component instance
 * @param {Event} event - The event to handle
 * @param {Function} refreshFunction - Function to call for refresh action
 * @returns {Promise} Promise that resolves when event is handled
 */
export async function handleComponentEvent(component, event, refreshFunction) {
  const { action, detail } = event.detail || {};
  
  switch (action) {
    case 'refresh':
      await refreshFunction();
      component.dispatchEvent(new CustomEvent(`aem-${component.constructor.name.toLowerCase().replace('aem', '')}-refreshed`));
      break;
      
    default:
      console.warn('Unknown component action:', action);
  }
}

/**
 * Setup global configuration
 * @param {string} baseUrl - Base URL to set in global config
 */
export function setupGlobalConfig(baseUrl) {
  window.asusCto = window.asusCto || {};
  if (baseUrl && !window.asusCto.baseUrl) {
    window.asusCto.baseUrl = baseUrl || window.location.href;
  }
}
