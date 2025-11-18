/**
 * Swiper Dynamic Loader
 * Loads Swiper library on-demand to improve initial page load performance
 */

import { loadScript } from './aem.js';
import { isPerformanceModeEnabled } from './scripts.js';

let swiperPromise = null;

/**
 * Dynamically loads Swiper library from CDN
 * @returns {Promise<Object>} Promise that resolves with Swiper constructor or mock
 */
export async function loadSwiper() {
  // Performance mode: Skip loading third-party scripts, return mock
  if (isPerformanceModeEnabled()) {
    console.log('Swiper: Skipped (Performance mode enabled)');
    // Return a mock Swiper constructor that does nothing
    return function MockSwiper() {
      console.log('Mock Swiper initialized (Performance mode)');
      return {
        on: () => {},
        destroy: () => {},
        update: () => {},
        autoplay: { start: () => {}, stop: () => {} }
      };
    };
  }

  // Return immediately if Swiper is already loaded
  if (window.Swiper) {
    return window.Swiper;
  }
  
  // Return existing promise if load is in progress
  if (!swiperPromise) {
    swiperPromise = loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.js',
      {
        integrity: 'sha512-Ysw1DcK1P+uYLqprEAzNQJP+J4hTx4t/3X2nbVwszao8wD+9afLjBQYjz7Uk4ADP+Er++mJoScI42ueGtQOzEA==',
        crossorigin: 'anonymous',
        referrerpolicy: 'no-referrer'
      }
    ).then(() => {
      // eslint-disable-next-line no-console
      console.log('Swiper loaded dynamically');
      return window.Swiper;
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to load Swiper library:', error);
      throw error;
    });
  }
  
  return swiperPromise;
}

