/**
 * Product Sidebar Block
 * Creates a filter sidebar component for product listing pages
 */

import { loadScript, decorateBlock, loadBlock } from '../../scripts/aem.js';
import { fetchFilters } from '../../scripts/api-service.js';
import { fetchPlaceholders, getCurrencySymbol, getLang } from '../../scripts/scripts.js';

// Fallback filter configuration (used if API fails)
const FALLBACK_FILTER_CONFIG = [];

// Budget defaults
const DEFAULT_MIN_BUDGET = 500;
const DEFAULT_MAX_BUDGET = 5000;
const DEFAULT_BUDGET_RANGE = { min: 1100, max: 5000 };

/* ========================================================================
 * Utility Functions
 * ======================================================================== */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isEmptyString = (s) => typeof s !== 'string' || s.trim() === '';

function toNumber(v) {
  if (typeof v === 'number') return v;
  const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

function formatCurrency(value, currencySymbol = '$', locale = 'en-US') {
  const n = Number(value) || 0;
  return `${currencySymbol}${n.toLocaleString(locale)}`;
}

function parseCurrency(value) {
  return toNumber(value);
}

/**
 * Generate a URL-safe ID from a name
 */
function generateFilterId(name) {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ========================================================================
 * API Functions
 * ======================================================================== */

/**
 * Transform API filter groups to internal filter format
 */
function transformApiFiltersToConfig(groups) {
  if (!groups || !Array.isArray(groups)) {
    return FALLBACK_FILTER_CONFIG;
  }

  return groups.map((group) => {
    const groupId = generateFilterId(group.name);

    return {
      id: groupId,
      title: group.name,
      ariaLabel: `Filter by ${group.name}`,
      expanded: group.expand === 1,
      options: (group.items || []).map((item) => {
        const itemId = `${groupId}-${item.itemId}`;
        return {
          id: itemId,
          value: String(item.itemId),
          label: item.name,
          count: item.count,
        };
      }),
    };
  });
}

/**
 * Fetch and transform filters from the API
 */
async function fetchFiltersFromApi() {
  try {
    const groups = await fetchFilters();
    return transformApiFiltersToConfig(groups);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching filters from API:', error);
    return FALLBACK_FILTER_CONFIG;
  }
}

/* ========================================================================
 * HTML Building Functions
 * ======================================================================== */

/**
 * Build checkbox list HTML for a filter category
 */
function buildCheckboxListHTML(filter) {
  const optionsHTML = filter.options.map((option) => `
    <li class="cmp-checkbox">
      <label for="${option.id}">
        <input type="checkbox" id="${option.id}" value="${option.value}" aria-label="${option.label}">
        <span>${option.label}</span>
      </label>
    </li>
  `).join('');

  return `<ul class="cmp-checkbox-list" aria-label="${filter.ariaLabel}">${optionsHTML}</ul>`;
}

/**
 * Convert filter config to accordion items format
 */
function filtersToAccordionItems(filters) {
  return filters.map((filter) => ({
    id: filter.id,
    title: filter.title,
    content: buildCheckboxListHTML(filter),
    expanded: filter.expanded || false,
  }));
}

/**
 * Build the complete sidebar HTML
 */
function buildSidebarHTML(config = {}) {
  const filters = config.filters || FALLBACK_FILTER_CONFIG;
  const minBudget = config.minBudget || DEFAULT_BUDGET_RANGE.min;
  const maxBudget = config.maxBudget || DEFAULT_BUDGET_RANGE.max;
  const budgetMin = config.budgetMin || DEFAULT_MIN_BUDGET;
  const budgetMax = config.budgetMax || DEFAULT_MAX_BUDGET;
  const currencySymbol = config.currencySymbol || '$';
  const locale = config.locale || 'en-US';
  const placeholders = config.placeholders || {};

  // Get placeholder texts with fallbacks
  const budgetText = placeholders['product-filters-budget-text'] || 'Your budget';
  const toText = placeholders['product-filters-to'] || 'to';
  const filterLabel = placeholders['product-filters-filter-label'] || 'Filter';
  const cancelText = placeholders['product-filters-cancel-cta-text'] || 'Cancel';
  const applyText = placeholders['product-filters-apply-cta-text'] || 'Apply';
  const appliedFiltersTitle = placeholders['product-filters-applied-filters-title'] || 'Applied filters';
  const clearAllText = placeholders['product-filters-clear-all'] || 'Clear all';

  const accordionItems = filtersToAccordionItems(filters);

  return `
    <!-- Sidebar Info (hidden on mobile) -->
    <div class="cmp-sidebar__info">
      <p class="cmp-sidebar__note" role="status">
        <span class="icon icon--info"></span>
        Selecting filter(s) will refresh the results and may change the availability of other options.
      </p>
    </div>
    
    <div class="cmp-mobile--header">
      <div class="product-mobile--header__title">
        <h2 class="product-mobile__title">${filterLabel}</h2>
      </div>
    </div>

    <!-- Applied Filters -->
    <div class="cmp-sidebar__applied-filters">
      <div class="applied-filters__header">
        <h2 class="applied-filters__title">${appliedFiltersTitle}</h2>
        <a href="#" class="applied-filters__clear" aria-label="${clearAllText} applied filters">${clearAllText}</a>
      </div>
      <div class="applied-filters__list" role="list" aria-live="polite" aria-label="Currently applied filters"></div>
    </div>

    <!-- Search -->
    <div class="cmp-sidebar__search hidden">
      <label class="cmp-form__field" for="product-search">
        <span class="cmp-form__icon">
          <img src="/icons/icon-search.svg" alt="Search" />
        </span>
        <input type="search" placeholder="Enter keywords" class="cmp-form__input" aria-label="Enter keywords" id="product-search"/>
      </label>
    </div>

    <!-- Budget -->
    <div class="cmp-sidebar__budget" role="group" aria-label="${budgetText}">
      <input type="hidden" name="minBudget" id="minBudget" value="${minBudget}" />
      <input type="hidden" name="maxBudget" id="maxBudget" value="${maxBudget}" />

      <div class="budget-left">
        <h3 class="budget-left">${budgetText}:</h3>
      </div>
      <div class="budget-center">
        <div class="budget-inputs">
          <label for="budget-min-value" class="sr-only">Minimum Budget Value</label>
          <input type="text" class="budget-value-input" id="budget-min-value" value="${minBudget}" />
          <span class="budget-separator" aria-hidden="true">${toText}</span>
          <label for="budget-max-value" class="sr-only">Maximum Budget Value</label>
          <input type="text" class="budget-value-input" id="budget-max-value" value="${maxBudget}" />
        </div>
        <div class="budget-range-wrapper">
          <div
            id="budget-range-slider"
            class="budget-range-slider"
            data-start="[${minBudget},${maxBudget}]"
            data-min="${budgetMin}"
            data-max="${budgetMax}"
            data-step="100"
          ></div>
          <div class="range-labels" aria-hidden="true">
            <span>${currencySymbol}${budgetMin.toLocaleString(locale)}</span>
            <span>${currencySymbol}${budgetMax.toLocaleString(locale)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Accordion Filters (placeholder for loadBlock) -->
    <div class="cmp-sidebar__filters">
      <div class="accordion" data-items='${JSON.stringify(accordionItems)}'></div>
    </div>

    <!-- Sticky Footer Actions (mobile only) -->
    <div class="cmp-sidebar__actions">
      <button class="btn-cancel btn" data-a11y-dialog-hide="product-filter-dialog">${cancelText}</button>
      <button class="btn-apply btn">${applyText}</button>
    </div>
  `;
}

/* ========================================================================
 * Filter State Management
 * ======================================================================== */

/**
 * Create filter state object
 */
function createFilterState(container, currencySymbol = '$', locale = 'en-US') {
  return {
    container,
    sidebar: container.querySelector('.cmp-sidebar__filters'),
    appliedFiltersContainer: container.querySelector('.cmp-sidebar__applied-filters'),
    appliedFiltersList: container.querySelector('.applied-filters__list'),
    clearAllBtn: container.querySelector('.applied-filters__clear'),
    budgetSlider: container.querySelector('#budget-range-slider'),
    minBudgetInput: container.querySelector('#minBudget'),
    maxBudgetInput: container.querySelector('#maxBudget'),
    minBudgetDisplay: container.querySelector('#budget-min-value'),
    maxBudgetDisplay: container.querySelector('#budget-max-value'),
    applyButton: container.querySelector('.btn-apply'),
    budgetRangeFilterId: 'filter-budget-range',
    filterButton: document.querySelectorAll('.cmp-product-filter-trigger'),
    DEFAULT_MIN: DEFAULT_MIN_BUDGET,
    DEFAULT_MAX: DEFAULT_MAX_BUDGET,
    DEFAULT_BUDGET_RANGE,
    currencySymbol,
    locale,
    isInitializing: false,
    urlUpdateTimeout: null,
    pendingFilters: [],
    isMobile: window.innerWidth < 992,
    lastSyncedValues: { min: null, max: null },
    filterCount: 0,
  };
}

/* ========================================================================
 * Budget Validation
 * ======================================================================== */

function validateBudgetValue(state, value, isMin = false) {
  const min = state.DEFAULT_MIN;
  const max = state.DEFAULT_MAX;
  let v = toNumber(value);

  v = clamp(v, min, max);

  if (isMin && state.maxBudgetInput) {
    const currentMax = toNumber(state.maxBudgetInput.value) || max;
    if (v > currentMax) return currentMax;
  } else if (!isMin && state.minBudgetInput) {
    const currentMin = toNumber(state.minBudgetInput.value) || min;
    if (v < currentMin) return currentMin;
  }

  return v;
}

/* ========================================================================
 * URL / State Sync Functions
 * ======================================================================== */

function getUrlParams(state) {
  const params = new URLSearchParams(window.location.search);
  const filters = params.getAll('filter').filter((f) => f.trim());
  return {
    minBudget: toNumber(params.get('minBudget')) || state.DEFAULT_BUDGET_RANGE.min,
    maxBudget: toNumber(params.get('maxBudget')) || state.DEFAULT_BUDGET_RANGE.max,
    filters,
  };
}

function updateUrlParams(state, params) {
  if (state.urlUpdateTimeout) clearTimeout(state.urlUpdateTimeout);
  state.urlUpdateTimeout = setTimeout(() => {
    const url = new URL(window.location);
    const sp = new URLSearchParams();

    sp.set('minBudget', params.minBudget);
    sp.set('maxBudget', params.maxBudget);

    (params.filters || []).forEach((f) => {
      if (!isEmptyString(f)) sp.append('filter', f);
    });

    url.search = sp.toString();

    if (!state.isInitializing) {
      window.history.replaceState({ filters: params }, '', url);
    }
  }, 120);
}

function getCurrentFilters(state) {
  if (!state.sidebar) return [];
  return Array.from(state.sidebar.querySelectorAll('input[type="checkbox"]:checked'))
    .map((ch) => {
      const text = getFilterText(state, ch);
      return text.includes(':') ? text.split(':').pop().trim() : text.trim();
    })
    .filter((t) => !isEmptyString(t));
}

function getCurrentFilterItemIds(state) {
  if (!state.sidebar) return [];
  return Array.from(state.sidebar.querySelectorAll('input[type="checkbox"]:checked'))
    .map((ch) => ch.value)
    .filter((v) => !isEmptyString(v));
}

function syncStateWithUrl(state) {
  if (state.isInitializing) return;

  const currentFilters = getCurrentFilters(state);
  const currentBudget = {
    minBudget: toNumber(state.minBudgetInput?.value) || state.DEFAULT_BUDGET_RANGE.min,
    maxBudget: toNumber(state.maxBudgetInput?.value) || state.DEFAULT_BUDGET_RANGE.max,
  };

  updateUrlParams(state, {
    ...currentBudget,
    filters: currentFilters,
  });

  const productGrid = document.getElementById('product-grid');
  if (productGrid) productGrid.innerHTML = '';

  const itemIds = getCurrentFilterItemIds(state);
  document.dispatchEvent(
    new CustomEvent('product-filter-applied', {
      detail: { filters: currentFilters, itemIds, resetPage: true },
    }),
  );
}

/* ========================================================================
 * Applied Filters Management
 * ======================================================================== */

function normalizeFilterText(filterText) {
  return String(filterText).replace('×', '').trim();
}

function filterExists(state, filterText) {
  if (!state.appliedFiltersList) return false;
  const normalized = normalizeFilterText(filterText);
  return [...state.appliedFiltersList.querySelectorAll('.applied-filter')].some((el) => {
    const text = el.querySelector('.filter-text')?.textContent?.trim()
      || el.textContent.replace('×', '').trim();
    return text === normalized;
  });
}

function updateAppliedFiltersVisibility(state) {
  if (!state.appliedFiltersContainer || !state.appliedFiltersList) return;
  const hasFilters = state.appliedFiltersList.children.length > 0;
  state.appliedFiltersContainer.classList.toggle('show', hasFilters);
}

function updateFilterCount(state) {
  if (!state.appliedFiltersList) return;
  state.filterCount = state.appliedFiltersList.children.length;

  if (state.filterButton && state.filterCount > 0) {
    state.filterButton.forEach((btn) => {
      btn.textContent = `Filter (${state.filterCount})`;
    });
  } else if (state.filterButton) {
    state.filterButton.forEach((btn) => {
      btn.textContent = 'Filter';
    });
  }
}

function updateAppliedFiltersDisplay(state) {
  if (window.innerWidth > 1280) return;
  if (!state.appliedFiltersList) return;

  const filters = Array.from(
    state.appliedFiltersList.querySelectorAll('.applied-filter.filter-element'),
  );
  const showLimit = 4;

  const moreBtn = state.appliedFiltersList.querySelector('.applied-filter.more-filters');
  if (moreBtn) moreBtn.remove();

  if (filters.length <= showLimit) {
    filters.forEach((el) => { el.style.display = 'inline-flex'; });
    return;
  }

  filters.forEach((el, i) => {
    el.style.display = i < showLimit ? 'inline-flex' : 'none';
  });

  const hiddenCount = filters.length - showLimit;
  const moreElement = document.createElement('span');
  moreElement.className = 'applied-filter more-filters';
  moreElement.innerHTML = `+${hiddenCount}`;
  moreElement.style.cursor = 'pointer';

  state.appliedFiltersList.appendChild(moreElement);

  moreElement.addEventListener('click', () => {
    filters.forEach((el) => { el.style.display = 'inline-flex'; });
    moreElement.remove();
  });
}

function addAppliedFilter(state, filterText, id) {
  if (isEmptyString(filterText) || !state.appliedFiltersList) return;

  const normalized = normalizeFilterText(filterText);
  if (filterExists(state, normalized)) return;

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

  state.appliedFiltersList.appendChild(filterElement);
  updateAppliedFiltersVisibility(state);
  updateFilterCount(state);
  updateAppliedFiltersDisplay(state);
}

function removeAppliedFilter(state, id) {
  if (!state.appliedFiltersList) return;

  [...state.appliedFiltersList.querySelectorAll('.applied-filter')].forEach((el) => {
    if (el.dataset.id === id) el.remove();
  });

  updateAppliedFiltersVisibility(state);
  updateFilterCount(state);
  updateAppliedFiltersDisplay(state);
}

/* ========================================================================
 * Budget Range Handling
 * ======================================================================== */

function updateBudgetRangeFilter(state, minVal, maxVal) {
  if (!state.appliedFiltersList) return;

  removeAppliedFilter(state, state.budgetRangeFilterId);

  const defaultMin = state.DEFAULT_BUDGET_RANGE.min;
  const defaultMax = state.DEFAULT_BUDGET_RANGE.max;

  if (minVal === undefined || maxVal === undefined) return;

  if (minVal !== defaultMin || maxVal !== defaultMax) {
    const text = `Price Range: ${formatCurrency(minVal, state.currencySymbol, state.locale)} - ${formatCurrency(maxVal, state.currencySymbol, state.locale)}`;
    if (!filterExists(state, text)) addAppliedFilter(state, text, state.budgetRangeFilterId);
  }
}

function handleSliderChange(state, isFinal = false) {
  if (!state.budgetSlider?.noUiSlider) return;
  const values = state.budgetSlider.noUiSlider.get();
  const [minVal, maxVal] = values.map((v) => Math.round(Number(v)));

  if (state.lastSyncedValues.min === minVal && state.lastSyncedValues.max === maxVal && isFinal) {
    return;
  }

  if (state.minBudgetDisplay) state.minBudgetDisplay.value = formatCurrency(minVal, state.currencySymbol, state.locale);
  if (state.maxBudgetDisplay) state.maxBudgetDisplay.value = formatCurrency(maxVal, state.currencySymbol, state.locale);

  if (state.minBudgetInput) state.minBudgetInput.value = minVal;
  if (state.maxBudgetInput) state.maxBudgetInput.value = maxVal;

  updateBudgetRangeFilter(state, minVal, maxVal);

  if (isFinal) {
    state.lastSyncedValues = { min: minVal, max: maxVal };
    syncStateWithUrl(state);
  }
}

async function initBudgetSlider(state) {
  if (!state.budgetSlider) return;

  if (!window.noUiSlider) {
    await loadScript('https://cdn.jsdelivr.net/npm/nouislider@15.7.1/dist/nouislider.min.js');
  }

  if (state.budgetSlider.noUiSlider) {
    state.budgetSlider.noUiSlider.destroy();
  }

  const ds = state.budgetSlider.dataset || {};
  const min = toNumber(ds.min) || state.DEFAULT_MIN;
  const max = toNumber(ds.max) || state.DEFAULT_MAX;
  const step = toNumber(ds.step) || 100;
  const start = ds.start ? JSON.parse(ds.start) : [state.DEFAULT_BUDGET_RANGE.min, state.DEFAULT_BUDGET_RANGE.max];

  window.noUiSlider.create(state.budgetSlider, {
    start,
    connect: true,
    step,
    margin: step,
    range: { min, max },
    format: {
      to: (v) => Math.round(v),
      from: (v) => Number(v),
    },
    handleAttributes: [
      { 'aria-label': 'Budget range minimum value', 'aria-controls': 'min-budget' },
      { 'aria-label': 'Budget range maximum value', 'aria-controls': 'max-budget' },
    ],
  });

  state.budgetSlider.noUiSlider.on('update', () => handleSliderChange(state, false));
  state.budgetSlider.noUiSlider.on('change', () => handleSliderChange(state, true));
}

function handleBudgetInputChange(state, inputElement, isMin) {
  if (!inputElement || !state.budgetSlider?.noUiSlider) return;

  const raw = parseCurrency(inputElement.value);
  const validated = validateBudgetValue(state, raw, isMin);

  inputElement.value = formatCurrency(validated, state.currencySymbol, state.locale);

  if (isMin && state.minBudgetInput) {
    state.minBudgetInput.value = validated;
  } else if (!isMin && state.maxBudgetInput) {
    state.maxBudgetInput.value = validated;
  }

  const currentValues = state.budgetSlider.noUiSlider.get();
  const [currMin, currMax] = currentValues.map((v) => Math.round(Number(v)));

  if (isMin) {
    state.budgetSlider.noUiSlider.set([validated, currMax]);
  } else {
    state.budgetSlider.noUiSlider.set([currMin, validated]);
  }

  updateBudgetRangeFilter(state, state.minBudgetInput.value, state.maxBudgetInput.value);

  if (!state.isMobile) {
    syncStateWithUrl(state);
  }
}

function setupBudgetInputHandlers(state) {
  const inputs = [state.minBudgetDisplay, state.maxBudgetDisplay].filter(Boolean);
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
      handleBudgetInputChange(state, input, isMin);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });
  });
}

