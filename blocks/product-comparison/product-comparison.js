import { fetchGameList, getApiEndpoint } from '../../scripts/api-service.js';
import { API_URIS } from '../../constants/api-constants.js';

const PRODUCT_LISTING_PAGE_URL = 'product-listing';
let AuthoredData = [];

/**
 * Main function to decorate and initialize the product comparison block.
 */
export default async function decorate(block) {

  await renderProductCompare(block);
  await loadProducts(true)

  setupBackButton();
  setupStickyHeader();
  syncScroll();

  initSwitch(block);
}

/**
 * Sets up the event listener for the back button to navigate to the product listing page.
 */
function setupBackButton() {
  const backButton = document.querySelector('#comparison-page-back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = PRODUCT_LISTING_PAGE_URL;
    });
  }
}

/**
 * Sets up an IntersectionObserver to make the floating product card container sticky when scrolling.
 */
function setupStickyHeader() {
  const mainContainer = document.querySelector('.product-comparison-card__container');
  const floatingContainer = document.querySelector('.product-comparison-floating-card__container-wrapper');
  const scrollable = document.querySelector('.scrollable-component');
  const floating = document.querySelector('.product-comparison-floating-card__container');
  const footer = document.querySelector('footer');

  if (!mainContainer || !floatingContainer || !scrollable || !floating || !footer) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      const isSticky = entry.boundingClientRect.bottom < 0 && footer.getBoundingClientRect().top > 250;
      floatingContainer.classList.toggle('sticky', isSticky);
      if (isSticky) {
        floating.scrollLeft = scrollable.scrollLeft;
      }
    },
    { threshold: [0, 1] }
  );

  observer.observe(mainContainer);
}

/**
 * Synchronizes the horizontal scroll position between the main scrollable component and the floating header.
 */
function syncScroll() {
  const scrollable = document.querySelector('.scrollable-component');
  const floating = document.querySelector('.product-comparison-floating-card__container');

  if (!scrollable || !floating) return;

  let isSyncing = false;

  const sync = (source, target) => () => {
    if (isSyncing) return;
    isSyncing = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => { isSyncing = false; });
  };

  scrollable.addEventListener('scroll', sync(scrollable, floating));
  floating.addEventListener('scroll', sync(floating, scrollable));
}

/**
 * Escapes special HTML characters in a string to prevent XSS.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders the initial HTML structure for the product comparison component.
 * @param {HTMLElement} block The block element to populate.
 */
async function renderProductCompare(block) {
  const productCompareContainer = document.createElement('div');
  productCompareContainer.className = 'product-comparison-page';

  const authoredRows = [...block.children];
  AuthoredData = authoredRows.map(row => row.textContent.trim());

  const html = `
  <div class="product-comparison-page light-mode">
    <div class="product-comparison-component-wrapper">

    <div class="header-component-wrapper">
      <div class="container header-container flex justify-between items-center">
          <div class="internal-container flex justify-between items-center">
              <button class="btn btn-link btn-sm back-button" id="comparison-page-back-button"
                  aria-label="Go back to previous page">
                  <span class="icon icon--arrow-left" aria-hidden="true"></span>
                  <span class="back-button-text">${AuthoredData[1] || 'Back'}</span>
              </button>
              <div class="vertical-divider" aria-hidden="true"></div>
              
          
              <div class="section-heading content-center">
                <div class="section-heading__text-group">
                  <h2 class="section-heading__title">${AuthoredData[0] || 'Product comparison'}</h2>
                </div>
              </div>


              </div>

              <div class="section-heading content-center">
                <div class="section-heading__text-group">
                  <h2 class="section-heading__title">${AuthoredData[0] || 'Product comparison'}</h2>
                </div>
              </div>
              
          <div class="clear-all-action-container">
              <span><span id="comparison-products-count" aria-live="polite"></span>/4</span>
              <button class="clear-all-button btn btn-link" aria-label="Clear all selected products">
                  ${AuthoredData[2] || 'Clear All'}
              </button>
          </div>
      </div>
      <div class="product-comparison-floating-card__container-wrapper">
          <div class="product-comparison-floating-card__container container product-comparison-grid">
          </div>
      </div>
  </div>
  <div class="scrollable-component" role="region" aria-label="Product comparison details">
      <div class="product-comparison-card__container product-comparison-grid" id="product-comparison-card__container">
      </div>
      <div class="switch-container no-differences flex" id="switch-container">    
            <div role="switch" aria-checked="false" tabindex="0">
                <span class="label">${AuthoredData[6] || 'Show me the differences'}</span>
                <span class="switch"><span></span></span>
            </div>
              <div class="info-tooltip-wrapper">
                  <button data-tooltip-trigger aria-describedby="highlight-tooltip" data-tooltip-position="bottom"
                      class="btn btn-link" aria-label="Highlight differences information">
                      <span class="icon icon--info"></span>
                  </button>
                  <div id="highlight-tooltip"
                      class="tooltip__content tooltip__content--theme-dark tooltip__content--size-small"
                      role="tooltip">
                      Highlight Differences is unavailable because all products have identical specifications.
                  </div>
              </div>
      </div>

      <div class="product-comparison-table">
          <div class="product-comparison-table-rows" id="product-comparison-table-rows"></div>
      </div>

      <div class="trailing-action-buttons-wrapper product-comparison-grid" id="trailing-action-buttons-wrapper"></div>
  </div>
  </div>
  </div>
`;

  productCompareContainer.innerHTML = html;

  // Replace in DOM
  block.replaceChildren(...productCompareContainer.children);

}

