import { loadCSS, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation, loadSwiper } from '../../scripts/scripts.js';
import { fetchGameList, getApiEndpoint } from '../../scripts/api-service.js';
import { API_URIS } from '../../constants/api-constants.js';


export default async function decorate(block) {
  await Promise.all([
    loadNoUiSlider(),
    loadSwiperCSS(),
    loadSwiper(),
    import('../../scripts/carousel.js'),
  ]);

  await renderProductCompare(block);
  await loadProducts(true)

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
    console.log("HHHHH Scroll header popup 1")
    const toggleFloating = () => {
      console.log("HHHHH Scroll header popup")
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

  if (scrollable && floating) {
    let isSyncingScrollable = false;
    let isSyncingFloating = false;

    scrollable.addEventListener('scroll', () => {
      if (isSyncingScrollable) {
        isSyncingScrollable = false;
        return;
      }
      isSyncingFloating = true;
      floating.scrollLeft = scrollable.scrollLeft;
      window.requestAnimationFrame(() => {
        isSyncingFloating = false;
      });
    });

    floating.addEventListener('scroll', () => {
      if (isSyncingFloating) {
        isSyncingFloating = false;
        return;
      }
      isSyncingScrollable = true;
      scrollable.scrollLeft = floating.scrollLeft;
      window.requestAnimationFrame(() => {
        isSyncingScrollable = false;
      });
    });
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
 * Loads the Swiper CSS from a CDN, ensuring it is only fetched once.
 */
let swiperCSSLoaded = null;
function loadSwiperCSS() {
  if (!swiperCSSLoaded) {
    swiperCSSLoaded = loadCSS(
      'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
    ).catch((err) => {
      console.error('Failed to load Swiper CSS:', err);
      throw err;
    });
  }
  return swiperCSSLoaded;
}



function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders the initial HTML structure for the product comparison component.
 * @param {HTMLElement} block The block element to populate.
 */
async function renderProductCompare(block) {
  const productCompareContainer = document.createElement('div');
  productCompareContainer.className = 'product-comparison-page';

  const authoredRows = [...block.children];
  const AuthoredData = authoredRows.map((row) => row.textContent.trim());


  const html = `
  <div class="product-comparison-page light-mode">
    <div class="product-comparison-component-wrapper">

    <div class="header-component-wrapper">
      <div class="container header-container flex justify-between items-center">
          <div class="internal-container flex justify-between items-center">
              <button class="btn btn-link btn-sm back-button" id="comparison-page-back-button"
                  aria-label="Go back to previous page">
                  <span class="icon icon--arrow-left" aria-hidden="true"></span>
                  <span class="back-button-text">Back</span>
              </button>
              <div class="vertical-divider" aria-hidden="true"></div>
              
          
              <div class="section-heading content-center">
                <div class="section-heading__text-group">
                  <h2 class="section-heading__title">Product comparison</h2>
                </div>
              </div>


              </div>

              
          <div class="clear-all-action-container">
              <span><span id="comparison-products-count" aria-live="polite"></span>/4</span>
              <button class="clear-all-button btn btn-link" aria-label="Clear all selected products">
                  Clear All
              </button>
          </div>
      </div>
      <div class="product-comparison-floating-card__container-wrapper">
          <div class="product-comparison-floating-card__container container product-comparison-grid">
          </div>
      </div>
  </div>
  <div class="scrollable-component" role="region" aria-label="Product comparison details">
      <div class="product-comparison-card__container product-comparison-grid" id="product-comparison-card__container">
      </div>
      <div class="switch-container no-differences flex" id="switch-container">    
            <div role="switch" aria-checked="false" tabindex="0">
                <span class="label">Show me the differences</span>
                <span class="switch"><span></span></span>
            </div>
              <div class="info-tooltip-wrapper">
                  <button data-tooltip-trigger aria-describedby="highlight-tooltip" data-tooltip-position="bottom"
                      class="btn btn-link" aria-label="Highlight differences information">
                      <span class="icon icon--info"></span>
                  </button>
                  <div id="highlight-tooltip"
                      class="tooltip__content tooltip__content--theme-dark tooltip__content--size-small"
                      role="tooltip">
                      Highlight Differences is unavailable because all products have identical specifications.
                  </div>
              </div>
      </div>

      <div class="product-comparison-table">
          <div class="product-comparison-table-rows" id="product-comparison-table-rows"></div>
      </div>

      <div class="trailing-action-buttons-wrapper product-comparison-grid" id="trailing-action-buttons-wrapper"></div>
  </div>
  </div>
  </div>
`;

  productCompareContainer.innerHTML = html;

  // Replace in DOM
  block.replaceChildren(...productCompareContainer.children);

}

let products = [];

function getStoredProducts() {
    try {
      let localStorageData = JSON.parse(localStorage.getItem('compare-products')).map((product) => product.id).join(',') || '';
      return localStorageData;
    } catch {
      return [];
    }
  }

 function _buildApiPayload() {
    const path = window.location.href.includes('/us/') ? 'us' : 'en';
    return {
      'websiteCode': path,
      'partNo': getStoredProducts() || ''
    };
  }

async function fetchProducts() {
  try {

    
    const endpoint = await getApiEndpoint(API_URIS.PRODUCT_COMPARISON_PAGE);

    const response = await fetchGameList(endpoint, 'POST', _buildApiPayload(), 'formData');

    if (response && response.result && response.result[0] && response.result[0].skus) {      
      return response.result[0].skus.map((product) => {
        const specs = product.spec_Content.map((spec) => {
          const value = spec.descriptionText.includes('<br>')
            ? spec.descriptionText.split('<br>').map((s) => s.trim())
            : spec.descriptionText;

          return {
            key: spec.displayField.toLowerCase().replace(/\s+/g, '-'),
            label: spec.displayField,
            value,
          };
        });

        return {
          id: product.partNo,
          bazaarvoiceProductId: `ASUS_M1_${product.m1Id}_P`,
          name: product.mktName.trim(),
          model: product.skuName,
          isBuyable: true, // Assuming default, not in new API response
          isCustomizable: true, // Assuming default, not in new API response
          buyLink: product.skuUrl,
          customizeLink: product.skuUrl,
          image: product.skuImg,
          specs,
        };
      });
    }
    return [];
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
          <span class="color-block" style="background-color:${spec.value}"></span><span>${spec.value}</span>
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

  return `<h3 tabindex="0" class="product-comparison-row-title">${label}</h3>
    <div id="${key}" class="product-comparison-row flex">
      <div class="product-row-info product-comparison-grid">
        ${specData}
      </div>
      ${advantageData
      ? `<div class="product-comparison-grid">
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
    <nav class="page-navigation flex hide">
      ${rows
      .map(
        (row) => `
          <a href="/en/products/desktops/product-comparison-page#${row.key}"  class="navigation-bullet" aria-label="Go to ${row.label} section">
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
          <a href="/en/products/desktops/product-comparison-page#${row.key}" class="navigation-hover-item" data-key="${row.key}" aria-label="Go to ${row.label} section">
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

  console.log(products)
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
  const hoverItems = document.querySelectorAll('.navigation-hover-item');

  // Handle hover panel visibility - trigger on bullet hover
  if (bulletsContainer && hoverPanel && bullets.length > 0) {
    let hoverTimeout;

    const showHoverPanel = () => {
      clearTimeout(hoverTimeout);
      hoverPanel.classList.remove('hidden');
      bulletsContainer.classList.add('hide-bullets');
    };

    const hideHoverPanel = () => {
      hoverTimeout = setTimeout(() => {
        hoverPanel.classList.add('hidden');
        bulletsContainer.classList.remove('hide-bullets');
      }, 200);
    };

    // Trigger on individual bullet hover
    bullets.forEach((bullet) => {
      bullet.addEventListener('mouseenter', showHoverPanel);
      bullet.addEventListener('mouseleave', hideHoverPanel);
    });

    // Keep panel visible when hovering over it
    hoverPanel.addEventListener('mouseenter', showHoverPanel);
    hoverPanel.addEventListener('mouseleave', hideHoverPanel);
  }

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
    if (hoverItems.length > 0) {
      hoverItems.forEach((item) => item.classList.remove('selected'));
    }

    if (currentId) {
      const bullet = document.querySelector(`.navigation-bullet[href$="#${currentId}"]`);
      const hoverItem = document.querySelector(`.navigation-hover-item[data-key="${currentId}"]`);
      if (bullet) bullet.classList.add('selected');
      if (hoverItem) hoverItem.classList.add('selected');
      bulletsContainer.classList.remove('hidden');
      // Don't automatically show hover panel - only show on hover
    } else {
      bulletsContainer.classList.add('hidden');
    }
  });

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
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("HHHHH Scroll header popup >>>>> ")
  
  // const mainContainer = document.querySelector('.product-comparison-card__container');
  // const floatingContainer = document.querySelector(
  //   '.product-comparison-floating-card__container-wrapper',
  // );
  // const scrollable = document.querySelector('.scrollable-component');
  // const floating = document.querySelector('.product-comparison-floating-card__container');

  // const backButton = document.querySelector('#comparison-page-back-button');
  // if (backButton) {
  //   backButton.addEventListener('click', () => {
  //     window.location.href = 'product-listing.html';
  //   });
  // }

  // if (mainContainer && floatingContainer && scrollable && floating) {
  //   console.log("HHHHH Scroll header popup 1")
  //   const toggleFloating = () => {
  //     console.log("HHHHH Scroll header popup")
  //     const mainBottom = mainContainer.offsetTop + mainContainer.offsetHeight;
  //     const footer = document.querySelector('footer');
  //     if (window.scrollY >= mainBottom && window.scrollY < footer.offsetTop - 250) {
  //       floatingContainer.classList.add('sticky');
  //       // Sync scroll position when floating cards become visible
  //       floating.scrollLeft = scrollable.scrollLeft;
  //     } else {
  //       floatingContainer.classList.remove('sticky');
  //     }
  //   };

  //   toggleFloating(); // run once on load
  //   window.addEventListener('scroll', toggleFloating);
  // }

  // if (scrollable && floating) {
  //   let isSyncingScrollable = false;
  //   let isSyncingFloating = false;

  //   scrollable.addEventListener('scroll', () => {
  //     if (isSyncingScrollable) {
  //       isSyncingScrollable = false;
  //       return;
  //     }
  //     isSyncingFloating = true;
  //     floating.scrollLeft = scrollable.scrollLeft;
  //     window.requestAnimationFrame(() => {
  //       isSyncingFloating = false;
  //     });
  //   });

  //   floating.addEventListener('scroll', () => {
  //     if (isSyncingFloating) {
  //       isSyncingFloating = false;
  //       return;
  //     }
  //     isSyncingScrollable = true;
  //     scrollable.scrollLeft = floating.scrollLeft;
  //     window.requestAnimationFrame(() => {
  //       isSyncingScrollable = false;
  //     });
  //   });
  // }
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
