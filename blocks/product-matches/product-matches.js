import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation, loadSwiper } from '../../scripts/scripts.js';
import { fetchGameList, getApiEndpoint } from '../../scripts/api-service.js';
import { API_URIS } from '../../constants/api-constants.js';

/**
 * Decorates the help-me-choose block, initializing the carousel and form.
 * @param {Element} block - The block element to decorate.
 * @returns {Promise<void>}
 */
export default async function decorate(block) {
  // Load noUiSlider only once
  await loadNoUiSlider();
  await loadSwiperCSS();
  await loadSwiper();
  await import('../../scripts/carousel.js');

  // Once loaded, render the component
  await renderHelpMeChoose(block);
  
  initPerfectMatchComponents(document.body)
  initsimilarProductsForms(document.body)
}


/**
 * Renders the Help Me Choose section, including the game list and budget filter.
 * @param {Element} block - The block element to render the content into.
 * @returns {Promise<void>}
 */
async function renderHelpMeChoose(block) {
  const helpMeChooseContainer = document.createElement('div');
  helpMeChooseContainer.className = 'product-matches-page container';

  const authoredRows = [...block.children];
  const AuthoredData = authoredRows.map(row => row.textContent.trim());
  console.log('Authored Data:', AuthoredData);

  const html = `
  <div class="container top-spacing bottom-spacing">

    <div class="section-heading content-center">
      <div class="section-heading__text-group">
        <h2 class="section-heading__title">We have found your perfect matches!</h2>
        <p class="section-heading__description"></p>
      </div>
    </div>

     
    <div class="carousel panelcontainer">

      <div
        id="carousel-product-matches"
        class="cmp-carousel"
        role="group"
        aria-live="polite"
        aria-roledescription="carousel"
        data-cmp-is="carousel"
        data-placeholder-text="false"
        data-slides-per-view="1"
        data-slides-per-view-tablet="2.3"
        data-slides-per-view-desktop="3"
        data-loop-slides="false"
        data-space-between="8"
        data-space-between-tablet="8"
        data-space-between-desktop="20"
       
      >
        <div 
          class="cmp-carousel__content cmp-carousel__content--overflow perfect-match-products-container section-with-bottom-spacing"
          aria-atomic="false"
          aria-live="polite"
        >
          <div class="swiper">
                <div class="swiper-wrapper"></div>
                <div class="swiper-pagination"></div>
            </div>
          <!-- Products will be loaded here -->
        </div>
        <div class="section-actions-container">
          <div class="loader"><span class="icon icon--loader"></span></div>
        </div>
      </div>
    </div>


    <div class="spacing-with-bottom section-with-top-spacing similar-products-container">
    
    <div class="section-heading">
      <div class="section-heading__text-group">
        <h2 class="section-heading__title">Explore more gaming desktops</h2>
        <p class="section-heading__description"></p>
      </div>
    </div>

    <div class="product-toolbar">
        <small class="matched-product"><span id="similar-products-count"></span> Matching Products</small>
        <div class="cmp-product-toolbar__sort-wrapper">
            <div class="cmp-product-sort-label">
                <label for="similar-products-sort-by">Sort by:</label>
            </div>
          <div class="cmp-product-sort">
            <select 
                id="similar-products-sort-by" 
                name="sort-by" 
                class="cmp-product-sort__select"
                aria-label="Sort products by">
                <option value="best-performance">Best Performance</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="ratings">Ratings</option>
                <option value="best-selling">Best Selling</option>
            </select>
          </div>
        </div>
    </div>
    <div class="carousel panelcontainer">

      <div
        id="similar-products-grid"
        class="cmp-carousel"
        role="group"
        aria-live="polite"
        aria-label="Similar Gaming Desktops"
        aria-roledescription="carousel"
        data-cmp-is="carousel"
        data-slides-per-view="1.3"
        data-slides-per-view-tablet="3.2"
        data-slides-per-view-desktop="3.2"
        data-loop-slides="false"
        data-space-between="8"
        data-space-between-tablet="8"
      >
        <div 
          class="cmp-carousel__content cmp-carousel__content--overflow"
          aria-atomic="false"
          aria-live="polite"
          aria-busy="true"
        >

          <!-- Products will be loaded here -->
        </div>
        <div class="section-actions-container is-loading">
          <div class="loader"><span class="icon icon--loader"></span></div>
        </div>
      </div>
    </div>
    <button class="btn btn-outline view-all-desktops-btn" id="view-all-desktops-btn" aria-label="View all gaming desktops">View All Desktops</button>
</div>
 
 
 
    </div>
`;

  helpMeChooseContainer.innerHTML = html;
  // Replace in DOM
  block.replaceChildren(...helpMeChooseContainer.children);


}


