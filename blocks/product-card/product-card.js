/**
 * Product Card Block
 * Creates a product card component that can be loaded via loadBlock
 */

/**
 * Default configuration for product cards
 */
const DEFAULT_CONFIG = {
  compareLabel: 'Compare',
  buyNowText: 'Buy now',
  quickViewText: 'Quick view',
  showQuickView: true,
  estoreLabel: 'ASUS estore price',
  estoreTooltip: 'ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be available on estore and are for reference only.',
};

/**
 * Build product card HTML from product data
 * @param {Object} product - Product data object
 * @param {Object} config - Configuration options
 * @returns {string} - HTML string for the product card
 */
function buildProductCardHTML(product, config) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate badges HTML from productTags
  const badges = [...(product.productTags || [])];
  const hasInStock = badges.some((badge) => badge.toLowerCase() === 'in stock');
  if (!hasInStock) {
    badges.unshift('In Stock');
  }

  const badgesHTML = badges.map((badge) => {
    let badgeClass = 'cmp-product-card__status-item';
    const badgeLower = badge.toLowerCase();
    if (badgeLower === 'in stock') badgeClass += ' cmp-product-card__status--in-stock';
    else if (badgeLower === 'new') badgeClass += ' cmp-product-card__status--new';
    else if (badgeLower === 'deal') badgeClass += ' cmp-product-card__status--deal';
    else if (badgeLower === 'hot') badgeClass += ' cmp-product-card__status--hot';
    return `<span class="${badgeClass}">${badge}</span>`;
  }).join('');

  // Generate FPS tooltip HTML from gamePriority
  let fpsTooltipHTML = '';
  if (product.gamePriority && product.gamePriority.length > 0) {
    const fpsRows = product.gamePriority.map((detail) => {
      const game = detail.gameTitle || 'Unknown Game';
      const fps1080 = detail.fullHdFps || '--';
      const fps1440 = detail.quadHdFps || '--';

      return `
        <tr>
          <th scope="row">${game}</th>
          <td>${fps1080 !== '--' ? fps1080 : '--'}</td>
          <td>${fps1440 !== '--' ? fps1440 : '--'}</td>
        </tr>
      `;
    }).join('');

    fpsTooltipHTML = `
      <table class="cmp-product-card__fps-table">
        <thead>
          <tr>
            <th scope="col">Game FPS</th>
            <th scope="col">1080P</th>
            <th scope="col">1440P</th>
          </tr>
        </thead>
        <tbody>
          ${fpsRows}
        </tbody>
      </table>
    `;
  }

  // Check if screen size below 1280px for mobile aria-hidden
  const isMobile = window.innerWidth < 1280;

  // Determine product URL
  const productUrl = product.urlKey || './pdp.html';
  const productId = product.sku || product.id || 'unknown';

  // Generate specs HTML
  const specsHTML = (product.keySpec || []).map((spec) => `<li class="cmp-product-card__spec-item">${spec.name || spec}</li>`).join('');

  return `
    <div class="cmp-product-card__header">
      <div class="cmp-product-card__status">
        ${badgesHTML}
      </div>
    </div>

    <div class="cmp-product-card__body">
      <div class="cmp-product-card__image cmp-image">
        ${mergedConfig.showQuickView ? `<button class="cmp-product-card__preview-btn" data-product-id="${productId}" data-a11y-dialog-show="product-preview-dialog" aria-label="${mergedConfig.quickViewText} ${product.name}" ${isMobile ? 'aria-hidden="true"' : ''}>${mergedConfig.quickViewText}</button>` : ''}
        <img class="cmp-image__image" src="${product.mainImage}" alt="${product.name}" loading="lazy" decoding="async">
        ${product.hoverImage ? `<img class="cmp-image__image--hover" src="${product.hoverImage}" alt="${product.name}" aria-hidden="true" loading="lazy" decoding="async">` : ''}
      </div>

      <div class="cmp-product-card__info">
        <div class="cmp-product-card__title">
          <a href="${productUrl}" aria-label="Buy ${product.name}">${product.name}</a>
        </div>
        <p class="cmp-product-card__model">
          <a href="${productUrl}#product-features">${product.modelName || ''}</a>
        </p>
      </div>

      <div class="cmp-product-card__rating_and_compare">
        <div class="cmp-product-card__rating">
          <div
            data-bv-show="inline_rating"
            data-bv-product-id="${product.externalId || product.sku}"
            data-bv-redirect-url="${productUrl}#product-reviews"
          ></div>
        </div>
        <div class="cmp-product-card__compare">
          <input 
            type="checkbox" 
            class="cmp-product-card__compare-checkbox" 
            id="compare-${productId}"
            name="compare-${productId}"
            data-id="${productId}"
            data-name="${product.name}"
            data-model="${product.modelName || ''}"
            data-sku="${product.modelName || ''}"
            data-image="${product.mainImage}"
            data-pdp="${productUrl}"
            data-add-to-compare
            aria-label="Add ${product.name} to compare"
          />
          <label for="compare-${productId}" class="cmp-product-card__compare-label">${mergedConfig.compareLabel}</label>
        </div>
      </div>

      ${product.gameTitle && product.fps && fpsTooltipHTML ? `
        <div class="cmp-product-card__fps">
          <p class="cmp-product-card__fps-game">${product.gameTitle}</p>
          <button 
            class="cmp-product-card__fps-score" 
            data-tooltip-trigger 
            aria-describedby="fps-details-${productId}"
            data-tooltip-position="right"
            type="button"
          >
            FPS: ${product.fps}
          </button>
          <div id="fps-details-${productId}" class="tooltip__content" role="tooltip">${fpsTooltipHTML}</div>
        </div>
      ` : ''}

      <ul class="cmp-product-card__specs">
        ${specsHTML}
      </ul>

      <div class="cmp-product-card__estore">
        <div class="cmp-product-card__estore-line">
          <span class="cmp-product-card__estore-label">${mergedConfig.estoreLabel}</span>
          <div class="cmp-product-card__estore-icon-wrapper">
            <button class="cmp-product-card__estore-icon" data-tooltip-trigger aria-describedby="estore-price-info-${productId}" data-tooltip-position="y" aria-label="Information about ${mergedConfig.estoreLabel}">
              <span class="visually-hidden"></span>
            </button>
            <div class="cmp-product-card__tooltip tooltip__content" id="estore-price-info-${productId}" role="tooltip">
              ${mergedConfig.estoreTooltip}
            </div>
          </div>
        </div>
      </div>

      <div class="cmp-product-card__price-block" role="group">
        <span class="cmp-product-card__price" role="text" aria-label="Current price ${product.displayPrice || product.specialPrice || product.price}">${product.displayPrice || product.specialPrice || product.price}</span>
        ${product.displayRegularPrice && product.specialPrice ? `<span class="cmp-product-card__original-price" role="text" aria-label="Original price ${product.displayRegularPrice}">${product.displayRegularPrice}</span>` : ''}
        ${product.displaySavedPrice ? `<span class="cmp-product-card__discount" role="text" aria-label="Discount ${product.displaySavedPrice}">SAVE ${product.displaySavedPrice}</span>` : ''}
      </div>
    </div>

    <div class="cmp-product-card__footer">
      <button class="cmp-button cmp-product-card__buy-button btn">${product.buyButtonStatus || mergedConfig.buyNowText}</button>
    </div>
  `;
}

