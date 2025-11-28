import * as noUiSlider from 'nouislider';
import { sanitizeText, validateRange } from '../../../site/scripts/_helpers';

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
class FilterComponent {
  constructor(container) {
    this.container = container;
    if (!this.container) {
      return;
    }
    this.DEFAULT_BUDGET_RANGE = { min: 500, max: 5000 };
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

    this.allGames = [];
  }

  init() {
    if (!this.container) {
      return;
    }

    this._initGames();
    this._initSlider();
    this._hydrateFromUrl();
    this._setupBudgetInputHandlers();
    this._bindEvents();
  }

  _initGames() {
    this.allGames = [...this.dom.games].map((g) => ({
      id: g.value,
      name: g.dataset.name,
      image: g.dataset.image,
    }));
  }

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
      // IMPROVEMENT: Use aria-controls to link the handles to the hidden inputs
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

  _updateBudgetDisplay(min, max) {
    if (this.dom.minValText) this.dom.minValText.value = `$${min}`;
    if (this.dom.maxValText) this.dom.maxValText.value = `$${max}`;
    if (this.dom.minBudgetInput) this.dom.minBudgetInput.value = min;
    if (this.dom.maxBudgetInput) this.dom.maxBudgetInput.value = max;
  }

  _bindEvents() {
    // Toggle filter open/close
    this.dom.filterButton?.addEventListener('click', (e) => {
      const filterBtn = e.target.tagName === 'SPAN' ? e.target.parentElement : e.target;
      if (this.container.classList.contains('open')) {
        filterBtn.setAttribute('aria-expanded', 'false');
        this._toggleFilter(false);
      } else {
        filterBtn.setAttribute('aria-expanded', 'true');
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
  _formatCurrency(value) {
    const n = Number(value) || 0;
    return `$${n.toLocaleString('en-US')}`;
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
  _handleBudgetInputChange(inputElement, isMin) {
    const sliderInstance = this.dom.slider?.noUiSlider;
    if (!inputElement || !sliderInstance) return;

    // 1. Get raw number from the input value (stripping currency/commas)
    const raw = toNumber(inputElement.value);
    // 2. Validate and clamp the value
    const validated = this._validateBudgetValue(raw, isMin);

    // 3. Update the visible input with the formatted, validated value
    inputElement.value = this._formatCurrency(validated);

    // 4. Update the slider position
    const [currentMin, currentMax] = sliderInstance.get().map(toNumber);

    if (isMin) {
      // Set the minimum handle position
      sliderInstance.set([validated, currentMax]);
    } else {
      // Set the maximum handle position
      sliderInstance.set([currentMin, validated]);
    }

    // Trigger update of hidden inputs via slider 'update' event
  }
  _toggleFilter(open) {
    if (open) {
      this.container.classList.add('open');
      document.querySelector('#budget').classList.add('expanded');
      this.dom.icon?.classList.replace('icon--arrow-bottom', 'icon--arrow-top');
    } else {
      this.container.classList.remove('open');
      document.querySelector('#budget').classList.remove('expanded');
      this.dom.icon?.classList.replace('icon--arrow-top', 'icon--arrow-bottom');
    }
  }

  _handleReset() {
    this.dom.slider?.noUiSlider.set([this.DEFAULT_BUDGET_RANGE.min, this.DEFAULT_BUDGET_RANGE.max]);
    this.dom.games.forEach((cb) => (cb.checked = false));
    this._updateBudgetDisplay(this.DEFAULT_BUDGET_RANGE.min, this.DEFAULT_BUDGET_RANGE.max);
  }

  _handleSubmit() {
    const checkedGames = [...this.dom.games].filter((cb) => cb.checked).map((cb) => cb.value);

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

  _hydrateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const selectedGames = params.getAll('games').map(sanitizeText);
    const minBudget = validateRange(
      params.get('min-budget'),
      this.DEFAULT_BUDGET_RANGE.min,
      this.DEFAULT_BUDGET_RANGE.min,
      this.DEFAULT_BUDGET_RANGE.max,
    );
    const maxBudget = validateRange(
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
    if (this.dom.confirmedMin) this.dom.confirmedMin.textContent = `$${minBudget}`;
    if (this.dom.confirmedMax) this.dom.confirmedMax.textContent = `$${maxBudget}`;
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

document.addEventListener('DOMContentLoaded', () => {
  initFilterComponents(document.body);
  observer.observe(document.body, { childList: true, subtree: true });
});
