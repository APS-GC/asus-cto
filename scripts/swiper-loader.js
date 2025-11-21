/**
 * Swiper Dynamic Loader
 * Loads Swiper library on-demand to improve initial page load performance
 */

import { loadScript, loadCSS } from './aem.js';

let swiperPromise = null;
let swiperCSSLoaded = false;

/**
 * Dynamically loads Swiper library from CDN
 * @returns {Promise<Object>} Promise that resolves with Swiper constructor
 */
export async function loadSwiper() {
  // Return immediately if Swiper is already loaded
  if (window.Swiper) {
    return window.Swiper;
  }
  
  // Return existing promise if load is in progress
  if (!swiperPromise) {
    console.log('Swiper: Starting dynamic load (JS + CSS) [Call ID: ' + Date.now() + ']');
    
    swiperPromise = (async () => {
      try {
        await Promise.all([
          // Load CSS once
          !swiperCSSLoaded ? loadCSS('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css').then(() => {
            swiperCSSLoaded = true;
            console.log('Swiper CSS loaded');
          }) : Promise.resolve(),
          // Load JS
          loadScript(
            'https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.js',
            {
              integrity: 'sha512-Ysw1DcK1P+uYLqprEAzNQJP+J4hTx4t/3X2nbVwszao8wD+9afLjBQYjz7Uk4ADP+Er++mJoScI42ueGtQOzEA==',
              crossorigin: 'anonymous',
              referrerpolicy: 'no-referrer'
            }
          )
        ]);
        console.log('Swiper loaded dynamically (CSS + JS)');
        return window.Swiper;
      } catch (error) {
        console.error('Failed to load Swiper library:', error);
        swiperPromise = null; // Reset on error so retry is possible
        throw error;
      }
    })(); // IIFE (Immediately Invoked Function Expression) creates promise synchronously
  } else {
    console.log('Swiper: Reusing existing load promise');
  }
  
  return swiperPromise;
}

