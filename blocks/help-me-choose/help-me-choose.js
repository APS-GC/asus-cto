import { loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchGameList, getApiEndpoint } from '../../scripts/api-service.js';
import { API_URIS } from '../../constants/api-constants.js';
import { loadSwiper } from '../../scripts/swiper-loader.js';

/**
 * Decorates the help-me-choose block, initializing the carousel and form.
 * @param {Element} block - The block element to decorate.
 * @returns {Promise<void>}
 */
export default async function decorate(block) {
  try {

  } catch (error) {
    console.error('Error loading product cards:', error);
    block.innerHTML = '<div class="product-card-error">Error loading products. Please try again later.</div>';
  }
}

