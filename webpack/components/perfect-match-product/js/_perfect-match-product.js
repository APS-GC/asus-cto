import { fetchData } from '../../../site/scripts/_api';

class PerfectMatchProduct {
  constructor() {
    this.perfectMatchProducts = [];
    this.container = null;
    this.swiperInstance = null;
    this.mobileBreakpoint = 730; // Mobile breakpoint in pixels
    this.productType = 'perfect-match';
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

  // For testing no matches screen, block the API call of perfect-match-products.json from inspect
  async loadPerfectMatchProducts(filters = {}) {
    this.container.innerHTML = '';
    this.actionsContainer.classList.add('is-loading');

    try {
      const params = new URLSearchParams();
      if (filters.games) filters.games.forEach((g) => params.append('games', g));
      if (filters.minBudget) params.set('minBudget', filters.minBudget);
      if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);

      // This is a temporary code for UAT team to verify the no results scenario
      // Remove this code once the UAT team is done with their testing
      const searchParams = new URLSearchParams(window.location.search);
      const triggerNoResults = searchParams.get('trigger-no-results');
      if (triggerNoResults === 'true') {
        throw new Error('No results triggered');
      }

      this.perfectMatchProducts = await fetchData(`perfect-match-products.json?${params}`);
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
    badge.ariaLabel = `${matchTypeLabel} product`;
    badge.tabIndex = -1;
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

// Initialize when DOM is ready (lazy-loaded when section enters viewport)
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.perfect-match-products-container');
  if (!container) {
    return;
  }

  const initPerfectMatch = () => {
    // Prevent multiple initializations
    if (window.perfectMatchProductInstance) {
      return;
    }

    const perfectMatchProduct = new PerfectMatchProduct();
    perfectMatchProduct.init(container);
    window.perfectMatchProductInstance = perfectMatchProduct;
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initPerfectMatch();
          obs.disconnect();
        }
      });
    });

    observer.observe(container);
  } else {
    // Fallback for older browsers
    initPerfectMatch();
  }
});
