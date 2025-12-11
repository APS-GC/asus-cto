import A11yDialog from 'a11y-dialog';
import Choices from 'choices.js';
import noUiSlider from 'nouislider';
import { fetchData } from '../../../site/scripts/_api';

/**
 * Utilities
 */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isEmptyString = (s) => typeof s !== 'string' || s.trim() === '';
const toNumber = (v) => {
  if (typeof v === 'number') return v;
  const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Product Sidebar Filter Manager
 */
class ProductSidebarFilter {
  constructor() {
    // Cache DOM elements once
    this.sidebar = document.querySelector('.cmp-sidebar__filters');
    this.appliedFiltersContainer = document.querySelector('.cmp-sidebar__applied-filters');
    this.appliedFiltersList = document.querySelector('.applied-filters__list');
    this.appliedFilter = this.appliedFiltersList?.querySelector('.applied-filter');
    this.clearAllBtn = document.querySelector('.applied-filters__clear');
    this.budgetSlider = document.getElementById('budget-range-slider');
    this.minBudgetInput = document.getElementById('budget-min-value');
    this.maxBudgetInput = document.getElementById('budget-max-value');
    this.applyButton = document.querySelector('.btn-apply');
    this.budgetRangeFilterId = 'filter-budget-range';
    this.filterButton = document.querySelectorAll('.cmp-product-filter-trigger');

    // Constants
    this.DEFAULT_MIN = 500;
    this.DEFAULT_MAX = 5000;
    this.DEFAULT_BUDGET_RANGE = { min: 1100, max: 5000 };
    this.FILTER_COUNT = 0;

    // State
    this.isInitializing = false;
    this.urlUpdateTimeout = null;
    this.pendingFilters = [];
    this.isMobile = window.innerWidth < 992;
    this.lastSyncedValues = { min: null, max: null };

    // Live region reused for announcements
    this._liveRegion = null;

    // Bind handlers
    this.handleResize = this.handleResize.bind(this);
    this._throttledResize = this._throttleRaf(this.handleResize);
  }

  /* -------------------------------
   * Utilities
   * ------------------------------*/
  parseCurrency(value) {
    return toNumber(value);
  }

  formatCurrency(value) {
    // ensure number
    const n = Number(value) || 0;
    return `$${n.toLocaleString('en-US')}`;
  }

  validateBudgetValue(value, isMin = false) {
    const min = this.DEFAULT_MIN;
    const max = this.DEFAULT_MAX;
    let v = toNumber(value);

    v = clamp(v, min, max);

    if (isMin && this.maxBudgetInput) {
      const currentMax = toNumber(this.maxBudgetInput.value) || max;
      if (v > currentMax) return currentMax;
    } else if (!isMin && this.minBudgetInput) {
      const currentMin = toNumber(this.minBudgetInput.value) || min;
      if (v < currentMin) return currentMin;
    }

    return v;
  }

  /* -------------------------------
   * URL / State sync
   * ------------------------------*/
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const filters = params.getAll('filter').filter((f) => f.trim());
    return {
      minBudget: toNumber(params.get('minBudget')) || this.DEFAULT_BUDGET_RANGE.min,
      maxBudget: toNumber(params.get('maxBudget')) || this.DEFAULT_BUDGET_RANGE.max,
      filters,
    };
  }

  updateUrlParams(params) {
    // debounce
    if (this.urlUpdateTimeout) clearTimeout(this.urlUpdateTimeout);
    this.urlUpdateTimeout = setTimeout(() => {
      const url = new URL(window.location);
      const sp = new URLSearchParams();

      sp.set('minBudget', params.minBudget);
      sp.set('maxBudget', params.maxBudget);

      (params.filters || []).forEach((f) => {
        if (!isEmptyString(f)) sp.append('filter', f);
      });

      url.search = sp.toString();

      if (!this.isInitializing) {
        // replaceState so back/forward is cleaner for filter-only changes
        window.history.replaceState({ filters: params }, '', url);
      }
    }, 120);
  }

  syncStateWithUrl() {
    if (this.isInitializing) return;

    const currentFilters = this.getCurrentFilters();
    const currentBudget = {
      minBudget: toNumber(this.minBudgetInput?.value) || this.DEFAULT_BUDGET_RANGE.min,
      maxBudget: toNumber(this.maxBudgetInput?.value) || this.DEFAULT_BUDGET_RANGE.max,
    };

    this.updateUrlParams({
      ...currentBudget,
      filters: currentFilters,
    });

    // Clear product grid while loading
    const productGrid = document.getElementById('product-grid');
    if (productGrid) productGrid.innerHTML = '';

    // Notify listing manager
    document.dispatchEvent(
      new CustomEvent('product-filter-applied', {
        detail: { filters: currentFilters, resetPage: true },
      }),
    );
  }

  /* -------------------------------
   * Applied filters management
   * ------------------------------*/
  _normalizeFilterText(filterText) {
    return String(filterText).replace('×', '').trim();
  }

  _filterExists(filterText) {
    if (!this.appliedFiltersList) return false;
    const normalized = this._normalizeFilterText(filterText);
    return [...this.appliedFiltersList.querySelectorAll('.applied-filter')].some((el) => {
      const text =
        el.querySelector('.filter-text')?.textContent?.trim() ||
        el.textContent.replace('×', '').trim();
      return text === normalized;
    });
  }

  addAppliedFilter(filterText, id) {
    if (isEmptyString(filterText) || !this.appliedFiltersList) return;

    const normalized = this._normalizeFilterText(filterText);
    if (this._filterExists(normalized)) return;

    const [category, value] = normalized.includes(':')
      ? normalized.split(':').map((s) => s.trim())
      : ['Filter', normalized];

    const filterElement = document.createElement('button');
    filterElement.className = 'applied-filter filter-element';
    filterElement.dataset.id = id;
    filterElement.setAttribute('title', `${normalized}`);
    filterElement.setAttribute('tabindex', '0');
    filterElement.innerHTML = `
      <span class="filter-text">${normalized}</span>
      <button class="remove-filter" tabindex="-1" aria-label="Remove ${category} filter: ${value}" type="button">×</button>
    `;

    this.appliedFiltersList.appendChild(filterElement);
    this.updateAppliedFiltersVisibility();
    this.updateFilterCount();
    this.updateAppliedFiltersDisplay();
  }

  removeAppliedFilter(id) {
    if (!this.appliedFiltersList) return;

    [...this.appliedFiltersList.querySelectorAll('.applied-filter')].forEach((el) => {
      if (el.dataset.id === id) el.remove();
    });

    this.updateAppliedFiltersVisibility();
    this.updateFilterCount();
    this.updateAppliedFiltersDisplay();
  }

  updateAppliedFiltersVisibility() {
    if (!this.appliedFiltersContainer || !this.appliedFiltersList) return;
    const hasFilters = this.appliedFiltersList.children.length > 0;
    this.appliedFiltersContainer.classList.toggle('show', hasFilters);
  }

  updateFilterCount() {
    if (!this.appliedFiltersList) return;
    this.filterCount = this.appliedFiltersList.children.length;

    if (this.filterButton && this.filterCount > 0) {
      this.filterButton.forEach((btn) => {
        btn.textContent = `Filter (${this.filterCount})`;
      });
    } else {
      this.filterButton.textContent = `Filter`;
    }
  }
  updateAppliedFiltersDisplay() {
    if (window.innerWidth > 1280) return;
    if (!this.appliedFiltersList) return;

    const filters = Array.from(
      this.appliedFiltersList.querySelectorAll('.applied-filter.filter-element'),
    );
    const showLimit = 4;

    const moreBtn = this.appliedFiltersList.querySelector('.applied-filter.more-filters');
    if (moreBtn) moreBtn.remove();

    if (filters.length <= showLimit) {
      filters.forEach((el) => (el.style.display = 'inline-flex'));
      return;
    }

    // Hide all beyond the 4th
    filters.forEach((el, i) => {
      el.style.display = i < showLimit ? 'inline-flex' : 'none';
    });

    //Display more element
    const hiddenCount = filters.length - showLimit;
    const moreElement = document.createElement('span');
    moreElement.className = 'applied-filter more-filters';
    moreElement.innerHTML = `+${hiddenCount}`;
    moreElement.style.cursor = 'pointer';

    this.appliedFiltersList.appendChild(moreElement);

    moreElement.addEventListener('click', () => {
      filters.forEach((el) => (el.style.display = 'inline-flex'));
      moreElement.remove();
    });
  }

  /* -------------------------------
   * Budget range handling
   * ------------------------------*/
  updateBudgetRangeFilter(minVal, maxVal) {
    if (!this.appliedFiltersList) return;

    // Remove old budget filters first
    this.removeAppliedFilter(this.budgetRangeFilterId);

    const defaultMin = this.DEFAULT_BUDGET_RANGE.min;
    const defaultMax = this.DEFAULT_BUDGET_RANGE.max;

    if (minVal === undefined || maxVal === undefined) return;

    if (minVal !== defaultMin || maxVal !== defaultMax) {
      const text = `Price Range: ${this.formatCurrency(minVal)} - ${this.formatCurrency(maxVal)}`;
      // avoid duplicates
      if (!this._filterExists(text)) this.addAppliedFilter(text, this.budgetRangeFilterId);
    }
  }

  /* -------------------------------
   * Slider & inputs
   * ------------------------------*/
  initBudgetSlider() {
    if (!this.budgetSlider) return;

    // destroy previous if present
    if (this.budgetSlider.noUiSlider) {
      this.budgetSlider.noUiSlider.destroy();
    }

    const ds = this.budgetSlider.dataset || {};
    const min = toNumber(ds.min) || this.DEFAULT_BUDGET_RANGE.min;
    const max = toNumber(ds.max) || this.DEFAULT_BUDGET_RANGE.max;
    const step = toNumber(ds.step) || 1;
    const start = ds.start ? JSON.parse(ds.start) : [min, max];

    noUiSlider.create(this.budgetSlider, {
      start,
      connect: true,
      step,
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

    // update on 'update' and 'change'
    this.budgetSlider.noUiSlider.on('update', () => this.handleSliderChange(false));
    this.budgetSlider.noUiSlider.on('change', () => this.handleSliderChange(true));
  }

  handleSliderChange(isFinal = false) {
    if (!this.budgetSlider?.noUiSlider) return;
    const values = this.budgetSlider.noUiSlider.get();
    const [minVal, maxVal] = values.map((v) => Math.round(Number(v)));

    // skip if unchanged
    if (this.lastSyncedValues.min === minVal && this.lastSyncedValues.max === maxVal && isFinal)
      return;

    // update inputs
    if (this.minBudgetInput) this.minBudgetInput.value = this.formatCurrency(minVal);
    if (this.maxBudgetInput) this.maxBudgetInput.value = this.formatCurrency(maxVal);

    // update applied filters (but don't sync URL until final change on desktop)
    this.updateBudgetRangeFilter(minVal, maxVal);

    if (isFinal) {
      this.lastSyncedValues = { min: minVal, max: maxVal };
      this.syncStateWithUrl();
    }
  }

  setupBudgetInputHandlers() {
    const inputs = [this.minBudgetInput, this.maxBudgetInput].filter(Boolean);
    inputs.forEach((input, idx) => {
      const isMin = idx === 0;

      input.addEventListener('click', () => input.select());
      input.addEventListener('focus', () => input.select());

      input.addEventListener('input', (e) => {
        const val = e.target.value || '';
        const clean = val.replace(/[^0-9$,]/g, '');
        if (val !== clean) e.target.value = clean;
      });

      input.addEventListener('blur', () => {
        this.handleBudgetInputChange(input, isMin);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });
    });
  }

  handleBudgetInputChange(inputElement, isMin) {
    if (!inputElement || !this.budgetSlider?.noUiSlider) return;

    const raw = this.parseCurrency(inputElement.value);
    const validated = this.validateBudgetValue(raw, isMin);

    // Set formatted display & inputs
    inputElement.value = this.formatCurrency(validated);

    if (isMin && this.minBudgetInput) {
      this.minBudgetInput.value = validated;
    } else if (!isMin && this.maxBudgetInput) {
      this.maxBudgetInput.value = validated;
    }

    const currentValues = this.budgetSlider.noUiSlider.get();
    let [currMin, currMax] = currentValues.map((v) => Math.round(Number(v)));
    const step = this.budgetSlider.noUiSlider.steps()[0][0];

    if (isMin) {
      currMin = validated === currMax ? currMax - step : validated;
      this.budgetSlider.noUiSlider.setHandle(0, currMin, false, true);
    } else {
      currMax = validated === currMin ? currMin + step : validated;
      this.budgetSlider.noUiSlider.setHandle(1, currMax, false, true);
    }

    // Update applied filters and sync with URL immediately on desktop
    this.updateBudgetRangeFilter(currMin, currMax);

    if (!this.isMobile) {
      this.syncStateWithUrl();
    }
  }

  /* -------------------------------
   * Checkbox handling (unified)
   * ------------------------------*/
  getFilterText(checkbox) {
    const section = checkbox.closest('.cmp-accordion__item');
    if (!section) return '';
    const sectionTitle = section.querySelector('.cmp-accordion__title')?.textContent?.trim() || '';
    const optionText = checkbox.nextElementSibling?.textContent?.trim() || '';
    return `${sectionTitle}: ${optionText}`;
  }

  getCurrentFilters() {
    if (!this.sidebar) return [];
    return Array.from(this.sidebar.querySelectorAll('input[type="checkbox"]:checked'))
      .map((ch) => {
        const text = this.getFilterText(ch);
        return text.includes(':') ? text.split(':').pop().trim() : text.trim();
      })
      .filter((t) => !isEmptyString(t));
  }

  onCheckboxChange(checkbox, forceApply = false) {
    const filterText = this.getFilterText(checkbox);
    if (isEmptyString(filterText)) return;

    // Add/remove applied filter in UI
    if (checkbox.checked) {
      this.addAppliedFilter(filterText, checkbox.id);
    } else {
      this.removeAppliedFilter(checkbox.id);
    }

    // Mobile behaviour: queue pending; desktop: sync immediately
    if (!this.isMobile || forceApply) {
      this.syncStateWithUrl();
    } else {
      this._queuePendingFilter(checkbox, filterText);
    }
  }

  _queuePendingFilter(checkbox, filterText) {
    const idx = this.pendingFilters.findIndex((f) => f.id === checkbox.id);
    if (checkbox.checked) {
      if (idx === -1) {
        this.pendingFilters.push({ id: checkbox.id, text: filterText, checked: true });
      }
    } else if (idx !== -1) {
      this.pendingFilters.splice(idx, 1);
    }
  }

  applyPendingFilters() {
    this.pendingFilters = [];
    this.syncStateWithUrl();

    // close dialog via close button if present
    const closeButton = document.querySelector('[data-a11y-dialog-hide="product-filter-dialog"]');
    if (closeButton) closeButton.click();
  }

  cancelPendingFilters() {
    this.pendingFilters.forEach((f) => {
      const checkbox = document.getElementById(f.id);
      if (checkbox) checkbox.checked = f.checked;
    });
    this.pendingFilters = [];
  }

  setupCheckboxHandlers() {
    if (!this.sidebar) return;
    const checkboxes = Array.from(this.sidebar.querySelectorAll('input[type="checkbox"]'));
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => this.onCheckboxChange(checkbox));
    });
  }

  /* -------------------------------
   * Remove applied-filter & clear all
   * ------------------------------*/
  setupRemoveFilterHandlers() {
    document.addEventListener('click', (e) => {
      const filterElement = e.target.closest('.applied-filter');
      if (filterElement) {
        e.preventDefault();
        const filterId = filterElement.dataset.id;
        // Uncheck matching checkbox(es)
        if (this.sidebar?.querySelector(`#${filterId}`)) {
          this.sidebar.querySelector(`#${filterId}`).checked = false;
        } else if (filterId === this.budgetRangeFilterId) {
          this.budgetSlider.noUiSlider.set([
            this.DEFAULT_BUDGET_RANGE.min,
            this.DEFAULT_BUDGET_RANGE.max,
          ]);
        }
        this.removeAppliedFilter(filterId);
        this.syncStateWithUrl();
      }
    });

    //For removing the selected filters when user press Enter key on the selected filter
    this.appliedFilter?.addEventListener('keydown', (e) => {
      const filterElement = e.target;
      if (!filterElement?.closest('.applied-filter')) return;
      if (e.key == 'Enter') {
        e.preventDefault();
        const filterId = filterElement.dataset.id;

        // Uncheck matching checkbox(es)
        if (this.sidebar?.querySelector(`#${filterId}`)) {
          this.sidebar.querySelector(`#${filterId}`).checked = false;
        } else if (filterId === this.budgetRangeFilterId) {
          this.budgetSlider.noUiSlider.set([
            this.DEFAULT_BUDGET_RANGE.min,
            this.DEFAULT_BUDGET_RANGE.max,
          ]);
        }
        setTimeout(() => {
          //To focus on the next sibiling element
          filterElement.nextElementSibling?.focus();
        }, 300);

        this.removeAppliedFilter(filterId);
        this.syncStateWithUrl();
      }
    });
  }

  setupClearAllHandler() {
    if (!this.clearAllBtn) return;
    this.clearAllBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Uncheck all
      if (this.sidebar) {
        this.sidebar.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
          checkbox.checked = false;
        });
      }

      // Reset budget range slider to defaults
      if (this.budgetSlider?.noUiSlider) {
        this.budgetSlider.noUiSlider.set([
          this.DEFAULT_BUDGET_RANGE.min,
          this.DEFAULT_BUDGET_RANGE.max,
        ]);
      }

      // Clear applied filters UI
      if (this.appliedFiltersList) this.appliedFiltersList.innerHTML = '';

      this.updateAppliedFiltersVisibility();
      this.updateFilterCount();
      this.updateAppliedFiltersDisplay();
      this.updateBudgetRangeFilter(this.DEFAULT_BUDGET_RANGE.min, this.DEFAULT_BUDGET_RANGE.max);
      this.syncStateWithUrl();
    });
  }

  /* -------------------------------
   * URL init & popstate
   * ------------------------------*/
  applyFilterFromText(filterText) {
    if (!filterText.includes(':')) return;
    const [sectionTitle, optionText] = filterText.split(':').map((s) => s.trim());

    this.sidebar.querySelectorAll('.cmp-accordion__item').forEach((item) => {
      const title = item.querySelector('.cmp-accordion__title')?.textContent?.trim();
      if (title === sectionTitle) {
        item.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
          const label = checkbox.nextElementSibling?.textContent?.trim();
          if (label === optionText) {
            if (!checkbox.checked) {
              checkbox.checked = true;
              // addAppliedFilter is idempotent / checks for duplicates
              this.addAppliedFilter(filterText);
            }
          }
        });
      }
    });
  }

  async initializeFromUrl() {
    this.isInitializing = true;
    try {
      const { minBudget, maxBudget, filters } = this.getUrlParams();

      // init slider
      if (this.budgetSlider?.noUiSlider) {
        this.budgetSlider.noUiSlider.setHandle(0, minBudget, false, true);
        this.budgetSlider.noUiSlider.setHandle(1, maxBudget, false, true);
        if (
          minBudget !== this.DEFAULT_BUDGET_RANGE.min ||
          maxBudget !== this.DEFAULT_BUDGET_RANGE.max
        ) {
          this.updateBudgetRangeFilter(minBudget, maxBudget);
        }
      }

      if (filters.length > 0 && this.sidebar) {
        // expand accordions if needed (small delay for UI)
        await new Promise((r) => setTimeout(r, 150));

        filters.forEach((filterText) => {
          // apply filter - this will also add applied filter in UI
          this.applyFilterFromText(filterText);
        });
      }
    } catch (err) {
      console.error('Error initializing from URL:', err);
    } finally {
      this.isInitializing = false;
    }
  }

  setupPopstateHandler() {
    window.addEventListener('popstate', () => {
      this.initializeFromUrl();
    });
  }

  /* -------------------------------
   * Mobile buttons + dialog helpers
   * ------------------------------*/
  setupMobileButtons() {
    if (this.applyButton) {
      this.applyButton.addEventListener('click', () => this.applyPendingFilters());
    }
  }

  closeMobileFilterDialog() {
    const closeButton = document.querySelector('[data-a11y-dialog-hide="product-filter-dialog"]');
    if (closeButton) closeButton.click();
  }

  /* -------------------------------
   * Resize handler (throttled)
   * ------------------------------*/
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 992;

    if (wasMobile && !this.isMobile && this.pendingFilters.length > 0) {
      this.applyPendingFilters();
    }
  }

  _throttleRaf(fn) {
    let scheduled = false;
    return () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        fn();
      });
    };
  }

  /* -------------------------------
   * Init
   * ------------------------------*/
  init() {
    if (!this.sidebar) return;

    this.initBudgetSlider();
    this.setupBudgetInputHandlers();
    this.setupCheckboxHandlers();
    this.setupRemoveFilterHandlers();
    this.setupClearAllHandler();
    this.setupMobileButtons();
    this.initializeFromUrl();
    this.setupPopstateHandler();

    // throttle resize
    window.addEventListener('resize', this._throttledResize);
  }
}

