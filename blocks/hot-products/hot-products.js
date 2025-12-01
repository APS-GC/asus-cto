import { fetchHotProducts } from '../../scripts/api-service.js';
import { loadBazaarvoiceScript, loadSwiper } from '../../scripts/scripts.js';
import { openModal } from '../modal/modal.js';
import { getBlockConfigs } from '../../scripts/configs.js';

// Create product card HTML matching AEM component structure
function createProductCard(product, config) {
  const card = document.createElement('div');
  card.className = 'cmp-product-card';

  // Generate badges HTML from productTags
  const badges = product.productTags || [];
  const hasInStock = badges.some(badge => badge.toLowerCase() === 'in stock');
  if (!hasInStock) {
    badges.unshift('In Stock');
  }

  const badgesHTML = badges.map(badge => {
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
    const fpsRows = product.gamePriority.map(detail => {
      const game = detail.gameTitle || 'Unknown Game';
      const fps1080 = detail.fullHdFps || '--';
      const fps1440 = detail.quadHdFps || '--';

      return `
        <tr>
          <td>${game}</td>
          <td>${fps1080 !== '--' ? fps1080 : '--'}</td>
          <td>${fps1440 !== '--' ? fps1440 : '--'}</td>
        </tr>
      `;
    }).join('');

    fpsTooltipHTML = `
      <table class="cmp-product-card__fps-table">
        <thead>
          <tr>
            <th>Game FPS</th>
            <th>1080P</th>
            <th>1440P</th>
          </tr>
        </thead>
        <tbody>
          ${fpsRows}
        </tbody>
      </table>
    `;
  }

  // Determine product URL
  const productUrl = product.urlKey || './pdp.html';
  const productId = product.sku || product.id || 'unknown';

  card.innerHTML = `
    <div class="cmp-product-card__header">
      <div class="cmp-product-card__status">
        ${badgesHTML}
      </div>
    </div>

    <div class="cmp-product-card__body">
      <div class="cmp-product-card__image cmp-image">
        <button class="cmp-product-card__preview-btn" data-product-id="${productId}" data-product-type="hot" data-a11y-dialog-show="product-preview-dialog" aria-label="${config.quickViewText} ${product.name}">${config.quickViewText}</button>
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
            namefv="compare-${productId}"
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
          <label for="compare-${productId}" class="cmp-product-card__compare-label">${config.compareLabel}</label>
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
        ${(product.keySpec || []).map(spec => `<li class="cmp-product-card__spec-item">${spec.name || spec}</li>`).join('')}
      </ul>

      <div class="cmp-product-card__estore">
        <div class="cmp-product-card__estore-line">
          <span class="cmp-product-card__estore-label">${config.estoreLabel}</span>
          <div class="cmp-product-card__estore-icon-wrapper">
            <button class="cmp-product-card__estore-icon" data-tooltip-trigger aria-describedby="estore-price-info-${productId}" data-tooltip-position="top" aria-label="Information about ${config.estoreLabel}">
              <span class="visually-hidden"></span>
            </button>
            <div class="cmp-product-card__tooltip tooltip__content" id="estore-price-info-${productId}" role="tooltip">
              ${config.estoreTooltip}
            </div>
          </div>
        </div>
      </div>

      <div class="cmp-product-card__price-block" aria-label="Current price $${product.specialPrice || product.price}${product.specialPrice && product.price ? `, Original price $${product.price}, save $${product.savedPrice || ''}` : ''}">
        <span class="cmp-product-card__price">$${product.specialPrice || product.price}</span>
        ${product.specialPrice && product.price ? `<span class="cmp-product-card__original-price">$${product.price}</span>` : ''}
        ${product.savedPrice ? `<span class="cmp-product-card__discount">SAVE $${product.savedPrice}</span>` : ''}
      </div>
    </div>

    <div class="cmp-product-card__footer">
      <button class="cmp-button cmp-product-card__buy-button btn">${config.buyNowText}</button>
    </div>
  `;

  return card;
}

// Default configuration
const DEFAULT_CONFIG = {
  title: 'Hot Products',
  productsToShow: 3,
  compareLabel: 'Compare',
  buyNowText: 'Buy now',
  quickViewText: 'Quick view',
  estoreLabel: 'ASUS estore price',
  estoreTooltip: 'ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be available on estore and are for reference only.',
  viewAllText: 'View all',
  viewAllLink: '#',
  openLinkInNewTab: false,
  productPreviewModalPath: '/content/asus-cto/language-master/en/modals/product-preview'
};

// Handle quick view button click
async function handleQuickView(product, config) {
  // Store product data temporarily for the product-preview block to access
  window.__productPreviewData = product;

  // Get modal path from config
  const modalPath = config.productPreviewModalPath || '/modals/product-preview';

  // Open modal with the authored page, dialog ID, and classes
  await openModal(
    modalPath,
    true,                           // is modal
    'product-preview-dialog',       // dialog ID
    ['cmp-product-preview', 'light-mode']  // classes
  );
}

export default async function decorate(block) {
  const config = await getBlockConfigs(block, DEFAULT_CONFIG, 'hot-products');

  const carouselId = `carousel-${Math.random().toString(36).substr(2, 10)}`;

  // Create the structure matching the target HTML
  const mockupContainer = document.createRange().createContextualFragment(`
    <div class="carousel panelcontainer">
      <div class="section-heading">
        <div class="section-heading__text-group">
          <h2 class="section-heading__title">${config.title}</h2>
        </div>
        <div class="section-heading__action-buttons cmp-carousel__actions">
          <button class="cmp-carousel__action cmp-carousel__action--previous cmp-carousel__action--disabled" disabled="" tabindex="-1" aria-label="Previous slide" aria-disabled="true">
            <span class="sr-only">Previous Button</span>
          </button>
          <button class="cmp-carousel__action cmp-carousel__action--next cmp-carousel__action--disabled" tabindex="-1" aria-label="Next slide" aria-disabled="true" disabled="">
            <span class="sr-only">Next Button</span>
          </button>
        </div>
      </div>

      <div 
        id="${carouselId}" 
        class="cmp-carousel" 
        role="group" 
        aria-live="off" 
        aria-roledescription="carousel"
        data-placeholder-text="false"
        data-slides-per-view="1"
        data-slides-per-view-tablet="2.3"
        data-slides-per-view-desktop="${config.productsToShow}"
        data-loop-slides="false"
        data-init="false"
        data-product-type="hot"
      >
        <div class="cmp-carousel__content cmp-carousel__content--overflow">
          <div class="swiper">
            <div class="swiper-wrapper">
              <div class="cmp-carousel__item swiper-slide">
                <div class="hot-products-loading">Loading products...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-actions-container mobile-margin-top">
        <a href="${config.viewAllLink}" class="section-actions-btn btn btn-link" aria-label="View all products"${config.openLinkInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>
          ${config.viewAllText} <span class="icon icon--arrow-right"></span>
        </a>
        <div class="loader">
          <span class="icon icon--loader"></span>
        </div>
      </div>
    </div>
  `);

  block.innerHTML = '';
  block.appendChild(mockupContainer);

  // Load products
  setTimeout(async () => {
    try {
      const products = await fetchHotProducts(null, config);

      if (products && products.length > 0) {
        const wrapper = block.querySelector('.swiper-wrapper');
        wrapper.innerHTML = '';

        const productsToDisplay = products.slice(0, config.productsToShow);

        // Preload hover images
        productsToDisplay.forEach(product => {
          if (product.hoverImage) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = product.hoverImage;
            document.head.appendChild(link);
          }
        });

        // Create product cards
        productsToDisplay.forEach((product, index) => {
          const slideItem = document.createElement('div');
          slideItem.className = `cmp-carousel__item swiper-slide${index === 0 ? ' swiper-slide-active' : ''}`;
          slideItem.setAttribute('tabindex', '-1');
          slideItem.setAttribute('role', 'group');
          slideItem.setAttribute('aria-label', `Slide ${index + 1} of ${productsToDisplay.length}`);

          const card = createProductCard(product, config);
          slideItem.appendChild(card);

          wrapper.appendChild(slideItem);

          // Add quick view event listener
          const quickViewBtn = card.querySelector('.cmp-product-card__preview-btn');
          if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickView(product, config);
            });
          }

          // Add buy button event listener
          const buyBtn = card.querySelector('.cmp-product-card__buy-button');
          if (buyBtn) {
            buyBtn.addEventListener('click', () => {
              window.location.href = product.urlKey || './pdp.html';
            });
          }
        });

        // Initialize Swiper through carousel.js
        await loadSwiper();
        await import('../../scripts/carousel.js');

        const container = block.querySelector('.carousel');
        if (window.initializeSwiperOnAEMCarousel && container) {
          window.initializeSwiperOnAEMCarousel(container);
        }

        // Load Bazaarvoice ratings
        window.addEventListener('delayed-loaded', async () => {
          try {
            await loadBazaarvoiceScript();
          } catch (error) {
            console.error('Hot Products: Failed to load Bazaarvoice:', error);
          }
        }, { once: true });
      } else {
        const wrapper = block.querySelector('.swiper-wrapper');
        wrapper.innerHTML = '<div class="hot-products-error swiper-slide">No products available</div>';
      }
    } catch (error) {
      console.error('Error loading hot products:', error);
      const wrapper = block.querySelector('.swiper-wrapper');
      wrapper.innerHTML = '<div class="hot-products-error swiper-slide">Failed to load products. Please try again later.</div>';
    }
  }, 0);
}