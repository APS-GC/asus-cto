import * as noUiSlider from 'nouislider';

// --- Utility Functions ---

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

// --- SelectGameForm Class ---

class SelectGameForm {
  /**
   * @param {HTMLElement} formElement - The form DOM element.
   */
  constructor(formElement) {
    this.form = formElement;
    if (!this.form) {
      return;
    }

    // Define budget range constants
    this.DEFAULT_BUDGET_RANGE = { min: 500, max: 5000 };
    this.DEFAULT_START_BUDGET = { min: 1100, max: 5000 };

    // Cache DOM elements
    this.dom = {
      games: this.form.querySelectorAll('input[name="games"]'),
      submitBtn: this.form.querySelector('button[type="submit"]'),
      slider: this.form.querySelector('#budget-range'),
      // Visible text inputs for budget display/editing (should be type="text")
      minValText: this.form.querySelector('#budget-min-value'),
      maxValText: this.form.querySelector('#budget-max-value'),
      // Hidden inputs for form submission (should be type="hidden")
      minBudgetInput: this.form.querySelector('#min-budget'),
      maxBudgetInput: this.form.querySelector('#max-budget'),
    };
  }

  /**
   * Initializes the form component.
   */
  init() {
    if (!this.form) return;

    this._initSlider();
    this._bindEvents();
    this._setupBudgetInputHandlers();

    // Enable submit button if a game is selected, otherwise disable it.
    this._updateSubmitButtonState(this._getSelectedGames().length === 0);
  }

  /**
   * Initializes the noUiSlider.
   */
  _initSlider() {
    if (!this.dom.slider || this.dom?.slider?.noUiSlider) {
      return;
    }

    const { dataset } = this.dom.slider;
    const min = parseInt(dataset.min || this.DEFAULT_BUDGET_RANGE.min, 10);
    const max = parseInt(dataset.max || this.DEFAULT_BUDGET_RANGE.max, 10);
    // Use the dataset start values, falling back to min and max if needed.
    const start = dataset.start
      ? JSON.parse(dataset.start)
      : [this.DEFAULT_START_BUDGET.min, this.DEFAULT_START_BUDGET.max];
    const step = dataset.step ? parseInt(dataset.step, 10) : 1;

    noUiSlider.create(this.dom.slider, {
      start,
      connect: true,
      step: step,
      margin: step,
      range: { min, max },
      // The 'format' is for internal use (reading/writing values)
      format: {
        to: (value) => Math.round(value),
        from: (value) => Number(value),
      },
      // The 'ariaFormat' is for screen readers
      ariaFormat: {
        to: (value) => `$${Math.round(value).toLocaleString('en-US')}`,
        from: (value) => Number(value.replace(/[$,]/g, '')),
      },
      handleAttributes: [
        { 'aria-label': 'Budget range minimum value', 'aria-controls': 'min-budget' },
        { 'aria-label': 'Budget range maximum value', 'aria-controls': 'max-budget' },
      ],
    });
    const sliderEl = this.dom.slider;
    const minHandle = sliderEl.querySelector('.noUi-handle-lower');
    const maxHandle = sliderEl.querySelector('.noUi-handle-upper');

    this.dom.slider.noUiSlider.on('update', (values) => {
      const [minVal, maxVal] = values.map((v) => parseFloat(v));
      this._updateBudgetDisplay(minVal, maxVal);
      this._updateSubmitButtonState(false);

      if (minHandle) {
        let text = `$${minVal}`;
        if (minVal === min) {
          text += ', minimum value reached';
        }
        minHandle.setAttribute('aria-valuetext', text);
      }

      if (maxHandle) {
        let text = `$${maxVal}`;
        if (maxVal === max) {
          text += ', maximum value reached';
        }
        maxHandle.setAttribute('aria-valuetext', text);
      }
    });
  }

  /**
   * Binds form-level events.
   */
  _bindEvents() {
    this.form.addEventListener('change', (e) => {
      // Re-evaluate button state when games selection changes
      if (e.target.name === 'games') {
        this._updateSubmitButtonState(this._getSelectedGames().length === 0);
      }
    });

    this.form.addEventListener('reset', () => this._handleFormReset());
  }