/**
 * Setup event listeners for the product card
 * @param {HTMLElement} block - The product card block element
 * @param {Object} product - Product data
 */
function setupEventListeners(block, product) {
  const productUrl = product.urlKey || './pdp.html';

  // Buy button click handler
  const buyBtn = block.querySelector('.cmp-product-card__buy-button');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      window.location.href = productUrl;
    });
  }

  // Quick view button - event handled by parent block that sets up the modal
}

/**
 * Update aria-hidden on preview buttons based on screen size
 */
function updatePreviewButtonsAriaHidden() {
  const isMobile = window.innerWidth < 1280;
  const productCards = document.querySelectorAll('.cmp-product-card');
  productCards.forEach((card) => {
    const previewBtn = card.querySelector('.cmp-product-card__preview-btn');
    if (previewBtn) {
      if (isMobile) {
        previewBtn.setAttribute('aria-hidden', 'true');
      } else {
        previewBtn.removeAttribute('aria-hidden');
      }
    }
  });
}

// Setup resize handler for aria-hidden on preview buttons
let resizeHandlerInitialized = false;
function initResizeHandler() {
  if (resizeHandlerInitialized) return;
  resizeHandlerInitialized = true;

  window.addEventListener('resize', updatePreviewButtonsAriaHidden);
}

/**
 * Decorate the product card block
 * Product data should be passed via data-product attribute (JSON string)
 * Config can be passed via data-config attribute (JSON string)
 */
export default async function decorate(block) {
  // Get product data from data attribute
  const productData = block.dataset.product;
  const configData = block.dataset.config;

  if (!productData) {
    // eslint-disable-next-line no-console
    console.warn('Product card: No product data provided');
    return;
  }

  try {
    const product = JSON.parse(productData);
    const config = configData ? JSON.parse(configData) : {};

    // Add the cmp-product-card class for styling
    block.classList.add('cmp-product-card');

    // Build and set the HTML
    block.innerHTML = buildProductCardHTML(product, config);

    // Setup event listeners
    setupEventListeners(block, product);

    // Initialize resize handler for aria-hidden updates
    initResizeHandler();

    // Clean up data attributes after use
    delete block.dataset.product;
    delete block.dataset.config;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Product card: Error parsing product data', error);
  }
}