/**
 * Product Listing Manager
 */
class ProductListingManager {
  constructor() {
    this.productGrid = document.getElementById('product-grid');
    this.noMatches = document.getElementById('no-matches');
    this.productCountElement = document.getElementById('product-count');
    this.showMoreContainer = document.getElementById('show-more-products-container');
    this.showMoreBtn = document.getElementById('show-more-products-btn');
    this.noMatchesExploreProducts = document.getElementById('no-matches-explore-products');
    this.productsPerPage = 6;
    this.currentPage = 1;
    this.allProducts = [];
    this.exploreProducts = [];
    this.totalProducts = 0;
    this.hasMore = true;
    this.currentSort = 'newest';
    this.filters = [];
    this.productType = 'plp';
  }

  init() {
    if (!this.productGrid) return;

    this.bindEvents();
    this.fetchProducts();
  }

  bindEvents() {
    this.showMoreBtn?.addEventListener('click', () => this.loadMoreProducts());

    document.addEventListener('product-filter-applied', (event) => {
      if (event.detail.resetPage) {
        this.currentPage = 1;
        this.allProducts = [];
      }
      this.filters = event.detail.filters;
      this.fetchProducts();
    });

    document.addEventListener('product-sort-applied', (event) => {
      this.currentPage = 1;
      this.allProducts = [];
      this.currentSort = event.detail.sort;
      this.fetchProducts();
    });
  }

