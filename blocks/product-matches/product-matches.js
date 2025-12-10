import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation, loadSwiper } from '../../scripts/scripts.js';
import { fetchGameList, getApiEndpoint } from '../../scripts/api-service.js';
import { API_URIS } from '../../constants/api-constants.js';

let AuthoredData = [];
/**
 * Decorates the help-me-choose block, initializing the carousel and form.
 * @param {Element} block - The block element to decorate.
 * @returns {Promise<void>}
 */
export default async function decorate(block) {
  // Load all dependencies in parallel for faster initialization
  await Promise.all([
    loadNoUiSlider(),
    loadSwiperCSS(),
    loadSwiper(),
    import('../../scripts/carousel.js'),
    loadChoisesJs(),
  ]);

  // Once loaded, render the component
  await renderHelpMeChoose(block);

  initPerfectMatchComponents();
  initsimilarProductsForms();
}

/**
 * Updates a global product map for tracking purposes.
 * This function is separated from rendering logic to maintain purity.
 * @param {object} product - The product data object.
 * @param {string} productType - The category/type of the product.
 */
function updateGlobalProductMap(product, productType) {
  if (!window.allProducts) {
    window.allProducts = new Map();
  }

  const validProductTypes = ['hot', 'related', 'new', 'plp', 'perfect-match', 'similar-products'];

  if (validProductTypes.includes(productType)) {
    if (!window.allProducts.has(productType)) {
      window.allProducts.set(productType, new Map());
    }
    window.allProducts.get(productType).set(product.id, product);
  }
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
  AuthoredData = authoredRows.map(row => row.textContent.trim());
  console.log('Authored Data:', AuthoredData);

  const html = `
  <div class="container top-spacing bottom-spacing">

    <div class="section-heading content-center">
      <div class="section-heading__text-group">
        <h2 class="section-heading__title">${AuthoredData[0]}</h2>
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
        <h2 class="section-heading__title">${AuthoredData[1]}</h2>
        <p class="section-heading__description"></p>
      </div>
    </div>

    <div class="product-toolbar">
        <small class="matched-product"><span id="similar-products-count"></span> ${AuthoredData[5]}</small>
        <div class="cmp-product-toolbar__sort-wrapper">
            <div class="cmp-product-sort-label">
                <label for="similar-products-sort-by">${AuthoredData[6]}:</label>
            </div>
          <div class="cmp-product-sort">
            <select 
                id="similar-products-sort-by" 
                name="sort-by" 
                class="cmp-product-sort__select"
                aria-label="Sort products by">
                <option value="best-performance">Best Performance</option>
                <option value="price-low-high">${AuthoredData[10]}</option>
                <option value="price-high-low">${AuthoredData[11]}</option>
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
    <button class="btn btn-outline view-all-desktops-btn" id="view-all-desktops-btn" aria-label="View all gaming desktops">${AuthoredData[12]}</button>
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

/**
 * Transforms a raw product item from the API into a standardized product object.
 * @param {object} item - The raw product item.
 * @param {string} [matchType] - The category of match (e.g., 'bestFit', 'customerChoice').
 * @returns {object} The transformed product object.
 */
function transformProductData(item, matchType) {
  const {
    sku,
    externalId,
    name,
    modelName,
    buyButtonStatus,
    productTags,
    mainImage,
    hoverImage,
    productCardContent,
    productPreviewPopupCF,
    gamePriority,
    timeSpyOverallScore,
    keySpec,
    specialPrice,
    price,
    savedPrice,
    urlKey
  } = item;

  const firstGame = gamePriority?.[0];

  const matchTypeMap = {
    bestFit: { id: 'best-fit', label: 'Best Fit' },
    customerChoice: { id: 'customer-choice', label: 'Customer Choice' },
    goodDeal: { id: 'good-deal', label: 'Good Deal' },
  };

  return {
    id: sku?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || '',
    bazaarvoiceProductId: externalId || null,
    name: name || '',
    model: modelName || null,
    matchType: matchTypeMap[matchType] || (matchType ? { id: matchType, label: matchType } : null),
    status: [
      buyButtonStatus === 'Buy Now' ? 'In Stock' : null,
      ...(productTags || []),
    ].filter(Boolean),
    isAvailable: buyButtonStatus !== 'Notify Me',
    isCustomizable: true, // as per target example
    buyLink: urlKey || null,           // you may build from item.productCardContent.urlKey
    customizeLink: urlKey || null,
    image: mainImage || productCardContent?.mainImage || null,
    imageHover: hoverImage || productCardContent?.hoverImage || null,
    images: productPreviewPopupCF?.additionalImages?.map((url) => ({
      image: url,
      thumbnail: url,
      title: `${name} image`,
    })) || [],
    fps: firstGame ? parseInt(firstGame.fullHdFps, 10) : null,
    benchmarkGame: firstGame?.gameTitle || null,
    fpsData: gamePriority?.map((g) => ({
      game: g.gameTitle,
      fps1080: parseInt(g.fullHdFps, 10),
      fps1440: parseInt(g.quadHdFps, 10),
      image: productCardContent?.mainImage || null,
    })) || [],
    timeSpyScore: {
      score: timeSpyOverallScore || productCardContent?.timeSpyOverallScore || null,
      level: 4,
      source: { image: productCardContent?.mainImage || null, name: '3DMark', tooltip: 'FPS data is theoretical and may vary.' },
    },
    specs: keySpec?.map((spec) => spec.name) || [],
    features: [], // no equivalent in source; left empty
    price: specialPrice || price,
    originalPrice: price,
    discount: savedPrice || null,
    estorePriceTooltipText: 'ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be available on estore and are for reference only.',
    purchaseLimit: null,
    shippingInfo: null,
    installment: null,
  };
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
    this.selecedSort = document.getElementById('similar-products-sort-by');
    this.sort = {
      'best-performance': 'best performance',
      'price-low-high': 'price low to high',
      'price-high-low': 'price high to low',
      'ratings': 'ratings',
      'best-selling': 'best selling'
    };
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
        const url = AuthoredData[13];
        if (url) {
          window.open(url, '_blank');
        }
      });
    }
  }

  async transform(input) {
    if (!input?.results?.items) return [];
    return input.results.items.map((item) => transformProductData(item));
  }

  /**
   * Sanitizes a value for use in a URL query parameter.
   * @param {*} value - The value to sanitize.
   * @returns {string} The sanitized string.
   */
  sanitizeQueryValue(value) {
    return String(value).replace(/[<>"]/g, '');
  }

  async fetchProducts() { // Per
    try {
      const contentContainer = this.productGrid.querySelector('.cmp-carousel__content');
      if (contentContainer) contentContainer.innerHTML = '';
      this.actionsContainer.classList.add('is-loading');

      const endpoint = await getApiEndpoint(API_URIS.HELP_ME_CHOOSE_RESULT_EXPLORE);
      
      const url = new URL(endpoint);
      const pageParams = new URLSearchParams(window.location.search);

      url.searchParams.set('websiteCode', window.location.href.includes('/en/') ? 'us' : 'en');
      url.searchParams.set('gameIds', pageParams.getAll('games').map(this.sanitizeQueryValue).join(','));
      url.searchParams.set('lowPrice', pageParams.get('min-budget') || '');
      url.searchParams.set('highPrice', pageParams.get('max-budget') || '');
      url.searchParams.set('sort', this.sort[this.currentSort] || '');
      url.searchParams.set('pageSize', '10');
      url.searchParams.set('offset', '0');

      // Section 2 (Explore more gaming desktops)
      const response = await fetchGameList(url.toString(), 'GET', {});

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
    contentContainer.classList.remove('layout-grid', 'layout-grid--cols', 'layout-grid--less--3cols');

    const isDesktop = window.innerWidth > this.desktopBreakpoint;
    if (isDesktop) {

      if (products.length >= 3) {
        contentContainer.classList.add('layout-grid', 'layout-grid--cols');
      } else if (products.length < 3) {
        contentContainer.classList.add('layout-grid', 'layout-grid--cols', 'layout-grid--less--3cols');
      }
      products.forEach((product) => {
        try {
          const cardHtml = window.renderProductCard(product, this.productType);
          const productCard = document.createElement('div');
          if (products.length <= 3) {
            productCard.className = 'layout-grid__col layout-grid__col--span-4';
          } else {
            productCard.className = 'layout-grid__col layout-grid__col--span-3';
          }
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
  // Destructure product data with default values for safety
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

  // Update the global product map as a separate step from rendering.
  updateGlobalProductMap(product, productType);

  // Generate HTML for status badges. Handles multiple statuses and converts them to CSS-friendly class names.
  const statusHtml = status
    .map(
      (s) => `<span class="cmp-product-card__status-item cmp-product-card__status--${s
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
                <label for="compare-${id}" class="cmp-product-card__compare-label">${AuthoredData[16]}</label>
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
              ${originalPrice
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
    this.response = [];
    this.path = "";
    this.lang = "";
  }

   formatGameFilter(value) {
    return {
      'value': String(value).replace(/[<>"]/g, ''), // Basic sanitization
      '_apply': 'AT_LEAST_ONCE'
    };
  };
  _buildApiPayload() {
    const params = new URLSearchParams(window.location.search);
    const selectedGames = params.getAll('games').map(this.formatGameFilter);
    const minBudget = params.get('min-budget') || 500;
    const maxBudget = params.get('max-budget') || 5000;
    const path = window.location.href.includes('/en/') ? '/content/dam/asuscto/us' : '/content/dam/asuscto/en';

    return {
      'query': '',
      'variables': {
        'path': path,
        'gameIdsFilter': {
          '_logOp': 'AND',
          '_expressions': selectedGames || [],
        },
        'lowerPrice': minBudget,
        'highPrice': maxBudget,
        'sort': 'price DESC'
      }
    };
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

    const params = new URLSearchParams(window.location.search);
    const selectedGames = params.getAll('games').map(this.sanitizeText);
    const minBudget = params.get('min-budget'); // '2100'
    const maxBudget = params.get('max-budget'); // '4300'
    this.path = window.location.href.includes('/en/') ? "/content/dam/asuscto/us" : "/content/dam/asuscto/en";

    this.dom = {
      "query": "",
      "variables": {
        "path": this.path,
        "gameIdsFilter": {
          "_logOp": "AND",
          "_expressions": selectedGames || [],
        },
        "lowerPrice": minBudget || 500,
        "highPrice": maxBudget || 5000,
        "sort": "price DESC"
      }
    }
    const apiPayload = this._buildApiPayload();
    await this.loadPerfectMatchProducts(apiPayload);

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
        id: matchType === "bestFit" ? "best-fit" :
          matchType === "customerChoice" ? "customer-choice" :
            matchType === "goodDeal" ? "good-deal" : matchType,

        label: matchType === "bestFit" ? "Best Fit" :
          matchType === "customerChoice" ? "Customer Choice" :
            matchType === "goodDeal" ? "Good Deal" : matchType
      },
      status: [
        item?.buyButtonStatus === 'Buy Now' ? 'In Stock' : null,
        ...(item?.productCardContent?.productTags || item?.productTags || []),
      ].filter(Boolean),
      isAvailable: item?.buyButtonStatus !== 'Notify Me',
      isCustomizable: true,            // set as per your logic
      buyLink: item?.productCardContent?.urlKey || null,           // you may build from item.productCardContent.urlKey
      customizeLink: item?.productCardContent?.urlKey || null,
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
    const categories = ["bestFit", "customerChoice", "goodDeal"];
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

  sanitizeText(value) {
    // Remove any characters that could be dangerous in HTML context
    return {
      "value": value.replace(/[<>"]/g, ''),
      "_apply": "AT_LEAST_ONCE"
    }
  };


  async loadPerfectMatchProducts(filters = {}) {
    this.container.innerHTML = '';
    this.actionsContainer.classList.add('is-loading');

    try {

      const endpoint = await getApiEndpoint(API_URIS.HELP_ME_CHOOSE_RESULT);
      const response = await fetchGameList(endpoint, 'POST', filters);
      this.perfectMatchProducts = await this.transformAll(response || {});

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
    // Center aligned cards
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    if (swiperWrapper && this.perfectMatchProducts.length < 3) {
      swiperWrapper.classList.add('swiper-wrapper-center');
    }
  }

  renderNoMatchProducts() {
    // Hide the section heading when no products are found
    if (this.sectionHeading) {
      this.sectionHeading.style.display = 'none';
    }

    const noMatchProductsContainer = document.createElement('div');
    noMatchProductsContainer.className = 'no-match-products';
    noMatchProductsContainer.innerHTML = `
      <div class='no-match-products__content'>
        <h3 class='no-match-products__title'>${AuthoredData[2]}</h3>
        <p class='no-match-products__description'>${AuthoredData[3]}</p>
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

    const matchTypeId = matchType?.id;
    const matchTypeLabel = matchType?.label;
    const badge = document.createElement('div');
    const badgeClass = this.getBadgeClass(matchTypeId, matchTypeLabel);
    badge.className = `perfect-match-badge ${badgeClass}`;
    badge.innerHTML = `<span class='perfect-match-badge__text'>${matchTypeLabel}</span>`;

    cardWrapper.insertBefore(badge, productCard);
  }

  getBadgeClass(matchTypeId, matchTypeLabel) {
    const identifier = matchTypeId || matchTypeLabel;
    const classMap = {
      'best-fit': 'perfect-match-badge--best-fit',
      'customer-choice': 'perfect-match-badge--customer-choice',
      'good-deal': 'perfect-match-badge--good-deal',
    };

    return classMap[identifier] || '';
  }
}

/**
 * Initializes the PerfectMatchProduct component.
 */
const initPerfectMatchComponents = () => {
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

function initSortDropdowns() {
  const sortElement = document.querySelector('#sort-by');
  const floatingSortElement = document.querySelector('#sort-by-floating');

  if (!sortElement || !floatingSortElement) return;

  const floatingSortManager = new SortDropdownManager(floatingSortElement);
    floatingSortManager.init();
  const sortManager = new SortDropdownManager(sortElement);
    sortManager.init();

    const syncDropdowns = (source, target) => {
      source.addEventListener('change', (e) => {
        const newValue = e.detail?.value || source.value;
        const targetChoices = target.choicesInstance || target._choicesInstance;
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

function initFloatingSortVisibility() {
  const onScreenSort = document.querySelector('#sort-by-onscreen');
  const mainFloatingContainer = document.querySelector('.floating-filter__plp');

  if (!onScreenSort || !mainFloatingContainer || window.innerWidth >= 1280) return;

    const sortElementOffsetTop = onScreenSort.offsetTop;
    const sortElementHeight = onScreenSort.offsetHeight;

    window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;
    const shouldBeVisible = scrollPosition >= sortElementOffsetTop + sortElementHeight;
    mainFloatingContainer.classList.toggle('hidden', !shouldBeVisible);
    });
  }

function initFilterDialog() {
  const filterTrigger = document.querySelectorAll(
    '[data-a11y-dialog-show="product-filter-dialog"]',
  );
  const filterDialog = document.getElementById('product-filter-dialog');

  if (!filterDialog) return;

  if (filterDialog && matchMedia('(min-width: 1280px)').matches) {
    filterDialog.removeAttribute('role');
  }

  if (!filterTrigger.length) return;

    const dialog = new A11yDialog(filterDialog);

    filterTrigger.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        filterDialog.classList.add('dialog-container');
        dialog.show();
      });
    });

    window.addEventListener('resize', () => {
    if (matchMedia('(min-width: 1280px)').matches) {
        filterDialog.classList.remove('dialog-container');
        filterDialog.removeAttribute('aria-hidden');
        filterDialog.removeAttribute('aria-modal');
        filterDialog.removeAttribute('role');
      }
    });
  }

/* -------------------------------
 * Initialize modules on DOMContentLoaded
 * ------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  initSortDropdowns();
  initFloatingSortVisibility();
  initFilterDialog();

  // Custom listeners for choices
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.choices__item--choice');
    if (!item) return;

    // Remove highlight class from hovered item
    item.classList.remove('is-highlighted');
  });
});
