import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Mock GraphQL API function
async function fetchProductData(endpoint = '/mock-api/products', limit = 3) {
  // Mock data matching the existing product card template structure
  const mockData = {
    data: {
      products: [
        {
          id: 'rog-strix-gt15',
          name: 'ROG Strix GT15 Gaming Desktop',
          model: 'G15CF-DB776',
          image: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-1.jpg',
          imageHover: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-1-hover.jpg',
          price: '1299',
          originalPrice: '1599',
          discount: '300',
          bazaarvoiceProductId: 'rog-strix-gt15',
          benchmarkGame: 'Cyberpunk 2077',
          fps: '85',
          specs: [
            'AMD Ryzen 7 5700G Processor',
            'NVIDIA GeForce RTX 3060 Ti',
            '16GB DDR4 RAM',
            '512GB PCIe SSD + 1TB HDD'
          ]
        },
        {
          id: 'rog-strix-gt35',
          name: 'ROG Strix GT35 Gaming Desktop',
          model: 'G35CZ-DB796',
          image: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-2.jpg',
          imageHover: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-2-hover.jpg',
          price: '1899',
          originalPrice: '2199',
          discount: '300',
          bazaarvoiceProductId: 'rog-strix-gt35',
          benchmarkGame: 'Call of Duty: Modern Warfare III',
          fps: '120',
          specs: [
            'Intel Core i7-11700KF Processor',
            'NVIDIA GeForce RTX 3070',
            '32GB DDR4 RAM',
            '1TB PCIe SSD'
          ]
        },
        {
          id: 'rog-strix-ga15',
          name: 'ROG Strix GA15 Gaming Desktop',
          model: 'G15DK-DB756',
          image: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-3.jpg',
          imageHover: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-3-hover.jpg',
          price: '999',
          originalPrice: '1299',
          discount: '300',
          bazaarvoiceProductId: 'rog-strix-ga15',
          benchmarkGame: 'Fortnite Chapter 5',
          fps: '165',
          specs: [
            'AMD Ryzen 5 5600G Processor',
            'NVIDIA GeForce RTX 3060',
            '16GB DDR4 RAM',
            '512GB PCIe SSD'
          ]
        },
        {
          id: 'rog-strix-ga35',
          name: 'ROG Strix GA35 Gaming Desktop',
          model: 'G35DX-DB986',
          image: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-4.jpg',
          imageHover: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-4-hover.jpg',
          price: '2299',
          originalPrice: '2599',
          discount: '300',
          bazaarvoiceProductId: 'rog-strix-ga35',
          benchmarkGame: 'Red Dead Redemption 2',
          fps: '95',
          specs: [
            'AMD Ryzen 9 5900X Processor',
            'NVIDIA GeForce RTX 3080',
            '32GB DDR4 RAM',
            '1TB PCIe SSD + 2TB HDD'
          ]
        },
        {
          id: 'rog-strix-gt15-white',
          name: 'ROG Strix GT15 Gaming Desktop (White)',
          model: 'G15CF-WB776',
          image: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-5.jpg',
          imageHover: '/content/dam/eds-enablement-xwalk/asus-cto-sites/product-5-hover.jpg',
          price: '1399',
          originalPrice: '1699',
          discount: '300',
          bazaarvoiceProductId: 'rog-strix-gt15-white',
          benchmarkGame: 'Apex Legends',
          fps: '144',
          specs: [
            'AMD Ryzen 7 5700G Processor',
            'NVIDIA GeForce RTX 3070',
            '16GB DDR4 RAM',
            '1TB PCIe SSD'
          ]
        }
      ]
    }
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockData.data.products.slice(0, limit);
}

// Get placeholder text
function getPlaceholder(key) {
  const placeholders = {
    'compare': 'Compare',
    'buy-now': 'Buy now',
    'in-stock': 'In Stock',
    'new': 'New',
    'deal': 'Deal',
    'quick-view': 'Quick view',
    'estore-price': 'ASUS estore price',
    'save': 'SAVE',
    'watch-now': 'Watch now',
    'previous': 'Previous',
    'next': 'Next'
  };
  
  return placeholders[key] || key;
}

// Create product card HTML
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'cmp-product-card';
  
  card.innerHTML = `
    <div class="cmp-product-card__header">
      <div class="cmp-product-card__status">
        <span class="cmp-product-card__status-item cmp-product-card__status--in-stock">${getPlaceholder('in-stock')}</span>
        <span class="cmp-product-card__status-item cmp-product-card__status--new">${getPlaceholder('new')}</span>
        <span class="cmp-product-card__status-item cmp-product-card__status--deal">${getPlaceholder('deal')}</span>
      </div>
    </div>

    <div class="cmp-product-card__body">
      <div class="cmp-product-card__image cmp-image">
        <button class="cmp-product-card__preview-btn" data-a11y-dialog-show="product-preview-dialog" aria-label="${getPlaceholder('quick-view')} ${product.name}">${getPlaceholder('quick-view')}</button>
        <img class="cmp-image__image" src="${product.image}" alt="${product.name}" loading="lazy" />
        ${product.imageHover ? `<img class="cmp-image__image--hover" src="${product.imageHover}" alt="${product.name}" aria-hidden="true" loading="lazy" />` : ''}
      </div>

      <div class="cmp-product-card__info">
        <div class="cmp-product-card__title">
          <a href="pdp.html" aria-label="${getPlaceholder('buy-now')} ${product.name}">${product.name}</a>
        </div>
        <p class="cmp-product-card__model">
          <a href="pdp.html#product-features">${product.model}</a>
        </p>
      </div>

      <div class="cmp-product-card__rating_and_compare">
        <div class="cmp-product-card__rating">
          <div
            data-bv-show="inline_rating"
            data-bv-product-id="${product.bazaarvoiceProductId}"
            data-bv-redirect-url="pdp.html#product-reviews"
          ></div>
        </div>
        <div class="cmp-product-card__compare">
          <input type="checkbox" class="cmp-product-card__compare-checkbox" id="compare-${product.id}" data-id="${product.id}"
            data-name="${product.name}" data-model="${product.model}" data-sku="${product.model}" data-image="${product.image}"
            data-pdp="/product-detail/${product.id}" data-add-to-compare />

          <label for="compare-${product.id}" class="cmp-product-card__compare-label">${getPlaceholder('compare')}</label>
        </div>
      </div>

      <div class="cmp-product-card__fps">
        <p class="cmp-product-card__fps-game">
          ${product.benchmarkGame}
        </p>

        <button class="cmp-product-card__fps-score" data-tooltip-trigger aria-describedby="fps-details-${product.id}" data-tooltip-position="right">
            FPS: ${product.fps}
        </button>
        <div id="fps-details-${product.id}" class="tooltip__content" role="tooltip">
          <table class="cmp-product-card__fps-table">
            <thead>
              <tr>
                <th>Game FPS</th>
                <th>1080P</th>
                <th>1440P</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Call of Duty: Modern Warfare III</td>
                <td>--</td>
                <td>57 FPS</td>
              </tr>
              <tr>
                <td>Fortnite Chapter 4</td>
                <td>346 FPS</td>
                <td>45 FPS</td>
              </tr>
              <tr>
                <td>Red Dead Redemption 2</td>
                <td>315 FPS</td>
                <td>--</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ul class="cmp-product-card__specs">
        ${product.specs.map(spec => `<li class="cmp-product-card__spec-item">${spec}</li>`).join('')}
      </ul>

      <div class="cmp-product-card__estore">
        <div class="cmp-product-card__estore-line">
          <span class="cmp-product-card__estore-label">${getPlaceholder('estore-price')}</span>

          <div class="cmp-product-card__estore-icon-wrapper">
            <button class="cmp-product-card__estore-icon" data-tooltip-trigger aria-describedby="estore-price-info-${product.id}" data-tooltip-position="top" aria-label="Information about ASUS estore price.">
              <span class="visually-hidden"></span>
            </button>
            <div class="tooltip__content" id="estore-price-info-${product.id}" role="tooltip">
              ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be
              available on estore and are for reference only.
            </div>
          </div>
        </div>
      </div>

      <div class="cmp-product-card__price-block">
        <span class="cmp-product-card__price">$${product.price}</span>
        <span class="cmp-product-card__original-price">$${product.originalPrice}</span>
        <span class="cmp-product-card__discount">${getPlaceholder('save')} $${product.discount}</span>
      </div>
    </div>

    <div class="cmp-product-card__footer">
      <button class="cmp-button cmp-product-card__buy-button btn">${getPlaceholder('buy-now')}</button>
    </div>
  `;
  
  return card;
}

