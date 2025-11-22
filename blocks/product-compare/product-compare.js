import { loadSwiper } from '../../scripts/swiper-loader.js';

/**
 * Main entry point for the product-compare block.
 * @param {HTMLElement} block The block element to decorate.
 */
export default async function decorate(block) {
  await renderProductCompare(block);
  initProductCompare(block);
}

/**
 * Renders the initial HTML structure for the product comparison component.
 * @param {HTMLElement} block The block element to populate.
 */
async function renderProductCompare(block) {
  const productCompareContainer = document.createElement('div');
  productCompareContainer.className = 'product-compare-container container';

  // Build the HTML in a fragment / string, then insert once
  const html = `
  <div
   class="cmp-product-compare is-hidden is-collapsed"
   data-compare-container
   role="region"
   aria-labelledby="compare-title"
   >
   <div class="container">
      <div class="cmp-product-compare__header">
         <div class="cmp-product-compare__header-content">
            <div class="cmp-product-compare__title-group">
               <div class="cmp-product-compare__title-row">
                  <h2 class="cmp-product-compare__title" id="compare-title">
                     Product Comparison (<span data-count>0</span>/4)
                  </h2>
                  <div class="cmp-product-compare__error-container" aria-live="polite">
                     <div class="cmp-product-compare__error" hidden data-error="limit">
                        You have reached the limit of 4 products, please remove one product before adding a
                        new one for comparison.
                     </div>
                     <div class="cmp-product-compare__error" hidden data-error="minimum">
                        Please select at least 2 products to compare.
                     </div>
                  </div>
               </div>
            </div>
            <button
               class="cmp-button cmp-product-compare__toggle"
               data-action="toggle-collapse"
               data-toggle="collapse"
               aria-expanded="false"
               aria-controls="compare-content"
               aria-label="Toggle compare content"
               ></button>
         </div>
      </div>
      <div class="cmp-product-compare__content-row" id="compare-content">
         <div class="carousel panelcontainer">
            <div
               id="carousel-product-compare"
               class="cmp-carousel"
               role="group"
               aria-live="polite"
               aria-roledescription="carousel"
               data-cmp-is="carousel"
               data-slides-per-view="2"
               data-slides-per-view-tablet="2"
               data-slides-per-view-desktop="4"
               data-loop-slides="false"
               data-space-between="8"
               data-space-between-tablet="8"
               data-space-between-desktop="20"
               >
               <div 
                  class="cmp-carousel__content cmp-carousel__content--overflow cmp-product-compare__list"
                  aria-atomic="false"
                  aria-live="polite"
                  >
                  <div class="swiper">
                     <div class="swiper-wrapper"></div>
                  </div>
               </div>
            </div>
         </div>
         <div class="cmp-product-compare__actions">
            <button class="cmp-button cmp-button--primary" data-action="compare" data-compare-link="./product-comparison.html" aria-label="Compare the selected products">
            View Comparison
            </button>
            <button class="cmp-button cmp-button--tertiary btn btn-link" data-action="clear-all">
            Clear All
            </button>
         </div>
      </div>
   </div>
</div>
`;

  productCompareContainer.innerHTML = html;

  // Replace in DOM
  block.replaceChildren(...productCompareContainer.children);
}

/**
 * Manages the state and behavior of the product comparison component,
 * including adding/removing products, handling UI updates, and user interactions.
 */
class ProductCompare {
  constructor(container) {
    this.container = container;
    if (!this.container) return;

    this.COMPARE_LIMIT = 4;
    this.COMPARE_KEY = 'compare-products';

    this.state = {
      products: this.getStoredProducts(),
      isCollapsed: true,
    };

    this.dom = {
      list: this.container.querySelector('.cmp-product-compare__list'),
      countSpan: this.container.querySelector('[data-count]'),
      errorContainer: this.container.querySelector('.cmp-product-compare__error-container'),
      compareBtn: this.container.querySelector("[data-action='compare']"),
      toggleBtn: this.container.querySelector('.cmp-product-compare__toggle'),
    };

    // Debounced render for smoother updates
    this.render = this.debounce(this.render.bind(this), 50);
  }

  /**
   * Asynchronously initializes the component, including the Swiper carousel and event listeners.
   */
  async init() {
    if (!this.container) return;

    // Initialize carousel *after* DOM insertion
    this.swiperInstance = await this.initializeSwiperCarousel(this.container);
    this.render();

    this.updateAllCheckboxes();
    this.attachEventListeners();
    this.setupMutationObserver();
  }