/* ========================================================================
 * Checkbox Handling
 * ======================================================================== */

function getFilterText(state, checkbox) {
  const section = checkbox.closest('.cmp-accordion__item');
  if (!section) return '';
  const sectionTitle = section.querySelector('.cmp-accordion__title')?.textContent?.trim() || '';
  const optionText = checkbox.nextElementSibling?.textContent?.trim() || '';
  return `${sectionTitle}: ${optionText}`;
}

function queuePendingFilter(state, checkbox, filterText) {
  const idx = state.pendingFilters.findIndex((f) => f.id === checkbox.id);
  if (checkbox.checked) {
    if (idx === -1) {
      state.pendingFilters.push({ id: checkbox.id, text: filterText, checked: true });
    }
  } else if (idx !== -1) {
    state.pendingFilters.splice(idx, 1);
  }
}

function onCheckboxChange(state, checkbox, forceApply = false) {
  const filterText = getFilterText(state, checkbox);
  if (isEmptyString(filterText)) return;

  if (checkbox.checked) {
    addAppliedFilter(state, filterText, checkbox.id);
  } else {
    removeAppliedFilter(state, checkbox.id);
  }

  if (!state.isMobile || forceApply) {
    syncStateWithUrl(state);
  } else {
    queuePendingFilter(state, checkbox, filterText);
  }
}

