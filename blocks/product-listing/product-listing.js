/**
 * Product Listing Block
 * Implements a full product listing page with sidebar filters, product grid, and pagination
 */

import { decorateBlock, loadBlock, loadScript, loadCSS } from '../../scripts/aem.js';
import { loadBazaarvoiceScript, fetchPlaceholdersForLocale } from '../../scripts/scripts.js';
import { fetchFilteredProducts } from '../../scripts/api-service.js';
import { getBlockConfigs } from '../../scripts/configs.js';
import { openModal } from '../modal/modal.js';

// Constants
const PRODUCTS_PER_PAGE = 6;

// Default configuration
const DEFAULT_CONFIG = {
  title: 'Gaming Desktops',
  subtitle: 'View all gaming desktops or filter for what you want.',
  compareLabel: 'Compare',
  buyNowText: 'Buy now',
  quickViewText: 'Quick view',
  estoreLabel: 'ASUS estore price',
  estoreTooltip: 'ASUS estore price is the price of a product provided by ASUS estore.',
  showMoreText: 'Show more',
  productsFoundText: '{{COUNT}} Products Found',
  filterInfoText: 'Selecting filter(s) will refresh the results and may change the availability of other options.',
  appliedFiltersTitle: 'Applied filters',
  clearAllText: 'Clear all',
  noMatchesTitle: 'No matches',
  noMatchesDescription: 'Oops.. Seems like we did not find item that matches your search. Please use a different search term, relax your criteria, or check out our hottest products below.',
  exploreMoreTitle: 'Explore more gaming desktops',
  productPreviewModalPath: '/en/modals/product-preview',
};

// Utility functions
const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

/**
 * Handle quick view button click
 */
async function handleQuickView(product, config) {
  window.__productPreviewData = product;
  const modalPath = config.productPreviewModalPath || '/en/modals/product-preview';
  await openModal(modalPath, true, 'product-preview-dialog', ['cmp-product-preview', 'light-mode']);
}

/**
 * Create the main HTML structure for the product listing page
 */
