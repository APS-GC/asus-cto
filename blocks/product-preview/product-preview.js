/**
 * Product Preview Block
 */

import Swiper from '../../node_modules/swiper/swiper-bundle.min.mjs';
import { openModal, createModal } from '../modal/modal.js';
import { getLocale } from '../../scripts/scripts.js';
import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';
import { getBlockConfigs } from '../../scripts/configs.js';
import { isUniversalEditor } from '../../scripts/utils.js';

/**
 * Get dummy product data for authoring mode
 * @returns {Object} Dummy product object with all fields populated
 */
function getDummyProductData() {
  return {
    sku: 'DEMO-SKU-001',
    externalId: 'DEMO-001',
    name: 'ASUS ROG Strix G16 Gaming Laptop',
    modelName: 'G614JV-AS73',
    mainImage: './clientlib-site/images/products/laptop-main.webp',
    hoverImage: './clientlib-site/images/products/laptop-hover.webp',
    additionalImages: [
      './clientlib-site/images/products/laptop-view1.webp',
      './clientlib-site/images/products/laptop-view2.webp',
      './clientlib-site/images/products/laptop-view3.webp'
    ],
    price: '1899.99',
    specialPrice: '1699.99',
    savedPrice: '200',
    productTags: ['In Stock', 'Best Seller', 'Free Shipping'],
    gameTitle: 'Cyberpunk 2077',
    fps: '120',
    keyFeatures: [
      {
        name: 'Powerful Performance',
        description: 'Intel Core i7-13650HX processor delivers exceptional gaming power'
      },
      {
        name: 'Stunning Graphics',
        description: 'NVIDIA GeForce RTX 4060 with 8GB GDDR6 for immersive visuals'
      },
      {
        name: 'Fast Display',
        description: '16" QHD 240Hz display for smooth, responsive gameplay'
      }
    ],
    keySpec: [
      'Intel Core i7-13650HX Processor',
      'NVIDIA GeForce RTX 4060 8GB',
      '16GB DDR5 RAM',
      '1TB PCIe SSD',
      '16" QHD 240Hz Display',
      'RGB Backlit Keyboard'
    ],
    gamePriority: [
      {
        gameTitle: 'Cyberpunk 2077',
        fullHdFps: '120',
        quadHdFps: '85',
        imageUrl: './clientlib-site/images/games/cyberpunk.webp'
      },
      {
        gameTitle: 'Call of Duty: Modern Warfare',
        fullHdFps: '144',
        quadHdFps: '95',
        imageUrl: './clientlib-site/images/games/cod.webp'
      },
      {
        gameTitle: 'Fortnite',
        fullHdFps: '165',
        quadHdFps: '120',
        imageUrl: './clientlib-site/images/games/fortnite.webp'
      },
      {
        gameTitle: 'Valorant',
        fullHdFps: '240',
        quadHdFps: '180',
        imageUrl: './clientlib-site/images/games/valorant.webp'
      },
      {
        gameTitle: 'Apex Legends',
        fullHdFps: '155',
        quadHdFps: '110',
        imageUrl: './clientlib-site/images/games/apex.webp'
      },
      {
        gameTitle: 'Overwatch 2',
        fullHdFps: '190',
        quadHdFps: '140',
        imageUrl: './clientlib-site/images/games/overwatch.webp'
      }
    ],
    timeSpyOverallScore: 8500
  };
}

/**
 * Get default configuration for product preview with locale
 * @param {string} locale - The locale value
 * @returns {Object} Default configuration object
 */
function getDefaultConfig(locale) {
  return {
    fpsDetailsModalPath: `/${locale}/modals/fps-details`,
    timeSpyScoreModalPath: `/${locale}/modals/time-spy-score`,
    dataSourceTooltip: 'All FPS performance data presented are theoretical and may vary in real-world usage. The FPS data is based on third-party testing conducted by UL and is provided for reference purposes only. Actual performance may differ.',
    threeMarkLogo: '',
  };
}

