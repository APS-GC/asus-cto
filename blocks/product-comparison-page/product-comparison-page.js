import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation, loadSwiper } from '../../scripts/scripts.js';
import { fetchGameList, getApiEndpoint } from '../../scripts/api-service.js';
import { API_URIS } from '../../constants/api-constants.js';
import { getBlockConfigs } from '../../scripts/configs.js';

// Default configuration
const DEFAULT_CONFIG = {
  title: 'Select The Game You Play',
  subtitle: 'We will recommend a plan that suits you most!',
  budgetText: 'Your Budget',
  helpmeChooseCTA: 'Help me choose',
  resetCTAText: 'Reset',
  confirmCTAText: 'Confirm',
  style: '1',
  minimumBudget: 500,
  maximumBudget: 5000,
  helpMeChooseCTALinkTo: './product-matches',
};

/**
 * Decorates the help-me-choose block, initializing the carousel and form.
 * @param {Element} block - The block element to decorate.
 * @returns {Promise<void>}
 */
export default async function decorate(block) {
  console.log("Product Comparison Page", block)
  // Load noUiSlider only once
  // await loadNoUiSlider();
  // await loadSwiperCSS();

  // // Once loaded, render the component
  // await renderHelpMeChoose(block);

  // // Initialize existing game forms
  // initSelectGameForms(document.body);

  // initFilterComponents(document.body);
  // // Setup a single MutationObserver (if not already)
  // setupSelectGameFormsObserver();
}


/**
 * Renders the Help Me Choose section, including the game list and budget filter.
 * @param {Element} block - The block element to render the content into.
 * @returns {Promise<void>}
 */
