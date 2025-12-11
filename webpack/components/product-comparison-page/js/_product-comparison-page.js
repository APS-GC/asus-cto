import { fetchData } from '../../../site/scripts/_api';
import { debounce } from '../../../site/scripts/_helpers';

let products = [];

async function fetchProducts() {
  try {
    const data = await fetchData(`product-comparison.json`);
    return data;
  } catch (err) {
    console.error('Error loading products:', err);
    return [];
  }
}

function renderComparisonProductCard(product) {
  const {
    id,
    name,
    model,
    bazaarvoiceProductId,
    image,
    price,
    originalPrice,
    discount,
    isCustomizable,
    isBuyable,
    customizeLink,
    buyLink,
  } = product;

  let button = '';
  if (isBuyable && isCustomizable) {
    button = `<a href='${customizeLink}#product-customization' class="btn btn-sm" aria-label="Customize ${name}">Customize</a>`;
  } else if (isBuyable && !isCustomizable) {
    button = `<a href='${buyLink}' class="btn btn-sm" aria-label="Buy ${name} now">Buy Now</a>`;
  } else {
    button = `<button class="btn btn-sm" aria-label="Notify me ${name}">Notify Me</button>`;
  }

  return `
    <div class="comparison-product-card comparison-product-card-item" data-id="${id}" role="group"">
      <div class="comparison-product-card__image-container">
        <button class="btn btn-link close-button" aria-label="Remove ${name} from comparison" data-id="${id}">
          <span class="icon icon--close"></span>
        </button>
        <img class="comparison-product-card__image" loading="lazy" src="${image}" alt="Image of ${name}" fetchpriority=high />
      </div>
      <div class="comparison-product-card__info flex">
        <div class="comparison-product-card__info-container flex">
          <a href="pdp.html" class="comparison-product-card__title">${name}</a>
          <a href="pdp.html#product-features" class="comparison-product-card__model">${model}</a>
          <div class="comparison-product-card__rating">
            <div
            data-bv-show="inline_rating"
            data-bv-product-id="${bazaarvoiceProductId}"
            data-bv-redirect-url="pdp.html#product-reviews"
            ></div>
          </div>
        </div>
        <div class="comparison-product-card__price-container">
          <p class="comparison-product-card__price text-bolder">$${price}</p>
          <div class="discount-wrapper flex">
            ${originalPrice ? `<span class="comparison-product-card__original-price">$${originalPrice}</span>` : ''}
            ${discount ? `<span class="comparison-product-card__discount">SAVE $${discount}</span>` : ''}
          </div>
        </div>
      </div>
      ${button}
    </div>
  `;
}

function renderFloatingCard(product) {
  const { id, name, bazaarvoiceProductId, image, price } = product;
  return `
    <div class="product-comparison-floating-card comparison-product-card-item" data-id="${id}">
    <button class="close-button-floating-card" aria-label="Remove ${name} from comparison" data-id="${id}">
        <span class="icon icon--close"></span>
    </button>
        <div class="floating-card-body flex">
          <div class="img-wrapper">
            <img src="${image}" alt="${name}" loading="lazy" fetchpriority="high" tabindex="0" aria-label="${name} product">
          </div>
            <div class="floating-card-info flex">
                <small class="floating-card__title ">
                    <a href="pdp.html">${name}</a>
                </small>
                <div
                    data-bv-show="inline_rating"
                    data-bv-product-id="${bazaarvoiceProductId}"
                    data-bv-redirect-url="pdp.html#product-reviews"
                ></div>
                <small class="floating-card__price">$${price}</small>
            </div>
        </div>
    </div>
  `;
}

function renderEmptyCard() {
  return `
    <div class="comparison-product-card comparison-product-card-item">
        <a href="product-listing.html" aria-label="Add a product to compare" class="comparison-product-card__empty-container">
            <div class="empty-container-contents">
                <span class="icon-wrapper"><span class="icon icon--plus-white" aria-hidden="true"></span></span>
                <p>Add to compare</p>
            </div>
        </a>
    </div>
  `;
}