function setupCheckboxHandlers(state) {
  if (!state.sidebar) return;
  const checkboxes = Array.from(state.sidebar.querySelectorAll('input[type="checkbox"]'));
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => onCheckboxChange(state, checkbox));
  });
}

/* ========================================================================
 * Mobile & Pending Filters
 * ======================================================================== */

function applyPendingFilters(state) {
  state.pendingFilters = [];
  syncStateWithUrl(state);

  const closeButton = document.querySelector('[data-a11y-dialog-hide="product-filter-dialog"]');
  if (closeButton) closeButton.click();
}

function setupMobileButtons(state) {
  if (state.applyButton) {
    state.applyButton.addEventListener('click', () => applyPendingFilters(state));
  }
}

function handleResize(state) {
  const wasMobile = state.isMobile;
  state.isMobile = window.innerWidth < 992;

  if (wasMobile && !state.isMobile && state.pendingFilters.length > 0) {
    applyPendingFilters(state);
  }
}

/* ========================================================================
 * Remove Filter & Clear All Handlers
 * ======================================================================== */

function setupRemoveFilterHandlers(state) {
  state.container.addEventListener('click', (e) => {
    const filterElement = e.target.closest('.applied-filter');
    if (filterElement) {
      e.preventDefault();
      const filterId = filterElement.dataset.id;
      if (state.sidebar?.querySelector(`#${filterId}`)) {
        state.sidebar.querySelector(`#${filterId}`).checked = false;
      } else if (filterId === state.budgetRangeFilterId && state.budgetSlider?.noUiSlider) {
        state.budgetSlider.noUiSlider.set([
          state.DEFAULT_BUDGET_RANGE.min,
          state.DEFAULT_BUDGET_RANGE.max,
        ]);
      }
      removeAppliedFilter(state, filterId);
      syncStateWithUrl(state);
    }
  });

  const appliedFilter = state.appliedFiltersList?.querySelector('.applied-filter');
  appliedFilter?.addEventListener('keydown', (e) => {
    const filterElement = e.target;
    if (!filterElement?.closest('.applied-filter')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const filterId = filterElement.dataset.id;

      if (state.sidebar?.querySelector(`#${filterId}`)) {
        state.sidebar.querySelector(`#${filterId}`).checked = false;
      } else if (filterId === state.budgetRangeFilterId && state.budgetSlider?.noUiSlider) {
        state.budgetSlider.noUiSlider.set([
          state.DEFAULT_BUDGET_RANGE.min,
          state.DEFAULT_BUDGET_RANGE.max,
        ]);
      }
      setTimeout(() => {
        filterElement.nextElementSibling?.focus();
      }, 300);

      removeAppliedFilter(state, filterId);
      syncStateWithUrl(state);
    }
  });
}