async function renderHelpMeChoose(block) {
  const helpMeChooseContainer = document.createElement('div');
  helpMeChooseContainer.className = 'help-me-choose-container container';

  const config = await getBlockConfigs(block, DEFAULT_CONFIG, 'help-me-choose');

  // Fetch products
  const endpoint = await getApiEndpoint(API_URIS.FETCH_GAME_LIST_EN);
  const gameList = await fetchGameList(endpoint);

  if(!gameList?.results?.gameList || gameList?.results?.gameList.length === -1) return;

  const lowestPrice = gameList?.results?.lowestPrice || 500;
  const highestPrice = gameList?.results?.highestPrice || 5000;

  const urlParams = new URLSearchParams(document.location.search);
  const defaultMinBudget = parseInt(urlParams.get('min-budget'), 10) || lowestPrice;
  const defaultMaxBudget = parseInt(urlParams.get('max-budget'), 10) || highestPrice;
  // Build the HTML in a fragment / string, then insert once
  const html = 
  
  config.style === 1 ? `
  <div class="game-recommendation">
      <div class="carousel panelcontainer">
          <div class="section-heading">
              <div class="section-heading__text-group">
                  <h2 class="section-heading__title">${escapeHtml(config.title)}</h2>
                  <p class="section-heading__description">${escapeHtml(config.subtitle)}</p>
              </div>
              <div class="section-heading__action-buttons cmp-carousel__actions">
                  <button class="cmp-carousel__action cmp-carousel__action--previous" type="button" aria-label="Previous slide">
                      <span class="sr-only">Previous Button</span>
                  </button>
                  <button class="cmp-carousel__action cmp-carousel__action--next" type="button" aria-label="Next slide">
                      <span class="sr-only">Next Button</span>
                  </button>
              </div>
          </div>

          <form id="game-selection-form" action="${escapeHtml(config.helpMeChooseCTALinkTo)}" class="game-form" aria-label="Game selection form" data-select-game-form>
              <div id="carousel-4e80c7e13l" class="cmp-carousel" role="group" aria-live="off" aria-roledescription="carousel" data-slides-per-view="auto" data-slides-per-view-tablet="6" data-slides-per-view-desktop="6" data-loop-slides="false">
                  <div class="cmp-carousel__content cmp-carousel__content--overflow" aria-atomic="false" aria-live="polite">
                  <div class="swiper">
                      <div class="swiper-wrapper">${generateGameItemsHTML(gameList?.results?.gameList, true)}</div>
                      </div>
                  </div>
              </div>

              <div class="budget-bar" role="group" aria-label="Your budget">
                  <div class="budget-left">
                      <div id="budget-range-label">${escapeHtml(config.budgetText)}:</div>
                  </div>
                  <div class="budget-center">${generateBudgetCenterHTML(lowestPrice, highestPrice)}</div>
                  <input type="hidden" name="min-budget" id="min-budget" value="" />
                  <input type="hidden" name="max-budget" id="max-budget" value="" />
                  <div class="budget-actions">
                      <button type="reset" class="reset-button btn btn-link">${escapeHtml(config.resetCTAText)}</button>
                      <button type="submit" class="btn" disabled>${escapeHtml(config.helpmeChooseCTA)}</button>
                  </div>
              </div>
          </form>
      </div>
    </div>` : `
 
  <div class="filter-bar container-xl"> 
    <div class="filters-container container">
        <button class="filter-button btn btn-link" aria-label="Filter dropdown">
            Filter 
            <span class="icon icon--arrow-bottom" id="filter-icon"></span>
        </button>
        <form class="filters">
            <div class="selected-games">
                <p class="selected-games-text">Selected game:</p>
                <div class="collapsed-view">
                </div>
                <div class="expanded-view">${generateGameItemsHTML(gameList?.results?.gameList, false)}</div>
            </div>
            <div class="vertical-divider"></div>
            <div class="budget" id="budget">
                <div class="your-budget">${escapeHtml(config.budgetText)}: 
                    <div>
                        <span class="confirmed-budget-min-value">${_formatCurrency(defaultMinBudget)}</span>
                        <span>-</span>
                        <span class="confirmed-budget-max-value">${_formatCurrency(defaultMaxBudget)}</span>
                    </div>
                </div>
                <div class="budget-center">${generateFilterBudgetCenterHTML(lowestPrice, highestPrice)}</div>
                <input type="hidden" name="min-budget" id="min-budget" value="${defaultMinBudget}" />
                <input type="hidden" name="max-budget" id="max-budget" value="${defaultMaxBudget}" />
                <div class="budget-actions">
                    <button type="reset" class="reset-button btn btn-link">${escapeHtml(config.resetCTAText)}</button>
                    <button type="submit" class="btn btn-link">${escapeHtml(config.confirmCTAText)}</button>
                </div>
            </div>
        </form>
    </div>
</div>
`;

  helpMeChooseContainer.innerHTML = html;

  // Move instrumentation
  // moveInstrumentation(block, helpMeChooseContainer);

  // Replace in DOM
  block.replaceChildren(...helpMeChooseContainer.children);

  // Initialize carousel *after* DOM insertion
  initializeSwiperCarousel(block);
}

function _isHomePage(){
  const patterns = [/^\/product-matches\/.+$/];
  if (patterns.some(regex => regex.test(window.location.pathname))) {
    return false;
  }
  return true;
}

/**
 * Generates HTML for a list of game items.
 * @param {Array} games - The list of game objects.
 * @returns {string} The generated HTML string.
 */
