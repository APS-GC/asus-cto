import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

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
 * Loads header fragment from the working fragment URL
 * @returns {Promise<string|null>} Fragment HTML content or null if not found
 */
export async function loadHeaderFragment() {
  const fragmentUrl = '/fragments/head.plain.html';
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
  const fragmentUrl = '/fragments/footer.plain.html';
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
  if(baseUrl){
    url = new URL(src.replace(window.location.origin, baseUrl));
  }else{
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
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
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
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
