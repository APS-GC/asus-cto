import { AppConfig } from '../../appConfig';
import { fetchData } from './_api';
import { allowedProductRenderTypes } from './_helpers';

/**
 * Renders the HTML markup for a single product card using the provided product data.
 * This function generates a self-contained card component with all necessary details,
 * including status, imagery, rating, specs, and pricing.
 *
 * @param {object} product - The product data object.
 * @returns {string} The complete HTML string for the product card.
 */
function renderProductCard(product, productType) {
  const {
    id = '',
    bazaarvoiceProductId = '',
    name = '',
    model = '',
    isAvailable = false,
    isCustomizable = false,
    customizeLink = '#',
    buyLink = '#',
    image = './clientlib-site/images/product-placeholder.webp',
    imageHover = '',
    status = [],
    bundleMessage = '',
    benchmarkGame = '',
    fps = 0,
    fpsData = [],
    specs = [],
    price = 'N/A',
    originalPrice = '',
    discount = '',
    estorePriceTooltipText = '',
  } = product;

  // Generate HTML for status badges. Handles multiple statuses and converts them to CSS-friendly class names.
  const statusHtml = status
    .map(
      (s) =>
        `<span class="cmp-product-card__status-item cmp-product-card__status--${s
          .toLowerCase()
          .replace(' ', '-')}">${s}</span>`,
    )
    .join('');

  // Generate HTML for the list of product specifications.
  const specsHtml = specs
    .map((spec) => `<li class="cmp-product-card__spec-item">${spec}</li>`)
    .join('');

  // Generate HTML table rows for the FPS details tooltip.
  const fpsDetailsHtml = fpsData
    .map(
      (detail) => `
        <tr>
            <th scope="row">${detail.game}</th>
            <td>${detail.fps1080 ?? '--'}</td>
            <td>${detail.fps1440 ?? '--'}</td>
        </tr>
    `,
    )
    .join('');

  /**
   * Generate HTML for the product actions.
   * The logic is as follows: (This is the mock logic. It needs to be changed based on the actual data)
   * - If the product is available and can be customized, show a "Customize" button.
   * - If the product is available and can not be customized, show a "Buy now" button.
   * - If the product is not available, show a "Notify me" button.
   */

  // Update global products array
  if (!window.allProducts) {
    window.allProducts = new Map();
  }

  if (allowedProductRenderTypes.includes(productType)) {
    if (!window.allProducts.has(productType)) {
      window.allProducts.set(productType, new Map());
    }
    window.allProducts.get(productType).set(product.id, product);
  }

  // Return the complete HTML structure for the product card using a template literal.
  return `
        <div class="cmp-product-card">
          <div class="cmp-product-card__header">
            <div class="cmp-product-card__status">${statusHtml}</div>
            ${bundleMessage ? `<div class="cmp-product-card__bundle-message">${bundleMessage}</div>` : ''}
          </div>
          <div class="cmp-product-card__body">
            <div class="cmp-product-card__image cmp-image">
              <button
                class="cmp-product-card__preview-btn"
                data-product-id="${id}"
                data-product-type="${productType}"
                data-a11y-dialog-show="product-preview-dialog"
                aria-label="Quick view ${name}"
              >Quick view</button>
              <img class="cmp-image__image" src="${image}" alt="${name}" />
              ${
                // Conditionally render the hover image only if it exists.
                imageHover
                  ? `<img class="cmp-image__image--hover" src="${imageHover}" alt="${name}" aria-hidden="true" />`
                  : ''
              }
            </div>
            <div class="cmp-product-card__info">
              <div class="cmp-product-card__title">
                <a href="${customizeLink ?? buyLink}" aria-label="Buy ${name}">${name}</a>
              </div>
              <p class="cmp-product-card__model">
                <a href="${customizeLink ?? buyLink}#product-features">${model}</a>
              </p>
            </div>
            <div class="cmp-product-card__rating_and_compare">
              <div class="cmp-product-card__rating">
                <div
                  data-bv-show="inline_rating"
                  data-bv-product-id="${bazaarvoiceProductId}"
                  data-bv-redirect-url="${customizeLink ?? buyLink}#product-reviews"
                ></div>
              </div>
              <div class="cmp-product-card__compare">
                <input
                  type="checkbox"
                  class="cmp-product-card__compare-checkbox"
                  nameFv="compare-${id}"
                  id="compare-${id}"
                  name="compare-${id}"
                  data-id="${id}"
                  data-name="${name}"
                  data-model="${model}"
                  data-sku="${model}"
                  data-image="${image}"
                  data-pdp="/product-detail/${id}"
                  data-add-to-compare
                />
                <label for="compare-${id}" class="cmp-product-card__compare-label" aria-label="Add ${name} to compare">Compare</label>
              </div>
            </div>
            <div class="cmp-product-card__fps">
              <p class="cmp-product-card__fps-game">${benchmarkGame}</p>
              <button
                class="cmp-product-card__fps-score"
                data-tooltip-trigger
                aria-describedby="fps-details-${id}"
                data-tooltip-position="right"
              >FPS: ${fps}</button>
              <div id="fps-details-${id}" class="tooltip__content" role="tooltip">
                <table class="cmp-product-card__fps-table">
                  <thead><tr><th scope="col">Game FPS</th><th scope="col">1080P</th><th scope="col">1440P</th></tr></thead>
                  <tbody>${fpsDetailsHtml}</tbody>
                </table>
              </div>
            </div>
            <ul class="cmp-product-card__specs">${specsHtml}</ul>
            <div class="cmp-product-card__estore">
              <div class="cmp-product-card__estore-line">
                <span class="cmp-product-card__estore-label">ASUS estore price</span>
                <div class="cmp-product-card__estore-icon-wrapper">
                  <button
                    class="cmp-product-card__estore-icon"
                    data-tooltip-trigger
                    aria-describedby="estore-price-info-${id}"
                    data-tooltip-position="y"
                    aria-label="Information about ASUS estore price"
                  >
                  </button>
                  <div
                    class="cmp-product-card__tooltip
                    tooltip__content"
                    id="estore-price-info-${id}"
                    role="tooltip"
                  >${estorePriceTooltipText}</div>
                </div>
              </div>
            </div>
            <div class="cmp-product-card__price-block" role="group"
            aria-label="Current price $${price} ${originalPrice ? `, Original price $${originalPrice},` : ''} ${discount ? `Save $${discount}` : ''}">
              <span class="cmp-product-card__price" aria-hidden="true">$${price}</span>
              ${
                originalPrice
                  ? `<span class="cmp-product-card__original-price" aria-hidden="true">$${originalPrice}</span>`
                  : ''
              }
              ${discount ? `<span class="cmp-product-card__discount" aria-hidden="true">SAVE $${discount}</span>` : ''}
            </div>
          </div>
          <div class="cmp-product-card__footer">
            ${prepareProductAction(name, isAvailable, isCustomizable, buyLink, customizeLink)}
          </div>
        </div>
      `;
}