  async fetchProducts() {
    try {
      if (this.currentPage === 1 && this.productGrid) {
        this.productGrid.innerHTML = '';
      }

      this.showMoreContainer?.classList.remove('hidden');
      this.showMoreContainer?.classList.add('is-loading');
      this.showMoreContainer?.classList.remove('has-more');
      this.noMatches?.classList.remove('show');
      this.noMatchesExploreProducts?.classList.add('hidden');
      this.exploreProducts = [];

      const filtersParam = encodeURIComponent(JSON.stringify(this.filters || []));
      let url = `products-paginated.json?page=${this.currentPage}&sort=${this.currentSort}&filters=${filtersParam}`;

      // This is a temporary code for UAT team to verify the no results scenario
      // Remove this code once the UAT team is done with their testing
      const searchParams = new URLSearchParams(window.location.search);
      const triggerNoResults = searchParams.get('trigger-no-results');
      if (triggerNoResults === 'true') {
        url = 'no-results-products.json';
      }

      const response = await fetchData(url);

      const products = response.products || [];
      this.allProducts = [...this.allProducts, ...products];
      this.totalProducts = response.totalProducts || this.allProducts.length;
      this.hasMore = Boolean(response.hasMore);

      this.updateProductCount();
      this.renderProducts(products);

      this.showMoreContainer?.classList.toggle('has-more', this.hasMore);

      // if no products are found, show explore products
      if (this.currentPage === 1 && this.allProducts.length === 0) {
        this.exploreProducts = response.exploreProducts || [];
        this.renderProducts(this.exploreProducts);
        this.noMatches?.classList.add('show');
        this.noMatchesExploreProducts?.classList.remove('hidden');
        this.showMoreContainer?.classList.add('hidden');
      }

      setTimeout(() => {
        if (parseInt(this.currentPage) > 1) {
          /* Identify the first product to focus after loading new products */
          const nextProductIndex =
            parseInt(this.productsPerPage) * (parseInt(this.currentPage) - 1);
          const prodsList = document.querySelectorAll('.cmp-product-card');
          const selectedProdToFocus = prodsList[nextProductIndex];

          if (selectedProdToFocus) {
            selectedProdToFocus.scrollIntoView({ behavior: 'smooth', block: 'start' });
            selectedProdToFocus.focus();
          }
        }
      }, 300);
    } catch (err) {
      console.error('Error loading products:', err);
      if (this.currentPage === 1) {
        this.noMatches?.classList.add('show');
        this.totalProducts = 0;
        this.updateProductCount();
      }
    } finally {
      this.showMoreContainer?.classList.remove('is-loading');
    }
  }