function generateGameItemsHTML(games, isCarousel = true) {
  if (!games || !Array.isArray(games)) {
    return '';
  }
  
  const wrapperClass = isCarousel ? 'cmp-carousel__item swiper-slide' : '';
  
  return games.map((game) => {
    const gameItemHTML = `
        <div class="game-item">
            <input type="checkbox" id="game-you-play-${game.gameId}" name="games" value="${escapeHtml(game.gameId)}" data-name="${escapeHtml(game.gameTitle)}" data-image="${escapeHtml(game.imageUrl)}" aria-label="Select ${escapeHtml(game.gameTitle)}" />
            <div class="game-details-wrapper">
                <div class="image-outer">
                    <div class="image-wrapper" aria-hidden="true">
                        <img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.gameTitle)}" class="game-image" loading="lazy" />
                    </div>
                    <div class="checkmark-overlay" aria-hidden="true"></div>
                </div>
                <label class="game-info" for="game-you-play-${game.gameId}" aria-hidden="true">${escapeHtml(game.gameTitle)}</label>
            </div>
        </div>`;
    
    return isCarousel ? `<div class="${wrapperClass}">${gameItemHTML}</div>` : gameItemHTML;
  }).join('');
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
 * Generates the HTML for the budget center section, including the slider and inputs/displays.
 * @param {number} lowestPrice - The lowest possible budget price.
 * @param {number} highestPrice - The highest possible budget price.
 * @param {boolean} useInputs - If true, renders text inputs for budget; otherwise, renders divs.
 * @returns {string} The generated HTML string for the budget center.
 */
function generateBudgetCenterHTML(lowestPrice, highestPrice) {
  return `
    <label for="budget-min-value" class="sr-only-fixed">Minimum Budget Value</label>
    <input class="budget-value" id="budget-min-value" value="${_formatCurrency(lowestPrice)}" />
    <div class="budget-separator" aria-hidden="true">to</div>
    <div id="maximum-budget-wrapper-mobile"></div>
    <div class="budget-range-wrapper">
        <div id="budget-range" class="budget-range-slider" data-start="[${lowestPrice}, ${highestPrice}]" data-min="500" data-max="5000" data-step="100"></div>
        <div class="range-labels" aria-hidden="true">
            <span>$500</span>
            <span>$5,000</span>
        </div>
    </div>
    <div id="maximum-budget-wrapper-desktop">
        <label for="budget-max-value" class="sr-only-fixed">Maximum Budget Value</label>
        <input class="budget-value" id="budget-max-value" value="${_formatCurrency(highestPrice)}" />
    </div>
  `;
}

/**
 * Generates the HTML for the filter-bar budget center section.
 * @param {number} lowestPrice - The lowest possible budget price.
 * @param {number} highestPrice - The highest possible budget price.
 * @returns {string} The generated HTML string for the filter-bar budget center.
 */
function generateFilterBudgetCenterHTML(lowestPrice, highestPrice) {
  return `
    <label for="budget-min-value" class="sr-only">Min Value</label>
    <input class="budget-value" id="budget-min-value" />
    <div class="budget-separator" aria-hidden="true">to</div>
    <label for="budget-max-value" class="sr-only">Max Value</label>
    <input class="budget-value" id="budget-max-value" />
    <div class="budget-range-wrapper">
        <div id="budget-range" class="budget-range-slider" data-start="[${lowestPrice}, ${highestPrice}]" data-min="500" data-max="5000" data-step="100"></div>
        <div class="range-labels" aria-hidden="true">
            <span>$500</span>
            <span>$5,000</span>
        </div>
    </div>
  `;
}

/**
 * Sets up a MutationObserver to initialize SelectGameForm components added dynamically.
 */
let selectGameObserver = null;
function setupSelectGameFormsObserver() {
  if (selectGameObserver) return; // don't create multiple observers

  selectGameObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          initSelectGameForms(node);
        }
      }
    }
  });

  selectGameObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Tears down the MutationObserver, disconnecting it from the document body.
 */
export function teardownDecorate() {
  if (selectGameObserver) {
    selectGameObserver.disconnect();
    selectGameObserver = null;
  }
}


/**
 * Helper to escape user / config data to prevent XSS
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
// Helper to escape user / config data to prevent XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
* Clamps a value 'v' between a minimum 'a' and a maximum 'b'.
* @param {number} v - The value to clamp.
* @param {number} a - The minimum boundary.
* @param {number} b - The maximum boundary.
* @returns {number} The clamped value.
*/
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Converts a string or number value to an integer, stripping non-numeric characters (except minus sign).
 * @param {*} v - The value to convert.
 * @returns {number} The integer value, or 0 if conversion fails.
 */
