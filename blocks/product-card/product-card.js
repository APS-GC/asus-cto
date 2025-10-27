import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Transform API response to component format
function transformProductData(apiProduct) {
  return {
    id: apiProduct.sku,
    name: apiProduct.name,
    model: apiProduct.modelName,
    image: apiProduct.mainImage,
    imageHover: apiProduct.hoverImage,
    price: apiProduct.specialPrice || apiProduct.price,
    originalPrice: apiProduct.price,
    discount: apiProduct.savedPrice,
    bazaarvoiceProductId: apiProduct.sku,
    benchmarkGame: apiProduct.gameTitle,
    fps: apiProduct.fps,
    specs: apiProduct.keySpec ? apiProduct.keySpec.map(spec => spec.name) : [],
    productUrl: apiProduct.urlKey,
    productTags: apiProduct.productTags || [],
    buyButtonStatus: apiProduct.buyButtonStatus || 'Buy now',
    gamePriority: apiProduct.gamePriority || [],
    timeSpyScore: apiProduct.timeSpyOverallScore,
    quickSpec: apiProduct.quickSpec ? apiProduct.quickSpec[0] : null
  };
}

// Fetch product data from API with fallback logic
async function fetchProductData(endpoint = 'https://author-p165753-e1767020.adobeaemcloud.com/bin/asuscto/fetchHotProducts', maxProducts = null) {
  const endpoints = [
    endpoint, // Try the provided endpoint first
    'https://author-p165753-e1767020.adobeaemcloud.com/bin/asuscto/fetchHotProducts', // Fallback to author (working)
    'https://publish-p165753-e1767020.adobeaemcloud.com/bin/asuscto/fetchHotProducts' // Try publish as second fallback
  ];
  
  // Remove duplicates and keep order
  const uniqueEndpoints = [...new Set(endpoints)];
  
  for (const apiEndpoint of uniqueEndpoints) {
    try {
      console.log(`Attempting to fetch from: ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Add common authentication headers
          'Cache-Control': 'no-cache'
        },
        // Include credentials for author endpoints
        credentials: apiEndpoint.includes('author') ? 'include' : 'omit',
        // Handle CORS
        mode: 'cors'
      });
      
      if (!response.ok) {
        console.warn(`API endpoint ${apiEndpoint} returned ${response.status}: ${response.statusText}`);
        continue; // Try next endpoint
      }
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`API endpoint ${apiEndpoint} returned non-JSON content: ${contentType}`);
        const textResponse = await response.text();
        console.warn(`Response preview: ${textResponse.substring(0, 200)}...`);
        continue; // Try next endpoint
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        console.warn(`Invalid API response format from ${apiEndpoint}:`, data);
        continue; // Try next endpoint
      }
      
      console.log(`Successfully fetched data from: ${apiEndpoint}`, data);
      // Transform API data to component format - fetch all products, don't limit here
      const allProducts = data.results.map(transformProductData);
      
      // Only limit if maxProducts is specified (for fallback scenarios)
      return maxProducts ? allProducts.slice(0, maxProducts) : allProducts;
        
    } catch (error) {
      console.warn(`Error fetching from ${apiEndpoint}:`, error.message);
      if (error.message.includes('JSON')) {
        console.warn('This usually means the endpoint returned HTML instead of JSON (possibly a login page)');
      }
      continue; // Try next endpoint
    }
  }
  
  // If all endpoints fail, return fallback data
  console.error('All API endpoints failed, using fallback data');
  return getFallbackProductData(maxProducts || 6);
}

// Fallback data when API fails
function getFallbackProductData(limit = 6) {
  const fallbackProducts = [
    {
      id: 'fallback-1',
      name: 'ROG Gaming Desktop',
      model: 'Contact Support',
      image: '/content/dam/asus-cto/products/fallback-image.webp',
      imageHover: null,
      price: 'N/A',
      originalPrice: 'N/A',
      discount: '0',
      bazaarvoiceProductId: 'fallback-1',
      benchmarkGame: 'Various Games',
      fps: 'TBD',
      specs: ['High Performance Gaming', 'Contact for Details'],
      productUrl: '#',
      productTags: [],
      buyButtonStatus: 'Contact Us',
      gamePriority: [],
      timeSpyScore: null,
      quickSpec: null
    },
    {
      id: 'fallback-2',
      name: 'ASUS Gaming Laptop',
      model: 'Contact Support',
      image: '/content/dam/asus-cto/products/fallback-image.webp',
      imageHover: null,
      price: 'N/A',
      originalPrice: 'N/A',
      discount: '0',
      bazaarvoiceProductId: 'fallback-2',
      benchmarkGame: 'Various Games',
      fps: 'TBD',
      specs: ['High Performance Gaming', 'Contact for Details'],
      productUrl: '#',
      productTags: [],
      buyButtonStatus: 'Contact Us',
      gamePriority: [],
      timeSpyScore: null,
      quickSpec: null
    },
    {
      id: 'fallback-3',
      name: 'Gaming Monitor',
      model: 'Contact Support',
      image: '/content/dam/asus-cto/products/fallback-image.webp',
      imageHover: null,
      price: 'N/A',
      originalPrice: 'N/A',
      discount: '0',
      bazaarvoiceProductId: 'fallback-3',
      benchmarkGame: 'Various Games',
      fps: 'TBD',
      specs: ['High Performance Gaming', 'Contact for Details'],
      productUrl: '#',
      productTags: [],
      buyButtonStatus: 'Contact Us',
      gamePriority: [],
      timeSpyScore: null,
      quickSpec: null
    }
  ];
  
  // Generate at least 6 fallback items to ensure carousel functionality
  const minItems = Math.max(limit, 6);
  return Array(minItems).fill(null).map((_, index) => ({
    ...fallbackProducts[index % fallbackProducts.length],
    id: `fallback-${index + 1}`,
    name: `${fallbackProducts[index % fallbackProducts.length].name} ${index + 1}`
  }));
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

// Generate dynamic status badges based on product tags
function generateStatusBadges(productTags) {
  if (!productTags || productTags.length === 0) {
    return `
      <span class="cmp-product-card__status-item cmp-product-card__status--in-stock">${getPlaceholder('in-stock')}</span>
    `;
  }
  
  return productTags.map(tag => {
    const tagLower = tag.toLowerCase();
    let statusClass = '';
    let displayText = '';
    
    switch (tagLower) {
      case 'hot':
        statusClass = 'cmp-product-card__status--hot';
        displayText = 'Hot';
        break;
      case 'new':
        statusClass = 'cmp-product-card__status--new';
        displayText = getPlaceholder('new');
        break;
      case 'deal':
        statusClass = 'cmp-product-card__status--deal';
        displayText = getPlaceholder('deal');
        break;
      default:
        statusClass = 'cmp-product-card__status--custom';
        displayText = tag;
    }
    
    return `<span class="cmp-product-card__status-item ${statusClass}">${displayText}</span>`;
  }).join('') + `<span class="cmp-product-card__status-item cmp-product-card__status--in-stock">${getPlaceholder('in-stock')}</span>`;
}

// Generate enhanced FPS tooltip with multiple games
function generateFpsTooltip(product) {
  console.log('Generating FPS tooltip for product:', product.id, 'Data:', {
    benchmarkGame: product.benchmarkGame,
    fps: product.fps,
    gamePriority: product.gamePriority,
    timeSpyScore: product.timeSpyScore
  });

  // Check if we have any FPS data at all
  if (!product.benchmarkGame && !product.fps && (!product.gamePriority || product.gamePriority.length === 0)) {
    console.log('FPS Tooltip: No FPS data available, skipping tooltip for product:', product.id);
    return '';
  }

  // Fallback to simple tooltip if no rich data available
  if (!product.gamePriority || !Array.isArray(product.gamePriority) || product.gamePriority.length === 0) {
    if (product.benchmarkGame && product.fps) {
      console.log('FPS Tooltip: Using simple fallback content for product:', product.id);
      return `
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
              <td>${product.benchmarkGame}</td>
              <td>${product.fps} FPS</td>
              <td>--</td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      console.log('FPS Tooltip: No sufficient data for simple tooltip, skipping for product:', product.id);
      return '';
    }
  }
  
  // Use API data for rich tooltip
  try {
    const gameRows = product.gamePriority.slice(0, 6).map(game => {
      if (!game || typeof game !== 'object') {
        console.warn('FPS Tooltip: Invalid game data:', game);
        return '';
      }
      
      return `
        <tr>
          <td>${game.gameTitle || 'Unknown Game'}</td>
          <td>${game.fullHdFps ? `${game.fullHdFps} FPS` : '--'}</td>
          <td>${game.quadHdFps ? `${game.quadHdFps} FPS` : '--'}</td>
        </tr>
      `;
    }).filter(row => row !== '').join('');
    
    // If no valid game rows, try simple fallback
    if (!gameRows.trim()) {
      console.log('FPS Tooltip: No valid game rows, trying simple fallback for product:', product.id);
      if (product.benchmarkGame && product.fps) {
        return `
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
                <td>${product.benchmarkGame}</td>
                <td>${product.fps} FPS</td>
                <td>--</td>
              </tr>
            </tbody>
          </table>
        `;
      } else {
        return '';
      }
    }
    
    console.log('FPS Tooltip: Using rich content for product:', product.id);
    return `
      <table class="cmp-product-card__fps-table">
        <thead>
          <tr>
            <th>Game FPS</th>
            <th>1080P</th>
            <th>1440P</th>
          </tr>
        </thead>
        <tbody>
          ${gameRows}
        </tbody>
      </table>
      ${product.timeSpyScore ? `
        <div class="cmp-product-card__fps-benchmark">
          <small>3DMark Time Spy: ${product.timeSpyScore}</small>
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('FPS Tooltip: Error generating rich tooltip:', error);
    // Try simple fallback on error
    if (product.benchmarkGame && product.fps) {
      return `
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
              <td>${product.benchmarkGame}</td>
              <td>${product.fps} FPS</td>
              <td>--</td>
            </tr>
          </tbody>
        </table>
      `;
    }
    return '';
  }
}

// Create product card HTML
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'cmp-product-card';
  
  // Determine the product URL
  const productUrl = product.productUrl && product.productUrl !== '#' ? product.productUrl : 'pdp.html';
  const buyButtonText = product.buyButtonStatus || getPlaceholder('buy-now');
  
  card.innerHTML = `
    <div class="cmp-product-card__header">
      <div class="cmp-product-card__status">
        ${generateStatusBadges(product.productTags)}
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
          <a href="${productUrl}" aria-label="${buyButtonText} ${product.name}" target="${product.productUrl && product.productUrl.startsWith('http') ? '_blank' : '_self'}">${product.name}</a>
        </div>
        <p class="cmp-product-card__model">
          <a href="${productUrl}#product-features" target="${product.productUrl && product.productUrl.startsWith('http') ? '_blank' : '_self'}">${product.model}</a>
        </p>
      </div>

      <div class="cmp-product-card__rating_and_compare">
        <div class="cmp-product-card__rating">
          <div
            data-bv-show="inline_rating"
            data-bv-product-id="${product.bazaarvoiceProductId}"
            data-bv-redirect-url="${productUrl}#product-reviews"
          ></div>
        </div>
        <div class="cmp-product-card__compare">
          <input type="checkbox" class="cmp-product-card__compare-checkbox" id="compare-${product.id}" data-id="${product.id}"
            data-name="${product.name}" data-model="${product.model}" data-sku="${product.model}" data-image="${product.image}"
            data-pdp="${productUrl}" data-add-to-compare />

          <label for="compare-${product.id}" class="cmp-product-card__compare-label">${getPlaceholder('compare')}</label>
        </div>
      </div>

      ${(product.benchmarkGame && product.fps) || (product.gamePriority && product.gamePriority.length > 0) ? `
        <div class="cmp-product-card__fps">
          <p class="cmp-product-card__fps-game">
            ${product.benchmarkGame || 'Gaming Performance'}
          </p>

          <button class="cmp-product-card__fps-score" data-tooltip-trigger aria-describedby="fps-details-${product.id}" data-tooltip-position="right">
              FPS: ${product.fps || 'Various'}
          </button>
          <div id="fps-details-${product.id}" class="tooltip__content" role="tooltip">
            ${generateFpsTooltip(product)}
          </div>
        </div>
      ` : ''}

      <ul class="cmp-product-card__specs">
        ${product.specs.map(spec => `<li class="cmp-product-card__spec-item">${spec}</li>`).join('')}
      </ul>

      <div class="cmp-product-card__estore">
        <div class="cmp-product-card__estore-line">
          <span class="cmp-product-card__estore-label">${getPlaceholder('estore-price')}</span>

          <div class="cmp-product-card__estore-icon-wrapper">
            <button class="cmp-product-card__estore-icon" aria-label="Information about ASUS estore price.">
              <span class="visually-hidden"></span>
            </button>
            <div class="cmp-product-card__tooltip">
              ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be
              available on estore and are for reference only.
            </div>
          </div>
        </div>
      </div>

      <div class="cmp-product-card__price-block">
        <span class="cmp-product-card__price">$${product.price}</span>
        ${product.originalPrice && product.originalPrice !== product.price ? `<span class="cmp-product-card__original-price">$${product.originalPrice}</span>` : ''}
        ${product.discount && product.discount !== '0' ? `<span class="cmp-product-card__discount">${getPlaceholder('save')} $${product.discount}</span>` : ''}
      </div>
    </div>

    <div class="cmp-product-card__footer">
      <button class="cmp-button cmp-product-card__buy-button btn" onclick="window.open('${productUrl}', '${product.productUrl && product.productUrl.startsWith('http') ? '_blank' : '_self'}')">${buyButtonText}</button>
    </div>
  `;
  
  return card;
}