function renderEmptyFloatingCard() {
  return `
    <a href="product-listing.html" class="product-comparison-floating-card comparison-product-card-item">
        <div class="empty-floating-card-contents flex">
          <span class="icon-wrapper"><span class="icon icon--plus-white"></span></span>
          <small>Add to compare</small>
        </div>
    </a>
  `;
}

function renderCompetitiveAdvantage(key, products) {
  const allSpecs = products.map((p) => p.specs.find((s) => s.key === key));

  const hasHighlight = allSpecs.some((spec) => spec?.highlight);
  if (!hasHighlight) {
    return '';
  }

  let advantageData = '';
  allSpecs.forEach((spec) => {
    if (spec?.highlight) {
      advantageData += `
        <div class="comparison-product-card-item">
          <p class="highlight">${spec.highlight}</p>
        </div>
      `;
    } else {
      advantageData += `
        <div class="comparison-product-card-item">
          <p>-</p>
        </div>
      `;
    }
  });

  return advantageData;
}

function renderComparisonRow(label, key, products) {
  const advantageData = renderCompetitiveAdvantage(key, products);
  let specData = '';
  const allSpecs = products.map((p) => p.specs.find((s) => s.key === key));

  allSpecs.forEach((spec) => {
    if (!spec) {
      specData += `
        <div class="table-cell comparison-product-card-item">
          <span>-</span>
        </div>
      `;
    } else if (spec.key === 'color') {
      specData += `
        <div class="table-cell comparison-product-card-item flex">
          <span class="color-block" style="background-color:${spec.colorCode}"></span><span>${spec.value}</span>
        </div>
      `;
    } else if (typeof spec.value !== 'string') {
      specData += `
        <div class="table-cell comparison-product-card-item">
          ${spec.value.map((v) => `<span>${v}</span>`).join('')}
        </div>
      `;
    } else {
      specData += `
        <div class="table-cell comparison-product-card-item">
          <span>${spec.value}</span>
        </div>
      `;
    }
  });

  return `
    <h3 class="product-comparison-row-title">${label}</h3>
    <div id="${key}" class="product-comparison-row flex">
      <div class="product-row-info product-comparison-grid">
        ${specData}
      </div>
      ${
        advantageData
          ? `<div class="product-row-advantage-data product-comparison-grid">
              ${advantageData}
            </div>`
          : ''
      }
    </div>
  `;
}

function renderTrailingActionButtons(product) {
  const { isBuyable, isCustomizable, name, buyLink, customizeLink } = product;

  let button = '';

  if (isBuyable && isCustomizable) {
    button = `<a href='${customizeLink}#product-customization' class="btn btn-sm" aria-label="Customize ${name}">Customize</a>`;
  } else if (isBuyable && !isCustomizable) {
    button = `<a href='${buyLink}' class="btn btn-sm" aria-label="Buy ${name} now">Buy Now</a>`;
  } else {
    button = `<button class="btn btn-sm" aria-label="Notify me ${name}">Notify Me</button>`;
  }

  return `
    <div class="trailing-action-buttons comparison-product-card-item">
      ${button}
    </div>
  `;
}

function renderNavigationBullets(rows) {
  return `
    <nav class="page-navigation hide flex">
      ${rows
        .map(
          (row) => `
          <a href="product-comparison.html#${row.key}"  class="navigation-bullet" aria-label="Go to ${row.label} section">
            <span class="navigation-bullet-dot"></span>
            <span class="navigation-bullet-label">${row.label}</span>
          </a>
        `,
        )
        .join('')}
    </nav>
    <div class="page-navigation-hover-panel hide">
      ${rows
        .map(
          (row) => `
          <a href="product-comparison.html#${row.key}" class="navigation-hover-item" data-key="${row.key}" aria-label="Go to ${row.label} section">
            <span class="navigation-hover-label">${row.label}</span>
          </a>
        `,
        )
        .join('')}
    </div>
  `;
}

