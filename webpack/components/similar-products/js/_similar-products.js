import { fetchData } from '../../../site/scripts/_api';
import { SortDropdownManager } from '../../product-sidebar/js/_product-sidebar';

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
    this.desktopBreakpoint = 1279;
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
      const response = await fetchData(`similar-products.json?&sort=${this.currentSort}`);

      const products = response.products || [];
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

document.addEventListener('DOMContentLoaded', () => {
  const sortElement = document.querySelector('#similar-products-sort-by');
  const gridElement = document.getElementById('similar-products-grid');

  if (!gridElement) {
    return;
  }

  const initSimilarProducts = () => {
    // Avoid re-initializing on multiple observer callbacks
    if (gridElement.dataset.initialized === 'true') {
      return;
    }
    gridElement.dataset.initialized = 'true';

    if (sortElement) {
      const sortManager = new SortDropdownManager(sortElement);
      sortManager.init();
    }

    const similarProductsManager = new SimilarProductsManager();
    similarProductsManager.init();
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initSimilarProducts();
          obs.disconnect();
        }
      });
    });

    observer.observe(gridElement);
  } else {
    // Fallback for older browsers
    initSimilarProducts();
  }
});
