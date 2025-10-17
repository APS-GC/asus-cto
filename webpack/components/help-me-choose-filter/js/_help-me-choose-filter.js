import * as noUiSlider from 'nouislider';
import { sanitizeText, validateRange } from '../../../site/scripts/_helpers';

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
    this._bindEvents();
  }

  _initGames() {
    this.allGames = [...this.dom.games].map((g) => ({
      id: g.value,
      name: g.dataset.name,
      image: g.dataset.image,
    }));

    console.log(this.allGames);
  }

  _initSlider() {
    if (!this.dom.slider || this.dom.slider.noUiSlider) return;
    const { dataset } = this.dom.slider;
    const min = parseInt(dataset.min || this.DEFAULT_BUDGET_RANGE.min, 10);
    const max = parseInt(dataset.max || this.DEFAULT_BUDGET_RANGE.max, 10);
    const start = dataset.start ? JSON.parse(dataset.start) : [min, max];
    const step = parseInt(dataset.step || 100, 10);

    noUiSlider.create(this.dom.slider, {
      start,
      connect: true,
      step,
      range: { min, max },
      format: {
        to: (value) => Math.round(value),
        from: (value) => Number(value),
      },
    });

    this.dom.slider.noUiSlider.on('update', (values) => {
      const [minVal, maxVal] = values.map((v) => parseFloat(v));
      this._updateBudgetDisplay(minVal, maxVal);
    });
  }

  _updateBudgetDisplay(min, max) {
    if (this.dom.minValText) this.dom.minValText.textContent = `$${min}`;
    if (this.dom.maxValText) this.dom.maxValText.textContent = `$${max}`;
    if (this.dom.minBudgetInput) this.dom.minBudgetInput.value = min;
    if (this.dom.maxBudgetInput) this.dom.maxBudgetInput.value = max;
  }

  _bindEvents() {
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

  _handleReset() {
    this.dom.slider?.noUiSlider.set([this.DEFAULT_BUDGET_RANGE.min, this.DEFAULT_BUDGET_RANGE.max]);
    this.dom.games.forEach((cb) => (cb.checked = false));
    this._updateBudgetDisplay(this.DEFAULT_BUDGET_RANGE.min, this.DEFAULT_BUDGET_RANGE.max);
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
