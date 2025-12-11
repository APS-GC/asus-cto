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

  init() {
    if (!this.container) return;
    if (window.location.pathname.endsWith('product-comparison.html')) {
      this.container.classList.add('is-hidden');
      return;
    }

    this.render();
    this.updateAllCheckboxes();
    this.attachEventListeners();
    this.setupMutationObserver();
  }

  // --- Utils ---
  debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  // --- State Management ---
  getStoredProducts() {
    try {
      return JSON.parse(localStorage.getItem(this.COMPARE_KEY)) || [];
    } catch {
      return [];
    }
  }

  announceChange(message) {
    let region = document.getElementById('sr-compare-announcement');
    if (!region) {
      region = document.createElement('div');
      region.id = 'sr-compare-announcement';
      region.className = 'sr-only-fixed';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 50);
  }

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

  // --- Event Handling ---
  attachEventListeners() {
    this.container.addEventListener('click', (e) => this.handleContainerClick(e));
    document.addEventListener('change', (e) => this.handleCheckboxChange(e));
  }

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

  handleCheckboxChange(event) {
    const checkbox = event.target;
    if (!checkbox.matches('[data-add-to-compare]')) return;

    const { id, name, sku, pdp, image } = checkbox.dataset;
    const product = { id, name, sku, pdpUrl: pdp, image };

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

    // Focus on the container to ensure acessed by screen reader
    this.container.focus();
  }

  // --- Actions ---
  removeProduct(idToRemove) {
    const removedProduct = this.state.products.find((p) => p.id === idToRemove);
    this.storeProducts(this.state.products.filter((p) => p.id !== idToRemove));
    if (removedProduct) {
      setTimeout(() => {
        this.announceChange(`${removedProduct.name} removed from comparison.`);
      }, 100);
    }
  }

  clearAll() {
    this.storeProducts([]);
    this.announceChange('All products removed from comparison.');
  }

  toggleCollapse(force = null) {
    this.state.isCollapsed = force ?? !this.state.isCollapsed;
    this.render();
  }

  // --- Rendering ---
  showError(type) {
    this.dom.errorContainer?.classList.add('has-error');
    this.dom.errorContainer?.querySelectorAll('[data-error]').forEach((el) => {
      el.hidden = el.dataset.error !== type;
    });
  }

  createSlotElement(product) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';

    if (product) {
      const slot = document.createElement('div');
      slot.className = `cmp-product-compare__slot is-filled`;
      slot.ariaLabel = `Product ${product.name} added for the comparison`;
      slot.role = 'group';
      slide.appendChild(slot);
      slot.innerHTML = `
        <div class="cmp-product-compare__item">
          <a href="pdp.html" class="cmp-product-compare__link">
            <div class="cmp-product-compare__image-block" aria-hidden="true">
              <img src="${product.image}" alt="${product.name}" class="cmp-product-compare__image" />
            </div>
            <div class="cmp-product-compare__text-block">
              <div class="cmp-product-compare__name">${product.name}</div>
              <div class="cmp-product-compare__sku">${product.sku}</div>
            </div>
          </a>
          <button class="cmp-product-compare__remove" data-id="${product.id}" aria-label="Remove ${product.name} from comparison"></button>
        </div>
      `;
    } else {
      const slot = document.createElement('a');
      slot.className = `cmp-product-compare__slot is-empty`;
      slot.ariaLabel = `Add up to 4 products to compare`;
      slot.role = 'button';
      slot.tabIndex = 0;
      slot.href = 'product-listing.html';
      slide.appendChild(slot);
      slot.innerHTML = `
        <div class="cmp-product-compare__placeholder" >
          <span class="cmp-product-compare__add-icon" aria-hidden="true"></span>
          <span>Add up to 4 products to compare</span>
        </div>
      `;
    }

    return slide;
  }

  updateAllCheckboxes() {
    const ids = new Set(this.state.products.map((p) => p.id));
    document
      .querySelectorAll('[data-add-to-compare]')
      .forEach((cb) => (cb.checked = ids.has(cb.dataset.id)));
  }

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

  render() {
    const productCount = this.state.products.length;

    this.container.classList.toggle('is-hidden', productCount === 0);
    this.container.classList.toggle('is-collapsed', this.state.isCollapsed);

    if (this.dom.toggleBtn) {
      this.dom.toggleBtn.setAttribute('aria-expanded', String(!this.state.isCollapsed));
      const div = document.querySelector('.cmp-product-compare');
      setTimeout(() => {
        div.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 300);
    }

    this.dom.countSpan.textContent = productCount;
    this.dom.compareBtn.classList.toggle('has-products', productCount >= 2);

    // Reset error state
    this.dom.errorContainer.classList.remove('has-error');
    this.dom.errorContainer.querySelectorAll('[data-error]').forEach((el) => {
      el.hidden = true;
    });

    const swiperInstance = this.dom.list.querySelector('.swiper').swiperInstance;
    swiperInstance.removeAllSlides();

    // Safe iteration without direct dynamic indexing
    for (let i = 0; i < this.COMPARE_LIMIT; i++) {
      let product = null;
      if (i >= 0 && i < this.state.products.length) {
        product = this.state.products.at(i); // safer accessor than [i]
      }
      const slotElement = this.createSlotElement(product);
      swiperInstance.addSlide(i, slotElement);
    }

    swiperInstance.update();
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-compare-container]');
  container.setAttribute('tabindex', '-1');
  if (container) new ProductCompare(container).init();
});

function handleStickyForCompareWindow() {
  if (document.querySelector('.cmp-product-compare__slot.is-filled')) {
    const div = document.querySelector('.cmp-product-compare');
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const atBottom = scrollTop + windowHeight >= documentHeight - 10;

    if (atBottom) {
      div.classList.add('relative');
    } else {
      div.classList.remove('relative');
    }
  }
}

let timeout;
window.addEventListener('scroll', () => {
  clearTimeout(timeout);
  timeout = setTimeout(handleStickyForCompareWindow, 50);
});

handleStickyForCompareWindow();