  /**
   * Gets a list of selected game IDs.
   * @returns {string[]} An array of selected game values.
   */
  _getSelectedGames() {
    return Array.from(this.dom.games)
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  /**
   * Parses a currency string into a number.
   * @param {string} value - The currency string to parse.
   * @returns {number} The parsed number.
   */
  _parseCurrency(value) {
    return toNumber(value);
  }

  /**
   * Formats a number as currency (e.g., $1,234).
   * @param {number|string} value - The numerical value.
   * @returns {string} The formatted currency string.
   */
  _formatCurrency(value) {
    const n = Number(value) || 0;
    return `$${n.toLocaleString('en-US')}`;
  }

  /**
   * Validates and clamps a budget value within the defined range and against the peer handle.
   * @param {number} value - The raw budget value.
   * @param {boolean} isMin - True if validating the minimum value.
   * @returns {number} The validated and clamped budget value.
   */
  _validateBudgetValue(value, isMin = false) {
    const min = this.DEFAULT_BUDGET_RANGE.min;
    const max = this.DEFAULT_BUDGET_RANGE.max;
    let v = toNumber(value);

    // 1. Clamp against overall min/max range
    v = clamp(v, min, max);

    const sliderInstance = this.dom.slider?.noUiSlider;
    if (!sliderInstance) return v;

    const [currentMin, currentMax] = sliderInstance.get().map(toNumber);

    // 2. Clamp against the other handle's position
    // The minimum value can't exceed the current maximum value
    if (isMin && v > currentMax) {
      return currentMax;
    }
    // The maximum value can't be less than the current minimum value
    if (!isMin && v < currentMin) {
      return currentMin;
    }

    return v;
  }

  /**
   * Updates all budget display and hidden input fields.
   * @param {number} min - The current minimum budget value.
   * @param {number} max - The current maximum budget value.
   */
  _updateBudgetDisplay(min, max) {
    if (this.dom.minValText) {
      this.dom.minValText.value = this._formatCurrency(min);
    }
    if (this.dom.maxValText) {
      this.dom.maxValText.value = this._formatCurrency(max);
    }
    // Update hidden inputs for form submission
    if (this.dom.minBudgetInput) {
      this.dom.minBudgetInput.value = min;
    }
    if (this.dom.maxBudgetInput) {
      this.dom.maxBudgetInput.value = max;
    }
  }

  /**
   * Sets the disabled state of the submit button.
   * @param {boolean} isDisabled - True to disable the button.
   */
  _updateSubmitButtonState(isDisabled = false) {
    if (this.dom.submitBtn) {
      this.dom.submitBtn.disabled = isDisabled;
    }
  }

  /**
   * Handles form reset by setting the slider back to its default start position.
   */
  _handleFormReset() {
    // Timeout is necessary to allow native form reset to complete first
    setTimeout(() => {
      this.dom.slider?.noUiSlider.set([
        this.DEFAULT_START_BUDGET.min,
        this.DEFAULT_START_BUDGET.max,
      ]);
      // Re-check button state after reset
      this._updateSubmitButtonState(this._getSelectedGames().length === 0);
    }, 0);
  }

  /**
   * Sets up event handlers for the visible budget text inputs.
   */
  _setupBudgetInputHandlers() {
    const inputs = [this.dom.minValText, this.dom.maxValText].filter(Boolean);
    inputs.forEach((input, idx) => {
      const isMin = idx === 0;

      // Ensure full text is selected on interaction for easy editing
      input.addEventListener('click', () => input.select());
      input.addEventListener('focus', () => input.select());

      // Filter input to allow only numbers, commas, and dollar signs (user experience)
      input.addEventListener('input', (e) => {
        const val = e.target.value || '';
        // Allow user to type $ and commas but strip anything else (for immediate feedback)
        const clean = val.replace(/[^0-9$,]/g, '');
        if (val !== clean) e.target.value = clean;
      });

      // On blur (focus lost), validate the value and update the slider
      input.addEventListener('blur', () => {
        this._handleBudgetInputChange(input, isMin);
      });

      // Handle 'Enter' key press to blur the input and trigger validation
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
    });
  }

  /**
   * Processes the budget text input change, validates, formats, and updates the slider.
   * @param {HTMLInputElement} inputElement - The text input element.
   * @param {boolean} isMin - True if handling the minimum value input.
   */
  _handleBudgetInputChange(inputElement, isMin) {
    const sliderInstance = this.dom.slider?.noUiSlider;
    if (!inputElement || !sliderInstance) return;

    const raw = this._parseCurrency(inputElement.value);
    const validated = this._validateBudgetValue(raw, isMin);

    // Set formatted display & inputs
    inputElement.value = this._formatCurrency(validated);

    if (isMin && this.dom.minBudgetInput) {
      this.dom.minBudgetInput.value = validated;
    } else if (!isMin && this.dom.maxBudgetInput) {
      this.dom.maxBudgetInput.value = validated;
    }

    const currentValues = sliderInstance.get();
    let [currMin, currMax] = currentValues.map((v) => Math.round(Number(v)));
    const step = sliderInstance.steps()[0][0];

    if (isMin) {
      currMin = validated === currMax ? currMax - step : validated;
      sliderInstance.setHandle(0, currMin, false, true);
    } else {
      currMax = validated === currMin ? currMin + step : validated;
      sliderInstance.setHandle(1, currMax, false, true);
    }
  }
}

// --- Initialization Logic ---

/**
 * Initializes all SelectGameForm components found within a given context.
 * @param {HTMLElement | Document} context - The DOM context to search within.
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

// Initialize on initial page load
document.addEventListener('DOMContentLoaded', () => {
  const mobileWrapper = document.getElementById('maximum-budget-wrapper-mobile');
  const desktopWrapper = document.getElementById('maximum-budget-wrapper-desktop');

  // Create a placeholder to remember original position in DOM
  const desktopPlaceholder = document.createComment('desktop-wrapper-placeholder');
  desktopWrapper?.parentNode?.insertBefore(desktopPlaceholder, desktopWrapper?.nextSibling);

  function moveBudgetContent() {
    if (!mobileWrapper || !desktopWrapper) return;

    if (window.innerWidth < 1280) {
      // Move all children to mobile wrapper
      if (desktopWrapper.children.length > 0) {
        while (desktopWrapper.firstChild) {
          mobileWrapper.appendChild(desktopWrapper.firstChild);
        }
      }
    } else if (mobileWrapper.children.length > 0) {
      // Move all children back to desktop wrapper
      while (mobileWrapper.firstChild) {
        desktopWrapper.appendChild(mobileWrapper.firstChild);
      }
    }
  }

  // Initial call
  moveBudgetContent();

  // Re-run on resize (with debounce)
  let resizeTimer;

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(moveBudgetContent, 150);
  });

  initSelectGameForms(document.body);

  // Start observing the entire document for changes
  observer.observe(document.body, { childList: true, subtree: true });
});

// Use MutationObserver to initialize components added dynamically (e.g., via AJAX)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        // Ensure the node is an element before querying
        if (node.nodeType === Node.ELEMENT_NODE) {
          initSelectGameForms(node);
        }
      });
    }
  });
});
