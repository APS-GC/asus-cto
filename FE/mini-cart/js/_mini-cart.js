import { fetchData } from '../../../site/scripts/_api';
export class MiniCart {
  constructor() {
    this.toggleBtn = document.querySelector('#mini-cart-toggle');
    this.miniCartContainer = document.querySelector('#mini-cart-container');
    this.title = document.querySelector('#mini-cart-title');
    this.scrollY = 0;
  }

  async init(loggedIn = false) {
    if (!this.toggleBtn || !this.miniCartContainer) return;

    // Render initial cart
    const miniCartHTML = await this.renderMiniCart(loggedIn);
    this.miniCartContainer.insertAdjacentHTML('beforeend', miniCartHTML);

    //toggle on clicking cart icon
    this.toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    //closing on clicking close icon
    this.miniCartContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('mini-cart__close')) {
        e.preventDefault();
        this.close();
      }
    });
  }

  //fetching products from json
  async fetchProducts() {
    try {
      return await fetchData(`mini-cart.json`);
    } catch (err) {
      console.error('Error loading products:', err);
      return [];
    }
  }

  //rendering cart
  async renderMiniCart(loggedIn) {
    if (!loggedIn) {
      this.toggleBtn.removeAttribute('total-items');
      this.title.innerHTML = 'Your cart is empty.';
      return `
        <p class="mini-cart__message"><a href="/">Sign in</a>to see if you have any saved items</p>
      `;
    } else {
      const products = await this.fetchProducts();
      if (!products.length) {
        this.toggleBtn.removeAttribute('total-items');
        this.title.innerHTML = 'Your cart is empty.';
        return `
            <p class="mini-cart__message">Shop to add the first item</p>
        `;
      } else {
        const cartItemsHtml = products.map((product) => this.renderCartItems(product)).join('');
        const subtotal = products.reduce((sum, p) => sum + p.quantity * parseFloat(p.price), 0);
        this.toggleBtn.setAttribute('total-items', products.length);
        this.title.innerHTML = `${products.length} items in cart`;
        return `
          <ul class="cart-items flex" role="list">${cartItemsHtml}</ul>
          <div class="subtotal flex">
          <p>Subtotal</p>
          <p class="text-bolder subtotal-amount" aria-live="polite">$ ${subtotal.toFixed(2)}</p>
          </div>
          <div class="checkout-btn">
          <button class="btn" aria-label="View Cart and Checkout">View Cart & Checkout</button>
          </div>
        `;
      }
    }
  }

  //rendering cart items
  renderCartItems(product) {
    const { name, image, price, quantity, description } = product;
    let descriptionHTML = '';
    if (product.description) {
      descriptionHTML = `<small>${description}</small>`;
    }
    return `
      <li class="cart-item flex" role="listitem" tabindex="0" aria-label="${name}">
        <div class="img-wrapper">
          <img src="${image}" alt="${name}">
        </div>
        <div class="product-info-container flex">
          <div class="product-info">
            <h6>${name}</h6>
            ${descriptionHTML}
          </div>
          <div class="price-info flex">
            <strong aria-label="Quantity">x${quantity}</strong>
            <strong aria-label="Price">$ ${price}</strong>
          </div>
        </div>
      </li>
    `;
  }

  //disabling main window scroll
  _disableScroll() {
    if (window.innerWidth <= 768) {
      this.scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollY}px`;
      document.body.style.width = '100%';
    }
  }

  //enabling again after closing the mini-cart
  _enableScroll() {
    if (window.innerWidth <= 768) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, this.scrollY);
    }
  }
  toggle() {
    const isOpen = this.miniCartContainer.getAttribute('aria-hidden') === 'false';
    if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.miniCartContainer.setAttribute('aria-hidden', 'false');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this._disableScroll();
  }

  close() {
    this.miniCartContainer.setAttribute('aria-hidden', 'true');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
    this._enableScroll();
  }
}
