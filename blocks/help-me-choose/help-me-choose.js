import { loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the help-me-choose block, initializing the carousel and form.
 * @param {Element} block - The block element to decorate.
 * @returns {Promise<void>}
 */
export default async function decorate(block) {
  // Load noUiSlider only once
  await loadNoUiSlider();

  // Once loaded, render the component
  await renderHelpMeChoose(block);

  // Initialize existing game forms
  initSelectGameForms(document.body);

  // Setup a single MutationObserver (if not already)
  setupSelectGameFormsObserver();
}


/**
 * Renders the Help Me Choose section, including the game list and budget filter.
 * @param {Element} block - The block element to render the content into.
 * @returns {Promise<void>}
 */
async function renderHelpMeChoose(block) {
  const helpMeChooseContainer = document.createElement('div');
  helpMeChooseContainer.className = 'help-me-choose-container container';

  const authoredRows = [...block.children];
  const AuthoredData = authoredRows.map(row => row.textContent.trim());

  // Fetch products
  const gameList = await fetchGameList();
  const lowestPrice = gameList?.results?.lowestPrice || 500;
  const highestPrice = gameList?.results?.highestPrice || 5000;
  // Build the HTML in a fragment / string, then insert once
  const html = `
    <div class="game-recommendation">
      <div class="carousel panelcontainer">
          <div class="section-heading">
              <div class="section-heading__text-group">
                  <h2 class="section-heading__title">${escapeHtml(AuthoredData[0] || '')}</h2>
                  <p class="section-heading__description">${escapeHtml(AuthoredData[1] || '')}</p>
              </div>
              <div class="cmp-carousel__actions">
                  <button class="cmp-carousel__action cmp-carousel__action--previous" type="button" aria-label="Previous">
                      <span class="icon icon--arrow-left"></span>
                  </button>
                  <button class="cmp-carousel__action cmp-carousel__action--next" type="button" aria-label="Next">
                      <span class="icon icon--arrow-right"></span>
                  </button>
              </div>
          </div>

          <form id="game-selection-form" action="./product-matches.html" class="game-form" aria-label="Game selection form" data-select-game-form>
              <div class="game-carousel-wrapper">
                  <div class="swiper">
                      <div class="swiper-wrapper">
                          ${gameList?.results?.gameList?.map(game => `
                          <div class="swiper-slide">
                              <div class="game-item">
                                  <input type="checkbox" id="game-you-play-${game.gameId}" name="games" value="${escapeHtml(game.gameId)}" data-name="${escapeHtml(game.gameTitle)}" data-image="${escapeHtml(game.imageUrl)}" aria-checked="false" />
                                  <div class="game-details-wrapper">
                                      <div class="image-wrapper" aria-hidden="true">
                                          <img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.gameTitle)}" class="game-image" loading="lazy" />
                                          <div class="checkmark-overlay"></div>
                                      </div>
                                      <label class="game-info" for="game-you-play-${game.gameId}">
                                          ${escapeHtml(game.gameTitle)}
                                      </label>
                                  </div>
                              </div>
                          </div>
                          `).join('')}
                      </div>
                      <div class="swiper-pagination"></div>
                  </div>
              </div>

              <div class="budget-bar">
                  <div class="budget-left">
                      <label for="budget-min-value">Your budget:</label>
                  </div>
                  <div class="budget-center">
                      <input type="text" class="budget-value" id="budget-min-value" aria-label="Minimum budget" />
                      <div class="budget-separator">to</div>
                      <div class="budget-range-wrapper">
                          <div id="budget-range" class="budget-range-slider" data-start="[${lowestPrice}, ${highestPrice}]" data-min="500" data-max="5000" role="slider" data-step="100" aria-label="Budget range slider" aria-valuemax="${highestPrice}" aria-valuemin="${lowestPrice}" aria-orientation="horizontal" aria-valuenow="${lowestPrice}"
                          aria-valuetext="Budget range between ${_formatCurrency(lowestPrice)} to ${_formatCurrency(highestPrice)}"></div>
                          <div class="range-labels">
                              <span>$500</span>
                              <span>$5,000</span>
                          </div>
                      </div>
                      <input type="text" class="budget-value" id="budget-max-value" aria-label="Maximum budget" />
                  </div>
                  <input type="hidden" name="min-budget" id="min-budget" value="" />
                  <input type="hidden" name="max-budget" id="max-budget" value="" />
                  <div class="budget-actions">
                      <button type="reset" class="reset-button btn btn-link">Reset</button>
                      <button type="submit" class="btn" disabled>Help me choose</button>
                  </div>
              </div>
          </form>
      </div>
    </div>
  `;

  helpMeChooseContainer.innerHTML = html;

  // Move instrumentation
  moveInstrumentation(block, helpMeChooseContainer);

  // Replace in DOM
  block.replaceChildren(...helpMeChooseContainer.children);

  // Initialize carousel *after* DOM insertion
  initializeSwiperCarousel(block);
}

/**
 * Fetches a list of games from a specified API endpoint, with fallback options and a timeout.
 * @param {string} [endpoint] - The API endpoint to fetch the game list from.
 * @param {number} [maxProducts] - The maximum number of products to return.
 */
async function fetchGameList(
  endpoint = 'https://dummyjson.com/c/ba3b-dd2e-4ba7-b9f0',
  timeoutMs = 5000
) {
  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout to abort the fetch
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    console.log(`Attempting to fetch from: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      mode: 'cors',
      signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.warn(`Fetch aborted (timeout after ${timeoutMs} ms)`);
    } else {
      console.warn(`Error fetching from ${endpoint}:`, error.message);
      if (error.message.includes('JSON')) {
        console.warn('Likely non-JSON response');
      }
    }

    return [];  // fallback
  }
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

  // Use modules explicitly (if using swiper modular build)
  const swiper = new Swiper(swiperContainer, {
    // Basic options
    slidesPerView: 2,
    spaceBetween: 16,

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
    };

    this.DEFAULT_BUDGET_RANGE = { min: 500, max: 5000 };
    this.DEFAULT_START_BUDGET = { min: this.dom.minBudgetInput.value, max: this.dom.maxBudgetInput.value };
  }

  /**
   * Initializes the SelectGameForm, setting up the slider and binding events.
   */
  init() {
    if (!this.form) return;

    this._initSlider();
    this._bindEvents();
    this._setupBudgetInputHandlers();

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
      this._updateSubmitButtonState(this._getSelectedGames().length === 0);
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
