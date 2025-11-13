/**
 * Product Preview Block
 */

import { openModal } from '../modal/modal.js';
import { isUniversalEditor } from '../../scripts/scripts.js';

/**
 * Get modal path
 * @param {string} modalName - Name of the modal (e.g., 'fps-details', 'time-spy-score')
 * @returns {string} - Path to modal content
 */
function getModalPath(modalName) {
  return `/modals/${modalName}`;
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
 * Create the Time Spy Score display HTML
 * @param {number} score - The Time Spy Score
 * @param {number} level - The calculated level (1-4)
 * @returns {string} HTML string for score display
 */
function createTimeSpyScoreDisplay(score, level) {
  const levelData = [
    { number: 1, title: 'Entry Gaming', range: '2000–4999' },
    { number: 2, title: 'Intermediate Gaming', range: '5000–6999' },
    { number: 3, title: 'High-Performance Gaming', range: '7000–8999' },
    { number: 4, title: 'Top-Tier Gaming', range: '9000–10999' }
  ];

  // Generate progress bars (4 bars for 4 visible levels)
  const progressBarsHTML = levelData.map((_, index) => {
    const isActive = index === level - 1 ? ' active' : '';
    return `<div class="level-bar${isActive}"></div>`;
  }).join('');

  // Generate level indicators
  const levelIndicatorsHTML = levelData.map((data, index) => {
    const isActive = index === level - 1 ? ' active' : '';
    return `
      <div class="level-item">
        <span class="level-badge${isActive}">Level ${data.number}</span>
        <div class="level-title">${data.title}</div>
        <div class="level-range">${data.range}</div>
      </div>
    `;
  }).join('');

  return `
    <h2 class="time-spy-score-title">3DMark Time Spy Score</h2>
    <div class="time-spy-score-display">
      <div class="time-spy-score-value">${score.toLocaleString()}</div>
      <div class="level-progress">
        ${progressBarsHTML}
      </div>
      <div class="level-indicators">
        ${levelIndicatorsHTML}
      </div>
    </div>
  `;
}

/**
 * Inject Time Spy Score display into modal
 * @param {number} score - The Time Spy Score
 */
function injectTimeSpyScore(score) {
  if (!score || isNaN(score)) {
    console.warn('Invalid Time Spy Score:', score);
    return;
  }

  const level = getTimeSpyLevel(score);
  
  // Wait for modal content to be fully loaded
  const checkAndInject = () => {
    // Get all modals and find the most recently opened one (last in DOM)
    const allModals = document.querySelectorAll('.modal');
    if (allModals.length === 0) {
      console.warn('No modal found');
      return;
    }

    // Get the last modal (most recently opened)
    const lastModal = allModals[allModals.length - 1];
    const modalContent = lastModal.querySelector('.modal-content');
    
    if (!modalContent) {
      console.warn('Modal content not found');
      setTimeout(checkAndInject, 50);
      return;
    }

    // Look for the time-spy-modal class
    const timeSpyContent = modalContent.querySelector('.time-spy-modal');
    const targetContainer = timeSpyContent || modalContent;
    
    // Wait for any content to be loaded
    if (!targetContainer.children.length) {
      setTimeout(checkAndInject, 50);
      return;
    }

    // Check if score display already exists (by looking for the h2 we'll inject)
    const existingTitle = targetContainer.querySelector('h2');
    if (existingTitle && existingTitle.textContent.includes('3DMark Time Spy Score')) {
      console.log('Score display already injected');
      return;
    }

    // Create and inject the score display HTML at the beginning
    const scoreHTML = createTimeSpyScoreDisplay(score, level);
    targetContainer.insertAdjacentHTML('afterbegin', scoreHTML);
    
    console.log('Injected Time Spy Score:', score, 'Level:', level);
  };

  // Start checking after a short delay
  setTimeout(checkAndInject, 150);
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
    <div class="preview-gallery">
      <div class="swiper preview-gallery-main">
        <div class="swiper-wrapper">
          ${images.map((img) => `
            <div class="swiper-slide">
              <img src="${img.image}" alt="${img.title}" loading="lazy">
            </div>
          `).join('')}
        </div>
      </div>
      ${images.length > 1 ? `
        <div class="preview-gallery-thumbs-wrapper">
          <div class="swiper preview-gallery-thumbs">
            <div class="swiper-wrapper">
              ${images.map((img) => `
                <div class="swiper-slide">
                  <img src="${img.thumbnail}" alt="${img.title}" loading="lazy">
                </div>
              `).join('')}
            </div>
          </div>
          <div class="preview-gallery-nav">
            <button class="preview-gallery-button-prev" aria-label="Previous"></button>
            <button class="preview-gallery-button-next" aria-label="Next"></button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function createGamePerformance(product) {
  if (!product.gamePriority || product.gamePriority.length === 0) {
    return '';
  }

  const has1080p = product.gamePriority.some((g) => g.fullHdFps);
  const has1440p = product.gamePriority.some((g) => g.quadHdFps);

  if (!has1080p && !has1440p) return '';

  const fps1080pHTML = product.gamePriority.filter((g) => g.fullHdFps).map((game) => `
    <div class="fps-item">
      <img src="${game.imageUrl || './clientlib-site/images/games/default.webp'}" alt="${game.gameTitle}">
      <span>${game.fullHdFps} FPS</span>
    </div>
  `).join('');

  const fps1440pHTML = product.gamePriority.filter((g) => g.quadHdFps).map((game) => `
    <div class="fps-item">
      <img src="${game.imageUrl || './clientlib-site/images/games/default.webp'}" alt="${game.gameTitle}">
      <span>${game.quadHdFps} FPS</span>
    </div>
  `).join('');

  const timeSpyHTML = product.timeSpyOverallScore ? `
    <div class="time-spy-score">
      <div class="time-spy-score-left">
        <div class="time-spy-score-label">
          <span class="label" aria-hidden="true">Time Spy Score</span>
          <button type="button" class="time-spy-score-btn" aria-label="View Time Spy Score Details" data-score="${product.timeSpyOverallScore}">
            <span class="icon icon--plus text-info"></span>
          </button>
        </div>
        <span class="score">${product.timeSpyOverallScore}</span>
      </div>
      <div class="time-spy-score-right">
        <span class="data-from">Data from</span>
        <div class="data-source">
          <img src="./clientlib-site/images/3dmark.webp" alt="3DMark">
          <button class="btn btn-link btn-tooltip" data-tooltip="All FPS performance data presented are theoretical and may vary in real-world usage. The FPS data is based on third-party testing conducted by UL and is provided for reference purposes only. Actual performance may differ." aria-label="3D Mark information">
            <span class="icon icon--info"></span>
          </button>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <div class="fps-section" id="game-fps">
      <div class="fps-header-row">
        <span class="fps-title">Game Performance</span>
        <div class="fps-info-group">
          <button class="fps-info" aria-label="View FPS Details">
            What is FPS? <span class="icon icon--plus"></span>
          </button>
        </div>
      </div>
      <div class="fps-tabs-wrapper" data-cmp-is="custom-tabs">
        <div class="cmp-tabs" data-style="solid">
          <ol role="tablist" class="cmp-tabs__tablist">
            <li role="tab" class="cmp-tabs__tab cmp-tabs__tab--active" aria-controls="preview-fps-1080p-tabpanel" aria-selected="true" tabindex="0">1080p</li>
            <li role="tab" class="cmp-tabs__tab" aria-controls="preview-fps-1440p-tabpanel" aria-selected="false">1440p</li>
          </ol>
          <div id="preview-fps-1080p-tabpanel" class="cmp-tabs__tabpanel cmp-tabs__tabpanel--active" role="tabpanel" aria-hidden="false">
            <div class="fps-scores">
              ${fps1080pHTML || '<p class="fps-empty">No FPS data available for this resolution</p>'}
            </div>
          </div>
          <div id="preview-fps-1440p-tabpanel" class="cmp-tabs__tabpanel" role="tabpanel" aria-hidden="true">
            <div class="fps-scores">
              ${fps1440pHTML || '<p class="fps-empty">No FPS data available for this resolution</p>'}
            </div>
          </div>
        </div>
      </div>
      ${timeSpyHTML}
    </div>
  `;
}

function createTimeSpyScore(product) {
  if (!product.timeSpyOverallScore) return '';

  return `
    <div class="time-spy-score">
      <div class="time-spy-score-left">
        <div class="time-spy-score-label">
          <span class="label" aria-hidden="true">Time Spy Score</span>
          <button type="button" class="time-spy-score-btn" aria-label="View Time Spy Score Details" data-score="${product.timeSpyOverallScore}">
            <span class="icon icon--plus text-info"></span>
          </button>
        </div>
        <span class="score">${product.timeSpyOverallScore}</span>
      </div>
      <div class="time-spy-score-right">
        <span class="data-from">Data from</span>
        <div class="data-source">
          <img src="./clientlib-site/images/3dmark.webp" alt="3DMark">
          <button class="btn btn-link btn-tooltip" data-tooltip="All FPS performance data presented are theoretical and may vary in real-world usage. The FPS data is based on third-party testing conducted by UL and is provided for reference purposes only. Actual performance may differ." aria-label="3D Mark information">
            <span class="icon icon--info"></span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function initializeGallery(block) {
  const isUE = isUniversalEditor();
  
  // Skip Swiper initialization in Universal Editor to prevent infinite loop
  if (isUE) {
    console.log('Product Preview: Skipping Swiper initialization in Universal Editor');
    return;
  }
  
  const mainSwiperEl = block.querySelector('.preview-gallery-main');
  const thumbSwiperEl = block.querySelector('.preview-gallery-thumbs');

  if (!mainSwiperEl) return;

  const slidesCount = mainSwiperEl.querySelectorAll('.swiper-slide').length;
  
  if (slidesCount === 0) return;

  const mainSwiper = new window.Swiper(mainSwiperEl, {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: slidesCount > 1,
  });

  if (thumbSwiperEl && slidesCount > 1) {
    const prevButton = block.querySelector('.preview-gallery-button-prev');
    const nextButton = block.querySelector('.preview-gallery-button-next');

    const thumbSwiper = new window.Swiper(thumbSwiperEl, {
      spaceBetween: 8,
      slidesPerView: 'auto',
      freeMode: true,
      watchSlidesProgress: true,
      slideToClickedSlide: true,
    });

    mainSwiper.controller.control = thumbSwiper;
    thumbSwiper.controller.control = mainSwiper;

    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => mainSwiper.slidePrev());
      nextButton.addEventListener('click', () => mainSwiper.slideNext());
    }
  }
}

function initializeTabs(block) {
  const tabs = block.querySelectorAll('.cmp-tabs__tab');
  const panels = block.querySelectorAll('.cmp-tabs__tabpanel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetPanelId = tab.getAttribute('aria-controls');
      
      // Remove active states
      tabs.forEach((t) => {
        t.classList.remove('cmp-tabs__tab--active');
        t.setAttribute('aria-selected', 'false');
        t.removeAttribute('tabindex');
      });
      
      panels.forEach((p) => {
        p.classList.remove('cmp-tabs__tabpanel--active');
        p.setAttribute('aria-hidden', 'true');
      });
      
      // Add active states
      tab.classList.add('cmp-tabs__tab--active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      
      const targetPanel = block.querySelector(`#${targetPanelId}`);
      if (targetPanel) {
        targetPanel.classList.add('cmp-tabs__tabpanel--active');
        targetPanel.setAttribute('aria-hidden', 'false');
      }
    });
  });
}