let products = [];

/**
 * Retrieves stored product IDs from localStorage.
 */
function getStoredProducts() {
  try {
    let localStorageData = JSON.parse(localStorage.getItem('compare-products')).map((product) => product.id).join(',') || '';
    return localStorageData;
  } catch {
    return [];
  }
}

/**
 * Builds the API payload with product part numbers to fetch comparison data.
 */
function _buildApiPayload() {
  const path = window.location.href.includes('/en/') ? 'us' : 'en';
  return {
    'websiteCode': path || 'en',
    'partNo': getStoredProducts() || ''
  };
}
/**
 * Transforms a single specification from the API response into a structured object.
 */
function _transformSpec(spec) {
  const value = spec.descriptionText.includes('<br>')
    ? spec.descriptionText.split('<br>').map((s) => s.trim())
    : spec.descriptionText;

  return {
    key: spec.displayField.toLowerCase().replace(/\s+/g, '-'),
    label: spec.displayField,
    value,
  };
}

/**
 * Transforms a product object from the API response into a standardized format for the component.
 */
function _transformProduct(product) {
  const specs = product.spec_Content.map(_transformSpec);

  return {
    id: product.partNo,
    bazaarvoiceProductId: `ASUS_M1_${product.m1Id}_P`,
    name: product.mktName.trim(),
    model: product.skuName,
    isBuyable: true, // Assuming default, not in new API response
    isCustomizable: true, // Assuming default, not in new API response
    buyLink: product.skuUrl,
    customizeLink: product.skuUrl,
    image: product.skuImg,
    specs,
  };
}

/**
 * Fetches product data from the comparison API endpoint.
 */
async function fetchProducts() {
  try {
    const endpoint = await getApiEndpoint(API_URIS.PRODUCT_COMPARISON_PAGE);
    const response = await fetchGameList(endpoint, 'POST', _buildApiPayload(), 'formData');

    if (response?.result?.[0]?.skus) {
      return response.result[0].skus.map(_transformProduct);
    }
    return [];
  } catch (err) {
    console.error('Error loading products:', err);
    return [];
  }
}

/**
 * Renders the appropriate action button (Customize, Buy Now, or Notify Me) for a product card.
 */
function renderProductCardButton(product) {
  const {
    isBuyable, isCustomizable, name, buyLink, customizeLink,
  } = product;

  if (isBuyable && isCustomizable) {
    return `<a href='${customizeLink}#product-customization' class="btn btn-sm" aria-label="${AuthoredData[5] || 'Customize'} ${name}">${AuthoredData[5] || 'Customize'}</a>`;
  }
  if (isBuyable && !isCustomizable) {
    return `<a href='${buyLink}' class="btn btn-sm" aria-label="Buy ${name} now">${AuthoredData[4] || 'Buy Now'}</a>`;
  }
  return `<button class="btn btn-sm" aria-label="Notify me ${name}">Notify Me</button>`;
}

/**
 * Renders the HTML for a single product card in the main comparison grid.
 */
