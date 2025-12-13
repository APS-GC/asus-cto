/**
 * Lazy Carousel Loader
 * Delays carousel initialization for below-the-fold carousels to improve TBT
 */

import { loadSwiper } from './scripts.js';

let swiperLoaded = false;
let pendingCarousels = [];
let carouselModule = null;

/**
 * Lazy load carousel initialization
 * Only initializes carousels when they're near the viewport
 */
export async function initializeLazyCarousels() {
  // Intersection Observer to detect when carousels are near viewport
  const carouselObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const carousel = entry.target;
          
          // Stop observing this carousel
          carouselObserver.unobserve(carousel);
          
          // Initialize the carousel
          await initializeCarousel(carousel);
        }
      });
    },
    {
      // Start loading when carousel is 200px away from viewport
      rootMargin: '200px 0px',
      threshold: 0.01
    }
  );

  // Find all carousels that haven't been initialized yet
  const carousels = document.querySelectorAll('.carousel:not([data-carousel-initialized])');
  
  carousels.forEach((carousel, index) => {
    // Mark carousel as pending initialization
    carousel.setAttribute('data-carousel-pending', 'true');
    
    // First carousel (above-the-fold): initialize immediately
    if (index === 0) {
      requestAnimationFrame(() => {
        initializeCarousel(carousel);
      });
    } else {
      // Below-the-fold carousels: use intersection observer
      carouselObserver.observe(carousel);
    }
  });
}

/**
 * Initialize a single carousel instance
 * @param {HTMLElement} carousel - Carousel container element
 */
async function initializeCarousel(carousel) {
  if (carousel.hasAttribute('data-carousel-initialized')) {
    return; // Already initialized
  }
  
  try {
    // Ensure Swiper is loaded (only loads once)
    if (!swiperLoaded) {
      await loadSwiper();
      swiperLoaded = true;
    }
    
    // Ensure carousel.js module is loaded (only loads once)
    if (!carouselModule) {
      carouselModule = await import('./carousel.js');
    }
    
    // Initialize this carousel using the global function
    if (window.initializeSwiperOnAEMCarousel) {
      window.initializeSwiperOnAEMCarousel(carousel);
    }
    
    // Mark as initialized
    carousel.setAttribute('data-carousel-initialized', 'true');
    carousel.removeAttribute('data-carousel-pending');
  } catch (error) {
    console.error('Failed to initialize carousel:', error);
  }
}

/**
 * Force initialize a specific carousel (for programmatic use)
 * @param {HTMLElement} carousel - Carousel container element
 */
export async function forceInitializeCarousel(carousel) {
  await initializeCarousel(carousel);
}

// Export for use in blocks
export { initializeCarousel };

