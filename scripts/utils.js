export const safeText = (el, fallback = '') => el?.textContent?.trim() ?? fallback;

export function isAuthorEnvironment() {
  if (window?.location?.origin?.includes('author')) {
    return true;
  }
  return false;
}

/**
 * Detect if running in Universal Editor environment
 * Universal Editor loads pages in an iframe within the author environment
 * @returns {boolean} True if running in Universal Editor
 */
export const isUniversalEditor = () => {
  const isInIframe = window.self !== window.top;
  return isAuthorEnvironment() && isInIframe;
};

export function whatBlockIsThis(element) {
  let currentElement = element;

  while (currentElement.parentElement) {
    if (currentElement.parentElement.classList.contains('block')) return currentElement.parentElement;
    currentElement = currentElement.parentElement;
    if (currentElement.classList.length > 0) return currentElement.classList[0];
  }
  return null;
}

/**
 * Moves all the attributes from a given elmenet to another given element virtual node.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function transferAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      if (to instanceof DocumentFragment) {
        to?.firstElementChild.setAttribute(attr, value);
      } else {
        to?.setAttribute(attr, value);
      }
      from.removeAttribute(attr);
    }
  });
}

/**
 * Helper to check if an element has AEM-specific data attributes
 * @param {Element} el - Element to check
 * @returns {boolean} True if element has AEM data attributes
 */
function hasAEMAttributes(el) {
  return Array.from(el.attributes).some((attr) => attr.name.startsWith('data-aue-'));
}

/**
 * Recursively finds the first element (starting from the given element) that contains any data-aue attribute.
 *
 * @param {Element} element - The root DOM element to start searching from
 * @returns {Element|null} The first element with data-* attribute, or null if none found
 */
function findFirstLevelAEMElement(element) {
  if (hasAEMAttributes(element)) return element;
  for (const child of element.children) {
    const foundElement = findFirstLevelAEMElement(child);
    if (foundElement) {
      return foundElement;
    }
  }
  return null;
}

/**
 * Move instrumentation attributes from a given element to another given element virtual node.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function transferInstrumentation(from, to) {
  const fromElement = hasAEMAttributes(from) ? from : findFirstLevelAEMElement(from);
  if (!fromElement) return;
  transferAttributes(
    fromElement,
    to,
    [...fromElement.attributes]
      .map(({ nodeName }) => nodeName)
      .filter(
        (attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-'),
      ),
  );
}

/**
 * Helper function to set the height of an element.
 * Handles number and string values.
 * @param {HTMLElement} el - The element to set height on
 * @param {number|string|Function} val - The height value (number in pixels, string, or function returning height)
 */
export function setHeight(el, val) {
  // If val is a function, execute it to get the height value
  if (typeof val === 'function') val = val();

  // If the value is a string (e.g., '100px' or 'auto'), set it directly
  if (typeof val === 'string') {
    el.style.height = val;
  } else {
    el.style.height = val + 'px';
  }
}

/**
 * Sets equal height for elements that are on the same visual row.
 * @param {string} containerSelector - The CSS selector for the elements to be resized (e.g., '.featured-product-card').
 */
export function equalheight(containerSelector) {
  // Use let/const for proper scoping
  let currentTallest = 0;
  let currentRowStart = 0;
  let rowDivs = []; // Use array literal for better practice

  const elements = document.querySelectorAll(containerSelector);

  if (elements.length === 0) return;

  // 1. Reset height of all elements to 'auto' for accurate measurement
  elements.forEach((el) => {
    el.style.height = 'auto';
  });

  // 2. Iterate and group elements by row
  elements.forEach((el) => {
    // Get the top position relative to the nearest positioned ancestor (or the document body)
    const topPosition = el.offsetTop;

    // Get the element's current computed height as a number
    // We use offsetHeight which is generally more reliable for element sizing
    // and includes padding/border if box-sizing: border-box is used.
    const elementHeight = el.offsetHeight;

    // Check if a new row has started
    if (currentRowStart !== topPosition) {
      // 3. If a new row starts, apply the max height to the ENDED row
      if (rowDivs.length > 0) {
        rowDivs.forEach((div) => {
          setHeight(div, currentTallest);
        });
      }

      // Reset for the new row
      rowDivs = [];
      currentRowStart = topPosition;
      currentTallest = elementHeight;
      rowDivs.push(el);
    } else {
      // 4. Still in the same row
      rowDivs.push(el);
      // Update the tallest height in the current row
      if (elementHeight > currentTallest) {
        currentTallest = elementHeight;
      }
    }
  });

  // 5. Apply the max height to the LAST row, which is outside the loop
  if (rowDivs.length > 0) {
    rowDivs.forEach((div) => {
      setHeight(div, currentTallest);
    });
  }
}