function setupClearAllHandler(state) {
  if (!state.clearAllBtn) return;
  state.clearAllBtn.addEventListener('click', (e) => {
    e.preventDefault();

    if (state.sidebar) {
      state.sidebar.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
      });
    }

    if (state.budgetSlider?.noUiSlider) {
      state.budgetSlider.noUiSlider.set([
        state.DEFAULT_BUDGET_RANGE.min,
        state.DEFAULT_BUDGET_RANGE.max,
      ]);
    }

    if (state.appliedFiltersList) state.appliedFiltersList.innerHTML = '';

    updateAppliedFiltersVisibility(state);
    updateFilterCount(state);
    updateAppliedFiltersDisplay(state);
    updateBudgetRangeFilter(state, state.DEFAULT_BUDGET_RANGE.min, state.DEFAULT_BUDGET_RANGE.max);
    syncStateWithUrl(state);
  });
}

/* ========================================================================
 * URL Initialization & Popstate
 * ======================================================================== */

function applyFilterFromText(state, filterText) {
  if (!filterText.includes(':')) return;
  const [sectionTitle, optionText] = filterText.split(':').map((s) => s.trim());

  state.sidebar?.querySelectorAll('.cmp-accordion__item').forEach((item) => {
    const title = item.querySelector('.cmp-accordion__title')?.textContent?.trim();
    if (title === sectionTitle) {
      item.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        const label = checkbox.nextElementSibling?.textContent?.trim();
        if (label === optionText) {
          if (!checkbox.checked) {
            checkbox.checked = true;
            addAppliedFilter(state, filterText, checkbox.id);
          }
        }
      });
    }
  });
}

