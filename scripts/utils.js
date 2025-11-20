export const safeText = (el, fallback = "") =>
  el?.textContent?.trim() ?? fallback;

export function isAuthorEnvironment() {
  if (window?.location?.origin?.includes("author")) {
    return true;
  }
  return false;
}

export function whatBlockIsThis(element) {
  let currentElement = element;

  while (currentElement.parentElement) {
    if (currentElement.parentElement.classList.contains("block"))
      return currentElement.parentElement;
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
 * Move instrumentation attributes from a given element to another given element virtual node.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function transferInstrumentation(from, to) {
  const fromElement = hasAEMAttributes(from) ? from  : findFirstLevelAEMElement(from);
  if(!fromElement)return;
  transferAttributes(
    fromElement,
    to,
    [...fromElement.attributes]
      .map(({ nodeName }) => nodeName)
      .filter(
        (attr) =>
          attr.startsWith("data-aue-") || attr.startsWith("data-richtext-")
      )
  );
}

/** 
 * Helper to check if an element has AEM-specific data attributes
 * @param {Element} el - Element to check
 * @returns {boolean} True if element has AEM data attributes
 */
function hasAEMAttributes(el) {
  return Array.from(el.attributes).some(attr => attr.name.startsWith('data-aue-'));
}

/**
 * Recursively finds the first element (starting from the given element) that contains any data-aue attribute.
 *
 * @param {Element} element - The root DOM element to start searching from
 * @returns {Element|null} The first element with data-* attribute, or null if none found
 */
function findFirstLevelAEMElement(element) {
  if (hasAEMAttributes(element))return element;
  for (const child of element.children) {
    return hasAEMAttributes(child) ? child : findFirstLevelAEMElement(child);
  }
  return null;
}