  updateProductCount() {
    if (!this.productCountElement) return;
    this.productCountElement.textContent = `${this.totalProducts} Products Found`;
  }

  renderProducts(products = []) {
    if (!this.productGrid) {
      console.error('Product grid element not found');
      return;
    }

    products.forEach((product) => {
      try {
        const cardHtml = window.renderProductCard(product, this.productType);
        const productCard = document.createElement('div');
        productCard.className =
          'layout-grid__col layout-grid__col--span-6 layout-grid__col--md-span-12';

        productCard.innerHTML = cardHtml;
        this.productGrid.appendChild(productCard);
      } catch (err) {
        console.error('Error rendering product card:', err, product);
      }
    });
  }

  loadMoreProducts() {
    if (!this.hasMore) return;
    this.currentPage += 1;
    this.fetchProducts();
  }

  showError(message) {
    if (this.productGrid) {
      this.productGrid.innerHTML = `
        <div class="cmp-product-listing__error">
          <p>${message}</p>
        </div>
      `;
    }
  }
}

/**
 * Sort Dropdown Manager
 */
export class SortDropdownManager {
  constructor(selectElement) {
    this.selectElement = selectElement;
    this.choicesInstance = null;
  }

  init() {
    if (!this.selectElement) return;

    this.choicesInstance = new Choices(this.selectElement, {
      searchEnabled: false,
      itemSelectText: '',
      shouldSort: false,
      allowHTML: false,
      removeItemButton: false,
      duplicateItemsAllowed: false,
      addItemFilter: null,
      customProperties: {},
    });

    this.selectElement._choicesInstance = this.choicesInstance;

    setTimeout(() => {
      this.setupAccessibility();
      this.setupEventListeners();
    }, 100);
  }