// Initialize carousel functionality
function initializeCarousel(carousel, products, itemsToShow = 3, autoplayInterval = 5000) {
  const content = carousel.querySelector('.cmp-carousel__content');
  const prevBtn = carousel.querySelector('.cmp-carousel__action--previous');
  const nextBtn = carousel.querySelector('.cmp-carousel__action--next');
  const indicators = carousel.querySelector('.cmp-carousel__indicators');
  
  let currentIndex = 0;
  let autoPlayTimer = null;
  
  // Check screen sizes
  function isDesktop() {
    return window.innerWidth >= 1024;
  }
  
  function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }
  
  function isMobile() {
    return window.innerWidth < 768;
  }
  
  // Calculate how many slides we need based on device and items to show
  function getTotalSlides() {
    if (isDesktop()) {
      // Desktop: no carousel, static display of itemsToShow products only
      return 1;
    } else if (isTablet()) {
      // Tablet: show itemsToShow at a time, calculate how many sets we need
      return Math.ceil(products.length / itemsToShow);
    } else {
      // Mobile: show one product at a time
      return products.length;
    }
  }
  
  // Get products to show for current slide
  function getProductsForSlide(slideIndex) {
    if (isDesktop()) {
      // Desktop: show only first itemsToShow products
      return products.slice(0, itemsToShow);
    } else if (isTablet()) {
      // Tablet: show itemsToShow products per slide
      const startIndex = slideIndex * itemsToShow;
      return products.slice(startIndex, startIndex + itemsToShow);
    } else {
      // Mobile: show one product at a time
      return [products[slideIndex]];
    }
  }
  
  // Create indicators
  function createIndicators() {
    const totalSlides = getTotalSlides();
    
    if (isDesktop() || totalSlides <= 1) {
      // No indicators needed for desktop or single slide
      indicators.innerHTML = '';
      return;
    }
    
    // Clear existing indicators
    indicators.innerHTML = '';
    
    for (let i = 0; i < totalSlides; i++) {
      const indicator = document.createElement('li');
      indicator.innerHTML = `<button type="button" role="tab" aria-controls="carousel-slide-${i}" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}">${i + 1}</button>`;
      indicator.addEventListener('click', () => {
        goToSlide(i);
      });
      indicators.appendChild(indicator);
    }
  }
  
  // Update carousel display
  function updateCarousel() {
    const totalSlides = getTotalSlides();
    if (totalSlides <= 1) return; // Only skip if there's actually nothing to navigate
    
    const indicatorButtons = indicators.querySelectorAll('button');
    
    // Update indicators
    indicatorButtons.forEach((btn, index) => {
      btn.setAttribute('aria-selected', index === currentIndex);
      btn.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
    });
    
    if (isDesktop() || isTablet()) {
      // Desktop and Tablet: move by sets of itemsToShow
      const translatePercent = currentIndex * 100;
      content.style.transform = `translateX(-${translatePercent}%)`;
    } else {
      // Mobile: move by 100% per product
      content.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
  }
  
  function goToSlide(index) {
    const totalSlides = getTotalSlides();
    if (totalSlides <= 1) return; // Only skip if there's actually nothing to navigate
    currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
    updateCarousel();
  }
  
  function nextSlide() {
    const totalSlides = getTotalSlides();
    if (totalSlides <= 1) return; // Only skip if there's actually nothing to navigate
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarousel();
  }
  
  function prevSlide() {
    const totalSlides = getTotalSlides();
    if (totalSlides <= 1) return; // Only skip if there's actually nothing to navigate
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateCarousel();
  }
  
  function startAutoPlay() {
    const totalSlides = getTotalSlides();
    if (!isDesktop() && !autoPlayTimer && autoplayInterval > 0 && totalSlides > 1) {
      autoPlayTimer = setInterval(nextSlide, autoplayInterval);
    }
  }
  
  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }
  
  function handleResize() {
    const totalSlides = getTotalSlides();
    
    if (isDesktop()) {
      stopAutoPlay();
      // Reset transform on desktop
      content.style.transform = '';
      currentIndex = 0;
    } else {
      // Reset currentIndex if it's out of bounds after resize
      if (currentIndex >= totalSlides) {
        currentIndex = 0;
      }
      updateCarousel();
      startAutoPlay();
    }
    
    createIndicators();
  }
  
  // Event listeners
  prevBtn.addEventListener('click', () => {
    console.log('Previous button clicked. Current index:', currentIndex, 'Total slides:', getTotalSlides(), 'Desktop:', isDesktop(), 'Window width:', window.innerWidth, 'Products:', products.length, 'Items to show:', itemsToShow);
    stopAutoPlay();
    prevSlide();
    // Restart autoplay after manual interaction
    setTimeout(startAutoPlay, 1000);
  });
  
  nextBtn.addEventListener('click', () => {
    console.log('Next button clicked. Current index:', currentIndex, 'Total slides:', getTotalSlides(), 'Desktop:', isDesktop(), 'Window width:', window.innerWidth, 'Products:', products.length, 'Items to show:', itemsToShow);
    stopAutoPlay();
    nextSlide();
    // Restart autoplay after manual interaction
    setTimeout(startAutoPlay, 1000);
  });
  
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);
  
  // Listen for window resize
  window.addEventListener('resize', handleResize);
  
  // Initial setup
  createIndicators();
  handleResize();
}