const toNumber = (v) => {
  if (typeof v === 'number') return v;
  // Strip non-numeric characters *except* the optional leading minus sign.
  const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

// Initialize carousel functionality
/**
 * Initializes a Swiper carousel for the block.
 * @param {Element} block - The block element containing the carousel.
 * @returns {Swiper} - The initialized Swiper instance.
 */
async function initializeSwiperCarousel(block) {
  const swiperContainer = block.querySelector('.swiper');
  if (!swiperContainer) return;

  await loadSwiper();

  // Use modules explicitly (if using swiper modular build)
  const swiper = new window.Swiper(swiperContainer, {
    // Basic options
    slidesPerView: 2,
    spaceBetween: 8,

    navigation: {
      nextEl: block.querySelector('.cmp-carousel__action--next'),
      prevEl: block.querySelector('.cmp-carousel__action--previous'),
    },
    pagination: {
      el: block.querySelector('.swiper-pagination'),
      clickable: true,
    },

    // Performance: consider enabling lazy loading or virtualization
    // (depending on your Swiper version)
    lazy: {
      loadPrevNext: true,
      loadPrevNextAmount: 2,
    },

    // Responsive behavior
    breakpoints: {
      768: {
        slidesPerView: 4,
        spaceBetween: 20,
        pagination: {
          enabled: false,
        },
      },
      1024: {
        slidesPerView: 6,
        spaceBetween: 20,
        allowTouchMove: true,
        navigation: {
          enabled: true,
        },
        pagination: {
          enabled: false,
        },
      },
    },
    on: {
      beforeDestroy: () => {
        swiper.navigation.destroy();
        swiper.pagination.destroy();
      },
      afterInit: function() {
        const navContainer = this.navigation.nextEl?.parentNode;
        if (navContainer && this.isBeginning && this.isEnd) {
          navContainer.style.display = 'none';
        }
      },
      resize: function() {
        const navContainer = this.navigation.nextEl?.parentNode;
        if (navContainer) {
          // Show or hide based on whether both nav buttons are disabled
          navContainer.style.display = (this.isBeginning && this.isEnd) ? 'none' : '';
        }
      },
    },
  });

  return swiper;
}


/* ---------------------------------------------
   * Formats a number as a currency string.
   * @param {number} value - The number to format.
   * @returns {string} - The formatted currency string.
   */
  function _formatCurrency(value) {
    return `$${(+value || 0).toLocaleString('en-US')}`;
  }


/**
 * Manages the game selection form and budget slider functionality.
 */
class SelectGameForm {
  /**
   * Initializes a new SelectGameForm instance.
   */
  constructor(formElement) {
    this.form = formElement;
    if (!this.form) return;

    this.dom = {
      games: this.form.querySelectorAll('input[name="games"]'),
      submitBtn: this.form.querySelector('button[type="submit"]'),
      slider: this.form.querySelector('#budget-range'),
      minValText: this.form.querySelector('#budget-min-value'),
      maxValText: this.form.querySelector('#budget-max-value'),
      minBudgetInput: this.form.querySelector('#min-budget'),
      maxBudgetInput: this.form.querySelector('#max-budget'),
      minBudgetValue: this.form.querySelector('#budget-range').getAttribute('aria-valuenow'),
      maxBudgetValue: this.form.querySelector('#budget-range').getAttribute('aria-valuemax'),
      mobileWrapper: this.form.querySelector('#maximum-budget-wrapper-mobile'),
      desktopWrapper: this.form.querySelector('#maximum-budget-wrapper-desktop'),
    };

    this.DEFAULT_BUDGET_RANGE = { min: 500, max: 5000 };
    this.DEFAULT_START_BUDGET = { min: this.dom.minBudgetInput.value, max: this.dom.maxBudgetInput.value };
    
    // Store placeholder for desktop wrapper position
    this.desktopPlaceholder = null;
    this.resizeTimer = null;
  }

  /**
   * Initializes the SelectGameForm, setting up the slider and binding events.
   */
  init() {
    if (!this.form) return;

    this._initSlider();
    this._bindEvents();
    this._setupBudgetInputHandlers();
    this._initResponsiveBudgetWrappers();

    this._updateSubmitButtonState(this._getSelectedGames().length === 0);
  }

  /**
   * Initializes the noUiSlider for budget selection.
   */
  _initSlider() {
    const slider = this.dom.slider;
    if (!slider || slider.noUiSlider) return;

    const { dataset } = slider;

    const min = +dataset.min || this.DEFAULT_BUDGET_RANGE.min;
    const max = +dataset.max || this.DEFAULT_BUDGET_RANGE.max;
    const step = +dataset.step || 1;

    const start = dataset.start
      ? JSON.parse(dataset.start)
      : [this.DEFAULT_START_BUDGET.min, this.DEFAULT_START_BUDGET.max];

    window.noUiSlider.create(slider, {
      start,
      connect: true,
      step,
      margin: step,
      range: { min, max },
      format: {
        to: (v) => Math.round(v),
        from: Number,
      },
      ariaFormat: {
        to: (v) => `$${Math.round(v).toLocaleString('en-US')}`,
        from: (v) => Number(v.replace(/[$,]/g, '')),
      },
      handleAttributes: [
        { 'aria-label': 'Budget minimum', 'aria-controls': 'min-budget' },
        { 'aria-label': 'Budget maximum', 'aria-controls': 'max-budget' },
      ],
    });

    slider.noUiSlider.on('update', (values) => {
      const [minVal, maxVal] = values.map(Number);
      this._updateBudgetDisplay(minVal, maxVal);
      this._updateSubmitButtonState();
    });
  }

  /**
   * Binds event listeners to the form for handling changes and resets.
   */
  _bindEvents() {
    this.form.addEventListener('change', (e) => {
      if (e.target.name === 'games') {
        this._updateSubmitButtonState(this._getSelectedGames().length === 0);
      }
    });

    this.form.addEventListener('reset', () => this._handleFormReset());
  }

  /* ---------------------------------------------
      Game Selection Helpers
  ----------------------------------------------*/
  _getSelectedGames() {
    return [...this.dom.games]
      .filter((g) => g.checked)
      .map((g) => g.value);
  }

  /**
   * Updates the state of the submit button based on whether any games are selected.
   * @param {boolean} disabled - Whether the submit button should be disabled.
   */
  _updateSubmitButtonState(disabled) {
    if (this.dom.submitBtn) {
      this.dom.submitBtn.disabled = disabled;
    }
  }

  /**
   * Validates a budget value, clamping it within the allowed range.
   * @param {number} value - The value to validate.
   * @param {boolean} isMin - Whether the value is the minimum budget.
   * @returns {number} - The validated budget value.
   */

  _validateBudgetValue(value, isMin) {
    const num = clamp(toNumber(value), this.DEFAULT_BUDGET_RANGE.min, this.DEFAULT_BUDGET_RANGE.max);
    const slider = this.dom.slider?.noUiSlider;
    if (!slider) return num;

    const [currMin, currMax] = slider.get().map(toNumber);

    return isMin ? Math.min(num, currMax) : Math.max(num, currMin);
  }

  /**
   * Updates the displayed budget values and hidden input fields.
   * @param {number} min - The minimum budget value.
   * @param {number} max - The maximum budget value.
   */
  _updateBudgetDisplay(min, max) {
    if (this.dom.minValText) this.dom.minValText.value = _formatCurrency(min);
    if (this.dom.maxValText) this.dom.maxValText.value = _formatCurrency(max);

    if (this.dom.minBudgetInput) this.dom.minBudgetInput.value = min;
    if (this.dom.maxBudgetInput) this.dom.maxBudgetInput.value = max;
  }

  /* ---------------------------------------------
      Reset Handler
  ----------------------------------------------*/
  _handleFormReset() {
    setTimeout(() => {
      const slider = this.dom.slider?.noUiSlider;
      if (slider) {
        slider.set([this.dom.minBudgetValue, this.dom.maxBudgetValue]);
      }
      this._updateSubmitButtonState(true);
    }, 0);
  }

  /**
   * Sets up event handlers for the budget input fields.
   */
  _setupBudgetInputHandlers() {
    const pairs = [
      [this.dom.minValText, true],
      [this.dom.maxValText, false],
    ];

    pairs.forEach(([input, isMin]) => {
      if (!input) return;

      input.addEventListener('focus', () => input.select());
      input.addEventListener('click', () => input.select());

      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9$,]/g, '');
      });

      input.addEventListener('blur', () => this._handleBudgetInputChange(input, isMin));

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
    });
  }

  /**
   * Handles changes to the budget input fields, validating and formatting the input.
   * @param {HTMLInputElement} input - The input element that triggered the change.
   * @param {boolean} isMin - Whether the input is for the minimum budget value.
   */
  _handleBudgetInputChange(input, isMin) {
    const slider = this.dom.slider?.noUiSlider;
    if (!slider) return;

    const validated = this._validateBudgetValue(toNumber(input.value), isMin);

    input.value = _formatCurrency(validated);

    const [currMin, currMax] = slider.get().map(toNumber);

    slider.set(isMin ? [validated, currMax] : [currMin, validated]);
  }

  /**
   * Initializes responsive budget wrapper behavior.
   * Creates a placeholder and sets up resize listener to move content between mobile and desktop wrappers.
   */
  _initResponsiveBudgetWrappers() {
    const { mobileWrapper, desktopWrapper } = this.dom;
    
    if (!mobileWrapper || !desktopWrapper) return;

    // Create a placeholder comment to remember original position in DOM
    this.desktopPlaceholder = document.createComment('desktop-wrapper-placeholder');
    desktopWrapper.parentNode?.insertBefore(this.desktopPlaceholder, desktopWrapper.nextSibling);

    // Initial call to position content correctly
    this._moveBudgetContent();

    // Add resize listener with debounce
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this._moveBudgetContent(), 150);
    });
  }

  /**
   * Moves budget max value content between mobile and desktop wrappers based on screen size.
   */
  _moveBudgetContent() {
    const { mobileWrapper, desktopWrapper } = this.dom;
    
    if (!mobileWrapper || !desktopWrapper) return;

    if (window.innerWidth < 1280) {
      // Move all children to mobile wrapper
      if (desktopWrapper.children.length > 0) {
        while (desktopWrapper.firstChild) {
          mobileWrapper.appendChild(desktopWrapper.firstChild);
        }
      }
    } else {
      // Move all children back to desktop wrapper
      if (mobileWrapper.children.length > 0) {
        while (mobileWrapper.firstChild) {
          desktopWrapper.appendChild(mobileWrapper.firstChild);
        }
      }
    }
  }
}