function prepareProductAction(productName, isAvailable, isCustomizable, buyLink, customizeLink) {
  let productActionsHtml = '';

  if (isAvailable && !isCustomizable) {
    productActionsHtml = `<a class="btn" href="${buyLink}" aria-label="Buy now ${productName}">Buy now</a>`;
  }

  if (isAvailable && isCustomizable) {
    productActionsHtml = `<a class="btn" href="${customizeLink}#product-customization"  aria-label="Customize ${productName}">Customize</a>`;
  }

  if (!isAvailable) {
    productActionsHtml = `<button class="btn"  aria-label="Notify me about ${productName}">Notify me</button>`;
  }

  return productActionsHtml;
}

/**
 * Asynchronously fetches product data based on the component's configuration,
 * renders each product into a card, and appends them to the designated container.
 * @param {HTMLElement} carouselElement - The carousel container element.
 */
async function loadProducts(carouselElement) {
  const productType = carouselElement.dataset.productType;
  const contentContainer = carouselElement.querySelector('.cmp-carousel__content');
  const actionsContainer = carouselElement.parentElement.querySelector(
    '.section-actions-container',
  );

  if (!productType || !contentContainer) {
    console.error(
      'Carousel is not configured correctly. Missing data-product-type or content container.',
    );
    return;
  }

  let endpoint = '';
  switch (productType) {
    case 'hot':
      endpoint = AppConfig.apiEndPoint.hotProducts;
      break;
    case 'related':
      endpoint = AppConfig.apiEndPoint.relatedProducts;
      break;
    case 'new':
      endpoint = AppConfig.apiEndPoint.newProducts;
      break;
    default:
      console.warn(`Unknown product type: ${productType}`);
      return;
  }

  try {
    actionsContainer?.classList.add('is-loading');
    const products = await fetchData(endpoint);

    products.forEach((product) => {
      const cardHtml = renderProductCard(product, productType);
      const carouselItem = document.createElement('div');
      carouselItem.className = 'cmp-carousel__item';
      carouselItem.innerHTML = cardHtml;
      contentContainer.appendChild(carouselItem);
    });

    if (window.initializeSwiperOnAEMCarousel) {
      window.initializeSwiperOnAEMCarousel(carouselElement.closest('.carousel'));
    }
  } catch (error) {
    console.error(`Failed to load ${productType} products:`, error);
  } finally {
    actionsContainer?.classList.remove('is-loading');
  }
}

/**
 * Initializes all product carousels on the page that have a data-product-type attribute.
 */
function initializeProductCarousels() {
  const productCarousels = document.querySelectorAll('[data-product-type]');
  productCarousels.forEach(loadProducts);
}

document.addEventListener('DOMContentLoaded', initializeProductCarousels);
window.renderProductCard = renderProductCard;