function getAllSpecs(products) {
  const specMap = new Map();

  products.forEach((product) => {
    product.specs.forEach((spec) => {
      if (!specMap.has(spec.key)) {
        specMap.set(spec.key, spec.label);
      }
    });
  });

  return Array.from(specMap.entries()).map(([key, label]) => ({ key, label }));
}

async function loadProducts(initial = false) {
  const container = document.querySelector('.product-comparison-card__container');
  if (!container) return;
  const floatingContainer = document.querySelector('.product-comparison-floating-card__container');
  const count = document.getElementById('comparison-products-count');
  const table = document.querySelector('.product-comparison-table-rows');
  const actionsContainer = document.querySelector('.trailing-action-buttons-wrapper');

  if (initial) {
    products = await fetchProducts();
  }

  container.innerHTML = '';
  floatingContainer.innerHTML = '';
  actionsContainer.innerHTML = '';
  table.innerHTML = '';
  products.forEach((product) => {
    container.insertAdjacentHTML('beforeend', renderComparisonProductCard(product));
    floatingContainer.insertAdjacentHTML('beforeend', renderFloatingCard(product));
    actionsContainer.insertAdjacentHTML('beforeend', renderTrailingActionButtons(product));
  });

  const switchContainer = document.querySelector('#switch-container');
  const floatingCards = floatingContainer.querySelectorAll('.product-comparison-floating-card');

  if (switchContainer) {
    if (floatingCards.length <= 1) {
      switchContainer.style.display = 'none';
    } else {
      switchContainer.style.display = '';
    }
  }

  for (let i = products.length; i < 4; i++) {
    container.insertAdjacentHTML('beforeend', renderEmptyCard());
    floatingContainer.insertAdjacentHTML('beforeend', renderEmptyFloatingCard());
  }

  if (products.length > 0) {
    const rows = getAllSpecs(products);

    // Switch toggle
    table.insertAdjacentHTML('beforebegin', renderNavigationBullets(rows));

    // Rows
    rows.forEach((row) => {
      table.insertAdjacentHTML('beforeend', renderComparisonRow(row.label, row.key, products));
    });
  }

  const headerOffset = 150;
  const bulletsContainer = document.querySelector('.page-navigation');
  const bullets = document.querySelectorAll('.navigation-bullet');
  const rows = document.querySelectorAll('.product-comparison-row');
  const hoverPanel = document.querySelector('.page-navigation-hover-panel');
  // Select hoverItems after they are dynamically created
  const hoverItems = document.querySelectorAll('.navigation-hover-item');

  // Handle hover panel visibility - trigger on bullet area hover/click
  if (bulletsContainer && hoverPanel && bullets.length > 0) {
    let isHoverPanelOpen = false;

    const openHoverPanel = (focusFirst = false, focusLast = false) => {
      hoverPanel.classList.remove('hide');
      bulletsContainer.classList.add('hide-bullets');
      isHoverPanelOpen = true;

      // Focus the first or last item in the hover panel if requested
      if (focusFirst) {
        setTimeout(() => {
          const firstHoverItem = hoverPanel.querySelector('.navigation-hover-item');
          if (firstHoverItem) {
            firstHoverItem.focus();
          }
        }, 50); // Small delay to ensure panel is visible
      } else if (focusLast) {
        setTimeout(() => {
          const allHoverItems = hoverPanel.querySelectorAll('.navigation-hover-item');
          const lastHoverItem = allHoverItems[allHoverItems.length - 1];
          if (lastHoverItem) {
            lastHoverItem.focus();
          }
        }, 50); // Small delay to ensure panel is visible
      }
    };

    const closeHoverPanel = () => {
      hoverPanel.classList.add('hide');
      bulletsContainer.classList.remove('hide-bullets');
      isHoverPanelOpen = false;
    };

    // Open panel when clicking near bullets
    bulletsContainer.addEventListener('click', (e) => {
      console.log('Container clicked:', e.target);
      if (!e.target.closest('.navigation-bullet')) {
        console.log('Clicked outside bullet');
        if (isHoverPanelOpen) {
          closeHoverPanel();
        } else {
          openHoverPanel();
        }
      } else {
        // Bullet was clicked, allow navigation and show panel
        console.log('Bullet clicked, opening panel');
        openHoverPanel();
      }
    });

    // Track navigation direction for backward navigation support
    let lastFocusedElement = null;
    let isBackwardNavigation = false;

    // Global focus tracking to detect navigation direction
    document.addEventListener('focusin', (e) => {
      // Don't track focus changes within the hover panel itself
      if (!hoverPanel.contains(e.target)) {
        lastFocusedElement = e.target;
      }
    });

    // Handle focus on bullets - auto-expand sub-menu
    bullets.forEach((bullet, index) => {
      bullet.addEventListener('focus', () => {
        // Detect if this is backward navigation (Shift+Tab)
        // Check if the previously focused element was after this bullet in tab order
        const allFocusableElements = Array.from(
          document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        );
        const currentIndex = allFocusableElements.indexOf(bullet);
        const lastIndex = lastFocusedElement
          ? allFocusableElements.indexOf(lastFocusedElement)
          : -1;

        isBackwardNavigation = lastIndex > currentIndex;

        // Open panel and move focus to submenu
        if (index === 0 && !isBackwardNavigation) {
          openHoverPanel(true); // Auto-focus first item in submenu for forward navigation
        } else if (isBackwardNavigation) {
          openHoverPanel(false, true); // Auto-focus last item in submenu for backward navigation
        } else {
          openHoverPanel(); // Just open panel for other bullets
        }
      });

      bullet.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Prevent default behavior to avoid navigation
          e.preventDefault();
          // Focus first item in the already-open panel
          openHoverPanel(true);
        }
      });

      // Track when bullet loses focus to detect navigation direction
      bullet.addEventListener('blur', () => {
        lastFocusedElement = bullet;
      });
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!hoverPanel.contains(e.target) && !bulletsContainer.contains(e.target)) {
        closeHoverPanel();
      }
    });

    // Close panel when focus moves away from navigation area
    document.addEventListener('focusin', (e) => {
      if (!hoverPanel.contains(e.target) && !bulletsContainer.contains(e.target)) {
        closeHoverPanel();
      }
    });

    // Handle keyboard navigation on hover panel items using event delegation
    hoverPanel.addEventListener('click', (e) => {
      const item = e.target.closest('.navigation-hover-item');
      if (item) {
        e.preventDefault();
        // Navigate to the section while maintaining focus
        const targetSection = item.getAttribute('data-key');
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Keep focus on the clicked item and panel open
        setTimeout(() => {
          item.focus();
        }, 100);
      }
    });

    // Handle keyboard navigation on hover panel items using event delegation
    {
      hoverPanel.addEventListener('keydown', (e) => {
        const item = getItem(e);
        if (!item) return;

        const allItems = getAllHoverItems();
        const index = allItems.indexOf(item);

        switch (e.key) {
          case 'Enter':
          case ' ':
            handleActivation(e, item);
            break;

          case 'ArrowDown':
            handleArrowNav(e, allItems, index, 1);
            break;

          case 'ArrowUp':
            handleArrowNav(e, allItems, index, -1);
            break;

          case 'Tab':
            handleTab(e, item, allItems, index);
            break;

          case 'Escape':
            handleEscape(e, item);
            break;
        }
      });

      /* ------------------------------------------------------------------
         Helper Functions
      ------------------------------------------------------------------- */

      function getItem(e) {
        return e.target.closest('.navigation-hover-item');
      }

      function getAllHoverItems() {
        return Array.from(hoverPanel.querySelectorAll('.navigation-hover-item'));
      }

      /** ----------------------------------------
       *  ENTER or SPACE
      ----------------------------------------- */
      function handleActivation(e, item) {
        if (e.key === ' ') e.preventDefault();

        const targetId = item.getAttribute('data-key');
        const target = document.getElementById(targetId);

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        setTimeout(() => item.focus(), 100);
      }

      /** ----------------------------------------
       *  ArrowUp / ArrowDown
      ----------------------------------------- */
      function handleArrowNav(e, allItems, index, direction) {
        e.preventDefault();

        const nextIndex = (index + direction + allItems.length) % allItems.length;

        allItems[nextIndex].focus();
      }

      /** ----------------------------------------
       *  Tab / Shift+Tab
      ----------------------------------------- */
      function handleTab(e, item, allItems, index) {
        if (e.shiftKey) {
          handleShiftTab(e, item, allItems, index);
        } else {
          handleForwardTab(e, allItems, index);
        }
      }

      function handleShiftTab(e, item, allItems, index) {
        if (index > 0) {
          e.preventDefault();
          allItems[index - 1].focus();
          return;
        }

        // At first item
        e.preventDefault();
        closeHoverPanel();
        focusPreviousFocusable(item);
      }

      function handleForwardTab(e, allItems, index) {
        if (index < allItems.length - 1) {
          e.preventDefault();
          allItems[index + 1].focus();
          return;
        }

        // Last item → allow natural Tab and close panel
        closeHoverPanel();
      }

      function focusPreviousFocusable(item) {
        const focusable = getFocusable();
        const bullet = findBullet(item);
        if (!bullet) return;

        const idx = focusable.indexOf(bullet);
        const prev = focusable[idx - 1];

        if (prev) {
          setTimeout(() => prev.focus(), 50);
        }
      }

      /** ----------------------------------------
       *  Escape
      ----------------------------------------- */
      function handleEscape(e, item) {
        e.preventDefault();
        closeHoverPanel();

        const bullet = findBullet(item);
        if (bullet) bullet.focus();
      }

      /* ------------------------------------------------------------------
         DOM helpers
      ------------------------------------------------------------------- */

      function getFocusable() {
        return Array.from(
          document.querySelectorAll(
            `a[href], button, input, select, textarea,
             [tabindex]:not([tabindex="-1"])`,
          ),
        );
      }

      function findBullet(item) {
        const key = item.getAttribute('data-key');
        return document.querySelector(`.navigation-bullet[href$="#${key}"]`);
      }
    }
  }

  window.addEventListener(
    'scroll',
    debounce(() => {
      if (!bulletsContainer) return;
      let currentId = '';
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        if (rect.top <= headerOffset && rect.bottom > headerOffset) {
          currentId = row.id;
        }
      });

      // removing 'selected' from all bullets first
      bullets.forEach((bullet) => bullet.classList.remove('selected'));
      if (hoverItems.length > 0) {
        hoverItems.forEach((item) => item.classList.remove('selected'));
      }

      if (currentId) {
        const bullet = document.querySelector(`.navigation-bullet[href$="#${currentId}"]`);
        const hoverItem = document.querySelector(`.navigation-hover-item[data-key="${currentId}"]`);
        if (bullet) bullet.classList.add('selected');
        if (hoverItem) hoverItem.classList.add('selected');
        bulletsContainer.classList.remove('hide');
        // Don't automatically show hover panel - only show on hover
      } else {
        bulletsContainer.classList.add('hide');
      }
    }),
  );

  count.innerHTML = products.length;

  // attach event listeners for close buttons
  document.addEventListener('click', (e) => {
    if (
      e.target.classList.contains('close-button') ||
      e.target.classList.contains('close-button-floating-card')
    ) {
      const id = e.target.dataset.id;
      products = products.filter((p) => p.id !== id);
      loadProducts();
    }
  });

  document.querySelectorAll('.close-button-floating-card').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      products = products.filter((p) => p.id !== id);
      loadProducts();
    });
  });
  const clearAllButton = document.querySelector('.clear-all-button');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', () => {
      products = [];
      loadProducts();
    });
  }

  checkDifferences();
  initScrollSync();
}