/**
 * Determine Time Spy Score level based on score value
 * @param {number} score - The Time Spy Score
 * @returns {number} - Level number (1-4)
 */
function getTimeSpyLevel(score) {
  if (score >= 9000) return 4;
  if (score >= 7000) return 3;
  if (score >= 5000) return 2;
  if (score >= 2000) return 1;
  return 1;
}

/**
 * Create Time Spy Score modal content
 * @param {number} score - The Time Spy Score
 * @param {Object} config - Configuration object
 * @returns {Array} Array of DOM nodes
 */
function createTimeSpyScoreContent(score, config) {
  const level = getTimeSpyLevel(score);
  
  const levelData = [
    { number: 1, title: 'Entry Gaming', range: '2000–4999', description: 'Provides a basic 1080p gaming experience at low settings—ideal for light or older titles.' },
    { number: 2, title: 'Intermediate Gaming', range: '5000–6999', description: 'Delivers smooth 1080p gameplay at medium to high settings in mainstream titles.' },
    { number: 3, title: 'High-Performance Gaming', range: '7000–8999', description: 'Capable of high settings at 1440p or ultra settings at 1080p in modern games.' },
    { number: 4, title: 'Top-Tier Gaming', range: '9000–10999', description: 'Designed for ultra settings at 1440p or high settings at 4K in demanding AAA titles.' },
  ];

  const container = document.createElement('div');
  container.innerHTML = `
    <button class="back-link" type="button" data-a11y-dialog-hide="time-spy-score-dialog" aria-label="Go back to product preview">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10.75 14.25L5.25 7.75L10.75 1.25" stroke="#181818" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      Back
    </button>

    <div class="dialog-section">
      <h2 id="time-spy-score-title">3DMark Time Spy Score</h2>
      <div class="score-value">${score.toLocaleString()}</div>
    </div>
    
    <div class="dialog-section">
      <div class="score-levels-bar">
        ${levelData.map((data) => `
          <div class="score-level${data.number === level ? ' current' : ''}" data-level="${data.number}">
            <span class="score-badge">Level ${data.number}</span>
            <div class="score-title">${data.title}</div>
            <div class="score-range">${data.range}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="dialog-section">
      <h3 class="dialog-section-title">What does the 3DMark score mean?</h3>
      <p>
        The 3DMark score is a benchmark score that measures the performance of a computer's
        graphics hardware, primarily for gaming. The higher the score, the stronger performance.
      </p>
    </div>

    ${levelData.map((data) => `
      <div class="dialog-section">
        <h3 class="dialog-section-title">Level ${data.number}: ${data.title}</h3>
        <p>${data.description}</p>
      </div>
    `).join('')}

    <div class="dialog-section">
      <p>
        Note that all performance data presented are theoretical and may vary in real-world usage.
        The Time Spy Score is based on third-party testing conducted by UL and is provided for
        reference purposes only. Actual performance may differ.
      </p>
    </div>

    <div class="dialog-section">
      <img src="./clientlib-site/images/3dmark.webp" alt="3DMark Logo" loading="lazy">
    </div>
  `;

  return Array.from(container.childNodes);
}

function createImageGallery(product) {
  const images = [];

  if (product.mainImage) {
    images.push({ image: product.mainImage, thumbnail: product.mainImage, title: product.name });
  }

  if (product.hoverImage) {
    images.push({ image: product.hoverImage, thumbnail: product.hoverImage, title: `${product.name} - Alt` });
  }

  // Add additional images if available
  if (product.additionalImages && product.additionalImages.length > 0) {
    product.additionalImages.slice(0, 5).forEach((img, idx) => {
      images.push({ image: img, thumbnail: img, title: `${product.name} - View ${idx + 3}` });
    });
  }

  return `
    <div class="product-gallery">
      <div class="swiper product-gallery__main-carousel">
        <div class="swiper-wrapper">
          ${images.map((img, idx) => `
            <div class="carousel__item swiper-slide">
              <img src="${img.image}" alt="${img.title}" class="gallery-main-image" data-gallery-index="${idx}">
            </div>
          `).join('')}
        </div>
      </div>
      <div class="product-gallery__thumbs-carousel-wrapper">
        <div class="swiper product-gallery__thumbs-carousel">
          <div class="swiper-wrapper">
            ${images.map((img, idx) => `
              <div class="carousel__item swiper-slide">
                <img src="${img.thumbnail}" alt="${img.title} Thumbnail" class="gallery-thumb-image" data-gallery-index="${idx}">
              </div>
            `).join('')}
          </div>
        </div>
        <div class="carousel__actions">
          <button class="carousel__action carousel__action--previous" aria-label="Previous image"><span class="icon icon--arrow-left"></span></button>
          <button class="carousel__action carousel__action--next" aria-label="Next image"><span class="icon icon--arrow-right"></span></button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create FPS content element for a specific resolution
 */
function createFPSContent(product, resolution) {
  const contentDiv = document.createElement('div');
  
  const games = product.gamePriority || [];
  const hasData = resolution === '1080p' 
    ? games.some(g => g.fullHdFps)
    : games.some(g => g.quadHdFps);

  if (!hasData) {
    contentDiv.className = 'fps-scores-empty';
    contentDiv.innerHTML = `Game FPS for this setup and resolution isn't available right now.<br>We're constantly uploading our data, so please check back soon!`;
  } else {
    contentDiv.className = 'fps-scores';
    const filteredGames = resolution === '1080p'
      ? games.filter(g => g.fullHdFps)
      : games.filter(g => g.quadHdFps);
    
    contentDiv.innerHTML = filteredGames.map(game => `
      <div class="fps-item">
        <img src="${game.imageUrl || './clientlib-site/images/games/default.webp'}" alt="${game.gameTitle}">
        <span>${resolution === '1080p' ? game.fullHdFps : game.quadHdFps} FPS</span>
      </div>
    `).join('');
  }
  
  return contentDiv;
}

/**
 * Create Game Performance section with tabs block
 */
async function createGamePerformance(product, config) {
  if (!product.gamePriority || product.gamePriority.length === 0) {
    return null;
  }

  const has1080p = product.gamePriority.some((g) => g.fullHdFps);
  const has1440p = product.gamePriority.some((g) => g.quadHdFps);

  if (!has1080p && !has1440p) return null;

  const container = document.createElement('div');
  container.className = 'fps-section';
  container.id = 'game-fps';

  // Header section
  const header = document.createElement('div');
  header.className = 'fps-header-row';
  header.innerHTML = `
    <span class="fps-title">Game Performance</span>
    <div class="fps-info-group">
      <button class="fps-info" data-a11y-dialog-show="fps-dialog" aria-label="View FPS Details">
        What is FPS? <span class="icon icon--plus"></span>
      </button>
    </div>
  `;
  container.appendChild(header);

  // Build tabs block with FPS data
  const fps1080pContent = createFPSContent(product, '1080p');
  const fps1440pContent = createFPSContent(product, '1440p');

  const tabsBlock = buildBlock('tabs', [
    ['1080p', fps1080pContent],
    ['1440p', fps1440pContent],
  ]);

  // Wrap tabs in fps-tabs-wrapper for styling
  const tabsWrapper = document.createElement('div');
  tabsWrapper.className = 'fps-tabs-wrapper';
  tabsWrapper.appendChild(tabsBlock);
  container.appendChild(tabsWrapper);

  // Decorate and load tabs block
  decorateBlock(tabsBlock);
  await loadBlock(tabsBlock);

  // Time Spy Score section
  if (product.timeSpyOverallScore) {
    const timeSpy = document.createElement('div');
    timeSpy.className = 'time-spy-score';
    timeSpy.innerHTML = `
      <div class="time-spy-score-left">
        <div class="time-spy-score-label">
          <span class="label" aria-hidden="true">Time Spy Score</span>
          <button type="button" class="time-spy-score-btn" data-a11y-dialog-show="time-spy-score-dialog" aria-label="View Time Spy Score Details" data-score="${product.timeSpyOverallScore}" data-level="${getTimeSpyLevel(product.timeSpyOverallScore)}">
            <span class="icon icon--plus text-info"></span>
          </button>
        </div>
        <span class="score">${Number(product.timeSpyOverallScore).toLocaleString()}</span>
      </div>
      <div class="time-spy-score-right">
        <span class="data-from">Data from</span>
        <div class="data-source">
          <img src="${config.threeMarkLogo}" alt="3DMark">
          <button data-tooltip-trigger aria-describedby="preview-time-spy-tooltip" data-tooltip-position="bottom" class="btn btn-link" aria-label="3D Mark information">
            <span class="icon icon--info"></span>
          </button>
          <div id="preview-time-spy-tooltip" class="tooltip__content tooltip__content--theme-dark tooltip__content--size-small" role="tooltip">
            ${config.dataSourceTooltip}
          </div>
        </div>
      </div>
    `;
    container.appendChild(timeSpy);
  }

  return container;
}

async function initializeGallery(block) {
  const mainSwiperEl = block.querySelector('.product-gallery__main-carousel');
  const thumbSwiperEl = block.querySelector('.product-gallery__thumbs-carousel');

  if (!mainSwiperEl) return;

  const slidesCount = mainSwiperEl.querySelectorAll('.swiper-slide').length;

  if (slidesCount === 0) return;

  const prevButton = block.querySelector('.carousel__action--previous');
  const nextButton = block.querySelector('.carousel__action--next');

  const thumbSwiper = new Swiper(thumbSwiperEl, {
    spaceBetween: 10,
    slidesPerView: 'auto',
    freeMode: true,
    slideToClickedSlide: true,
    watchSlidesProgress: true,
    watchOverflow: true,
    centeredSlides: false,
    initialSlide: 0,
  });

  const mainSwiper = new Swiper(mainSwiperEl, {
    noSwipingClass: 'swiper-no-swiping',
    initialSlide: 0,
    loop: true,
    navigation: {
      nextEl: nextButton,
      prevEl: prevButton,
      disabledClass: 'cmp-carousel__action--disabled',
    },
    thumbs: {
      swiper: thumbSwiper,
      slideThumbActiveClass: 'carousel__item--active',
    },
  });

  // Add active class to first thumbnail
  if (thumbSwiperEl) {
    const firstThumb = thumbSwiperEl.querySelector('.carousel__item');
    if (firstThumb) {
      firstThumb.classList.add('carousel__item--active');
    }
  }
}


export default async function decorate(block) {
  // Add main component class for styling
  block.classList.add('cmp-product-preview');
  
  // Check if in Universal Editor and adjust styling
  const inUE = isUniversalEditor();
  if (inUE) {
    // Apply inline styles to override modal positioning for UE
    block.style.position = 'relative';
    block.style.inset = 'auto';
    block.style.zIndex = '1';
    block.style.background = 'transparent';
    block.style.minHeight = 'auto';
  }
  
  // Get locale and default configuration
  const locale = await getLocale();
  const defaultConfig = getDefaultConfig(locale);
  
  // Parse configuration from block metadata using getBlockConfigs
  const config = await getBlockConfigs(block, defaultConfig, 'product-preview');
  
  let product = null;

  try {
    // Try to get product data from window object first (set by hot-products)
    if (window.__productPreviewData) {
      product = window.__productPreviewData;
      delete window.__productPreviewData;
    } else if (block.dataset.product) {
      // Fallback to dataset for backward compatibility
      product = JSON.parse(block.dataset.product);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing product data:', error);
  }

  // If no product data available
  if (!product) {
    // In Universal Editor, show dummy data for preview
    if (inUE) {
      product = getDummyProductData();
    } else {
      // In production, show error message
      block.innerHTML = '<p>Product data not available</p>';
      return;
    }
  }

  // Store config in dataset for event listeners
  block.dataset.config = JSON.stringify(config);

  const currentPrice = product.specialPrice || product.price;
  const originalPrice = product.specialPrice ? product.price : null;
  const savings = product.savedPrice
                  || (originalPrice ? (parseFloat(originalPrice) - parseFloat(currentPrice)).toFixed(0) : null);

  // Add "In Stock" badge by default if not already present
  const badges = product.productTags || [];
  const hasInStock = badges.some((badge) => badge.toLowerCase() === 'in stock');
  if (!hasInStock) {
    badges.unshift('In Stock'); // Add "In Stock" at the beginning
  }
  
  const badgesHTML = badges.map((badge, index) => {
    const badgeClass = badge.toLowerCase().replace(/\s+/g, '-');
    const divider = index < badges.length - 1 ? '<span class="vertical-divider"></span>' : '';
    return `<span class="tag ${badgeClass}">${badge}</span>${divider}`;
  }).join('');

  // Use specSummary HTML directly from API, fallback to keySpec
  let specsHTML = '';
  if (product.specSummary) {
    // Add required classes to ul element from API HTML
    specsHTML = product.specSummary.replace('<ul>', '<ul class="spec-summary__list list-style-square">');
  } else if (product.keySpec && product.keySpec.length > 0) {
    const specItems = product.keySpec.map((spec) => {
      const specName = spec.name || spec;
      return `<li>${specName}</li>`;
    }).join('');
    specsHTML = `<ul class="spec-summary__list list-style-square">${specItems}</ul>`;
  }

  // Use productAdvantage HTML directly from API, fallback to keyFeatures
  let featuresHTML = '';
  if (product.productAdvantage) {
    // Add required classes to ul element from API HTML
    featuresHTML = product.productAdvantage.replace('<ul>', '<ul class="features">');
  } else if (product.keyFeatures && product.keyFeatures.length > 0) {
    const featureItems = product.keyFeatures.map((feature) => {
      const featureName = feature.name || feature.title || '';
      const featureDesc = feature.description || feature.desc || '';
      return `<li><strong>${featureName}</strong><br><span>${featureDesc}</span></li>`;
    }).join('');
    featuresHTML = `<ul class="features">${featureItems}</ul>`;
  }

  block.innerHTML = `
    <div class="cmp-product-preview__topbar">
      <div class="container">
        <div class="cmp-product-preview__topbar-left">
          <p class="cmp-product-preview__purchase-limit">A maximum of 5 pieces per customer.</p>
          <p class="cmp-product-preview__shipping-info">Up to 5 working days to ship.</p>
        </div>
        
        <div class="cmp-product-preview__topbar-right">
          <div class="cmp-product-preview__price-group">
            <div class="cmp-product-preview__price-final">$${currentPrice}</div>
            <div class="cmp-product-preview__price-meta">
              ${originalPrice ? `<span class="cmp-product-preview__price-old">$${originalPrice}</span>` : ''}
              ${savings ? `<span class="cmp-product-preview__price-save">Save $${savings}</span>` : ''}
            </div>
            ${currentPrice ? `
            <div class="cmp-product-preview__installment">
              Starting at $${Math.ceil(parseFloat(currentPrice) / 12)}/mo with
              <img src="./clientlib-site/images/affirm.svg" alt="Affirm">
              Check your purchasing power
            </div>
            ` : ''}
          </div>
          
          <div class="cmp-product-preview__action-buttons">
            <button class="btn btn-outline">View Details</button>
          </div>
        </div>
      </div>
    </div>

    <div class="cmp-product-preview__body">
      <div class="product-preview-card">
        <button class="close-icon" data-a11y-dialog-hide="product-preview-dialog" aria-label="Close the dialog"></button>
        <div class="product-preview-image-section">
          ${createImageGallery(product)}
        </div>

        <div class="product-preview__overview-section">
          ${badgesHTML ? `<div class="availability-tags">${badgesHTML}</div>` : ''}
          
          <div id="preview-product-title">
            <h2 class="product-title">${product.name}</h2>
            ${product.modelName ? `<p class="product-model">Model: ${product.modelName}</p>` : ''}
          </div>

          <div class="star-rating-wrapper">
            <div data-bv-show="inline_rating" data-bv-product-id="${product.externalId || product.sku}" data-bv-redirect-url="pdp.html#product-reviews" data-bv-theme="light"></div>
          </div>

          ${product.gameTitle && product.fps ? `
            <div class="game-title">
              <span>${product.gameTitle}</span>
              <a class="badge" href="#game-fps">FPS: ${product.fps}</a>
            </div>
          ` : ''}

          <div class="compare-product">
            <input type="checkbox" class="compare-checkbox" id="compare-${product.sku}" data-add-to-compare data-id="${product.sku}" data-name="${product.name}" data-model="${product.modelName || product.sku}" data-image="${product.mainImage}" data-price="${currentPrice}" data-fps="${product.fps || ''}" data-pdp-url="./pdp.html" data-sku="${product.sku}" />
            <label for="compare-${product.sku}">Compare</label>
          </div>

          ${featuresHTML ? `
            <div class="divider"></div>
            ${featuresHTML}
          ` : ''}

          ${specsHTML ? `
            <div class="divider"></div>
            <div class="spec-summary">
              <h3 class="spec-summary__heading">Spec Summary</h3>
              ${specsHTML}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Apply additional inline styles for UE mode after HTML is rendered
  if (inUE) {
    const body = block.querySelector('.cmp-product-preview__body');
    const topbar = block.querySelector('.cmp-product-preview__topbar');
    
    if (body) {
      body.style.background = 'transparent';
      body.style.padding = '0';
      body.style.marginBottom = '0';
    }
    
    if (topbar) {
      topbar.style.position = 'relative';
    }
  }

  // Initialize gallery
  await initializeGallery(block);
  
  // Create and append FPS section using tabs block
  const fpsSection = await createGamePerformance(product, config);
  if (fpsSection) {
    const imageSection = block.querySelector('.product-preview-image-section');
    if (imageSection) {
      imageSection.appendChild(fpsSection);
    }
  }

  // Close button is handled by modal.js via data-a11y-dialog-hide attribute

  // Add FPS info button event listener
  const fpsInfoButton = block.querySelector('.fps-info');
  if (fpsInfoButton) {
    fpsInfoButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const blockConfig = JSON.parse(block.dataset.config || '{}');
      const fpsModalPath = blockConfig.fpsDetailsModalPath || `/${locale}/modals/fps-details`;
      await openModal(fpsModalPath, true, 'fps-dialog', ['dialog--boxed', 'cmp-fps-dialog'], 'fps-content');
    });
  }

  // Add Time Spy Score info button event listener
  const timeSpyScoreButton = block.querySelector('.time-spy-score-btn');
  if (timeSpyScoreButton) {
    timeSpyScoreButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const scoreStr = timeSpyScoreButton.dataset.score;
      const score = parseInt(scoreStr, 10);
      
      if (!score || Number.isNaN(score)) {
        // eslint-disable-next-line no-console
        console.error('Invalid score value:', scoreStr);
        return;
      }

      // eslint-disable-next-line no-console
      console.log('Time Spy Score button clicked. Score:', score);
      
      const blockConfig = JSON.parse(block.dataset.config || '{}');
      const contentNodes = createTimeSpyScoreContent(score, blockConfig);
      const { showModal } = await createModal(contentNodes, true, 'time-spy-score-dialog', ['dialog--boxed', 'cmp-time-spy-score-dialog']);
      showModal();
    });
  }
}