  setupAccessibility() {
    const container = this.selectElement.closest('.choices');
    if (!container) return;

    container.removeAttribute('aria-expanded');
    container.querySelector('.choices__list--dropdown').removeAttribute('aria-expanded');
    const inner = container.querySelector('.choices__inner');
    if (!inner) return;

    const ariaAttrs = ['role', 'aria-label', 'aria-expanded', 'aria-haspopup', 'tabindex'];
    ariaAttrs.forEach((attr) => {
      const val = container.getAttribute(attr);
      if (val !== null) {
        inner.setAttribute(attr, val);
        container.removeAttribute(attr);
      }
    });

    inner.setAttribute('role', 'combobox');
    inner.setAttribute('aria-haspopup', 'listbox');
    inner.setAttribute('aria-expanded', 'false');

    const dropdownList = container.querySelector('.choices__list--dropdown .choices__list');
    if (!dropdownList) return;

    const listboxId = `${this.selectElement.id || this.selectElement.name}-listbox`;
    dropdownList.setAttribute('role', 'listbox');
    dropdownList.setAttribute('id', listboxId);
    dropdownList.setAttribute('tabindex', '-1');

    inner.setAttribute('aria-controls', listboxId);

    const ariaLabel = this.selectElement.getAttribute('aria-label') || 'Select option';
    inner.setAttribute('aria-label', ariaLabel);
    dropdownList.setAttribute('aria-label', ariaLabel);

    const singleItem = container.querySelector('.choices__list--single .choices__item');
    if (singleItem) {
      singleItem.removeAttribute('role');
      singleItem.removeAttribute('aria-selected');
    }
    let liveRegion = document.getElementById('choices-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'choices-live-region';
      liveRegion.setAttribute('aria-live', 'assertive');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('role', 'status');
      liveRegion.className = 'sr-only';
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-9999px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    const optionItems = container.querySelectorAll(
      '.choices__list--dropdown .choices__item--choice',
    );
    optionItems.forEach((item, index) => {
      item.setAttribute('role', 'option');
      item.id = `${this.selectElement.id || this.selectElement.name}-option-${index}`;
      const text = item.textContent?.trim();
      if (text) item.setAttribute('aria-label', text);
      item.setAttribute('aria-selected', item.classList.contains('is-selected') ? 'true' : 'false');
      item.setAttribute('tabindex', '-1');
    });

    const announceFirstItem = () => {
      const first = dropdownList.querySelector('.choices__item--choice');
      if (first) {
        inner.setAttribute('aria-activedescendant', first.id);
        liveRegion.textContent = first.textContent.trim();
      }
    };

    const updateActiveDescendant = () => {
      const highlighted = container.querySelector('.is-highlighted');
      if (highlighted) {
        inner.setAttribute('aria-activedescendant', highlighted.id);
        liveRegion.textContent = highlighted.textContent.trim();
      }
    };

    // When dropdown opens
    container.addEventListener('showDropdown', () => {
      inner.setAttribute('aria-expanded', 'true');
      setTimeout(() => {
        announceFirstItem();
        const count = optionItems.length;
        liveRegion.textContent = `${ariaLabel} expanded, ${count} options available.`;
      }, 100);
    });

    // When dropdown closes
    container.addEventListener('hideDropdown', () => {
      inner.setAttribute('aria-expanded', 'false');
      inner.removeAttribute('aria-activedescendant');

      // Clear live region first, then announce collapse with delay for TalkBack
      liveRegion.textContent = '';
      setTimeout(() => {
        liveRegion.textContent = `${ariaLabel} collapsed.`;
      }, 50);
    });

    // Update active option with keyboard navigation
    container.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        updateActiveDescendant();
      }
    });

    // Update on mouse hover or click
    container.addEventListener('mouseover', updateActiveDescendant);
    container.addEventListener('choice', updateActiveDescendant);
  }

  setupEventListeners() {
    this.selectElement.addEventListener('change', (event) => {
      const value = event.detail?.value;

      document.dispatchEvent(
        new CustomEvent('product-sort-applied', {
          detail: { sort: value },
        }),
      );

      // Announce the selected value
      const selectedOption = this.selectElement.querySelector(`option[value="${value}"]`);
      if (selectedOption) {
        this.announceSelection(selectedOption.textContent);
      }
    });
  }

  announceSelection(selectedText) {
    const liveRegion = document.getElementById('choices-live-region');
    if (liveRegion) {
      liveRegion.textContent = `${selectedText} selected.`;
    }
  }
}

