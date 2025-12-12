/**
 * Back to Top Button functionality
 * Handles smooth scrolling to top and visibility based on scroll position
 */

class BackToTop {
  constructor() {
    this.button = document.getElementById('backToTop');
    this.scrollThreshold = 800; // Show button after scrolling 800px
    this.isVisible = false;
  }

  init() {
    if (!this.button) {
      return;
    }

    // Bind event listeners
    this.button.addEventListener('click', this.scrollToTop.bind(this));
    window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 100));

    // Initial check
    this.handleScroll();
  }

  /**
   * Smooth scroll to top of page
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Handle scroll events to show/hide button
   */
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldShow = scrollTop > this.scrollThreshold;

    if (shouldShow && !this.isVisible) {
      this.showButton();
    } else if (!shouldShow && this.isVisible) {
      this.hideButton();
    }
  }

  /**
   * Show the back to top button
   */
  showButton() {
    this.button.classList.add('visible');
    this.isVisible = true;
  }

  /**
   * Hide the back to top button
   */
  hideButton() {
    this.button.classList.remove('visible');
    this.isVisible = false;
  }

  /**
   * Throttle function to limit scroll event frequency
   */
  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const backToTop = new BackToTop();
  backToTop.init();

  const compareBar = document.querySelector('.cmp-product-compare');
  const button = document.getElementById('backToTop');

  if (compareBar && button) {
    const updateButtonPosition = () => {
      const compareBarHeight = compareBar.classList.contains('is-hidden')
        ? 0
        : compareBar.offsetHeight;

      button.style.bottom = `${compareBarHeight + 30}px`;
      button.style.zIndex = '1100';
    };

    updateButtonPosition();

    const observer = new MutationObserver(updateButtonPosition);
    observer.observe(compareBar, { attributes: true, attributeFilter: ['class'] });
  }

  // Footer newsletter subscription
  {
    const newsletterForm = document.getElementById('frm-footer-newsletter');

    if (!newsletterForm) return;

    const responseElement = newsletterForm.querySelector('.newsletter__response');
    const emailInput = newsletterForm.querySelector('[name="email"]');

    // Strict + user-friendly regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/;

    // Submit handler
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let email = emailInput.value.trim();

      // Browser validation + regex validation
      if (!emailInput.checkValidity() || !emailRegex.test(email)) {
        newsletterForm.classList.add('has--error');
        responseElement.textContent = 'Please enter a valid email address';
        return;
      }

      // reset UI
      newsletterForm.classList.remove('has--error');
      responseElement.textContent = '';

      // Call external subscription handler
      window.triggerSubscribeForm?.(email);
    });
  }
});