// Helper to load noUiSlider only once
let noUiSliderPromise = null;
/**
 * Loads the noUiSlider library, ensuring it's only loaded once.
 */
function loadNoUiSlider() {
  if (!noUiSliderPromise) {
    noUiSliderPromise = loadScript(
      'https://cdn.jsdelivr.net/npm/nouislider@15.8.1/dist/nouislider.min.js'
    ).catch((err) => {
      console.error('Failed to load noUiSlider:', err);
      throw err;
    });
  }
  return noUiSliderPromise;
}

/**
 * Loads the Swiper CSS from a CDN, ensuring it is only fetched once.
 */
let swiperCSSLoaded = null;
function loadSwiperCSS() {
  if (!swiperCSSLoaded) {
    swiperCSSLoaded = loadCSS(
      'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
    ).catch((err) => {
      console.error('Failed to load Swiper CSS:', err);
      throw err;
    });
  }
  return swiperCSSLoaded;
}



class SimilarProductsManager {
  constructor() {
    this.productGrid = document.getElementById('similar-products-grid');
    this.productCountElement = document.getElementById('similar-products-count');
    this.viewAllButton = document.getElementById('view-all-desktops-btn');
    this.actionsContainer = this.productGrid?.querySelector('.section-actions-container');
    this.allProducts = [];
    this.totalProducts = 0;
    this.currentSort = 'newest';
    this.filters = [];
    this.desktopBreakpoint = 1024;
    this.productType = 'similar-products';
  }

  init() {
    if (!this.productGrid) return;

    this.bindEvents();
    this.fetchProducts();
    window.addEventListener('resize', () => this.handleResize());
  }

  bindEvents() {
    document.addEventListener('product-filter-applied', (event) => {
      this.filters = event.detail.filters;
      this.fetchProducts();
    });

    document.addEventListener('product-sort-applied', (event) => {
      this.allProducts = [];
      this.currentSort = event.detail.sort;
      this.fetchProducts();
    });
    if (this.viewAllButton) {
      this.viewAllButton.addEventListener('click', () => {
        window.location.href = '/product-listing.html';
      });
    }
  }

  async fetchProducts() {
    try {
      const contentContainer = this.productGrid.querySelector('.cmp-carousel__content');
      if (contentContainer) contentContainer.innerHTML = '';
      this.actionsContainer.classList.add('is-loading');
      const response = await fetchGameList("https://dummyjson.com/c/214a-7a07-453d-8cbd"); // await fetchData(`similar-products.json?&sort=${this.currentSort}`);

      

      const products = response || []; // Change response.products
      this.allProducts = [...this.allProducts, ...products];
      this.totalProducts = response.totalProducts || this.allProducts.length;
      this.hasMore = Boolean(response.hasMore);

      console.log("Hello 1", response, response.products)

      this.updateProductCount();
      this.renderProducts(products);
    } catch (err) {
      console.error('Error loading products:', err);
      this.totalProducts = 0;
      this.updateProductCount();
    } finally {
      this.actionsContainer.classList.remove('is-loading');
    }
  }

