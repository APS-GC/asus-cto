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
  await loadChoisesJs();

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
  helpMeChooseContainer.className = 'product-matches container';

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
let noChoisePromise = null;
/**
 * Loads the noUiSlider library, ensuring it's only loaded once.
 */
function loadChoisesJs() {
  if (!noChoisePromise) {
    noChoisePromise = loadScript(
      'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js'
    ).catch((err) => {
      console.error('Failed to load noUiSlider:', err);
      throw err;
    });
  }
  return noChoisePromise;
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

async transform(input) {
  if (!input?.results?.items) return [];

  return input.results.items.map(item => ({
    id: item.sku.toLowerCase().replace(/\s+/g, '-'),            // e.g. "90PF05T1-M00NN0" → "90pf05t1-m00nn0"
    bazaarvoiceProductId: item.externalId || null,
    name: item.name,
    model: item.modelName || null,
    matchType: {
      id: "best-fit",
      label: "Best Fit"
    },
    status: [
      // infer from productTags or buyButtonStatus
      ...(item.productTags || []),
      item.buyButtonStatus === "In Stock" ? "In Stock" : null
    ].filter(Boolean),
    isAvailable: (item.buyButtonStatus !== "Notify Me"),  // example condition
    isCustomizable: true,  // as per target example
    buyLink: "./pdp.html",        // placeholder (no equivalent in source)
    customizeLink: "./pdp.html",  // placeholder
    image: item?.mainImage || item.productCardContent?.mainImage || null,
    imageHover: item?.hoverImage || item?.productCardContent?.hoverImage || null,
    images: (item.productPreviewPopupCF && item.productPreviewPopupCF.additionalImages) 
              ? item.productPreviewPopupCF.additionalImages.map(url => ({
                  image: url,
                  thumbnail: url,
                  title: item.name + " image"
                }))
              : [],
    fps: (() => {
      const gp = item.gamePriority && item.gamePriority[0];
      return gp ? parseInt(gp.fullHdFps, 10) : null;
    })(),



    benchmarkGame: (item.gamePriority && item.gamePriority[0]?.gameTitle) || null,
    fpsData: item.gamePriority 
        ? item.gamePriority.map(g => ({
            game: g.gameTitle,
            fps1080: parseInt(g.fullHdFps, 10),
            fps1440: parseInt(g.quadHdFps, 10),
            image: item?.productCardContent?.mainImage || null
          }))
        : [],
    timeSpyScore: {
      score: item.timeSpyOverallScore || item.productCardContent.timeSpyOverallScore || null,
      level: 4,
      source: {
        image: item?.productCardContent?.mainImage || null,
        name: "3DMark",
        tooltip: "FPS data is theoretical and may vary."
      }
    },
    specs: item.keySpec ? item.keySpec.map(spec => spec.name) : [],
    features: [],  // no equivalent in source; left empty
    price: item.specialPrice || item.price,
    originalPrice: item.price,
    discount: item.savedPrice || null,
    estorePriceTooltipText: "ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be available on estore and are for reference only.",
    purchaseLimit: null,
    shippingInfo: null,
    installment: null
  }));
}


  async fetchProducts() { // Per
    try {
      const contentContainer = this.productGrid.querySelector('.cmp-carousel__content');
      if (contentContainer) contentContainer.innerHTML = '';
      this.actionsContainer.classList.add('is-loading');
      const response = await fetchGameList("https://dummyjson.com/c/8c1e-2df4-42dd-b5f0", 'GET', {}); // Section 2: Explore more gaming desktops
      


      // Example usage:
      const source = { /* your JSON object above */ };
      const result = await this.transform(response);

      
      const products = result || []; // Change response.products
      this.allProducts = [...this.allProducts, ...products];
      this.totalProducts = response.totalProducts || this.allProducts.length;
      this.hasMore = Boolean(response.hasMore);

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

const initsimilarProductsForms = (context) => {

  const sortElement = document.querySelector('#similar-products-sort-by');
  if (sortElement) {
    const sortManager = new SortDropdownManager(sortElement);
    sortManager.init();
  }

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
              <img class="cmp-image__image" src="${image}" alt="${name}" />
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
    this.res = [];
    this.path = "/content/dam/asuscto/us";
  }

  async init(container) {
    this.container = container;
    this.sectionHeading = document.querySelector('.section-heading');
    if (!this.container) {
      return;
    }
    this.actionsContainer = this.container.parentElement.querySelector(
      '.section-actions-container',
    );

    await this.loadPerfectMatchProducts();

    // Add resize listener to handle viewport changes
    window.addEventListener('resize', () => this.handleResize());
  }


transformItem(item, matchType) {
  return {
    
    id: item.sku.toLowerCase().replace(/[^a-z0-9]/g, "-"),  // example slugify
    bazaarvoiceProductId: item.externalId || null,            // example mapping
    name: item.name,
    model: item.modelName,
    matchType: {
      id:  matchType === "bestFit" ? "best-fit" :
             matchType === "customerChoice" ? "customer-choice" :
             matchType === "goodDeal" ? "good-deal" : matchType,
             
      label: matchType === "bestFit" ? "Best Fit" :
             matchType === "customerChoice" ? "Customer Choice" :
             matchType === "goodDeal" ? "Good Deal" : matchType
    },
    status: [
      // infer from productTags or buyButtonStatus
      ...(item?.productCardContent?.productTags || item?.productTags || []),
      item.buyButtonStatus === "In Stock" ? "In Stock" : null
    ].filter(Boolean),
    isAvailable: item.buyButtonStatus !== "Notify Me",
    isCustomizable: true,            // set as per your logic
    buyLink: "./pdp.html",           // you may build from item.productCardContent.urlKey
    customizeLink: "./pdp.html",
    image: item?.mainImage || item.productCardContent?.mainImage || null,
    imageHover: item?.hoverImage || item?.productCardContent?.hoverImage || null,
    images: (item?.productPreviewPopupCF && item?.productPreviewPopupCF?.additionalImages) 
              ? item?.productPreviewPopupCF?.additionalImages?.map(url => ({
                  image: url,
                  thumbnail: url,
                  title: item.name + " image"
                }))
              : [],
    fps: (() => {
      const gp = item.gamePriority && item.gamePriority[0];
      return gp ? parseInt(gp.fullHdFps, 10) : null;
    })(),
    benchmarkGame: (item.gamePriority && item.gamePriority[0]?.gameTitle) || null,
    fpsData: item.gamePriority 
        ? item.gamePriority.map(g => ({
            game: g.gameTitle,
            fps1080: parseInt(g.fullHdFps, 10),
            fps1440: parseInt(g.quadHdFps, 10),
            image: item?.productCardContent?.mainImage || null
          }))
        : [],
    timeSpyScore: {
      score: item.timeSpyOverallScore || item.productCardContent.timeSpyOverallScore || null,
      level: 4,
      source: {
        image: item?.productCardContent?.mainImage || null,
        name: "3DMark",
        tooltip: "FPS data is theoretical and may vary."
      }
    },
    specs: item.keySpec ? item.keySpec.map(spec => spec.name) : [],
    // Optional/custom fields — adapt as needed
    features: [],  // you may compute based on spec or other logic
    price: item.specialPrice || item.price,
    originalPrice: item.price,
    discount: item.savedPrice || null,
    estorePriceTooltipText: "ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be available on estore and are for reference only.",
    purchaseLimit: null,
    shippingInfo: null,
    installment: null
  };
}

  async transformAll(input) {

    const result = [];
    const categories = ["bestFit","customerChoice","goodDeal"];
    for (const cat of categories) {
      const group = input.data[cat];
      if (group && Array.isArray(group.items)) {
        group.items.forEach(item => {
          result.push(this.transformItem(item, cat));
        });
      }
    }
    return result;
  }

  async loadPerfectMatchProducts(filters = {}) {
    this.container.innerHTML = '';
    this.actionsContainer.classList.add('is-loading');

    try {
      const params = new URLSearchParams();
      if (filters.games) filters.games.forEach((g) => params.append('games', g));
      if (filters.minBudget) params.set('minBudget', filters.minBudget);
      if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);


      // https://publish-p165753-e1767020.adobeaemcloud.com/graphql/execute.json/asuscto/fetchHelpMeChooseResults
      this.res = await fetchGameList("https://publish-p165753-e1767020.adobeaemcloud.com/graphql/execute.json/asuscto/fetchHelpMeChooseResults",'POST',
        {
          "query": "",
          "variables": {
              "path": this.path || "/content/dam/asuscto/us",
              "lowerPrice": filters.minBudget || 500,
              "highPrice": filters.maxBudget || 1500
          }
      }
      ); // Section 1 : We have found your perfect matches!
      this.perfectMatchProducts = await this.transformAll(this.res);
      // this.perfectMatchProducts = await this.transformAll({"data":{"bestFit":{"items":[{"itemsId":["362831","105261","105262","105263","105264","105265","105266","123078","110568","42700","43450","43452","43453","43454","43455"],"productId":"32642","storeViewCode":"en_US","sku":"90PF05T1-M00NN0","partNo":"90PF05T1-M00NN0","name":"ROG G700 (2025) GM700","modelName":"GM700TZ-MS777","productType":"simple","gamePriority":[{"gameId":"G001","gameTitle":"Fortnite Chapter 4","fullHdFps":"495","quadHdFps":"135","isMostPopular":true},{"gameId":"G002","gameTitle":"Counter-Strike 2","fullHdFps":"480","quadHdFps":"275","isMostPopular":false},{"gameId":"G003","gameTitle":"Baldur's Gate 3","fullHdFps":"275","quadHdFps":"205","isMostPopular":false},{"gameId":"G004","gameTitle":"Call of Duty: Modern Warfare III","fullHdFps":"325","quadHdFps":"260","isMostPopular":false},{"gameId":"G005","gameTitle":"Red Dead Redemption 2","fullHdFps":"315","quadHdFps":"120","isMostPopular":false},{"gameId":"G006","gameTitle":"Alan Wake 2","fullHdFps":"170","quadHdFps":"105","isMostPopular":false}],"gameIds":["G001","G002","G003","G004","G005","G006"],"allGameFps":"2060.0","price":2199.99,"specialPrice":1899.99,"savedPrice":300,"buyButtonStatus":"Notify Me","customerChoice":9,"productCardContent":{"productTags":["Hot","New"],"mainImage":"https://dlcdnwebimgs.asus.com/gain/E1D9A286-FF7B-4D78-87B8-7B17CC3DDCB4/w717/h525","hoverImage":"https://dlcdnwebimgs.asus.com/gain/E1D9A286-FF7B-4D78-87B8-7B17CC3DDCB4/w717/h525","firstPriorityGameTitle":"Fortnite Chapter 4","fps":"495","timeSpyScoreGpu":null,"timeSpyScoreCpu":null,"timeSpyOverallScore":"25895.0","currency":null,"currencySymbol":null,"displayPrice":"$1,899.99","displaySavedPrice":"$300.00","displayRegularPrice":"$2,199.99","urlKey":"https://shop.asus.com/us/rog/rog-g700-2025-gm700.html"},"keySpec":[{"fieldNo":"16082","fieldNos":["16082"],"name":"AMD® Radeon™ RX 9070 XT PRIME Desktop GPU"},{"fieldNo":"16163","fieldNos":["16163","16494"],"name":"Windows 11 Home"},{"fieldNo":"16035","fieldNos":["16035","16641"],"name":"AMD Ryzen™ 7 9800X 3D Processor"},{"fieldNo":"16036","fieldNos":["16036"],"name":"2TB M.2 NVMe™ PCIe® 4.0 SSD storage"}],"productPreviewPopupCF":{"additionalImages":["https://dlcdnwebimgs.asus.com/gain/0AADFD08-BBEF-4300-A1BB-12982E854FDE/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/13346FD3-263C-4796-ADE6-3DC1EE9356A7/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/20CA1C75-8ACE-4D13-BD1C-545B37D3C989/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/23F58F7B-D77E-482A-BD48-72A1EF74F5AB/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/36EEF4DA-C087-4A03-9F0A-55F0D216B43F/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/490B7B92-D6E8-472D-B6E9-004F07AC1FE6/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/4F1746FA-FB05-43E4-8152-2CF7BEA583EF/w1000/h1000/"],"additionalImagesLabel":["ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700"],"installment":null,"purchaseLimit":"A maximum cnt of 5 pieces per customer.","preOrderInfo":null,"productAdvantage":{"html":"Up to NVIDIA® GeForce RTX™4060Ti DUAL Desktop GPUUp to Windows 11 ProUp to Intel® Core™ Ultra 7 Processor 265FUp to 1TB M.2 2280 NVMe™ PCIe® 4.0 SSD"},"specSummary":{"html":"Up to NVIDIA® GeForce RTX™4060Ti DUAL Desktop GPUUp to Windows 11 ProUp to Intel® Core™ Ultra 7 Processor 265FUp to 1TB M.2 2280 NVMe™ PCIe® 4.0 SSD"}}}]},"customerChoice":{"items":[{"itemsId":["36285","94108","89792","110658","41994","43450"],"productId":"22275","storeViewCode":"en_US","sku":"90PF03T1-M013Z0","partNo":"90PF03T1-M013Z0","name":"ROG G22CH","modelName":"G22CH-DS774S","productType":"simple","gamePriority":[{"gameId":"G001","gameTitle":"Fortnite Chapter 4","fullHdFps":"365","quadHdFps":"100","isMostPopular":true},{"gameId":"G002","gameTitle":"Counter-Strike 2","fullHdFps":"415","quadHdFps":"225","isMostPopular":false},{"gameId":"G003","gameTitle":"Baldur's Gate 3","fullHdFps":"180","quadHdFps":"160","isMostPopular":false},{"gameId":"G004","gameTitle":"Call of Duty: Modern Warfare III","fullHdFps":"255","quadHdFps":"180","isMostPopular":false},{"gameId":"G005","gameTitle":"Red Dead Redemption 2","fullHdFps":"225","quadHdFps":"85","isMostPopular":false},{"gameId":"G006","gameTitle":"Alan Wake 2","fullHdFps":"105","quadHdFps":"75","isMostPopular":false}],"gameIds":["G001","G002","G003","G004","G005","G006"],"allGameFps":"1545.0","price":1799.99,"specialPrice":1599.99,"savedPrice":200,"buyButtonStatus":"Buy Now","customerChoice":21,"productCardContent":{"productTags":["Hot","New"],"mainImage":"https://dlcdnwebimgs.asus.com/gain/2B87FC44-233C-4FA5-8DB4-C09F3D229B8C/w717/h525","hoverImage":"https://dlcdnwebimgs.asus.com/gain/2B87FC44-233C-4FA5-8DB4-C09F3D229B8C/w717/h525","firstPriorityGameTitle":"Fortnite Chapter 4","fps":"365","timeSpyScoreGpu":null,"timeSpyScoreCpu":null,"timeSpyOverallScore":"20840.0","currency":null,"currencySymbol":null,"displayPrice":"$1,599.99","displaySavedPrice":"$200.00","displayRegularPrice":"$1,799.99","urlKey":"https://shop.asus.com/us/rog/90pf03t1-m013z0-rog-g22ch.html"},"keySpec":[{"fieldNo":"16082","fieldNos":["16082"],"name":"NVIDIA® GeForce RTX4070 SUPER DUAL Desktop GPU"},{"fieldNo":"16163","fieldNos":["16163","16494"],"name":"Windows 11 Home"},{"fieldNo":"16035","fieldNos":["16035","16641"],"name":"Intel® Core™ i7-14700F Processor"},{"fieldNo":"16036","fieldNos":["16036"],"name":"1TB M.2 NVMe™ PCIe® 4.0 SSD storage"}],"productPreviewPopupCF":{"additionalImages":["https://dlcdnwebimgs.asus.com/gain/0AADFD08-BBEF-4300-A1BB-12982E854FDE/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/13346FD3-263C-4796-ADE6-3DC1EE9356A7/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/20CA1C75-8ACE-4D13-BD1C-545B37D3C989/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/23F58F7B-D77E-482A-BD48-72A1EF74F5AB/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/36EEF4DA-C087-4A03-9F0A-55F0D216B43F/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/490B7B92-D6E8-472D-B6E9-004F07AC1FE6/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/4F1746FA-FB05-43E4-8152-2CF7BEA583EF/w1000/h1000/"],"additionalImagesLabel":["ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700"],"installment":null,"purchaseLimit":"A maximum cnt of 5 pieces per customer.","preOrderInfo":null,"productAdvantage":{"html":"Up to NVIDIA® GeForce RTX™4060Ti DUAL Desktop GPUUp to Windows 11 ProUp to Intel® Core™ Ultra 7 Processor 265FUp to 1TB M.2 2280 NVMe™ PCIe® 4.0 SSD"},"specSummary":{"html":"Up to NVIDIA® GeForce RTX™4060Ti DUAL Desktop GPUUp to Windows 11 ProUp to Intel® Core™ Ultra 7 Processor 265FUp to 1TB M.2 2280 NVMe™ PCIe® 4.0 SSD"}}}]},"goodDeal":{"items":[{"itemsId":["36283","105261","105262","105263","105264","105265","105266","123078","110568","42700","43450","43452","43453","43454","43455"],"productId":"32642","storeViewCode":"en_US","sku":"90PF05T1-M00NN0","partNo":"90PF05T1-M00NN0","name":"ROG G700 (2025) GM700","modelName":"GM700TZ-MS777","model1id":null,"externalId":"ROG_S_90PF05T1-M00NN0_P","productType":"simple","gamePriority":[{"gameId":"G001","gameTitle":"Fortnite Chapter 4","fullHdFps":"495","quadHdFps":"135","isMostPopular":true},{"gameId":"G002","gameTitle":"Counter-Strike 2","fullHdFps":"480","quadHdFps":"275","isMostPopular":false},{"gameId":"G003","gameTitle":"Baldur's Gate 3","fullHdFps":"275","quadHdFps":"205","isMostPopular":false},{"gameId":"G004","gameTitle":"Call of Duty: Modern Warfare III","fullHdFps":"325","quadHdFps":"260","isMostPopular":false},{"gameId":"G005","gameTitle":"Red Dead Redemption 2","fullHdFps":"315","quadHdFps":"120","isMostPopular":false},{"gameId":"G006","gameTitle":"Alan Wake 2","fullHdFps":"170","quadHdFps":"105","isMostPopular":false}],"gameIds":["G001","G002","G003","G004","G005","G006"],"allGameFps":"2060.0","price":2199.99,"specialPrice":1899.99,"savedPrice":300,"buyButtonStatus":"Notify Me","customerChoice":9,"productCardContent":{"productTags":["Hot","New"],"mainImage":"https://dlcdnwebimgs.asus.com/gain/E1D9A286-FF7B-4D78-87B8-7B17CC3DDCB4/w717/h525","hoverImage":"https://dlcdnwebimgs.asus.com/gain/E1D9A286-FF7B-4D78-87B8-7B17CC3DDCB4/w717/h525","firstPriorityGameTitle":"Fortnite Chapter 4","fps":"495","timeSpyScoreGpu":null,"timeSpyScoreCpu":null,"timeSpyOverallScore":"25895.0","currency":null,"currencySymbol":null,"displayPrice":"$1,899.99","displaySavedPrice":"$300.00","displayRegularPrice":"$2,199.99","urlKey":"https://shop.asus.com/us/rog/rog-g700-2025-gm700.html"},"keySpec":[{"fieldNo":"16082","fieldNos":["16082"],"name":"AMD® Radeon™ RX 9070 XT PRIME Desktop GPU"},{"fieldNo":"16163","fieldNos":["16163","16494"],"name":"Windows 11 Home"},{"fieldNo":"16035","fieldNos":["16035","16641"],"name":"AMD Ryzen™ 7 9800X 3D Processor"},{"fieldNo":"16036","fieldNos":["16036"],"name":"2TB M.2 NVMe™ PCIe® 4.0 SSD storage"}],"productPreviewPopupCF":{"additionalImages":["https://dlcdnwebimgs.asus.com/gain/0AADFD08-BBEF-4300-A1BB-12982E854FDE/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/13346FD3-263C-4796-ADE6-3DC1EE9356A7/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/20CA1C75-8ACE-4D13-BD1C-545B37D3C989/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/23F58F7B-D77E-482A-BD48-72A1EF74F5AB/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/36EEF4DA-C087-4A03-9F0A-55F0D216B43F/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/490B7B92-D6E8-472D-B6E9-004F07AC1FE6/w1000/h1000/","https://dlcdnwebimgs.asus.com/gain/4F1746FA-FB05-43E4-8152-2CF7BEA583EF/w1000/h1000/"],"additionalImagesLabel":["ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700","ROG G700 (2025) G700"],"installment":null,"purchaseLimit":"A maximum cnt of 5 pieces per customer.","preOrderInfo":null,"productAdvantage":{"html":"Up to NVIDIA® GeForce RTX™4060Ti DUAL Desktop GPUUp to Windows 11 ProUp to Intel® Core™ Ultra 7 Processor 265FUp to 1TB M.2 2280 NVMe™ PCIe® 4.0 SSD"},"specSummary":{"html":"Up to NVIDIA® GeForce RTX™4060Ti DUAL Desktop GPUUp to Windows 11 ProUp to Intel® Core™ Ultra 7 Processor 265FUp to 1TB M.2 2280 NVMe™ PCIe® 4.0 SSD"}}}]}}});

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

/**
 * Sort Dropdown Manager
 */
export class SortDropdownManager {
  constructor(selectElement) {
    this.selectElement = selectElement;
    this.choicesInstance = null;
  }

  init() {
    if (!this.selectElement) return;

    this.choicesInstance = new Choices(this.selectElement, {
      searchEnabled: false,
      itemSelectText: '',
      shouldSort: false,
      allowHTML: false,
      removeItemButton: false,
      duplicateItemsAllowed: false,
      addItemFilter: null,
      customProperties: {},
    });

    this.selectElement._choicesInstance = this.choicesInstance;

    // Wait for Choices.js to finish its initial DOM manipulation
    setTimeout(() => {
      this.setupAccessibility();
      this.setupEventListeners();
    }, 100);
  }

  setupAccessibility() {
    const container = this.selectElement.closest('.choices');
    if (!container) return;

    const inner = container.querySelector('.choices__inner');
    if (!inner) return;

    // Move ARIA attributes from `.choices` to `.choices__inner`
    const ariaAttrs = ['role', 'aria-label', 'aria-expanded', 'aria-haspopup', 'tabindex'];
    ariaAttrs.forEach((attr) => {
      const val = container.getAttribute(attr);
      if (val !== null) {
        inner.setAttribute(attr, val);
        container.removeAttribute(attr);
      }
    });

    // Ensure correct combobox semantics on `.choices__inner`
    inner.setAttribute('role', 'combobox');
    inner.setAttribute('aria-haspopup', 'listbox');
    inner.setAttribute('aria-expanded', 'false');

    // Dropdown list should have role="listbox"
    const dropdownList = container.querySelector('.choices__list--dropdown .choices__list');
    if (dropdownList) {
      dropdownList.setAttribute('role', 'listbox');
      dropdownList.setAttribute('tabindex', '-1');
    }

    // Remove role/aria-selected from the single item display
    const singleItem = container.querySelector('.choices__list--single .choices__item');
    if (singleItem) {
      singleItem.removeAttribute('role');
      singleItem.removeAttribute('aria-selected');
    }

    // Get aria label from select box and add to cobmobox and listbox
    const ariaLabel = this.selectElement.getAttribute('aria-label');
    if (ariaLabel) {
      inner.setAttribute('aria-label', ariaLabel);
      dropdownList.setAttribute('aria-label', ariaLabel);
    }
  }

  handleDropdownOpen() {
    const container = this.selectElement.closest('.choices');
    if (!container) return;

    const inner = container.querySelector('.choices__inner');
    if (!inner) return;

    // Hide the redundant single-item display
    const singleItem = container.querySelector('.choices__list--single');
    if (singleItem) {
      singleItem.setAttribute('aria-hidden', 'true');
    }

    // Update aria-expanded on `.choices__inner`
    inner.setAttribute('aria-expanded', 'true');

    // Set aria-activedescendant to selected item
    const selectedOption = container.querySelector('.choices__item--choice.is-selected');
    if (selectedOption) {
      inner.setAttribute('aria-activedescendant', selectedOption.id);
    }
  }

  handleDropdownClose() {
    const container = this.selectElement.closest('.choices');
    if (!container) return;

    const inner = container.querySelector('.choices__inner');
    if (!inner) return;

    // Re-enable single-item display
    const singleItem = container.querySelector('.choices__list--single');
    if (singleItem) {
      singleItem.removeAttribute('aria-hidden');
    }

    // Update aria-expanded on `.choices__inner`
    inner.setAttribute('aria-expanded', 'false');

    // Clear aria-activedescendant
    inner.removeAttribute('aria-activedescendant');
  }

  updateAriaSelected(newValue) {
    const container = this.selectElement.closest('.choices');
    if (!container) return;

    const allOptions = container.querySelectorAll('.choices__item--choice');
    allOptions.forEach((option) => {
      option.setAttribute('aria-selected', 'false');
    });

    const newSelectedOption = container.querySelector(
      `.choices__item--choice[data-value="${newValue}"]`,
    );
    if (newSelectedOption) {
      newSelectedOption.setAttribute('aria-selected', 'true');
    }
  }

  setupEventListeners() {
    this.selectElement.addEventListener('change', (event) => {
      const value = event.detail?.value;

      document.dispatchEvent(
        new CustomEvent('product-sort-applied', {
          detail: { sort: value },
        }),
      );

      // Announce the selected value for screen readers
      const selectedOption = this.selectElement.querySelector(`option[value="${value}"]`);
      if (selectedOption) {
        this.announceSelection(selectedOption.textContent);
      }
    });
  }

  announceSelection(selectedText) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only-fixed';
    announcement.textContent = `${selectedText} selected`;
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (document.body.contains(announcement)) document.body.removeChild(announcement);
    }, 1000);
  }
}

/* -------------------------------
 * Initialize modules on DOMContentLoaded
 * ------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  const sortElement = document.querySelector('#sort-by');
  const floatingSortElement = document.querySelector('#sort-by-floating');
  const mainFloatingContainer = document.querySelector('.floating-filter__plp');
  let sortManager, floatingSortManager;

  if (sortElement && floatingSortElement) {
    floatingSortManager = new SortDropdownManager(floatingSortElement);
    floatingSortManager.init();
    sortManager = new SortDropdownManager(sortElement);
    sortManager.init();
    const syncDropdowns = (source, target) => {
      source.addEventListener('change', (e) => {
        const newValue = e.detail?.value || source.value;
        const targetChoices = target.choicesInstance || target._choicesInstance;
        const customSource = source.closest('.choices');
        source.setAttribute('aria-label', newValue);
        customSource.setAttribute('aria-label', newValue);
        if (target.value === newValue) return;

        if (targetChoices && typeof targetChoices.setChoiceByValue === 'function') {
          targetChoices.setChoiceByValue(newValue);
        } else {
          target.value = newValue;
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    };

    syncDropdowns(sortElement, floatingSortElement);
    syncDropdowns(floatingSortElement, sortElement);
  }

  const onScreenSort = document.querySelector('#sort-by-onscreen');
  if (window.innerWidth < 1280 && onScreenSort) {
    const sortElementOffsetTop = onScreenSort.offsetTop;
    const sortElementHeight = onScreenSort.offsetHeight;

    window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;

      if (scrollPosition >= sortElementOffsetTop + sortElementHeight) {
        mainFloatingContainer.classList.remove('hidden');
      } else {
        mainFloatingContainer.classList.add('hidden');
      }
    });
  }

  const filterTrigger = document.querySelectorAll(
    '[data-a11y-dialog-show="product-filter-dialog"]',
  );

  const filterDialog = document.getElementById('product-filter-dialog');

  if (filterDialog && matchMedia('(min-width: 1280px)').matches) {
    filterDialog.removeAttribute('role');
  }

  if (filterTrigger.length && filterDialog) {
    const dialog = new A11yDialog(filterDialog);

    filterTrigger.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        filterDialog.classList.add('dialog-container');
        dialog.show();
      });
    });

    window.addEventListener('resize', () => {
      if (!matchMedia('(max-width: 1280px)').matches) {
        filterDialog.classList.remove('dialog-container');
        filterDialog.removeAttribute('aria-hidden');
        filterDialog.removeAttribute('aria-modal');
        filterDialog.removeAttribute('role');
      }
    });
  }
  // Custom listeners for choices
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.choices__item--choice');
    if (!item) return;

    // Remove highlight class from hovered item
    item.classList.remove('is-highlighted');
  });
});