// Enhanced tooltip implementation matching webpack components
function initializeTooltips(container) {
  const tooltipTriggers = container.querySelectorAll('[data-tooltip-trigger]');
  
  console.log(`Initializing ${tooltipTriggers.length} tooltips in container:`, container);
  
  tooltipTriggers.forEach((trigger, index) => {
    const tooltipId = trigger.getAttribute('aria-describedby');
    const tooltip = document.getElementById(tooltipId);
    
    console.log(`Tooltip ${index + 1}: Trigger:`, trigger, 'ID:', tooltipId, 'Content element:', tooltip);
    
    if (!tooltip) {
      console.warn(`Tooltip content not found for trigger ${index + 1} with ID: ${tooltipId}`);
      return;
    }
    
    // Ensure tooltip has content
    if (!tooltip.innerHTML.trim()) {
      console.warn(`Tooltip ${index + 1} has empty content:`, tooltip);
      return;
    }
    
    // Move tooltip to body for better positioning
    if (tooltip.parentElement !== document.body) {
      document.body.appendChild(tooltip);
      console.log(`Moved tooltip ${index + 1} to body`);
    }
    
    // Set accessibility attributes
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    
    // Initial styles
    tooltip.style.position = 'fixed';
    tooltip.style.top = '-9999px';
    tooltip.style.left = '-9999px';
    tooltip.style.zIndex = '99999';
    
    // Ensure tooltip has minimum styling for visibility
    tooltip.style.maxWidth = tooltip.style.maxWidth || '400px';
    tooltip.style.padding = tooltip.style.padding || '1rem';
    tooltip.style.backgroundColor = tooltip.style.backgroundColor || 'var(--color-primary-950, #1a1a1a)';
    tooltip.style.color = tooltip.style.color || 'var(--color-primary, #ffffff)';
    tooltip.style.borderRadius = tooltip.style.borderRadius || 'var(--border-radius, 8px)';
    tooltip.style.fontSize = tooltip.style.fontSize || '0.875rem';
    
    const position = trigger.getAttribute('data-tooltip-position') || 'auto';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    const calculateBestPosition = (position, triggerRect, tooltipRect) => {
      const padding = 13; // 8px spacing + 5px arrow size
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const space = {
        top: triggerRect.top,
        bottom: viewport.height - triggerRect.bottom,
        left: triggerRect.left,
        right: viewport.width - triggerRect.right,
      };
      
      const strategies = {
        top: () => ({
          top: triggerRect.top - tooltipRect.height - padding,
          left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
          currentPosition: 'top',
        }),
        bottom: () => ({
          top: triggerRect.bottom + padding,
          left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
          currentPosition: 'bottom',
        }),
        left: () => ({
          left: triggerRect.left - tooltipRect.width - padding,
          top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
          currentPosition: 'left',
        }),
        right: () => ({
          left: triggerRect.right + padding,
          top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
          currentPosition: 'right',
        }),
        auto: () => {
          const positions = [
            { valid: space.right > tooltipRect.width + padding, left: triggerRect.right + padding, top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2, currentPosition: 'right', priority: space.right },
            { valid: space.bottom > tooltipRect.height + padding, top: triggerRect.bottom + padding, left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2, currentPosition: 'bottom', priority: space.bottom },
            { valid: space.top > tooltipRect.height + padding, top: triggerRect.top - tooltipRect.height - padding, left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2, currentPosition: 'top', priority: space.top },
            { valid: space.left > tooltipRect.width + padding, left: triggerRect.left - tooltipRect.width - padding, top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2, currentPosition: 'left', priority: space.left },
          ];
          const valid = positions.filter((p) => p.valid);
          return valid.length > 0 ? valid.reduce((best, cur) => (cur.priority > best.priority ? cur : best)) : positions[0];
        },
      };
      
      return strategies[position] ? strategies[position]() : strategies.auto();
    };
    
    const positionTooltip = () => {
      const triggerRect = trigger.getBoundingClientRect();
      tooltip.style.visibility = 'hidden';
      tooltip.classList.add('tooltip--visible');
      const tooltipRect = tooltip.getBoundingClientRect();
      const posResult = calculateBestPosition(position, triggerRect, tooltipRect);
      
      tooltip.style.top = `${Math.max(13, Math.round(posResult.top))}px`;
      tooltip.style.left = `${Math.max(13, Math.round(posResult.left))}px`;
      
      tooltip.classList.remove('tooltip--position-top', 'tooltip--position-bottom', 'tooltip--position-left', 'tooltip--position-right');
      tooltip.classList.add(`tooltip--position-${posResult.currentPosition}`);
      tooltip.style.visibility = '';
    };
    
    const showTooltip = () => {
      document.querySelectorAll('.tooltip__content.tooltip--visible').forEach(t => {
        if (t !== tooltip) {
          t.classList.remove('tooltip--visible');
          t.setAttribute('aria-hidden', 'true');
        }
      });
      
      setTimeout(() => {
        positionTooltip();
        tooltip.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-expanded', 'true');
      }, 100);
    };
    
    const hideTooltip = () => {
      tooltip.classList.remove('tooltip--visible');
      tooltip.setAttribute('aria-hidden', 'true');
      trigger.setAttribute('aria-expanded', 'false');
    };
    
    // Event listeners
    if (isTouch) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const isVisible = tooltip.classList.contains('tooltip--visible');
        if (isVisible) { hideTooltip(); } else { showTooltip(); }
      });
      document.addEventListener('click', (e) => {
        if (!tooltip.contains(e.target) && !trigger.contains(e.target)) { hideTooltip(); }
      });
    } else {
      trigger.addEventListener('mouseenter', showTooltip);
      trigger.addEventListener('mouseleave', hideTooltip);
      trigger.addEventListener('focus', showTooltip);
      trigger.addEventListener('blur', hideTooltip);
    }
  });
}

