import {
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  loadScript,
  buildBlock,
  decorateBlock,
  loadBlock,
  getMetadata,
} from './aem.js';
import { getConfigValue } from './configs.js';
import { loadGTM, sendPageLoadAttributes } from './google-data-layer.js';

/**
 * Get the current locale from configuration
 * @returns {Promise<string>} The locale value, defaults to 'en' if not configured
 */
export async function getLocale() {
  const locale = await getConfigValue('locale');
  return locale || 'en';
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * Enhanced version of createOptimizedPicture with fetchpriority support
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {string} [alt] The image alternative text
 * @param {boolean} [eager] Set loading attribute to eager
 * @param {Array} [breakpoints] Breakpoints and corresponding params (eg. width)
 * @param {string} [fetchPriority] Set fetchpriority attribute ('high', 'low', 'auto')
 * @returns {Element} The picture element
 */
export function createOptimizedPicture(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
  fetchPriority = null,
) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      if (fetchPriority) {
        img.setAttribute('fetchpriority', fetchPriority);
      }
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Swiper Dynamic Loader
 * Loads Swiper library on-demand to improve initial page load performance
 */
let swiperPromise = null;
let swiperCSSLoaded = false;

/**
 * Dynamically loads Swiper library from CDN
 * @returns {Promise<Object>} Promise that resolves with Swiper constructor
 */
export async function loadSwiper() {
  // Return immediately if Swiper is already loaded
  if (window.Swiper) {
    return window.Swiper;
  }
  
  // Return existing promise if load is in progress
  if (!swiperPromise) {
    console.log('Swiper: Starting dynamic load (JS + CSS) [Call ID: ' + Date.now() + ']');
    
    swiperPromise = (async () => {
      try {
        await Promise.all([
          // Load CSS once
          !swiperCSSLoaded ? loadCSS('https://cdn.jsdelivr.net/npm/swiper@11.2.10/swiper-bundle.min.css').then(() => {
            swiperCSSLoaded = true;
            console.log('Swiper CSS loaded');
          }) : Promise.resolve(),
          // Load JS
          loadScript(
            'https://cdn.jsdelivr.net/npm/swiper@11.2.10/swiper-bundle.min.js',
            {
              crossorigin: 'anonymous',
              referrerpolicy: 'no-referrer'
            }
          )
        ]);
        console.log('Swiper loaded dynamically (CSS + JS)');
        return window.Swiper;
      } catch (error) {
        console.error('Failed to load Swiper library:', error);
        swiperPromise = null; // Reset on error so retry is possible
        throw error;
      }
    })(); // IIFE (Immediately Invoked Function Expression) creates promise synchronously
  } else {
    console.log('Swiper: Reusing existing load promise');
  }
  
  return swiperPromise;
}

/**
 * Loads header fragment from the working fragment URL
 * @returns {Promise<string|null>} Fragment HTML content or null if not found
 */
export async function loadHeaderFragment() {
  //TODO: change this to relative when we base url is changed.
  const locale = await getLocale();
  const fragmentUrl = `/${locale}/fragments/head.plain.html`;
  try {
    const response = await fetch(fragmentUrl);
    if (response.ok) {
      const html = await response.text();
      return processFragmentContent(html);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Failed to load header fragment:', error);
  }

  return null;
}

/**
 * Loads footer fragment from the working fragment URL
 * @returns {Promise<string|null>} Fragment HTML content or null if not found
 */
export async function loadFooterFragment() {
  //TODO: change this to relative when we base url is changed.
  const locale = await getLocale();
  const fragmentUrl = `/${locale}/fragments/footer.plain.html`;
  try {
    const response = await fetch(fragmentUrl);
    if (response.ok) {
      const html = await response.text();
      return processFooterFragmentContent(html);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Failed to load footer fragment:', error);
  }

  return null;
}

/**
 * Processes fragment content and extracts header block structure
 * @param {string} html Fragment HTML content
 * @returns {string|null} Processed header block content
 */
export function processFragmentContent(html) {
  try {
    // Create a temporary DOM to parse the fragment
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Look for existing header block (UE authoring data format)
    const existingHeaderBlock = tempDiv.querySelector('.header.block');
    if (existingHeaderBlock) {
      // Extract the inner header content (skip the outer wrapper)
      const innerHeader = existingHeaderBlock.querySelector('.header');
      if (innerHeader) {
        return innerHeader.outerHTML;
      }
    }

    // Fallback: Look for any header block
    const headerBlock = tempDiv.querySelector('.header');
    if (headerBlock) {
      return headerBlock.outerHTML;
    }

    return null;

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error processing fragment content:', error);
    return null;
  }
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {string} [alt] The image alternative text
 * @param {boolean} [eager] Set loading attribute to eager
 * @param {Array} [breakpoints] Breakpoints and corresponding params (eg. width)
 * @returns {Element} The picture element
 */
export function createOptimizedPictureExternal(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
  baseUrl
) {
  let url;
  if (baseUrl) {
    url = new URL(src.replace(window.location.origin, baseUrl));
  } else {
    url = new URL(src, window.location.href);
  }
  const picture = document.createElement('picture');
  const { pathname, href } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${href}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${href}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${href}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}
/**
 * Processes footer fragment content and extracts footer block structure
 * @param {string} html Fragment HTML content
 * @returns {string|null} Processed footer block content
 */
export function processFooterFragmentContent(html) {
  try {
    // Create a temporary DOM to parse the fragment
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Look for existing footer block (UE authoring data format)
    const existingFooterBlock = tempDiv.querySelector('.footer.block');
    if (existingFooterBlock) {
      // Extract the inner footer content (skip the outer wrapper)
      const innerFooter = existingFooterBlock.querySelector('.footer');
      if (innerFooter) {
        return innerFooter.outerHTML;
      }
    }

    // Fallback: Look for any footer block
    const footerBlock = tempDiv.querySelector('.footer');
    if (footerBlock) {
      return footerBlock.outerHTML;
    }

    return null;

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error processing footer fragment content:', error);
    return null;
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  
  const noscript = document.createElement('noscript');
  noscript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N8KDRJVJ" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
  document.body.insertBefore(noscript, document.body.firstChild);
  
  const main = doc.querySelector('main');
  if (main) {
    const overlapHeader = getMetadata('overlapheader');
    if (overlapHeader === 'true' && main.firstElementChild) {
      main.firstElementChild.classList.add('overlap-header');
    }
    
    decorateMain(main);
    const hasCarousel = main.querySelector('.hero-banner, .hot-products, .product-preview, .help-me-choose,.our-advantages');
    if (hasCarousel) {
      loadSwiper().catch(err => console.error('Failed to preload Swiper:', err));
    }
    
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  await loadGTM();
  await sendPageLoadAttributes();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  // Initialize global tooltip manager for all tooltip functionality
  import('./tooltip.js')
    .then((module) => {
      if (typeof window.tooltipManager === 'undefined') {
        window.tooltipManager = new module.default();
      }
    })
    .catch((error) => {
      console.error('Failed to load tooltip manager:', error);
    });
}

/**
 * Dynamically load Bazaarvoice script only when needed
 * This is called from blocks that need ratings functionality
 * 
 * @returns {Promise} Resolves when script is loaded
 */
export async function loadBazaarvoiceScript() {
  const BV_SCRIPT_ID = 'bv-script';

  // TODO: Replace with getConfigValue() when configs are ready
  // Hardcoded values for now based on current deployment
  const clientName = 'asustek';
  const siteId = 'cto_main_site_black';
  const environment = 'production';
  const locale = 'en_US';

  // Check if script already exists in DOM
  if (document.getElementById(BV_SCRIPT_ID)) {
    console.log('Bazaarvoice: Script already loaded');
    return Promise.resolve();
  }

  console.log('Bazaarvoice: Loading script dynamically');

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = BV_SCRIPT_ID;
    script.async = true;
    script.onload = () => {
      console.log('Bazaarvoice: Script loaded successfully');
      resolve();
    };
    script.src = `https://apps.bazaarvoice.com/deployments/${clientName}/${siteId}/${environment}/${locale}/bv.js`;
    document.head.appendChild(script);
  });
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Loads a block named 'header' into header
 * @param {Element} header header element
 * @returns {Promise}
 */
async function loadHeader(header) {
  
  try {
    // Try to load header from fragment first
    const fragmentContent = await loadHeaderFragment();
    if (fragmentContent) {
      const headerBlock = buildBlock('header', '');
      
      // Populate the header block with fragment content
      headerBlock.innerHTML = fragmentContent;
      
      header.append(headerBlock);
      decorateBlock(headerBlock);
      return loadBlock(headerBlock);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Failed to load header fragment, falling back to default header:', error);
  }

  // Fallback to original header loading
  const headerBlock = buildBlock('header', '');
  header.append(headerBlock);
  decorateBlock(headerBlock);
  return loadBlock(headerBlock);
}

/**
 * Loads a block named 'footer' into footer
 * @param footer footer element
 * @returns {Promise}
 */
async function loadFooter(footer) {
  
  try {
    // Try to load footer from fragment first
    const fragmentContent = await loadFooterFragment();
    if (fragmentContent) {
      const footerBlock = buildBlock('footer', '');
      
      // Populate the footer block with fragment content
      footerBlock.innerHTML = fragmentContent;
      
      footer.append(footerBlock);
      decorateBlock(footerBlock);
      return loadBlock(footerBlock);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Failed to load footer fragment, falling back to default footer:', error);
  }

  // Fallback to original footer loading
  const footerBlock = buildBlock('footer', '');
  footer.append(footerBlock);
  decorateBlock(footerBlock);
  return loadBlock(footerBlock);
}

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
// eslint-disable-next-line import/prefer-default-export
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          const placeholders = {};
          json.data
            .filter((placeholder) => placeholder.Key)
            .forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve(window.placeholders[prefix]);
        })
        .catch(() => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[`${prefix}`];
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
  document.dispatchEvent(new Event('eds-lazy-event'));
}

async function loadPage() {
  if (document.querySelector('aem-header, aem-footer')) {
    console.log('Web component usage detected - skipping full page initialization');
    return;
  }
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