function renderComparisonProductCard(product) {
  const {
    id,
    name,
    model,
    bazaarvoiceProductId,
    image,
    price,
    originalPrice,
    discount,
  } = product;

  return `
    <div class="comparison-product-card comparison-product-card-item" data-id="${id}" role="group"">
      <div class="comparison-product-card__image-container">
        <button class="btn btn-link close-button" aria-label="Remove ${name} from comparison" data-id="${id}">
          <span class="icon icon--close"></span>
        </button>
        <img class="comparison-product-card__image" loading="lazy" src="${image}" alt="Image of ${name}" fetchpriority=high />
      </div>
      <div class="comparison-product-card__info flex">
        <div class="comparison-product-card__info-container flex">
          <a href="pdp.html" class="comparison-product-card__title">${name}</a>
          <a href="pdp.html#product-features" class="comparison-product-card__model">${model}</a>
          <div class="comparison-product-card__rating">
            <div
            data-bv-show="inline_rating"
            data-bv-product-id="${bazaarvoiceProductId}"
            data-bv-redirect-url="pdp.html#product-reviews"
            ></div>
          </div>
        </div>
        <div class="comparison-product-card__price-container">
          <p class="comparison-product-card__price text-bolder">$${price || '0'}</p>
          <div class="discount-wrapper flex">
            ${originalPrice ? `<span class="comparison-product-card__original-price">$${originalPrice || '0'}</span>` : ''}
            ${discount ? `<span class="comparison-product-card__discount">SAVE $${discount || '0'}</span>` : ''}
          </div>
        </div>
      </div>
      ${renderProductCardButton(product)}
    </div>
  `;
}

/**
 * Renders the HTML for a single product card in the sticky floating header.
 */
function renderFloatingCard(product) {
  const {
    id, name, bazaarvoiceProductId, image, price, buyLink,
  } = product;
  const safeName = escapeHtml(name);
  return `
    <div class="product-comparison-floating-card comparison-product-card-item" data-id="${id}">
    <button class="close-button-floating-card" aria-label="Remove ${safeName} from comparison" data-id="${id}">
        <span class="icon icon--close"></span>
    </button>
        <div class="floating-card-body flex">
          <div class="img-wrapper">
            <img src="${image}" alt="${safeName}" loading="lazy" fetchpriority="high" tabindex="0" aria-label="${safeName} product">
          </div>
            <div class="floating-card-info flex">
                <small class="floating-card__title ">
                    <a href="${buyLink}">${safeName}</a>
                </small>
                <div
                    data-bv-show="inline_rating" data-bv-product-id="${bazaarvoiceProductId}" data-bv-redirect-url="${buyLink}#product-reviews"
                ></div>
                <small class="floating-card__price">$${price || '0'}</small>
            </div>
        </div>
    </div>
  `;
}

/**
 * Renders the HTML for an empty card slot, prompting the user to add a product.
 */
function renderEmptyCard() {
  return `
    <div class="comparison-product-card comparison-product-card-item">
        <a href="${PRODUCT_LISTING_PAGE_URL}" aria-label="Add a product to compare" class="comparison-product-card__empty-container">
            <div class="empty-container-contents">
                <span class="icon-wrapper"><span class="icon icon--plus-white" aria-hidden="true"></span></span>
                <p>${AuthoredData[3] || 'Add to compare'}</p>
            </div>
        </a>
    </div>
  `;
}

/**
 * Renders the HTML for an empty card slot in the floating header.
 */
function renderEmptyFloatingCard() {
  return `
    <a href="${PRODUCT_LISTING_PAGE_URL}" class="product-comparison-floating-card comparison-product-card-item">
        <div class="empty-floating-card-contents flex">
          <span class="icon-wrapper"><span class="icon icon--plus-white"></span></span>
          <small>${AuthoredData[3] || 'Add to compare'}</small>
        </div>
    </a>
  `;
}

/**
 * Renders the "Competitive Advantage" highlight for a specific specification row if one exists.
 */
function renderCompetitiveAdvantage(key, products) {
  const allSpecs = products.map((p) => p.specs.find((s) => s.key === key));

  if (!allSpecs.some((spec) => spec?.highlight)) {
    return '';
  }

  return allSpecs
    .map((spec) => {
      const content = spec?.highlight
        ? `<p class="highlight">${spec.highlight}</p>`
        : '<p>-</p>';
      return `<div class="comparison-product-card-item">${content}</div>`;
    })
    .join('');
}

/**
 * Renders a single cell within a specification row, handling different data types like colors.
 */
function renderSpecCell(spec) {
  if (!spec) {
    return '<div class="table-cell comparison-product-card-item"><span>-</span></div>';
  }

  let content;
  let extraClasses = '';

  if (spec.key === 'color') {
    content = `<span class="color-block" style="background-color:${spec.value}"></span><span>${spec.value}</span>`;
    extraClasses = ' flex';
  } else if (Array.isArray(spec.value)) {
    content = spec.value.map((v) => `<span>${escapeHtml(v)}</span>`).join('');
  } else {
    content = `<span>${escapeHtml(spec.value)}</span>`;
  }

  return `<div class="table-cell comparison-product-card-item${extraClasses}">${content}</div>`;
}

/**
 * Renders a full specification row in the comparison table, including the label and all product values.
 */