  updateProductCount() {
    if (!this.productCountElement) return;
    this.productCountElement.textContent = `${this.totalProducts}`;
  }
  destroyCarousel() {
    if (this?.swiperInstance?.destroy) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }
  }

  renderProducts(products = []) {
    if (!this.productGrid) {
      console.error('Product grid element not found');
      return;
    }

    const contentContainer = this.productGrid.querySelector('.cmp-carousel__content');
    if (!contentContainer) {
      console.error('Carousel content container not found');
      return;
    }

    contentContainer.innerHTML = '';
    contentContainer.classList.remove('layout-grid', 'layout-grid--cols');

    const isDesktop = window.innerWidth > this.desktopBreakpoint;
    if (isDesktop) {
      contentContainer.classList.add('layout-grid', 'layout-grid--cols');
      products.forEach((product) => {
        try {
          const cardHtml = window.renderProductCard(product, this.productType);
          const productCard = document.createElement('div');
          productCard.className = 'layout-grid__col layout-grid__col--span-3';
          productCard.innerHTML = cardHtml;
          contentContainer.appendChild(productCard);
        } catch (err) {
          console.error('Error rendering product card:', err, product);
        }
      });

      this.destroyCarousel();
    } else {
      products.forEach((product) => {
        try {
          const cardHtml = window.renderProductCard(product);
          const carouselItem = document.createElement('div');
          carouselItem.className = 'cmp-carousel__item';
          carouselItem.tabIndex = '0';
          carouselItem.innerHTML = cardHtml;
          contentContainer.appendChild(carouselItem);
        } catch (err) {
          console.error('Error rendering product card:', err, product);
        }
      });

      this.initializeCarousel();
    }
  }

  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.renderProducts(this.allProducts);
    }, 250);
  }

  renderCarousel() {
    // Clear container and render products as carousel items
    this.container.innerHTML = '';

    this.perfectMatchProducts.forEach((product) => {
      try {
        // Create carousel item wrapper
        const carouselItem = document.createElement('div');
        carouselItem.className = 'cmp-carousel__item';
        carouselItem.style.width = '280px';

        // Use global product card renderer (same as homepage)
        const cardHtml = window.renderProductCard(product, this.productType);
        carouselItem.innerHTML = cardHtml;

        // Add badge styling after rendering
        this.addBadgeToCard(carouselItem, product.matchType);

        this.container.appendChild(carouselItem);
      } catch (error) {
        console.error('Error rendering product card:', error, product);
      }
    });

    // Initialize carousel after products are loaded
    this.initializeCarousel();
  }

  initializeCarousel() {
    // Find the carousel container
    const carouselContainer = this.productGrid.closest('.carousel');

    if (carouselContainer && window.initializeSwiperOnAEMCarousel) {
      // Initialize Swiper carousel using the global function
      this.swiperInstance = window.initializeSwiperOnAEMCarousel(carouselContainer);
    } else {
      console.warn('Carousel initialization failed: container or function not found');
    }
  }
}

// document.addEventListener('DOMContentLoaded', () => {
//   // const sortElement = document.querySelector('#similar-products-sort-by');
//   // if (sortElement) {
//   //   const sortManager = new SortDropdownManager(sortElement);
//   //   sortManager.init();
//   // }

//   const similarProductsManager = new SimilarProductsManager();
//   similarProductsManager.init();
// });