/* -------------------------------
 * Initialize modules on DOMContentLoaded
 * ------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  const sortElement = document.querySelector('#sort-by');
  const floatingSortElement = document.querySelector('#sort-by-floating');
  const mainFloatingContainer = document.querySelector('.floating-filter__plp');
  let sortManager, floatingSortManager;

  if (sortElement && floatingSortElement) {
    floatingSortManager = new SortDropdownManager(floatingSortElement);
    floatingSortManager.init();
    sortManager = new SortDropdownManager(sortElement);
    sortManager.init();
    const syncDropdowns = (source, target) => {
      source.addEventListener('change', (e) => {
        const newValue = e.detail?.value || source.value;
        const targetChoices = target.choicesInstance || target._choicesInstance;
        const customSource = source.closest('.choices');
        source.setAttribute('aria-label', newValue);
        customSource.setAttribute('aria-label', newValue);
        if (target.value === newValue) return;

        if (targetChoices && typeof targetChoices.setChoiceByValue === 'function') {
          targetChoices.setChoiceByValue(newValue);
        } else {
          target.value = newValue;
          target.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    };

    syncDropdowns(sortElement, floatingSortElement);
    syncDropdowns(floatingSortElement, sortElement);
  }

  const onScreenSort = document.querySelector('#sort-by-onscreen');
  if (window.innerWidth < 1280 && onScreenSort) {
    const sortElementOffsetTop = onScreenSort.offsetTop;
    const sortElementHeight = onScreenSort.offsetHeight;

    window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;

      if (scrollPosition >= sortElementOffsetTop + sortElementHeight) {
        mainFloatingContainer.classList.remove('hidden');
      } else {
        mainFloatingContainer.classList.add('hidden');
      }
    });
  }

  const filterManager = new ProductSidebarFilter();
  filterManager.init();

  const listingManager = new ProductListingManager();
  listingManager.init();

  const filterTrigger = document.querySelectorAll(
    '[data-a11y-dialog-show="product-filter-dialog"]',
  );

  const filterDialog = document.getElementById('product-filter-dialog');

  if (filterDialog && matchMedia('(min-width: 1280px)').matches) {
    filterDialog.removeAttribute('role');
  }

  if (filterTrigger.length && filterDialog) {
    const dialog = new A11yDialog(filterDialog);

    filterTrigger.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        filterDialog.classList.add('dialog-container');
        dialog.show();
      });
    });

    window.addEventListener('resize', () => {
      if (!matchMedia('(max-width: 1280px)').matches) {
        filterDialog.classList.remove('dialog-container');
        filterDialog.removeAttribute('aria-hidden');
        filterDialog.removeAttribute('aria-modal');
        filterDialog.removeAttribute('role');
      }
    });
  }

  // Custom listeners for choices
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.choices__item--choice');
    if (!item) return;

    // Remove highlight class from hovered item
    item.classList.remove('is-highlighted');
  });
});