function createMainStructure(config, placeholders = {}) {
  // Get placeholder texts with fallbacks
  const filterLabel = placeholders['product-filters-filter-label'] || 'Filter';
  const sortByText = placeholders['product-filters-sort-by-text'] || 'Sort by:';
  const productsFoundText = config.productsFoundText || '{{COUNT}} Products Found';
  const initialCountText = productsFoundText.replace('{{COUNT}}', '0');

  return `
    <!-- Floating Filter (Mobile) -->
    <div class="container floating-filter__plp hidden">
      <div class="cmp-product-sort">
        <select 
          id="sort-by-floating" 
          name="sort-by" 
          class="cmp-product-sort__select"
          aria-label="Sort products by"
        >
          <option value="best-performance" selected>Best Performance</option>
          <option value="price-low-high">Price Low to High</option>
          <option value="price-high-low">Price High to Low</option>
          <option value="ratings">Ratings</option>
          <option value="best-selling">Best Selling</option>
        </select>

        <button class="cmp-product-filter-trigger btn" data-a11y-dialog-show="product-filter-dialog">
          ${filterLabel}
        </button>
      </div>
    </div>

    <!-- Hero Section -->
    <div class="cmp-hero__container">
      <h1 class="cmp-hero__title">${escapeHtml(config.title)}</h1>
      <p class="cmp-hero__subtitle">${escapeHtml(config.subtitle)}</p>
    </div>

    <!-- Sidebar Grid -->
    <div class="sidebar-grid">
      <!-- Left Sidebar (Filters) - loaded via loadBlock -->
      <div class="product-sidebar-wrapper">
        <div class="product-sidebar block" data-block-name="product-sidebar"></div>
      </div>

      <!-- Middle Content (Product Listing) -->
      <div class="cmp-product-listing">
        <!-- Toolbar -->
        <div class="cmp-product-toolbar">
          <!-- Product count -->
          <div class="cmp-product-count">
            <span id="product-count" data-count-template="${productsFoundText}">${initialCountText}</span>
          </div>

          <!-- Sort wrapper -->
          <div class="cmp-product-toolbar__sort-wrapper">
            <div class="cmp-product-sort-label">
              <label for="sort-by">${sortByText}</label>
            </div>
            <div class="cmp-product-sort" id="sort-by-onscreen">
              <select 
                id="sort-by" 
                name="sort-by" 
                class="cmp-product-sort__select"
                aria-label="Sort products by"
              >
                <option value="best-performance" selected>Best Performance</option>
                <option value="price-low-high">Price Low to High</option>
                <option value="price-high-low">Price High to Low</option>
                <option value="ratings">Ratings</option>
                <option value="best-selling">Best Selling</option>
              </select>

              <button class="cmp-product-filter-trigger btn" data-a11y-dialog-show="product-filter-dialog">
                ${filterLabel}
              </button>
            </div>
          </div>
        </div>

        <!-- No Matches -->
        <div class="no-matches" id="no-matches">
          <div class="no-matches__container">
            <h2 class="no-matches__title">${escapeHtml(config.noMatchesTitle)}</h2>
            <p class="no-matches__description">${config.noMatchesDescription}</p>
          </div>
        </div>

        <!-- Explore Products (shown when no matches) -->
        <div id="no-matches-explore-products" class="no-matches-explore-products hidden">
          <h2 class="heading">${escapeHtml(config.exploreMoreTitle || 'Explore more gaming desktops')}</h2>
        </div>

        <!-- Product Grid -->
        <div class="layout-grid" id="product-grid">
          <!-- Products will be dynamically loaded here -->
        </div>

        <!-- Show More Button -->
        <div class="section-actions-container" id="show-more-products-container">
          <button class="section-actions-btn btn btn-link" id="show-more-products-btn">
            ${escapeHtml(config.showMoreText)} <span class="icon icon--arrow-bottom"></span>
          </button>
          <div class="loader">
            <span class="icon icon--loader"></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ========================================================================
 * Product Listing Manager (Functional)
 * ======================================================================== */

/**
 * Create product listing state
 */
function createListingState(container, config) {
  return {
    container,
    config,
    productGrid: container.querySelector('#product-grid'),
    noMatches: container.querySelector('#no-matches'),
    noMatchesExploreProducts: container.querySelector('#no-matches-explore-products'),
    productCountElement: container.querySelector('#product-count'),
    showMoreContainer: container.querySelector('#show-more-products-container'),
    showMoreBtn: container.querySelector('#show-more-products-btn'),
    pageSize: PRODUCTS_PER_PAGE,
    pageOffset: 0,
    allProducts: [],
    totalProducts: 0,
    hasMore: true,
    currentSort: 'best-performance',
    filterItemIds: [],
    websiteCode: 'us',
  };
}

/**
 * Update product count display
 */
function updateProductCount(state) {
  if (!state.productCountElement) return;
  const template = state.productCountElement.dataset.countTemplate || '{{COUNT}} Products Found';
  state.productCountElement.textContent = template.replace('{{COUNT}}', state.totalProducts);
}

/**
 * Initialize tooltips for product cards
 */
function initializeTooltips(productGrid) {
  const tooltipTriggers = productGrid.querySelectorAll('[data-tooltip-trigger]');

  tooltipTriggers.forEach((trigger) => {
    const tooltipId = trigger.getAttribute('aria-describedby');
    const tooltip = document.getElementById(tooltipId);

    if (!tooltip) return;

    trigger.addEventListener('mouseenter', () => tooltip.classList.add('tooltip--visible'));
    trigger.addEventListener('mouseleave', () => tooltip.classList.remove('tooltip--visible'));
    trigger.addEventListener('focus', () => tooltip.classList.add('tooltip--visible'));
    trigger.addEventListener('blur', () => tooltip.classList.remove('tooltip--visible'));
  });
}

/**
 * Render products to the grid
 */
async function renderProducts(state, products = []) {
  if (!state.productGrid) return;

  const loadPromises = products.map(async (product) => {
    const productCardWrapper = document.createElement('div');
    productCardWrapper.className = 'layout-grid__col layout-grid__col--span-6 layout-grid__col--md-span-12';

    const cardBlockWrapper = document.createElement('div');
    cardBlockWrapper.className = 'product-card-wrapper';

    const cardBlock = document.createElement('div');
    cardBlock.className = 'product-card';
    cardBlock.dataset.product = JSON.stringify(product);
    cardBlock.dataset.config = JSON.stringify({
      compareLabel: state.config.compareLabel,
      buyNowText: state.config.buyNowText,
      quickViewText: state.config.quickViewText,
      showQuickView: false,
      estoreLabel: state.config.estoreLabel,
      estoreTooltip: state.config.estoreTooltip,
    });

    cardBlockWrapper.appendChild(cardBlock);
    productCardWrapper.appendChild(cardBlockWrapper);
    state.productGrid.appendChild(productCardWrapper);

    decorateBlock(cardBlock);
    await loadBlock(cardBlock);

    // Add quick view event listener
    const quickViewBtn = cardBlock.querySelector('.cmp-product-card__preview-btn');
    if (quickViewBtn) {
      quickViewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleQuickView(product, state.config);
      });
    }

    return cardBlock;
  });

  await Promise.all(loadPromises);
  initializeTooltips(state.productGrid);
}

/**
 * Fetch products from API
 */
async function fetchProducts(state) {
  try {
    if (state.pageOffset === 0 && state.productGrid) {
      state.productGrid.innerHTML = '';
    }

    state.showMoreContainer?.classList.add('is-loading');
    state.showMoreContainer?.classList.remove('has-more');
    state.noMatches?.classList.remove('show');
    state.noMatchesExploreProducts?.classList.add('hidden');

    const response = await fetchFilteredProducts({
      websiteCode: state.websiteCode,
      itemsId: state.filterItemIds,
      sort: state.currentSort,
      pageSize: state.pageSize,
      pageOffset: state.pageOffset,
    });

    const { total, results } = response;

    state.allProducts = [...state.allProducts, ...results];
    state.totalProducts = total;
    state.hasMore = state.pageOffset + state.pageSize < total;

    updateProductCount(state);
    await renderProducts(state, results);

    state.showMoreContainer?.classList.toggle('has-more', state.hasMore);

    if (state.totalProducts === 0) {
      state.noMatches?.classList.add('show');
      state.noMatchesExploreProducts?.classList.remove('hidden');
      state.showMoreContainer?.classList.add('hidden');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error loading products:', err);
    if (state.pageOffset === 0) {
      state.noMatches?.classList.add('show');
      state.totalProducts = 0;
      updateProductCount(state);
    }
  } finally {
    state.showMoreContainer?.classList.remove('is-loading');
  }
}

/**
 * Load more products
 */
function loadMoreProducts(state) {
  if (!state.hasMore) return;
  state.pageOffset += state.pageSize;
  fetchProducts(state);
}

/**
 * Bind listing events
 */
function bindListingEvents(state) {
  state.showMoreBtn?.addEventListener('click', () => loadMoreProducts(state));

  document.addEventListener('product-filter-applied', (event) => {
    if (event.detail.resetPage) {
      state.pageOffset = 0;
      state.allProducts = [];
    }
    state.filterItemIds = event.detail.itemIds || [];
    fetchProducts(state);
  });

  document.addEventListener('product-sort-applied', (event) => {
    state.pageOffset = 0;
    state.allProducts = [];
    state.currentSort = event.detail.sort;
    fetchProducts(state);
  });
}

/**
 * Initialize product listing manager
 */
function initProductListingManager(container, config) {
  const state = createListingState(container, config);
  if (!state.productGrid) return;

  bindListingEvents(state);
  fetchProducts(state);
}

/* ========================================================================
 * Sort Dropdown Manager (Functional)
 * ======================================================================== */

/**
 * Setup accessibility for Choices.js dropdown
 */
function setupSortAccessibility(selectElement) {
  const container = selectElement.closest('.choices');
  if (!container) return;

  const inner = container.querySelector('.choices__inner');
  if (!inner) return;

  // Move ARIA attributes from `.choices` to `.choices__inner`
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
  if (dropdownList) {
    const listboxId = `${selectElement.id}-listbox`;
    dropdownList.setAttribute('role', 'listbox');
    dropdownList.setAttribute('id', listboxId);
    dropdownList.setAttribute('tabindex', '-1');
    inner.setAttribute('aria-controls', listboxId);

    const selectedOption = dropdownList.querySelector('.choices__item--choice.is-selected');
    if (selectedOption) {
      inner.setAttribute('aria-activedescendant', selectedOption.id);
    }
  }

  const singleItem = container.querySelector('.choices__list--single .choices__item');
  if (singleItem) {
    singleItem.removeAttribute('role');
    singleItem.removeAttribute('aria-selected');
  }

  const ariaLabel = selectElement.getAttribute('aria-label');
  if (ariaLabel) {
    inner.setAttribute('aria-label', ariaLabel);
    if (dropdownList) {
      dropdownList.setAttribute('aria-label', ariaLabel);
    }
  }

  const options = dropdownList?.querySelectorAll('.choices__item--choice');
  options?.forEach((option, index) => {
    const optionId = `${selectElement.id}-option-${index}`;
    option.setAttribute('id', optionId);
    option.setAttribute('aria-label', option.textContent.trim());
    option.setAttribute('aria-selected', option.classList.contains('is-selected') ? 'true' : 'false');
    option.setAttribute('tabindex', '-1');
  });
}

/**
 * Update aria-selected on dropdown options
 */
function updateAriaSelected(selectElement, newValue) {
  const container = selectElement.closest('.choices');
  if (!container) return;

  const allOptions = container.querySelectorAll('.choices__item--choice');
  allOptions.forEach((option) => {
    option.setAttribute('aria-selected', 'false');
  });

  const newSelectedOption = container.querySelector(`.choices__item--choice[data-value="${newValue}"]`);
  if (newSelectedOption) {
    newSelectedOption.setAttribute('aria-selected', 'true');
  }
}

/**
 * Announce selection for screen readers
 */
function announceSelection(selectedText) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
  announcement.textContent = `${selectedText} selected`;
  document.body.appendChild(announcement);
  setTimeout(() => {
    if (document.body.contains(announcement)) document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Handle dropdown open event
 */
function handleDropdownOpen(selectElement) {
  const container = selectElement.closest('.choices');
  if (!container) return;

  const inner = container.querySelector('.choices__inner');
  if (!inner) return;

  const singleItem = container.querySelector('.choices__list--single');
  if (singleItem) {
    singleItem.setAttribute('aria-hidden', 'true');
  }

  inner.setAttribute('aria-expanded', 'true');

  const selectedOption = container.querySelector('.choices__item--choice.is-selected');
  if (selectedOption) {
    inner.setAttribute('aria-activedescendant', selectedOption.id);
  }
}

/**
 * Handle dropdown close event
 */
function handleDropdownClose(selectElement) {
  const container = selectElement.closest('.choices');
  if (!container) return;

  const inner = container.querySelector('.choices__inner');
  if (!inner) return;

  const singleItem = container.querySelector('.choices__list--single');
  if (singleItem) {
    singleItem.removeAttribute('aria-hidden');
  }

  inner.setAttribute('aria-expanded', 'false');
}

/**
 * Setup event listeners for sort dropdown
 */
function setupSortEventListeners(selectElement) {
  selectElement.addEventListener('change', (event) => {
    const value = event.detail?.value || event.target.value;

    document.dispatchEvent(
      new CustomEvent('product-sort-applied', {
        detail: { sort: value },
      }),
    );

    updateAriaSelected(selectElement, value);

    const selectedOption = selectElement.querySelector(`option[value="${value}"]`);
    if (selectedOption) {
      announceSelection(selectedOption.textContent);
    }
  });

  selectElement.addEventListener('showDropdown', () => handleDropdownOpen(selectElement));
  selectElement.addEventListener('hideDropdown', () => handleDropdownClose(selectElement));
}

/**
 * Initialize a sort dropdown with Choices.js
 */
async function initSortDropdown(selectElement) {
  if (!selectElement) return null;

  if (!window.Choices) {
    await loadScript('https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js');
  }

  const choicesInstance = new window.Choices(selectElement, {
    searchEnabled: false,
    itemSelectText: '',
    shouldSort: false,
    allowHTML: false,
    removeItemButton: false,
    duplicateItemsAllowed: false,
    addItemFilter: null,
    customProperties: {},
  });

  selectElement._choicesInstance = choicesInstance;

  setTimeout(() => {
    setupSortAccessibility(selectElement);
    setupSortEventListeners(selectElement);
  }, 100);

  return choicesInstance;
}

/**
 * Initialize Sort Dropdowns
 */
async function initSortDropdowns(container) {
  const sortElement = container.querySelector('#sort-by');
  const floatingSortElement = container.querySelector('#sort-by-floating');
  const onScreenSort = container.querySelector('#sort-by-onscreen');
  const floatingContainer = container.querySelector('.floating-filter__plp');

  // Initialize Choices.js on both sort dropdowns
  if (sortElement) {
    await initSortDropdown(sortElement);
  }

  if (floatingSortElement) {
    await initSortDropdown(floatingSortElement);
  }

  // Sync dropdowns
  if (sortElement && floatingSortElement) {
    const syncDropdowns = (source, target) => {
      source.addEventListener('change', (e) => {
        const newValue = e.detail?.value || source.value;
        const targetChoices = target._choicesInstance;
        const customSource = source.closest('.choices');

        if (customSource) {
          source.setAttribute('aria-label', newValue);
          customSource.setAttribute('aria-label', newValue);
        }

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

  // Floating filter visibility on scroll
  if (window.innerWidth < 1280 && onScreenSort && floatingContainer) {
    window.addEventListener('scroll', () => {
      const rect = onScreenSort.getBoundingClientRect();
      const isPastViewport = rect.bottom <= 0;

      if (isPastViewport) {
        floatingContainer.classList.remove('hidden');
      } else {
        floatingContainer.classList.add('hidden');
      }
    });
  }

  // Remove highlight class on mouseover
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.choices__item--choice');
    if (!item) return;
    item.classList.remove('is-highlighted');
  });
}

/* ========================================================================
 * Filter Dialog (Functional)
 * ======================================================================== */

/**
 * Close filter dialog
 */
function closeFilterDialog(filterDialog) {
  filterDialog.classList.remove('dialog-container');
  filterDialog.setAttribute('aria-hidden', 'true');
  filterDialog.removeAttribute('aria-modal');
  filterDialog.removeAttribute('role');
  document.body.classList.remove('modal-open');
}

/**
 * Initialize Filter Dialog for mobile/tablet
 */
async function initFilterDialog(container) {
  const filterTriggers = container.querySelectorAll('[data-a11y-dialog-show="product-filter-dialog"]');
  const filterDialog = container.querySelector('#product-filter-dialog');

  if (!filterDialog) return;

  // Load modal CSS for dialog-container styles
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);

  if (window.matchMedia('(min-width: 1280px)').matches) {
    filterDialog.removeAttribute('role');
  }

  filterTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      filterDialog.classList.add('dialog-container');
      filterDialog.setAttribute('role', 'dialog');
      filterDialog.setAttribute('aria-modal', 'true');
      filterDialog.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    });
  });

  filterDialog.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-a11y-dialog-hide="product-filter-dialog"]');
    if (closeBtn) {
      closeFilterDialog(filterDialog);
    }
  });

  filterDialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFilterDialog(filterDialog);
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 1280px)').matches) {
      closeFilterDialog(filterDialog);
      filterDialog.removeAttribute('role');
    }
  });
}

/* ========================================================================
 * Main Decorate Function
 * ======================================================================== */

export default async function decorate(block) {
  const [config, placeholders] = await Promise.all([
    getBlockConfigs(block, DEFAULT_CONFIG, 'product-listing'),
    fetchPlaceholdersForLocale(),
  ]);

  const structure = createMainStructure(config, placeholders);
  block.innerHTML = structure;

  // Load product-sidebar block via loadBlock
  const sidebarBlock = block.querySelector('.product-sidebar');
  if (sidebarBlock) {
    decorateBlock(sidebarBlock);
    await loadBlock(sidebarBlock);
  }

  initProductListingManager(block, config);
  await initSortDropdowns(block);
  initFilterDialog(block);

  // Load Bazaarvoice for ratings
  window.addEventListener('delayed-loaded', async () => {
    try {
      await loadBazaarvoiceScript();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Product Listing: Failed to load Bazaarvoice:', error);
    }
  }, { once: true });
}