const initsimilarProductsForms = (context) => {
  // Select all elements marked with the data attribute
  const similarProductsManager = new SimilarProductsManager();
  similarProductsManager.init();
};


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
            <td>${detail.game}</td>
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

  if ([
  'hot',
  'related',
  'new',
  'plp',
  'perfect-match',
  'similar-products',
].includes(productType)) {
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
            ${bundleMessage ? `<div class="cmp-product-card__bundle-message">${bundleMessage.replace('Bundle and ', 'Bundle and <span class="cmp-product-card__bundle-message-break">')}</span></div>` : ''}
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
                  id="compare-${id}"
                  data-id="${id}"
                  data-name="${name}"
                  data-model="${model}"
                  data-sku="${model}"
                  data-image="${image}"
                  data-pdp="/product-detail/${id}"
                  data-add-to-compare
                />
                <label for="compare-${id}" class="cmp-product-card__compare-label">Compare</label>
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
                  <thead><tr><th>Game FPS</th><th>1080P</th><th>1440P</th></tr></thead>
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
                    data-tooltip-position="top"
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
            <div class="cmp-product-card__price-block">
              <span class="cmp-product-card__price">$${price}</span>
              ${
                originalPrice
                  ? `<span class="cmp-product-card__original-price">$${originalPrice}</span>`
                  : ''
              }
              ${discount ? `<span class="cmp-product-card__discount">SAVE $${discount}</span>` : ''}
            </div>
          </div>
          <div class="cmp-product-card__footer">
            ${prepareProductAction(name, isAvailable, isCustomizable, buyLink, customizeLink)}
          </div>
        </div>
      `;
}

function prepareProductAction(productName, isAvailable, isCustomizable, buyLink, customizeLink) {
  var productActionsHtml = '';

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


class PerfectMatchProduct {
  constructor() {
    this.perfectMatchProducts = [];
    this.container = null;
    this.swiperInstance = null;
    this.mobileBreakpoint = 700; // Mobile breakpoint in pixels
    this.productType = 'perfect-match';
  }

  async init(container) {
    console.log("Perfect Match 1")
    this.container = container;
    this.sectionHeading = document.querySelector('.section-heading');
    if (!this.container) {
      return;
    }
    this.actionsContainer = this.container.parentElement.querySelector(
      '.section-actions-container',
    );

    await this.loadPerfectMatchProducts();
    console.log("Perfect Match 2")

    // Add resize listener to handle viewport changes
    window.addEventListener('resize', () => this.handleResize());
  }

  async loadPerfectMatchProducts(filters = {}) {
    this.container.innerHTML = '';
    this.actionsContainer.classList.add('is-loading');

    try {
      const params = new URLSearchParams();
      if (filters.games) filters.games.forEach((g) => params.append('games', g));
      if (filters.minBudget) params.set('minBudget', filters.minBudget);
      if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);

      this.perfectMatchProducts = await fetchGameList("https://dummyjson.com/c/57ff-ad51-4a29-9d24");

      console.log("Perfect Match 3", this.perfectMatchProducts)

    } catch (error) {
      console.error('Failed to load perfect match products:', error);
      this.perfectMatchProducts = [];
    } finally {
      this.actionsContainer.classList.remove('is-loading');
    }

    if (!this.perfectMatchProducts.length) {
      this.renderNoMatchProducts();
      return;
    }

    this.renderProducts();
  }

  renderNoMatchProducts() {
    // Hide the section heading when no products are found
    if (this.sectionHeading) {
      this.sectionHeading.style.display = 'none';
    }

    const noMatchProductsContainer = document.createElement('div');
    noMatchProductsContainer.className = 'no-match-products';
    noMatchProductsContainer.innerHTML = `
      <div class="no-match-products__content">
        <h3 class="no-match-products__title">No matches</h3>
        <p class="no-match-products__description">Try changing or removing some of your filters or expanding your search area</p>
      </div>
    `;
    this.container.innerHTML = '';
    this.container.appendChild(noMatchProductsContainer);
  }

  renderProducts() {
    if (!this.perfectMatchProducts.length) {
      return;
    }

    // Show the section heading when products are found
    if (this.sectionHeading) {
      this.sectionHeading.style.display = '';
    }

    // Check if mobile view
    const isMobile = window.innerWidth < this.mobileBreakpoint;

    if (isMobile) {
      this.renderMobileGrid();
    } else {
      console.log("Perfect Match 4")
      this.renderCarousel();
    }
  }

  renderMobileGrid() {
    // Clear container and render products as grid on mobile
    this.container.innerHTML = '';

    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'perfect-match-mobile-grid';

    this.perfectMatchProducts.forEach((product) => {
      try {
        // Create grid item wrapper
        const gridItem = document.createElement('div');
        gridItem.className = 'perfect-match-mobile-grid__item cmp-perfect-match-product__item';

        // Use global product card renderer
        const cardHtml = window.renderProductCard(product, this.productType);
        gridItem.innerHTML = cardHtml;

        // Add badge styling after rendering
        this.addBadgeToCard(gridItem, product.matchType);

        gridContainer.appendChild(gridItem);
      } catch (error) {
        console.error('Error rendering product card:', error, product);
      }
    });

    this.container.appendChild(gridContainer);
  }

  renderCarousel() {
    // Clear container and render products as carousel items
    this.container.innerHTML = '';

    this.perfectMatchProducts.forEach((product) => {
      try {
        // Create carousel item wrapper
        const carouselItem = document.createElement('div');
        carouselItem.className = 'cmp-carousel__item cmp-perfect-match-product__item';
        
        // Use global product card renderer (same as homepage)
        const cardHtml = window.renderProductCard(product, this.productType);
        carouselItem.innerHTML = cardHtml;

        // Add badge styling after rendering
        this.addBadgeToCard(carouselItem, product.matchType);

        this.container.appendChild(carouselItem);
        
      } catch (error) {
        console.error('Error rendering product card:', error, product);
      }
    });

    // Initialize carousel after products are loaded
    this.initializeCarousel();
  }

  initializeCarousel() {
    
    // Find the carousel container
    const carouselContainer = this.container.closest('.carousel');

    console.log("Product Match 5", carouselContainer, window.initializeSwiperOnAEMCarousel)

    if (carouselContainer && window.initializeSwiperOnAEMCarousel) {
      // Initialize Swiper carousel using the global function
      this.swiperInstance = window.initializeSwiperOnAEMCarousel(carouselContainer);
    } else {
      console.warn('Carousel initialization failed: container or function not found');
    }
  }

  destroyCarousel() {
    if (this?.swiperInstance?.destroy) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }
  }

  handleResize() {
    
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      const isMobile = window.innerWidth < this.mobileBreakpoint;
      const hasSwiper = this.swiperInstance !== null;

      
      if (isMobile && hasSwiper) {
        // Destroy carousel and switch to grid on mobile
        this.destroyCarousel();
        this.renderMobileGrid();
      } else if (!isMobile && !hasSwiper && this.perfectMatchProducts.length) {
        // Initialize carousel when switching from mobile to desktop
        this.renderCarousel();
      }
    }, 250);
  }

  addBadgeToCard(cardWrapper, matchType) {
    const productCard = cardWrapper.querySelector('.cmp-product-card');
    if (!productCard) return;

    // Handle both string and object matchType formats
    const matchTypeId = typeof matchType === 'object' ? matchType.id : matchType;
    const matchTypeLabel = typeof matchType === 'object' ? matchType.label : matchType;

    // Create and insert badge with CSS classes
    const badge = document.createElement('div');
    const badgeClass = this.getBadgeClass(matchTypeId, matchTypeLabel);
    badge.className = `perfect-match-badge ${badgeClass}`;
    badge.innerHTML = `<span class="perfect-match-badge__text">${matchTypeLabel}</span>`;

    cardWrapper.insertBefore(badge, productCard);
  }

  getBadgeClass(matchTypeId, matchTypeLabel) {
    // Use ID for class mapping if available, otherwise fall back to label
    const identifier = matchTypeId || matchTypeLabel;

    const classMap = {
      // ID-based mapping (new format)
      'best-fit': 'perfect-match-badge--best-fit',
      'customer-choice': 'perfect-match-badge--customer-choice',
      'good-deal': 'perfect-match-badge--good-deal',
    };

    // This is a safe way to access the classMap object.
    // eslint-disable-next-line security/detect-object-injection
    return classMap[identifier] || '';
  }
}

// Initialize when DOM is ready

const initPerfectMatchComponents = (context) => {
  const perfectMatchProduct = new PerfectMatchProduct();
  perfectMatchProduct.init(document.querySelector('.perfect-match-products-container'));
  window.perfectMatchProductInstance = perfectMatchProduct;
};