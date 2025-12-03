/**
 * Accordion Block
 * Creates an accordion component that can be loaded via loadBlock or used standalone
 */

/**
 * Generate a unique ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Build accordion HTML from items data
 * @param {Array} items - Array of accordion items { id, title, content, expanded }
 * @param {string} accordionId - Unique ID for the accordion
 * @returns {string} - HTML string for the accordion
 */
function buildAccordionHTML(items, accordionId) {
  const itemsHTML = items.map((item) => {
    const itemId = item.id || `${accordionId}-item-${generateId()}`;
    const isExpanded = item.expanded || false;

    return `
      <div 
        class="cmp-accordion__item"
        data-cmp-hook-accordion="item"
        id="${itemId}"
        ${isExpanded ? 'data-cmp-expanded' : ''}
      >
        <h3 class="cmp-accordion__header">
          <button 
            id="${itemId}-button"
            class="cmp-accordion__button ${isExpanded ? 'cmp-accordion__button--expanded' : ''}"
            type="button"
            aria-controls="${itemId}-panel"
            data-cmp-hook-accordion="button"
            aria-expanded="${isExpanded}"
          >
            <span class="cmp-accordion__title">${item.title}</span>
            <span class="cmp-accordion__icon"></span>
          </button>
        </h3>
        <div 
          data-cmp-hook-accordion="panel"
          id="${itemId}-panel"
          class="cmp-accordion__panel ${isExpanded ? 'cmp-accordion__panel--expanded' : 'cmp-accordion__panel--hidden'}"
          role="group"
          aria-labelledby="${itemId}-button"
          aria-hidden="${!isExpanded}"
        >
          ${item.content}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="accordion panelcontainer">
      <div 
        id="${accordionId}"
        data-cmp-is="accordion"
        class="cmp-accordion"
        data-placeholder-text="false"
      >
        ${itemsHTML}
      </div>
    </div>
  `;
}

/**
 * Setup accordion event handlers
 * @param {HTMLElement} container - The accordion container element
 */
function setupAccordionHandlers(container) {
  const accordion = container.querySelector('.cmp-accordion');
  if (!accordion) return;

  const buttons = accordion.querySelectorAll('.cmp-accordion__button');
  
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.cmp-accordion__item');
      const panel = item.querySelector('.cmp-accordion__panel');
      const isExpanded = item.hasAttribute('data-cmp-expanded');

      if (isExpanded) {
        // Collapse
        item.removeAttribute('data-cmp-expanded');
        button.classList.remove('cmp-accordion__button--expanded');
        button.setAttribute('aria-expanded', 'false');
        panel.classList.remove('cmp-accordion__panel--expanded');
        panel.classList.add('cmp-accordion__panel--hidden');
        panel.setAttribute('aria-hidden', 'true');
      } else {
        // Expand
        item.setAttribute('data-cmp-expanded', '');
        button.classList.add('cmp-accordion__button--expanded');
        button.setAttribute('aria-expanded', 'true');
        panel.classList.add('cmp-accordion__panel--expanded');
        panel.classList.remove('cmp-accordion__panel--hidden');
        panel.setAttribute('aria-hidden', 'false');
      }
    });

    // Keyboard navigation
    button.addEventListener('keydown', (e) => {
      const items = [...accordion.querySelectorAll('.cmp-accordion__button')];
      const currentIndex = items.indexOf(button);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < items.length - 1) {
            items[currentIndex + 1].focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            items[currentIndex - 1].focus();
          }
          break;
        case 'Home':
          e.preventDefault();
          items[0].focus();
          break;
        case 'End':
          e.preventDefault();
          items[items.length - 1].focus();
          break;
        default:
          break;
      }
    });
  });
}

/**
 * Create accordion from block content (for authored content)
 * @param {HTMLElement} block - The block element
 * @returns {Array} - Array of accordion items
 */
function parseBlockContent(block) {
  const items = [];
  const rows = block.querySelectorAll(':scope > div');

  rows.forEach((row, index) => {
    const cols = row.querySelectorAll(':scope > div');
    if (cols.length >= 2) {
      items.push({
        id: `accordion-item-${index}`,
        title: cols[0].textContent.trim(),
        content: cols[1].innerHTML,
        expanded: index === 0, // First item expanded by default
      });
    }
  });

  return items;
}

/**
 * Decorate the accordion block
 * Can be used in two ways:
 * 1. With authored content (rows with title and content)
 * 2. With data attributes (data-items JSON string)
 */
export default async function decorate(block) {
  const accordionId = `accordion-${generateId()}`;
  let items = [];

  // Check if items are passed via data attribute
  const itemsData = block.dataset.items;
  if (itemsData) {
    try {
      items = JSON.parse(itemsData);
      delete block.dataset.items;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Accordion: Error parsing items data', error);
    }
  } else {
    // Parse from block content (authored)
    items = parseBlockContent(block);
  }

  if (items.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('Accordion: No items found');
    return;
  }

  // Build and set the HTML
  block.innerHTML = buildAccordionHTML(items, accordionId);

  // Setup event handlers
  setupAccordionHandlers(block);
}