/**
 * Initializes all SelectGameForm components found within a given context.
 * @param {HTMLElement} context - The root element within which to search for and initialize the forms.
 */
const initSelectGameForms = (context) => {
  // Select all elements marked with the data attribute
  const forms = context.querySelectorAll('[data-select-game-form]');
  forms.forEach((form) => {
    // Prevent re-initialization
    if (form.dataset.initialized !== 'true') {
      new SelectGameForm(form).init();
      form.dataset.initialized = 'true';
    }
  });
};


// Filter 
class FilterComponent {
  constructor(container) {
    this.container = container;
    if (!this.container) {
      return;
    }
   
    
    this.dom = {
      filterButton: this.container.querySelector('.filter-button'),
      icon: this.container.querySelector('#filter-icon'),
      slider: this.container.querySelector('#budget-range'),
      minValText: this.container.querySelector('#budget-min-value'),
      maxValText: this.container.querySelector('#budget-max-value'),
      minBudgetInput: this.container.querySelector('#min-budget'),
      maxBudgetInput: this.container.querySelector('#max-budget'),
      confirmedMin: this.container.querySelector('.confirmed-budget-min-value'),
      confirmedMax: this.container.querySelector('.confirmed-budget-max-value'),
      collapsedView: this.container.querySelector('.collapsed-view'),
      games: this.container.querySelectorAll('.expanded-view input[type="checkbox"]'),
      form: this.container.querySelector('form.filters'),
    };

     this.DEFAULT_BUDGET_RANGE = { min: 500, max: 5000 };
    // Parse the budget values from the text content (format: "$1,100")
    const parseBudgetValue = (text) => {
      const num = parseInt(text.replace(/[$,]/g, ''), 10);
      return isNaN(num) ? 0 : num;
    };
    this.DEFAULT_START_BUDGET = { 
      min: parseBudgetValue(this.dom.confirmedMin?.textContent || '500'), 
      max: parseBudgetValue(this.dom.confirmedMax?.textContent || '5000') 
    };

    this.allGames = [];
  }

