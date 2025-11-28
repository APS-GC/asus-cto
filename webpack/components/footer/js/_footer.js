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

  const newsletterForm = document.getElementById('frm-footer-newsletter');
  const responseElement = newsletterForm.querySelector('.newsletter__response');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      newsletterForm.classList.remove('has--error', 'has--success');
      responseElement.textContent = '';

      if (!newsletterForm.checkValidity()) {
        newsletterForm.classList.add('has--error');
        responseElement.textContent = 'Please enter a valid email address';
        return;
      }

      const email = newsletterForm.querySelector('[name="email"]').value;
      window.triggerSubscribeForm(email);
    });
  }
});