// Check if we're in Universal Editor authoring mode
function isAuthoringMode() {
  return window.hlx?.rum?.isSelected || 
         document.body.classList.contains('adobe-ue-edit') ||
         window.location.search.includes('view-doc-source=true') ||
         window.location.hostname === 'author-p105462-e991028.adobeaemcloud.com' ||
         document.querySelector('script[src*="universal-editor"]') !== null ||
         window.adobeIMS?.isSignedInUser();
}

// Get configuration value with fallback for both hyphenated and camelCase keys
function getConfigValue(config, hyphenatedKey, camelCaseKey, defaultValue) {
  return config[hyphenatedKey] || config[camelCaseKey] || defaultValue;
}

// Create authoring mode structure for Universal Editor with full visual context
async function createAuthoringStructure(config, block = null) {
  // If block is provided, try to read current values from existing UE fields
  let sectionTitle = getConfigValue(config, 'section-title', 'sectionTitle', 'Hot Products');
  let itemCount = parseInt(getConfigValue(config, 'item-count', 'itemCount', '3'), 10);
  let viewAllLink = getConfigValue(config, 'view-all-link', 'viewAllLink', '/products');
  let viewAllText = getConfigValue(config, 'view-all-text', 'viewAllText', 'View all');
  let apiEndpoint = getConfigValue(config, 'api-endpoint', 'apiEndpoint', 'https://author-p165753-e1767020.adobeaemcloud.com/bin/asuscto/fetchHotProducts');

  // If block exists, read current values from UE fields (in case they've been edited)
  if (block) {
    const existingSectionTitle = block.querySelector('[data-aue-prop="sectionTitle"]');
    if (existingSectionTitle) {
      sectionTitle = existingSectionTitle.textContent.trim() || sectionTitle;
    }
    
    const existingItemCount = block.querySelector('[data-aue-prop="itemCount"]');
    if (existingItemCount) {
      const newItemCount = parseInt(existingItemCount.textContent.trim(), 10);
      if (!isNaN(newItemCount) && newItemCount > 0) {
        itemCount = newItemCount;
      }
    }
    
    const existingViewAllLink = block.querySelector('[data-aue-prop="viewAllLink"]');
    if (existingViewAllLink) {
      viewAllLink = existingViewAllLink.textContent.trim() || viewAllLink;
    }
    
    const existingViewAllText = block.querySelector('[data-aue-prop="viewAllText"]');
    if (existingViewAllText) {
      viewAllText = existingViewAllText.textContent.trim() || viewAllText;
    }
    
    const existingApiEndpoint = block.querySelector('[data-aue-prop="apiEndpoint"]');
    if (existingApiEndpoint) {
      apiEndpoint = existingApiEndpoint.textContent.trim() || apiEndpoint;
    }
  }

  // Use the same fetchProductData function as the published version
  const products = await fetchProductData(apiEndpoint, itemCount);
  
  // Generate product cards HTML for authoring using the same createProductCard function
  const productCardsElements = products.map((product, index) => {
    const productCard = createProductCard(product);
    return `
      <div class="cmp-carousel__item ${index === 0 ? 'cmp-carousel__item--active' : ''}" id="carousel-item-${index}" role="tabpanel" aria-hidden="${index !== 0}">
        ${productCard.outerHTML}
      </div>
    `;
  }).join('');

  return `
    <div class="product-card-section">
      <div class="product-card-header">
        <h2 class="product-card-title" data-aue-type="text" data-aue-label="Section Title" data-aue-prop="sectionTitle">${sectionTitle}</h2>
      </div>
      
      <div class="product-card-carousel">
        <div class="cmp-carousel" role="group" aria-live="polite" aria-roledescription="carousel">
          <div class="cmp-carousel__content">
            ${productCardsElements}
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
        <a class="product-card-view-all">
          <span data-aue-type="text" data-aue-label="View All Text" data-aue-prop="viewAllText">${viewAllText}</span> <span class="view-all-arrow">&#8250;</span>
        </a>
        <div style="display: none;">
          <div data-aue-type="text" data-aue-label="View All Link" data-aue-prop="viewAllLink">${viewAllLink}</div>
          <div data-aue-type="text" data-aue-label="Item Count" data-aue-prop="itemCount">${itemCount}</div>
          <div data-aue-type="text" data-aue-label="API Endpoint" data-aue-prop="apiEndpoint">${apiEndpoint}</div>
        </div>
      </div>
    </div>
  `;
}