  init() {
    if (!this.container) {
      return;
    }

    this._initGames();
    this._initSlider();
    this._setupBudgetInputHandlers();
    this._hydrateFromUrl();
    this._bindFilterEvents();
  }

  _initGames() {
    this.allGames = [...this.dom.games].map((g) => ({
      id: g.value,
      name: g.dataset.name,
      image: g.dataset.image,
    }));
  }

  _initSlider() {
    const slider = this.dom.slider;
    if (!slider || slider.noUiSlider) return;

    const { dataset } = slider;

    const min = +dataset.min || this.DEFAULT_BUDGET_RANGE.min;
    const max = +dataset.max || this.DEFAULT_BUDGET_RANGE.max;
    const step = +dataset.step || 1;

    const start = dataset.start
      ? JSON.parse(dataset.start)
      : [this.DEFAULT_START_BUDGET.min, this.DEFAULT_START_BUDGET.max];

    window.noUiSlider.create(slider, {
      start,
      connect: true,
      step,
      margin: step,
      range: { min, max },
      format: {
        to: (v) => Math.round(v),
        from: Number,
      },
      ariaFormat: {
        to: (v) => `$${Math.round(v).toLocaleString('en-US')}`,
        from: (v) => Number(v.replace(/[$,]/g, '')),
      },
      handleAttributes: [
        { 'aria-label': 'Budget minimum', 'aria-controls': 'min-budget' },
        { 'aria-label': 'Budget maximum', 'aria-controls': 'max-budget' },
      ],
    });

    slider.noUiSlider.on('update', (values) => {
      const [minVal, maxVal] = values.map(Number);
      this._updateBudgetDisplay(minVal, maxVal);
    });
  }