export default async function decorate(block) {
  const isUE = isUniversalEditor();
  if (isUE) return;
  
  let product = null;
  
  try {
    // Try to get product data from window object first (set by hot-products)
    if (window.__productPreviewData) {
      product = window.__productPreviewData;
      // Store in dataset for UE re-decorations, clear from window otherwise
      if (isUE) {
        block.dataset.product = JSON.stringify(product);
      } else {
        delete window.__productPreviewData;
      }
    } else if (block.dataset.product) {
      // Fallback to dataset for backward compatibility or UE re-decorations
      product = JSON.parse(block.dataset.product);
    }
  } catch (error) {
    console.error('Error parsing product data:', error);
  }
  
  if (!product) {
    block.innerHTML = '<p>Product data not available</p>';
    return;
  }
  
  // In UE, add authoring class for CSS targeting
  if (isUE) {
    block.classList.add('ue-authoring');
    block.setAttribute('data-authoring', 'true');
  }

  const currentPrice = product.specialPrice || product.price;
  const originalPrice = product.specialPrice ? product.price : null;
  const savings = product.savedPrice || (originalPrice ? (parseFloat(originalPrice) - parseFloat(currentPrice)).toFixed(0) : null);
  
  // Add "In Stock" badge by default if not already present
  const badges = product.productTags || [];
  const hasInStock = badges.some(badge => badge.toLowerCase() === 'in stock');
  if (!hasInStock) {
    badges.unshift('In Stock'); // Add "In Stock" at the beginning
  }
  
  const badgesHTML = badges.map((badge) => {
    const isInStock = badge.toLowerCase() === 'in stock';
    const badgeClass = isInStock ? 'preview-badge preview-badge--in-stock' : 'preview-badge';
    return `<span class="${badgeClass}">${badge}</span>`;
  }).join('');
  
  const specsHTML = (product.keySpec || []).map((spec) => {
    const specName = spec.name || spec;
    return `<li>${specName}</li>`;
  }).join('');

  const featuresHTML = (product.keyFeatures || []).map((feature) => {
    const featureName = feature.name || feature.title || '';
    const featureDesc = feature.description || feature.desc || '';
    return `<li><strong>${featureName}</strong><br><span>${featureDesc}</span></li>`;
  }).join('');

  block.innerHTML = `
    <div class="product-preview-topbar">
      <div class="product-preview-topbar-left">
        <p class="topbar-info">A maximum of 5 pieces per customer.</p>
        <p class="topbar-info">Up to 5 working days to ship.</p>
      </div>
      
      <div class="product-preview-topbar-right">
        <div class="cmp-product-preview__price-group">
          <div class="cmp-product-preview__price-final">$${currentPrice}</div>
          <div class="cmp-product-preview__price-meta">
            ${originalPrice ? `<span class="cmp-product-preview__price-old">$${originalPrice}</span>` : ''}
            ${savings ? `<span class="cmp-product-preview__price-save">Save $${savings}</span>` : ''}
          </div>
          <div class="cmp-product-preview__installment">
            Starting at $${Math.ceil(parseFloat(currentPrice) / 12)}/mo with 
            <img src="./clientlib-site/images/affirm.svg" alt="Affirm" />
            Check your purchasing power
          </div>
        </div>
        
        <div class="cmp-product-preview__action-buttons">
          <button class="btn btn-outline">View Details</button>
        </div>
      </div>
    </div>

    <div class="product-preview-body">
      <div class="product-preview-body-wrapper">
        <button class="product-preview-close" aria-label="Close" type="button"></button>
        <div class="preview-card">
        <div class="preview-left">
          ${createImageGallery(product)}
          ${createGamePerformance(product)}
        </div>

        <div class="preview-right">
          ${badgesHTML ? `<div class="preview-badges">${badgesHTML}</div>` : ''}
          
          <h2 class="preview-title">${product.name}</h2>
          ${product.modelName ? `<p class="preview-model">Model: ${product.modelName}</p>` : ''}

          <div class="preview-rating">
            <div data-bv-show="inline_rating" data-bv-product-id="${product.externalId || product.sku}" data-bv-redirect-url="pdp.html"></div>
          </div>

          ${product.gameTitle && product.fps ? `
            <div class="preview-game-badge">
              <span class="game-name">${product.gameTitle}</span>
              <a class="fps-badge" href="#game-fps">FPS: ${product.fps}</a>
            </div>
          ` : ''}

          <div class="preview-compare">
            <input type="checkbox" class="preview-compare-checkbox" id="preview-compare-${product.sku}" />
            <label for="preview-compare-${product.sku}">Compare</label>
          </div>

          ${featuresHTML ? `
            <div class="preview-divider"></div>
            <ul class="features">
              ${featuresHTML}
            </ul>
          ` : ''}

          ${specsHTML ? `
            <div class="preview-divider"></div>
            <div class="preview-specs">
              <h3>Spec Summary</h3>
              <ul class="preview-specs-list">${specsHTML}</ul>
            </div>
          ` : ''}
        </div>
      </div>
      </div>
    </div>
  `;

  initializeGallery(block);
  initializeTabs(block);

  // Add close button event listener
  const closeButton = block.querySelector('.product-preview-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      const dialog = block.closest('dialog');
      if (dialog) {
        dialog.close();
      }
    });
  }

  // Add FPS info button event listener
  const fpsInfoButton = block.querySelector('.fps-info');
  if (fpsInfoButton) {
    fpsInfoButton.addEventListener('click', async () => {
      await openModal(getModalPath('fps-details'));
    });
  }

  // Add Time Spy Score info button event listener
  const timeSpyScoreButton = block.querySelector('.time-spy-score-btn');
  if (timeSpyScoreButton) {
    timeSpyScoreButton.addEventListener('click', async () => {
      const scoreStr = timeSpyScoreButton.dataset.score;
      const score = parseInt(scoreStr, 10);
      console.log('Time Spy Score button clicked. Raw score:', scoreStr, 'Parsed score:', score);
      await openModal(getModalPath('time-spy-score'));
      if (score && !isNaN(score)) {
        injectTimeSpyScore(score);
      } else {
        console.error('Invalid score value:', scoreStr);
      }
    });
  }

  // Skip BazaarVoice initialization in Universal Editor
  if (!isUE && window.BV && window.BV.ui) {
    window.BV.ui('rr', 'show_reviews');
  }
}

