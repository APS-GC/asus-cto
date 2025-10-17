import { fetchData } from '../../../site/scripts/_api';

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
    button = `<button class="btn btn-sm">Notify Me</button>`;
  }

  return `
    <div class="comparison-product-card layout-grid__col layout-grid__col--span-3" data-id="${id}" role="group"">
      <div class="comparison-product-card__image-container">
        <button type="button" class="icon icon--close close-button" aria-label="Remove ${name} from comparison" data-id="${id}"></button>
        <img class="comparison-product-card__image" loading="lazy" src="${image}" alt="Image of ${name}"/>
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
    <div class="product-comparison-floating-card layout-grid__col layout-grid__col--span-3" data-id="${id}">
        <span class="icon icon--close close-button-floating-card" data-id="${id}"></span>
        <div class="floating-card-body flex">
          <div class="img-wrapper">
            <img src="${image}" alt="${name}">
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
    <div class="comparison-product-card layout-grid__col layout-grid__col--span-3">
        <a href="/product-listing.html" aria-label="Add a product to compare" class="comparison-product-card__empty-container">
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
    <a href="/product-listing.html" class="product-comparison-floating-card layout-grid__col layout-grid__col--span-3">
        <div class="empty-floating-card-contents flex">
          <span class="icon-wrapper"><span class="icon icon--plus-white"></span></span>
          <small>Add to compare</small>
        </div>
    </a>
  `;
}

function renderCompetitiveAdvantage(key, products) {
  const allSpecs = products.map((p) => p.specs.find((s) => s.key === key));

  const hasHighlight = allSpecs.some((spec) => spec && spec.highlight);
  if (!hasHighlight) {
    return '';
  }

  let advantageData = '';
  allSpecs.forEach((spec) => {
    if (spec && spec.highlight) {
      advantageData += `
        <div class="layout-grid__col layout-grid__col--span-3">
          <p class="highlight">${spec.highlight}</p>
        </div>
      `;
    } else {
      advantageData += `
        <div class="layout-grid__col layout-grid__col--span-3">
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
        <div class="table-cell layout-grid__col layout-grid__col--span-3">
          <p>-</p>
        </div>
      `;
    } else if (spec.key === 'color') {
      specData += `
        <div class="table-cell layout-grid__col layout-grid__col--span-3 flex">
          <span class="color-block" style="background-color:${spec.colorCode}"></span><p>${spec.value}</p>
        </div>
      `;
    } else if (typeof spec.value !== 'string') {
      specData += `
        <div class="table-cell layout-grid__col layout-grid__col--span-3">
          ${spec.value.map((v) => `<p>${v}</p>`).join('')}
        </div>
      `;
    } else {
      specData += `
        <div class="table-cell layout-grid__col layout-grid__col--span-3">
          <p>${spec.value}</p>
        </div>
      `;
    }
  });

  return `
    <div id="${key}" class="product-comparison-row flex">
      <h3>${label}</h3>
      <div class="product-row-info layout-grid layout-grid--cols">
        ${specData}
      </div>
      <div class="layout-grid layout-grid--cols">
        ${advantageData}
      </div>
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
    button = `<button class="btn btn-sm">Notify Me</button>`;
  }

  return `
    <div class="trailing-action-buttons layout-grid__col layout-grid__col--span-3">
      ${button}
    </div>
  `;
}

function renderNavigationBullets(rows) {
  return `
    <nav class="page-navigation hidden flex">
      ${rows
        .map(
          (row) => `
          <a href="product-comparison.html#${row.key}"  class="navigation-bullet" aria-label="Go to ${row.label} section"></a>
        `,
        )
        .join('')}
    </nav>
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
  console.log(Array.from(specMap.entries()).map(([key, label]) => ({ key, label })));
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

  window.addEventListener('scroll', () => {
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

    if (currentId) {
      const bullet = document.querySelector(`.navigation-bullet[href$="#${currentId}"]`);
      if (bullet) bullet.classList.add('selected');
      bulletsContainer.classList.remove('hidden');
    } else {
      bulletsContainer.classList.add('hidden');
    }
  });

  count.innerHTML = products.length;

  // attach event listeners for close buttons
  document.querySelectorAll('.close-button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      products = products.filter((p) => p.id !== id);
      loadProducts();
    });
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
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts(true);

  const mainContainer = document.querySelector('.product-comparison-card__container');
  const floatingContainer = document.querySelector(
    '.product-comparison-floating-card__container-wrapper',
  );
  const backButton = document.querySelector('#comparison-page-back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = '/product-listing.html';
    });
  }

  if (mainContainer && floatingContainer) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          floatingContainer.classList.add('hidden');
        } else {
          floatingContainer.classList.remove('hidden');
        }
      },
      {
        root: null,
        threshold: 0,
      },
    );
    observer.observe(mainContainer);
  }

  const scrollable = document.querySelector('.scrollable-component');
  const floating = document.querySelector('.product-comparison-floating-card__container');

  if (scrollable && floating) {
    let isSyncingScrollable = false;
    let isSyncingFloating = false;

    scrollable.addEventListener('scroll', () => {
      if (!isSyncingFloating) {
        isSyncingScrollable = true;
        floating.scrollLeft = scrollable.scrollLeft;
      }
      isSyncingFloating = false;
    });

    floating.addEventListener('scroll', () => {
      if (!isSyncingScrollable) {
        isSyncingFloating = true;
        scrollable.scrollLeft = floating.scrollLeft;
      }
      isSyncingScrollable = false;
    });
  }
});

function highlightDifferences() {
  document.querySelectorAll('.product-comparison-row').forEach((row) => {
    const cells = Array.from(row.querySelectorAll('.table-cell'));
    const values = cells.map((c) => c.textContent.trim());

    const allSame = values.every((v) => v === values[0]);
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
    .querySelectorAll('.product-comparison-row')
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