// Initialize carousel functionality
function initializeCarousel(carousel, products) {
  const content = carousel.querySelector('.cmp-carousel__content');
  const prevBtn = carousel.querySelector('.cmp-carousel__action--previous');
  const nextBtn = carousel.querySelector('.cmp-carousel__action--next');
  const indicators = carousel.querySelector('.cmp-carousel__indicators');
  
  let currentIndex = 0;
  let autoPlayInterval = null;
  
  // Check if we're on desktop (1024px+)
  function isDesktop() {
    return window.innerWidth >= 1024;
  }
  
  // Create indicators only if not on desktop
  function createIndicators() {
    if (!isDesktop()) {
      // Clear existing indicators first
      indicators.innerHTML = '';
      products.forEach((_, index) => {
        const indicator = document.createElement('li');
        indicator.innerHTML = `<button type="button" role="tab" aria-controls="carousel-item-${index}" aria-selected="${index === 0 ? 'true' : 'false'}" tabindex="${index === 0 ? '0' : '-1'}">${index + 1}</button>`;
        indicator.addEventListener('click', () => {
          goToSlide(index);
        });
        indicators.appendChild(indicator);
      });
    } else {
      // Clear indicators on desktop
      indicators.innerHTML = '';
    }
  }
  
  function updateCarousel() {
    // Don't update carousel on desktop
    if (isDesktop()) return;
    
    const items = content.querySelectorAll('.cmp-carousel__item');
    const indicatorButtons = indicators.querySelectorAll('button');
    
    items.forEach((item, index) => {
      item.classList.toggle('cmp-carousel__item--active', index === currentIndex);
      item.setAttribute('aria-hidden', index !== currentIndex);
    });
    
    indicatorButtons.forEach((btn, index) => {
      btn.setAttribute('aria-selected', index === currentIndex);
      btn.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
    });
    
    content.style.transform = `translateX(-${currentIndex * 100}%)`;
  }
  
  function goToSlide(index) {
    if (isDesktop()) return;
    currentIndex = index;
    updateCarousel();
  }
  
  function nextSlide() {
    if (isDesktop()) return;
    currentIndex = (currentIndex + 1) % products.length;
    updateCarousel();
  }
  
  function prevSlide() {
    if (isDesktop()) return;
    currentIndex = (currentIndex - 1 + products.length) % products.length;
    updateCarousel();
  }
  
  function startAutoPlay() {
    if (!isDesktop() && !autoPlayInterval) {
      autoPlayInterval = setInterval(nextSlide, 5000);
    }
  }
  
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }
  
  function handleResize() {
    if (isDesktop()) {
      stopAutoPlay();
      // Reset transform on desktop
      content.style.transform = '';
      // Show all items on desktop
      const items = content.querySelectorAll('.cmp-carousel__item');
      items.forEach((item) => {
        item.classList.remove('cmp-carousel__item--active');
        item.setAttribute('aria-hidden', 'false');
      });
      // Clear indicators on desktop
      indicators.innerHTML = '';
    } else {
      createIndicators();
      updateCarousel();
      startAutoPlay();
    }
  }
  
  // Event listeners
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);
  
  // Listen for window resize
  window.addEventListener('resize', handleResize);
  
  // Initial setup
  createIndicators();
  handleResize();
}