  _updateBudgetDisplay(min, max) {
    if (this.dom.minValText) this.dom.minValText.value = _formatCurrency(min);
    if (this.dom.maxValText) this.dom.maxValText.value = _formatCurrency(max);
    if (this.dom.minBudgetInput) this.dom.minBudgetInput.value = min;
    if (this.dom.maxBudgetInput) this.dom.maxBudgetInput.value = max;
  }

  _bindFilterEvents() {
    // Toggle filter open/close
    this.dom.filterButton?.addEventListener('click', () => {
      if (this.container.classList.contains('open')) {
        this._toggleFilter(false);
      } else {
        this._toggleFilter(true);
      }
    });

    // Form submit (confirm)
    this.dom.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });

    // Reset button
    this.dom.form?.addEventListener('reset', () => {
      setTimeout(() => this._handleReset(), 0);
    });
  }

  _toggleFilter(open) {
    if (open) {
      this.container.classList.add('open');
      this.dom.icon?.classList.replace('icon--arrow-bottom', 'icon--arrow-top');
    } else {
      this.container.classList.remove('open');
      this.dom.icon?.classList.replace('icon--arrow-top', 'icon--arrow-bottom');
    }
  }

  _handleReset() { //this.dom.confirmedMin.textContent
    this.dom.slider?.noUiSlider.set([this.DEFAULT_START_BUDGET.min,this.DEFAULT_START_BUDGET.max]);
    this.dom.games.forEach((cb) => (cb.checked = false));
    this._updateBudgetDisplay(this.DEFAULT_START_BUDGET.min, this.DEFAULT_START_BUDGET.max);
  }

  _handleSubmit() {
    const checkedGames = [...this.dom.games].filter((cb) => cb.checked).map((cb) => cb.value);
    if (checkedGames.length === 0) return;

    const minBudget = this.dom.minBudgetInput?.value;
    const maxBudget = this.dom.maxBudgetInput?.value;

    // Update URL
    const params = new URLSearchParams();
    checkedGames.forEach((id) => params.append('games', id));
    params.set('min-budget', minBudget);
    params.set('max-budget', maxBudget);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    //update confirmed state
    this._hydrateFromUrl();
    if (window.perfectMatchProductInstance) {
      window.perfectMatchProductInstance.loadPerfectMatchProducts({
        games: checkedGames,
        minBudget,
        maxBudget,
      });
    }

    // Close filter
    this._toggleFilter(false);
  }

  _setupBudgetInputHandlers() {
    const pairs = [
      [this.dom.minValText, true],
      [this.dom.maxValText, false],
    ];

    pairs.forEach(([input, isMin]) => {
      if (!input) return;

      input.addEventListener('focus', () => input.select());
      input.addEventListener('click', () => input.select());

      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9$,]/g, '');
      });

      input.addEventListener('blur', () => this._handleBudgetInputChange(input, isMin));

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
    });
  }
  
  /**
   * Handles changes to the budget input fields, validating and formatting the input.
   * @param {HTMLInputElement} input - The input element that triggered the change.
   * @param {boolean} isMin - Whether the input is for the minimum budget value.
   */
  _handleBudgetInputChange(input, isMin) {
    const slider = this.dom.slider?.noUiSlider;
    if (!slider) return;

    const validated = this._validateBudgetValue(toNumber(input.value), isMin);

    input.value = _formatCurrency(validated);

    const [currMin, currMax] = slider.get().map(toNumber);

    slider.set(isMin ? [validated, currMax] : [currMin, validated]);
  }

  /**
   * Validates a budget value, clamping it within the allowed range.
   * @param {number} value - The value to validate.
   * @param {boolean} isMin - Whether the value is the minimum budget.
   * @returns {number} - The validated budget value.
   */

  _validateBudgetValue(value, isMin) {
    const num = clamp(toNumber(value), this.DEFAULT_BUDGET_RANGE.min, this.DEFAULT_BUDGET_RANGE.max);
    const slider = this.dom.slider?.noUiSlider;
    if (!slider) return num;

    const [currMin, currMax] = slider.get().map(toNumber);

    return isMin ? Math.min(num, currMax) : Math.max(num, currMin);
  }

  _updateCollapsedView(gameIds) {

    if (!this.dom.collapsedView) return;
    this.dom.collapsedView.innerHTML = '';

    const selectedGameObjs = this.allGames.filter((g) => gameIds.includes(g.id));

    selectedGameObjs.slice(0, 3).forEach((game) => {
      const img = document.createElement('img');
      img.src = game.image;
      img.alt = game.name;
      this.dom.collapsedView.appendChild(img);
    });

    if (selectedGameObjs.length > 3) {
      const extraDiv = document.createElement('div');
      extraDiv.className = 'extra-games text-center';
      extraDiv.textContent = `+${selectedGameObjs.length - 3}`;
      this.dom.collapsedView.appendChild(extraDiv);
    }
  }

  // ---- Validation helpers ----
