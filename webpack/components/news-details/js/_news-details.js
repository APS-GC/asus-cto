import { fetchData } from '../../../site/scripts/_api';

class RelatedProductsManager {
  constructor() {
    this.productContainer = document.getElementById('carousel-related-products');
    this.productType = 'related';
  }

  init() {
    if (!this.productContainer) return;

    this.fetchProducts();
  }

  async fetchProducts() {
    try {
      const contentContainer = this.productContainer.querySelector('.cmp-carousel__content');
      if (contentContainer) contentContainer.innerHTML = '';
      const products = await fetchData(`related-products.json`);
      this.renderProducts(products);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }

  destroyCarousel() {
    if (this?.swiperInstance?.destroy) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = null;
    }
  }

  renderProducts(products = []) {
    if (!this.productContainer) {
      console.error('Product grid element not found');
      return;
    }

    const contentContainer = this.productContainer.querySelector('.cmp-carousel__content');
    if (!contentContainer) {
      console.error('Carousel content container not found');
      return;
    }

    contentContainer.innerHTML = '';
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

  renderCarousel() {
    // Clear container and render products as carousel items
    this.container.innerHTML = '';

    this.perfectMatchProducts.forEach((product) => {
      try {
        // Create carousel item wrapper
        const carouselItem = document.createElement('div');
        carouselItem.className = 'cmp-carousel__item';

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
    const carouselContainer = this.productContainer.closest('.carousel');

    if (carouselContainer && window.initializeSwiperOnAEMCarousel) {
      this.swiperInstance = window.initializeSwiperOnAEMCarousel(carouselContainer);
    } else {
      console.warn('Carousel initialization failed: container or function not found');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const relatedProductsManager = new RelatedProductsManager();
  relatedProductsManager.init();

  const cards = document.querySelectorAll('.cmp-advantage-card__news-details');

  cards.forEach((card) => {
    const watchNowBtn = card.querySelector('.cmp-advantage-card__news-details__btn');
    const videoPlayer = card.querySelector('.cmp-advantage-card__news-details__video');
    const closeVideoBtn = card.querySelector('.cmp-advantage-card__news-details__close-video');

    if (!watchNowBtn || !videoPlayer) return;

    watchNowBtn.addEventListener('click', () => {
      if (videoPlayer.dataset.src && !videoPlayer.src) {
        videoPlayer.src = videoPlayer.dataset.src;
        videoPlayer.load();
      }

      videoPlayer.play();
      card.classList.add('is-playing');
    });

    if (closeVideoBtn) {
      const handleClose = () => {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        card.classList.remove('is-playing');
      };

      closeVideoBtn.addEventListener('click', handleClose);

      // --- Keyboard accessibility ---
      closeVideoBtn.addEventListener('keydown', (evt) => {
        if (evt.key === 'Tab') {
          evt.preventDefault();
          videoPlayer.focus();
        } else if (evt.key === 'Enter') {
          evt.preventDefault();
          handleClose();
        }
      });
    }

    videoPlayer.addEventListener('ended', () => {
      videoPlayer.currentTime = 0;
      card.classList.remove('is-playing');
    });
  });
});

function getColumnCount(table) {
  const firstRow = table.querySelector('tr');
  let count = 0;

  if (!firstRow) return 0;

  [...firstRow.children].forEach((cell) => {
    const span = parseInt(cell.getAttribute('colspan') || 1, 10);
    count += span;
  });

  return count;
}

const responsiveTables = document.querySelectorAll('.responsive-table-wrapper table');

responsiveTables.forEach((table) => {
  const colCount = getColumnCount(table);
  table.style.setProperty('--column-count', colCount);
});

document.querySelectorAll('.table-wrapper').forEach((wrapper) => {
  const topScroll = wrapper.querySelector('.custom-scrollbar');
  const bottomScroll = wrapper.querySelector('.responsive-table-wrapper');
  const inner = topScroll.querySelector('.custom-scrollbar-inner');

  function updateWidth() {
    const scrollWidth = bottomScroll.scrollWidth;
    const clientWidth = bottomScroll.clientWidth;

    inner.style.width = scrollWidth + 'px';

    if (scrollWidth <= clientWidth) {
      topScroll.style.display = 'none';
    } else {
      topScroll.style.display = 'block';
    }
  }
  updateWidth();

  window.addEventListener('resize', updateWidth);

  topScroll.addEventListener('scroll', () => {
    bottomScroll.scrollLeft = topScroll.scrollLeft;
  });
  bottomScroll.addEventListener('scroll', () => {
    topScroll.scrollLeft = bottomScroll.scrollLeft;
  });
});
