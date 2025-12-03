import { decorateBlock, loadBlock } from '../../scripts/aem.js';
import { fetchHotProducts } from '../../scripts/api-service.js';
import { loadBazaarvoiceScript, loadSwiper } from '../../scripts/scripts.js';
import { openModal } from '../modal/modal.js';
import { getBlockConfigs } from '../../scripts/configs.js';

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
  productPreviewModalPath: '/content/asus-cto/language-master/en/modals/product-preview',
};

/**
 * Create a product card block element
 * @param {Object} product - Product data
 * @param {Object} config - Configuration options
 * @returns {HTMLElement} - Product card block wrapper
 */
function createProductCardBlock(product, config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'product-card-wrapper';

  const block = document.createElement('div');
  block.className = 'product-card';
  block.dataset.product = JSON.stringify(product);
  block.dataset.config = JSON.stringify({
    compareLabel: config.compareLabel,
    buyNowText: config.buyNowText,
    quickViewText: config.quickViewText,
    estoreLabel: config.estoreLabel,
    estoreTooltip: config.estoreTooltip,
  });

  wrapper.appendChild(block);
  return wrapper;
}

// Handle quick view button click
async function handleQuickView(product, config) {
  // Store product data temporarily for the product-preview block to access
  window.__productPreviewData = product;

  // Get modal path from config
  const modalPath = config.productPreviewModalPath || '/modals/product-preview';

  // Open modal with the authored page, dialog ID, and classes
  await openModal(
    modalPath,
    true, // is modal
    'product-preview-dialog', // dialog ID
    ['cmp-product-preview', 'light-mode'], // classes
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
          <!-- Products will be loaded here -->
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

  // Get the section actions container for loader control
  const sectionActionsContainer = block.querySelector('.section-actions-container');

  // Load products
  setTimeout(async () => {
    try {
      // Show loader
      if (sectionActionsContainer) {
        sectionActionsContainer.classList.add('is-loading');
      }

      const products = await fetchHotProducts(null, config);

      // Hide loader
      if (sectionActionsContainer) {
        sectionActionsContainer.classList.remove('is-loading');
      }

      if (products && products.length > 0) {
        const wrapper = block.querySelector('.cmp-carousel__content');
        wrapper.innerHTML = '';

        const productsToDisplay = products.slice(0, config.productsToShow);

        // Preload hover images
        productsToDisplay.forEach((product) => {
          if (product.hoverImage) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = product.hoverImage;
            document.head.appendChild(link);
          }
        });

        // Create and load product cards
        const loadPromises = productsToDisplay.map(async (product) => {
          const slideItem = document.createElement('div');
          slideItem.className = 'cmp-carousel__item';

          const cardWrapper = createProductCardBlock(product, config);
          const cardBlock = cardWrapper.querySelector('.product-card');

          slideItem.appendChild(cardWrapper);
          wrapper.appendChild(slideItem);

          // Decorate and load the product card block
          decorateBlock(cardBlock);
          await loadBlock(cardBlock);

          // Add quick view event listener after block is loaded
          const quickViewBtn = cardBlock.querySelector('.cmp-product-card__preview-btn');
          if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickView(product, config);
            });
          }

          return cardBlock;
        });

        await Promise.all(loadPromises);

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
        const wrapper = block.querySelector('.cmp-carousel__content');
        wrapper.innerHTML = '<div class="hot-products-error">No products available</div>';
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading hot products:', error);

      // Hide loader on error
      if (sectionActionsContainer) {
        sectionActionsContainer.classList.remove('is-loading');
      }

      const wrapper = block.querySelector('.cmp-carousel__content');
      wrapper.innerHTML = '<div class="hot-products-error">Failed to load products. Please try again later.</div>';
    }
  }, 0);
}