sanitizeText(value){
  // Remove any characters that could be dangerous in HTML context
  return value.replace(/[<>"]/g, '');
};

validateRange(value, fallback, min, max){
  const num = parseInt(value, 10);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max); // clamp between min & max
};


  _hydrateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const selectedGames = params.getAll('games').map(this.sanitizeText);
    const minBudget = this.validateRange(
      params.get('min-budget'),
      this.DEFAULT_BUDGET_RANGE.min,
      this.DEFAULT_BUDGET_RANGE.min,
      this.DEFAULT_BUDGET_RANGE.max,
    );
    const maxBudget = this.validateRange(
      params.get('max-budget'),
      this.DEFAULT_BUDGET_RANGE.max,
      this.DEFAULT_BUDGET_RANGE.min,
      this.DEFAULT_BUDGET_RANGE.max,
    );

    // hydrate checkboxes
    this.dom.games.forEach((cb) => {
      cb.checked = selectedGames.includes(cb.value);
    });

    // hydrate slider
    if (this.dom.slider?.noUiSlider) {
      this.dom.slider.noUiSlider.set([minBudget, maxBudget]);
    }

    // hydrate confirmed values
    if (this.dom.confirmedMin) this.dom.confirmedMin.textContent = _formatCurrency(minBudget);
    if (this.dom.confirmedMax) this.dom.confirmedMax.textContent = _formatCurrency(maxBudget);
    this._updateCollapsedView(selectedGames);
  }
}

const initFilterComponents = (context) => {
  const containers = context.querySelectorAll('.filter-bar');
  containers.forEach((el) => {
    if (!el.dataset.initialized) {
      const filterComponent = new FilterComponent(el);
      filterComponent.init();
      el.dataset.initialized = 'true';
    }
  });
};

// MutationObserver
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        initFilterComponents(node);
      }
    });
  });
});