async function initializeFromUrl(state) {
  state.isInitializing = true;
  try {
    const { minBudget, maxBudget, filters } = getUrlParams(state);

    if (state.budgetSlider?.noUiSlider) {
      state.budgetSlider.noUiSlider.set([minBudget, maxBudget]);
      if (
        minBudget !== state.DEFAULT_BUDGET_RANGE.min
        || maxBudget !== state.DEFAULT_BUDGET_RANGE.max
      ) {
        updateBudgetRangeFilter(state, minBudget, maxBudget);
      }
    }

    if (filters.length > 0 && state.sidebar) {
      await new Promise((r) => { setTimeout(r, 150); });

      filters.forEach((filterText) => {
        applyFilterFromText(state, filterText);
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error initializing from URL:', err);
  } finally {
    state.isInitializing = false;
  }
}

function setupPopstateHandler(state) {
  window.addEventListener('popstate', () => {
    initializeFromUrl(state);
  });
}

/* ========================================================================
 * Main Initialization
 * ======================================================================== */

async function initFilterManager(container, currencySymbol = '$', locale = 'en-US') {
  const state = createFilterState(container, currencySymbol, locale);
  if (!state.sidebar) return;

  // Load accordion block via loadBlock
  const accordionBlock = container.querySelector('.cmp-sidebar__filters .accordion');
  if (accordionBlock) {
    decorateBlock(accordionBlock);
    await loadBlock(accordionBlock);
  }

  await initBudgetSlider(state);
  setupBudgetInputHandlers(state);
  setupCheckboxHandlers(state);
  setupRemoveFilterHandlers(state);
  setupClearAllHandler(state);
  setupMobileButtons(state);
  await initializeFromUrl(state);
  setupPopstateHandler(state);

  window.addEventListener('resize', () => handleResize(state));
}

/* ========================================================================
 * Decorate Function
 * ======================================================================== */

export default async function decorate(block) {
  const configData = block.dataset.config;
  let config = {};

  if (configData) {
    try {
      config = JSON.parse(configData);
      delete block.dataset.config;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Product sidebar: Error parsing config', error);
    }
  }

  block.classList.add('cmp-sidebar');
  block.id = 'product-filter-dialog';

  // Fetch filters, currency symbol, locale, and placeholders in parallel
  const [filters, currencySymbol, locale, placeholders] = await Promise.all([
    fetchFiltersFromApi(),
    getCurrencySymbol(),
    getLang(),
    fetchPlaceholders(),
  ]);

  config.filters = filters;
  config.currencySymbol = currencySymbol;
  config.locale = locale;
  config.placeholders = placeholders;

  block.innerHTML = buildSidebarHTML(config);

  await initFilterManager(block, currencySymbol, locale);
}