// Initialize tooltip functionality
function initializeTooltips(container) {
  // Check if tooltip manager exists, if not create it
  if (typeof window.tooltipManager === 'undefined') {
    // Import and initialize tooltip manager
    import('../../webpack/components/tooltip/js/_tooltip.js').then(() => {
      if (window.tooltipManager) {
        // Register tooltips in the container
        const tooltipTriggers = container.querySelectorAll('[data-tooltip-trigger]');
        tooltipTriggers.forEach(trigger => {
          window.tooltipManager.registerTooltip(trigger);
        });
      }
    });
  } else {
    // Register tooltips in the container
    const tooltipTriggers = container.querySelectorAll('[data-tooltip-trigger]');
    tooltipTriggers.forEach(trigger => {
      window.tooltipManager.registerTooltip(trigger);
    });
  }
}

export default async function decorate(block) {
  // Get configuration from block data
  const config = {};
  const rows = [...block.children];
  
  rows.forEach(row => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
      const value = cells[1].textContent.trim();
      config[key] = value;
    }
  });
  
  // Get configuration values
  const sectionTitle = config['section-title'] || 'Hot Products';
  const itemCount = parseInt(config['item-count'] || config['items'] || '3', 10);
  const viewAllLink = config['view-all-link'] || '/products';
  const viewAllText = config['view-all-text'] || 'View all';
  
  // Show loading state
  block.innerHTML = '<div class="product-card-loading">Loading products...</div>';
  
  try {
    // Fetch product data
    const products = await fetchProductData('/mock-api/products', itemCount);
    
    if (!products || products.length === 0) {
      block.innerHTML = '<div class="product-card-error">No products found.</div>';
      return;
    }
    
    // Create main container with title and view all link
    const container = document.createElement('div');
    container.className = 'product-card-section';
    container.innerHTML = `
      <div class="product-card-header">
        <h2 class="product-card-title">${sectionTitle}</h2>
      </div>
      
      <div class="product-card-carousel">
        <div class="cmp-carousel" role="group" aria-live="polite" aria-roledescription="carousel">
          <div class="cmp-carousel__content">
            ${products.map((product, index) => `
              <div class="cmp-carousel__item ${index === 0 ? 'cmp-carousel__item--active' : ''}" id="carousel-item-${index}" role="tabpanel" aria-hidden="${index !== 0}">
              </div>
            `).join('')}
          </div>
          
          <div class="cmp-carousel__actions">
            <button class="cmp-carousel__action cmp-carousel__action--previous" type="button" aria-label="${getPlaceholder('previous')}">
              <span class="icon icon--arrow-left">&#8249;</span>
            </button>
            <button class="cmp-carousel__action cmp-carousel__action--next" type="button" aria-label="${getPlaceholder('next')}">
              <span class="icon icon--arrow-right">&#8250;</span>
            </button>
          </div>
          
          <ol class="cmp-carousel__indicators" role="tablist" aria-label="Choose a slide to display"></ol>
        </div>
      </div>
      
      <div class="product-card-footer">
        <a href="${viewAllLink}" class="product-card-view-all">
          ${viewAllText} <span class="view-all-arrow">&#8250;</span>
        </a>
      </div>
    `;
    
    // Add product cards to carousel items
    const carouselItems = container.querySelectorAll('.cmp-carousel__item');
    products.forEach((product, index) => {
      const productCard = createProductCard(product);
      carouselItems[index].appendChild(productCard);
    });
    
    // Replace block content
    block.textContent = '';
    block.appendChild(container);
    
    // Initialize carousel functionality
    initializeCarousel(container.querySelector('.cmp-carousel'), products);
    
    // Initialize tooltips
    initializeTooltips(container);
    
    // Add instrumentation
    moveInstrumentation(block, container);
    
  } catch (error) {
    console.error('Error loading product cards:', error);
    block.innerHTML = '<div class="product-card-error">Error loading products. Please try again later.</div>';
  }
}