function renderComparisonRow(label, key, products) {
  const advantageData = renderCompetitiveAdvantage(key, products);
  const allSpecs = products.map((p) => p.specs.find((s) => s.key === key));
  const specData = allSpecs.map(renderSpecCell).join('');

  return `<h3 tabindex="0" class="product-comparison-row-title">${label}</h3>
    <div id="${key}" class="product-comparison-row flex">
      <div class="product-row-info product-comparison-grid">
        ${specData}
      </div>
      ${advantageData
      ? `<div class="product-comparison-grid">
              ${advantageData}
            </div>`
      : ''
    }
    </div>
  `;
}

/**
 * Renders the trailing action buttons at the bottom of the comparison table for each product.
 */
function renderTrailingActionButtons(product) {
  return `
    <div class="trailing-action-buttons comparison-product-card-item">
      ${renderProductCardButton(product)}
    </div>
  `;
}

/**
 * Renders the side navigation bullets and the hover panel for quick navigation between spec rows.
 */
function renderNavigationBullets(rows) {
  const pagePath = window.location.pathname;

  const bulletsHtml = rows
    .map(
      (row) => `
        <a href="${pagePath}#${row.key}" class="navigation-bullet" aria-label="Go to ${row.label} section">
          <span class="navigation-bullet-dot"></span>
          <span class="navigation-bullet-label">${row.label}</span>
        </a>
      `,
    )
    .join('');

  const hoverItemsHtml = rows
    .map(
      (row) => `
        <a href="${pagePath}#${row.key}" class="navigation-hover-item" data-key="${row.key}" aria-label="Go to ${row.label} section">
          <span class="navigation-hover-label">${row.label}</span>
        </a>
      `,
    )
    .join('');

  return `
    <nav class="page-navigation hidden flex">${bulletsHtml}</nav>
    <div class="page-navigation-hover-panel hidden">${hoverItemsHtml}</div>
  `;
}

/**
 * Extracts a unique list of all specifications from an array of products.
 */
function getAllSpecs(products) {
  const allSpecs = products.flatMap((product) => product.specs);

  const specMap = new Map();
  allSpecs.forEach((spec) => {
    if (!specMap.has(spec.key)) {
      specMap.set(spec.key, spec.label);
    }
  });
  return Array.from(specMap.entries()).map(([key, label]) => ({ key, label }));
}

/**
 * Loads product data and triggers the rendering of the entire comparison view.
 */