// Function to parse configuration from block data
function parseConfig(block) {
  const config = {};
  const rows = [...block.children];
  
  console.log('parseConfig - Total rows:', rows.length); // Debug log
  
  // Expected configuration mapping based on _product-card.json order
  const configMapping = [
    { key: 'section-title', camelKey: 'sectionTitle', defaultValue: 'Hot Products' },
    { key: 'item-count', camelKey: 'itemCount', defaultValue: '3' },
    { key: 'view-all-link', camelKey: 'viewAllLink', defaultValue: '/products' },
    { key: 'view-all-text', camelKey: 'viewAllText', defaultValue: 'View all' },
    { key: 'api-endpoint', camelKey: 'apiEndpoint', defaultValue: 'https://author-p165753-e1767020.adobeaemcloud.com/bin/asuscto/fetchHotProducts' },
    { key: 'autoplay-interval', camelKey: 'autoplayInterval', defaultValue: '5000' }
  ];
  
  rows.forEach((row, index) => {
    const cells = [...row.children];
    console.log(`Row ${index} has ${cells.length} cells`); // Debug log
    
    if (cells.length >= 2) {
      // Traditional two-column structure (key-value pairs)
      const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
      const value = cells[1].textContent.trim();
      config[key] = value;
      
      // Also store camelCase version for UE compatibility
      const camelCaseKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      config[camelCaseKey] = value;
      
      console.log(`Added config (2-cell): ${key} = ${value}`); // Debug log
    } else if (cells.length === 1) {
      const cellText = cells[0].textContent.trim();
      console.log(`Single cell content: "${cellText}"`); // Debug log
      
      if (cellText.includes(':')) {
        // Handle colon-separated key:value pairs
        const [key, value] = cellText.split(':').map(s => s.trim());
        if (key && value) {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '-');
          config[normalizedKey] = value;
          
          // Also store camelCase version for UE compatibility
          const camelCaseKey = normalizedKey.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
          config[camelCaseKey] = value;
          
          console.log(`Added config (colon-separated): ${normalizedKey} = ${value}`); // Debug log
        }
      } else if (cellText && index < configMapping.length) {
        // Handle UE single-cell structure - map by row index
        const mapping = configMapping[index];
        config[mapping.key] = cellText;
        config[mapping.camelKey] = cellText;
        
        console.log(`Added config (index-mapped): ${mapping.key} = ${cellText}`); // Debug log
      } else if (!cellText && index < configMapping.length) {
        // Handle empty cells - use default values
        const mapping = configMapping[index];
        config[mapping.key] = mapping.defaultValue;
        config[mapping.camelKey] = mapping.defaultValue;
        
        console.log(`Added config (default): ${mapping.key} = ${mapping.defaultValue}`); // Debug log
      }
    } else {
      console.log(`Row ${index} skipped - no cells or empty row`); // Debug log
    }
  });
  
  console.log('Final config:', config); // Debug log
  return config;
}