function initScrollSync() {
  const cardContainer = document.getElementById('product-comparison-card__container');
  const tableRows = document.getElementById('product-comparison-table-rows');
  const trailingActions = document.getElementById('trailing-action-buttons-wrapper');
  const floating = document.querySelector('.product-comparison-floating-card__container');

  const scrollTargets = [cardContainer, tableRows, trailingActions, floating].filter(Boolean);

  if (scrollTargets.length === 0) return;

  let isSyncing = false;

  function syncScroll(source) {
    if (isSyncing) return;
    isSyncing = true;

    const x = source.scrollLeft;

    requestAnimationFrame(() => {
      scrollTargets.forEach((el) => {
        if (el !== source) {
          el.scrollLeft = x;
        }
      });
      isSyncing = false;
    });
  }

  scrollTargets.forEach((el) => {
    el.addEventListener('scroll', () => syncScroll(el));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts(true);

  const mainContainer = document.querySelector('.product-comparison-card__container');
  const floatingContainer = document.querySelector(
    '.product-comparison-floating-card__container-wrapper',
  );
  const scrollable = document.querySelector('.scrollable-component');
  const floating = document.querySelector('.product-comparison-floating-card__container');

  const backButton = document.querySelector('#comparison-page-back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'product-listing.html';
    });
  }

  if (mainContainer && floatingContainer && scrollable && floating) {
    const toggleFloating = () => {
      const mainBottom = mainContainer.offsetTop + mainContainer.offsetHeight;
      const footer = document.querySelector('footer');
      if (window.scrollY >= mainBottom && window.scrollY < footer.offsetTop - 250) {
        floatingContainer.classList.add('sticky');
        // Sync scroll position when floating cards become visible
        floating.scrollLeft = scrollable.scrollLeft;
      } else {
        floatingContainer.classList.remove('sticky');
      }
    };

    toggleFloating(); // run once on load
    window.addEventListener('scroll', toggleFloating);
  }
});

