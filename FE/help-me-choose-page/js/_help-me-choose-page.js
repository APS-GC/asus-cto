import * as noUiSlider from 'nouislider';

class SelectGameForm {
  constructor(formElement) {
    this.form = formElement;
    if (!this.form) {
      return;
    }

    this.DEFAULT_BUDGET_RANGE = { min: 500, max: 5000 };

    this.dom = {
      games: this.form.querySelectorAll('input[name="games"]'),
      submitBtn: this.form.querySelector('button[type="submit"]'),
      slider: this.form.querySelector('#budget-range'),
      minValText: this.form.querySelector('#budget-min-value'),
      maxValText: this.form.querySelector('#budget-max-value'),
      minBudgetInput: this.form.querySelector('#min-budget'),
      maxBudgetInput: this.form.querySelector('#max-budget'),
    };
  }

  init() {
    if (!this.form) {
      return;
    }

    this._initSlider();
    this._bindEvents();
    this._updateSubmitButtonState(true);
  }

  _initSlider() {
    if (!this.dom.slider || this.dom?.slider?.noUiSlider) {
      return;
    }

    const { dataset } = this.dom.slider;
    const min = parseInt(dataset.min || this.DEFAULT_BUDGET_RANGE.min, 10);
    const max = parseInt(dataset.max || this.DEFAULT_BUDGET_RANGE.max, 10);
    const start = dataset.start ? JSON.parse(dataset.start) : [min, max];
    const step = dataset.step ? parseInt(dataset.step, 10) : 1;

    noUiSlider.create(this.dom.slider, {
      start,
      connect: true,
      step: step,
      margin: step,
      range: { min, max },
      format: {
        to: (value) => Math.round(value),
        from: (value) => Number(value),
      },
      ariaFormat: {
        to: (value) => `$${Math.round(value)}`,
        from: (value) => Number(value.replace('$', '')),
      },
      handleAttributes: [
        { 'aria-label': 'Budget range starts from' },
        { 'aria-label': 'Budget range max value' },
      ],
    });

    this.dom.slider.noUiSlider.on('update', (values) => {
      const [minVal, maxVal] = values.map((v) => parseFloat(v));
      this._updateBudgetDisplay(minVal, maxVal);
      this._updateSubmitButtonState(false);
    });
  }

  _bindEvents() {
    this.form.addEventListener('change', (e) => {
      if (e.target.name === 'games') {
        this._updateSubmitButtonState(false);
      }
    });

    this.form.addEventListener('reset', () => this._handleFormReset());
  }

  _updateBudgetDisplay(min, max) {
    if (this.dom.minValText) {
      this.dom.minValText.textContent = `$${min}`;
    }
    if (this.dom.maxValText) {
      this.dom.maxValText.textContent = `$${max}`;
    }
    if (this.dom.minBudgetInput) {
      this.dom.minBudgetInput.value = min;
    }
    if (this.dom.maxBudgetInput) {
      this.dom.maxBudgetInput.value = max;
    }
  }

  _updateSubmitButtonState(isDisabled = false) {
    if (this.dom.submitBtn) {
      this.dom.submitBtn.disabled = isDisabled;
    }
  }

  _handleFormReset() {
    setTimeout(() => {
      this._updateSubmitButtonState(true);
      this.dom.slider?.noUiSlider.set([
        this.DEFAULT_BUDGET_RANGE.min,
        this.DEFAULT_BUDGET_RANGE.max,
      ]);
    }, 0);
  }
}

// Initializes all SelectGameForm components found within a given context.
const initSelectGameForms = (context) => {
  const forms = context.querySelectorAll('[data-select-game-form]');
  forms.forEach((form) => {
    // Prevent re-initialization
    if (!form.dataset.initialized) {
      const selectGameForm = new SelectGameForm(form);
      selectGameForm.init();
      form.dataset.initialized = 'true';
    }
  });
};

// Initialize on initial page load
document.addEventListener('DOMContentLoaded', () => {
  initSelectGameForms(document.body);

  // Start observing the entire document for changes
  observer.observe(document.body, { childList: true, subtree: true });
});

// Use MutationObserver to initialize components added dynamically
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          initSelectGameForms(node);
        }
      });
    }
  });
});