// Function to render authoring mode with event listeners
async function renderAuthoringMode(block) {
  const config = parseConfig(block);
  
  block.innerHTML = '<div class="product-card-loading">Loading products...</div>';
  try {
    const authoringStructure = await createAuthoringStructure(config, block);
    block.innerHTML = authoringStructure;
    
    // Add event listeners for UE field changes
    const ueFields = block.querySelectorAll('[data-aue-prop]');
    ueFields.forEach(field => {
      // Listen for content changes (when UE updates the field)
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            // Debounce the re-render to avoid excessive updates
            clearTimeout(field.updateTimeout);
            field.updateTimeout = setTimeout(() => {
              renderAuthoringMode(block);
            }, 500);
          }
        });
      });
      
      observer.observe(field, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      // Also listen for input events
      field.addEventListener('input', () => {
        clearTimeout(field.updateTimeout);
        field.updateTimeout = setTimeout(() => {
          renderAuthoringMode(block);
        }, 500);
      });
    });
    
  } catch (error) {
    console.error('Error loading authoring structure:', error);
    block.innerHTML = '<div class="product-card-error">Error loading authoring view. Please try again later.</div>';
  }
}

export default async function decorate(block) {
  // Parse initial configuration
  const config = parseConfig(block);

  // If we're in authoring mode, show the editable structure
  if (isAuthoringMode()) {
    await renderAuthoringMode(block);
    return;
  }
  
  // Get configuration values for published mode using the helper function
  const sectionTitle = getConfigValue(config, 'section-title', 'sectionTitle', 'Hot Products');
  const itemCount = parseInt(getConfigValue(config, 'item-count', 'itemCount', '3'), 10);
  const viewAllLink = getConfigValue(config, 'view-all-link', 'viewAllLink', '/products');
  const viewAllText = getConfigValue(config, 'view-all-text', 'viewAllText', 'View all');
  const apiEndpoint = getConfigValue(config, 'api-endpoint', 'apiEndpoint', 'https://author-p165753-e1767020.adobeaemcloud.com/bin/asuscto/fetchHotProducts');
  const autoplayIntervalValue = parseInt(getConfigValue(config, 'autoplay-interval', 'autoplayInterval', '5000'), 10);
  
  // Show loading state
  block.innerHTML = '<div class="product-card-loading">Loading products...</div>';
  
  try {
    // Fetch ALL product data
    const allProducts = await fetchProductData(apiEndpoint);
    
    if (!allProducts || allProducts.length === 0) {
      block.innerHTML = '<div class="product-card-error">No products found.</div>';
      return;
    }
    
    console.log(`Fetched ${allProducts.length} products total. ItemCount: ${itemCount}. Will show ${itemCount} items at a time through ${allProducts.length} total products`);
    
    // Create main container with title and view all link - always use ALL products for carousel
    const container = document.createElement('div');
    container.className = 'product-card-section';
    container.innerHTML = `
      <div class="product-card-header">
        <h2 class="product-card-title">${sectionTitle}</h2>
      </div>
      
      <div class="product-card-carousel">
        <div class="cmp-carousel" role="group" aria-live="polite" aria-roledescription="carousel">
          <div class="cmp-carousel__content">
            ${allProducts.map((product, index) => `
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
    
    // Add ALL product cards to carousel items
    const carouselItems = container.querySelectorAll('.cmp-carousel__item');
    allProducts.forEach((product, index) => {
      const productCard = createProductCard(product);
      carouselItems[index].appendChild(productCard);
    });
    
    // Replace block content
    block.textContent = '';
    block.appendChild(container);
    
    // Initialize carousel functionality with ALL products and let it handle itemCount
    initializeCarousel(container.querySelector('.cmp-carousel'), allProducts, itemCount, autoplayIntervalValue);
    
    // Initialize tooltips
    initializeTooltips(container);
    
    // Add instrumentation  
    moveInstrumentation(block, container);
    
  } catch (error) {
    console.error('Error loading product cards:', error);
    block.innerHTML = '<div class="product-card-error">Error loading products. Please try again later.</div>';
  }
}