async function loadProducts(initial = false) {
  const container = document.querySelector('.product-comparison-card__container');
  if (!container) return;
  const floatingContainer = document.querySelector('.product-comparison-floating-card__container');
  const count = document.getElementById('comparison-products-count');
  const table = document.querySelector('.product-comparison-table-rows');
  const actionsContainer = document.querySelector('.trailing-action-buttons-wrapper');
  if (initial) {
    products = await fetchProducts();
  }

  container.innerHTML = '';
  floatingContainer.innerHTML = '';
  actionsContainer.innerHTML = '';
  table.innerHTML = '';
  products.forEach((product) => {
    container.insertAdjacentHTML('beforeend', renderComparisonProductCard(product));
    floatingContainer.insertAdjacentHTML('beforeend', renderFloatingCard(product));
    actionsContainer.insertAdjacentHTML('beforeend', renderTrailingActionButtons(product));
  });

  const switchContainer = document.querySelector('#switch-container');
  const floatingCards = floatingContainer.querySelectorAll('.product-comparison-floating-card');

  if (switchContainer) {
    if (floatingCards.length <= 1) {
      switchContainer.style.display = 'none';
    } else {
      switchContainer.style.display = '';
    }
  }

  for (let i = products.length; i < 4; i++) {
    container.insertAdjacentHTML('beforeend', renderEmptyCard());
    floatingContainer.insertAdjacentHTML('beforeend', renderEmptyFloatingCard());
  }

  if (products.length > 0) {
    const rows = getAllSpecs(products);

    // Switch toggle
    table.insertAdjacentHTML('beforebegin', renderNavigationBullets(rows));

    // Rows
    rows.forEach((row) => {
      table.insertAdjacentHTML('beforeend', renderComparisonRow(row.label, row.key, products));
    });
  }

  const headerOffset = 150;
  const bulletsContainer = document.querySelector('.page-navigation');
  const bullets = document.querySelectorAll('.navigation-bullet');
  const rows = document.querySelectorAll('.product-comparison-row');
  const hoverPanel = document.querySelector('.page-navigation-hover-panel');
  const hoverItems = document.querySelectorAll('.navigation-hover-item');

  // Handle hover panel visibility - trigger on bullet hover
  if (bulletsContainer && hoverPanel && bullets.length > 0) {
    let hoverTimeout;

    const showHoverPanel = () => {
      clearTimeout(hoverTimeout);
      hoverPanel.classList.remove('hidden');
      bulletsContainer.classList.add('hide-bullets');
    };

    const hideHoverPanel = () => {
      hoverTimeout = setTimeout(() => {
        hoverPanel.classList.add('hidden');
        bulletsContainer.classList.remove('hide-bullets');
      }, 200);
    };

    // Trigger on individual bullet hover
    bullets.forEach((bullet) => {
      bullet.addEventListener('mouseenter', showHoverPanel);
      bullet.addEventListener('mouseleave', hideHoverPanel);
    });

    // Keep panel visible when hovering over it
    hoverPanel.addEventListener('mouseenter', showHoverPanel);
    hoverPanel.addEventListener('mouseleave', hideHoverPanel);
  }

  window.addEventListener('scroll', () => {
    if (!bulletsContainer) return;
    let currentId = '';
    rows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      if (rect.top <= headerOffset && rect.bottom > headerOffset) {
        currentId = row.id;
      }
    });

    // removing 'selected' from all bullets first
    bullets.forEach((bullet) => bullet.classList.remove('selected'));
    if (hoverItems.length > 0) {
      hoverItems.forEach((item) => item.classList.remove('selected'));
    }

    if (currentId) {
      const bullet = document.querySelector(`.navigation-bullet[href$="#${currentId}"]`);
      const hoverItem = document.querySelector(`.navigation-hover-item[data-key="${currentId}"]`);
      if (bullet) bullet.classList.add('selected');
      if (hoverItem) hoverItem.classList.add('selected');
      bulletsContainer.classList.remove('hidden');
      // Don't automatically show hover panel - only show on hover
    } else {
      bulletsContainer.classList.add('hidden');
    }
  });

  count.innerHTML = products.length;

  // attach event listeners for close buttons
  document.addEventListener('click', (e) => {
    if (
      e.target.classList.contains('close-button') ||
      e.target.classList.contains('close-button-floating-card')
    ) {
      const id = e.target.dataset.id;
      products = products.filter((p) => p.id !== id);
      loadProducts();
    }
  });

  document.querySelectorAll('.close-button-floating-card').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      products = products.filter((p) => p.id !== id);
      loadProducts();
    });
  });
  const clearAllButton = document.querySelector('.clear-all-button');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', () => {
      products = [];
      loadProducts();
    });
  }

  checkDifferences();
}

/**
 * Highlights comparison rows where product specifications are different.
 */
function highlightDifferences() {
  document.querySelectorAll('.product-comparison-row').forEach((row) => {
    const values = Array.from(row.querySelectorAll('.table-cell'), (c) => c.textContent.trim());

    const allSame = values.every((v) => v === values[0]);
    row.classList.toggle('different-row', !allSame);
  });
}

/**
 * Checks if there are any differences between products and toggles the visibility of the "Show differences" switch.
 */
function checkDifferences() {
  const rows = document.querySelectorAll('.product-comparison-row');
  const hasDifferences = Array.from(rows).some((row) => {
    const values = Array.from(row.querySelectorAll('.table-cell'), (c) => c.textContent.trim());
    const allSame = values.every((v) => v === values[0]);
    return !allSame;
  });

  const switchContainer = document.querySelector('#switch-container');
  if (switchContainer) {
    switchContainer.classList.toggle('no-differences', !hasDifferences);
  }
}

/**
 * Removes the "different-row" class from all comparison rows.
 */
function clearDifferences() {
  document.querySelectorAll('.product-comparison-row').forEach((row) => row.classList.remove('different-row'));
}

/**
 * A class to manage the state and behavior of the "Show differences" switch.
 */
class Switch {
  constructor(domNode) {
    this.switchNode = domNode;
    this.switchNode.addEventListener('click', () => this.toggleStatus());
    this.switchNode.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  /**
   * Handles keyboard events for accessibility, allowing the switch to be toggled with Enter or Space.
   */
  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleStatus();
    }
  }

  /**
   * Toggles the checked state of the switch and calls the appropriate function to show or hide differences.
   */
  toggleStatus() {
    const isChecked = this.switchNode.getAttribute('aria-checked') !== 'true';
    this.switchNode.setAttribute('aria-checked', isChecked);
    (isChecked ? highlightDifferences : clearDifferences)();
  }
}

/**
 * Initializes all switch components on the page.
 */
const initSwitch = async (context) => {
  // Select all elements marked with the data attribute
  Array.from(context.querySelectorAll('[role=switch]')).forEach((element) => new Switch(element));
};