function highlightDifferences() {
  document.querySelectorAll('.product-comparison-row').forEach((row) => {
    const cells = Array.from(row.querySelectorAll('.table-cell'));
    const values = cells.map((c) => c.textContent.trim());

    const allSame = values.every((v) => v === values[0]);
    const title = row.previousElementSibling;
    if (title?.classList?.contains('product-comparison-row-title')) {
      if (!allSame) {
        title.classList.add('different-row');
      } else {
        title.classList.remove('different-row');
      }
    }
    if (!allSame) {
      row.classList.add('different-row');
    } else {
      row.classList.remove('different-row');
    }
  });
}

function checkDifferences() {
  let noDifferences = true;
  document.querySelectorAll('.product-comparison-row').forEach((row) => {
    const cells = Array.from(row.querySelectorAll('.table-cell'));
    const values = cells.map((c) => c.textContent.trim());

    const allSame = values.every((v) => v === values[0]);
    if (!allSame) {
      noDifferences = false;
    }
  });
  const switchContainer = document.querySelector('#switch-container');
  if (switchContainer) {
    if (noDifferences) {
      switchContainer.classList.add('no-differences');
    } else {
      switchContainer.classList.remove('no-differences');
    }
  }
}

function clearDifferences() {
  document
    .querySelectorAll('.product-comparison-row, .product-comparison-row-title')
    .forEach((row) => row.classList.remove('different-row'));
}

class Switch {
  constructor(domNode) {
    this.switchNode = domNode;
    this.switchNode.addEventListener('click', () => this.toggleStatus());
    this.switchNode.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleStatus();
    }
  }

  // Switch state of a switch
  toggleStatus() {
    const currentState = this.switchNode.getAttribute('aria-checked') === 'true';
    const newState = String(!currentState);

    this.switchNode.setAttribute('aria-checked', newState);
    if (newState === 'true') {
      highlightDifferences();
    } else {
      clearDifferences();
    }
  }
}

window.addEventListener('load', function () {
  Array.from(document.querySelectorAll('[role=switch]')).forEach((element) => new Switch(element));
});