  /**
   * Utility function to delay the execution of a function.
   * @param {Function} fn The function to debounce.
   * @param {number} delay The delay in milliseconds.
   * @returns {Function} The debounced function.
   */
  debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Retrieves the list of products to compare from localStorage.
   */
  getStoredProducts() {
    try {
      return JSON.parse(localStorage.getItem(this.COMPARE_KEY)) || []; 
    } catch {
      return [];
    }
  }

  /**
   * Stores the provided products in state and localStorage, then triggers a re-render.
   * @param {Array} products The array of products to store.
   */
  storeProducts(products) {
    this.state.products = products;
    try {
      localStorage.setItem(this.COMPARE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Error storing compare products:', e);
    }
    this.state.isCollapsed = false;
    this.render();
    this.updateAllCheckboxes();
  }

  /**
   * Attaches necessary event listeners to the container and document.
   */
  attachEventListeners() {
    this.container.addEventListener('click', (e) => this.handleContainerClick(e));
    document.addEventListener('change', (e) => this.handleCheckboxChange(e));
  }

  /**
   * Handles click events within the component, dispatching actions based on the clicked element.
   */
  handleContainerClick(event) {
    const actionTarget = event.target.closest('[data-action]');
    const removeTarget = event.target.closest('.cmp-product-compare__remove');

    if (removeTarget) {
      this.removeProduct(removeTarget.dataset.id);
      return;
    }
    if (!actionTarget) return;

    event.preventDefault();
    switch (actionTarget.dataset.action) {
      case 'clear-all':
        this.clearAll();
        return;
      case 'toggle-collapse':
        this.toggleCollapse();
        return;
      case 'compare':
        if (this.state.products.length < 2) {
          this.showError('minimum');
          return;
        }
        if (actionTarget.dataset.compareLink) {
          window.location.href = actionTarget.dataset.compareLink;
        }
        return;
    }
  }

  /**
   * Handles changes to 'add-to-compare' checkboxes across the site.
   */
  handleCheckboxChange(event) {
    const checkbox = event.target;
    if (!checkbox.matches('[data-add-to-compare]')) return;

    const { id, name, sku, pdp, image } = checkbox.dataset;
    const product = { id, name, sku, pdpUrl: pdp, image };

    // Focus on the container to ensure acessed by screen reader
    this.container.focus();

    if (checkbox.checked) {
      if (this.state.products.length >= this.COMPARE_LIMIT) {
        this.showError('limit');
        checkbox.checked = false;
        return;
      }
      if (!this.state.products.some((p) => p.id === id)) {
        this.storeProducts([...this.state.products, product]);
      }
    } else {
      this.removeProduct(id);
    }
  }

  /**
   * Removes a product from the comparison list by its ID.
   * @param {string} idToRemove The ID of the product to remove.
   */
  removeProduct(idToRemove) {
    this.storeProducts(this.state.products.filter((p) => p.id !== idToRemove));
  }

  /**
   * Clears all products from the comparison list.
   */
  clearAll() {
    this.storeProducts([]);
  }

  /**
   * Toggles the collapsed/expanded state of the comparison bar.
   * @param {boolean|null} force Optional state to force (true for collapsed, false for expanded).
   */
  toggleCollapse(force = null) {
    this.state.isCollapsed = force ?? !this.state.isCollapsed;
    this.render();
  }

  /**
   * Displays a specific error message (e.g., 'limit' or 'minimum').
   * @param {string} type The type of error to show.
   */
  showError(type) {
    this.dom.errorContainer?.classList.add('has-error');
    this.dom.errorContainer?.querySelectorAll('[data-error]').forEach((el) => {
      el.hidden = el.dataset.error !== type;
    });
  }

  /**
   * Creates the HTML element for a single product slot in the comparison bar.
   * @param {object|null} product The product data, or null for an empty slot.
   * @returns {HTMLElement} The created slide element.
   */
  createSlotElement(product) {
    console.log("hello 3", product);
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';

    const slot = document.createElement('div');
    slot.className = `cmp-product-compare__slot ${product ? 'is-filled' : 'is-empty'}`;
    slot.ariaLabel = `Add up to 4 products to compare`;
    slot.role = 'button';
    slot.tabIndex = 0;
    slide.appendChild(slot);

    if (product) {
      slot.innerHTML = `
        <div class="cmp-product-compare__item">
          <a href="${product.pdpUrl}" class="cmp-product-compare__link">
            <div class="cmp-product-compare__image-block">
              <img src="${product.image}" alt="${product.name}" class="cmp-product-compare__image"/>
            </div>
            <div class="cmp-product-compare__text-block">
              <div class="cmp-product-compare__name">${product.name}</div>
              <div class="cmp-product-compare__sku">${product.sku}</div>
            </div>
          </a>
          <button class="cmp-product-compare__remove" data-id="${product.id}" aria-label="Remove product"></button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <div class="cmp-product-compare__placeholder">
          <span class="cmp-product-compare__add-icon" aria-hidden="true"></span>
          <span>Add up to 4 products to compare</span>
        </div>
      `;
    }

    return slide;
  }

  /**
   * Updates the checked state of all 'add-to-compare' checkboxes on the page.
   */
  updateAllCheckboxes() {
    const ids = new Set(this.state.products.map((p) => p.id));
    document
      .querySelectorAll('[data-add-to-compare]')
      .forEach((cb) => (cb.checked = ids.has(cb.dataset.id)));
  }

  /**
   * Sets up a MutationObserver to watch for new product cards added to the DOM.
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (
        mutations.some((m) =>
          [...m.addedNodes].some((n) => n.querySelectorAll?.('[data-add-to-compare]').length),
        )
      ) {
        this.updateAllCheckboxes();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Initializes the Swiper carousel for the product comparison list.
   * @param {HTMLElement} block The root element of the component.
   * @returns {Promise<object>} The initialized Swiper instance.
   */
  async initializeSwiperCarousel(block) {
    const swiperContainer = block.querySelector('.swiper');
    if (!swiperContainer) return;

    await loadSwiper();

    // Use modules explicitly (if using swiper modular build)
    const swiper = new window.Swiper(swiperContainer, {
      // Basic options
      slidesPerView: 2,
      spaceBetween: 16,

      navigation: {
        nextEl: block.querySelector('.cmp-carousel__action_hmc--next'),
        prevEl: block.querySelector('.cmp-carousel__action_hmc--previous'),
      },
      pagination: {
        el: block.querySelector('.swiper-pagination'),
        clickable: true,
      },

      // Performance: consider enabling lazy loading or virtualization
      // (depending on your Swiper version)
      lazy: {
        loadPrevNext: true,
        loadPrevNextAmount: 2,
      },

      // Responsive behavior
      breakpoints: {
        768: {
          slidesPerView: 4,
          spaceBetween: 20,
          pagination: {
            enabled: false,
          },
        },
        1024: {
          slidesPerView: 4,
          spaceBetween: 20,
          allowTouchMove: true,
          navigation: {
            enabled: false,
          },
          pagination: {
            enabled: false,
          },
        },
      },
      on: {
        beforeDestroy: () => {
          swiper.navigation.destroy();
          swiper.pagination.destroy();
        },
      },
    });

    return swiper;
  }

  /**
   * Renders the component based on the current state, updating counts, errors, and product slots.
   */
  render() {
    const productCount = this.state.products.length;

    this.container.classList.toggle('is-hidden', productCount === 0);
    this.container.classList.toggle('is-collapsed', this.state.isCollapsed);

    if (this.dom.toggleBtn) {
      this.dom.toggleBtn.setAttribute('aria-expanded', String(!this.state.isCollapsed));
    }

    this.dom.countSpan.textContent = productCount;
    this.dom.compareBtn.classList.toggle('has-products', productCount >= 2);

    // Reset error state
    this.dom.errorContainer.classList.remove('has-error');
    this.dom.errorContainer.querySelectorAll('[data-error]').forEach((el) => {
      el.hidden = true;
    });

    if (productCount >= this.COMPARE_LIMIT && !this.state.isCollapsed) {
      this.showError('limit');
    }

    if (productCount === 1 && !this.state.isCollapsed) {
      this.showError('minimum');
    }

    // Guard against calling methods on an uninitialized or destroyed Swiper instance
    if (!this.swiperInstance || this.swiperInstance.destroyed) {
      return;
    }
    this.swiperInstance.removeAllSlides(); // This will now only run if swiperInstance is valid

    // Safe iteration without direct dynamic indexing
    for (let i = 0; i < this.COMPARE_LIMIT; i++) {
      let product = null;
      if (i >= 0 && i < this.state.products.length) {
        product = this.state.products.at(i); // safer accessor than [i]
      }
      const slotElement = this.createSlotElement(product);
      this.swiperInstance.addSlide(i, slotElement);
    }

    this.swiperInstance.update();
  }

}

/**
 * Initializes the ProductCompare component on the page.
 * @param {HTMLElement} context The parent element to search within for the component.
 */
const initProductCompare = async (context) => {
  // Select all elements marked with the data attribute
  const container = context.querySelector('[data-compare-container]');
  container.setAttribute('tabindex', '0');
  await new ProductCompare(container).init();
};
