/**
 * API Service
 * Provides centralized API calls for fetching data across the application
 * Similar pattern to blocks/product-card/product-card.js
 */

import { API_URIS } from '../constants/api-constants.js';
import { getConfigValue } from './configs.js';

/**
 * Get full API endpoint URL
 * @param {string} uri - API URI path
 * @returns {Promise<string>} - Full endpoint URL
 */
export async function getApiEndpoint(uri) {
  const baseUrl = await getConfigValue('api-endpoint') || 'https://publish-p165753-e1767020.adobeaemcloud.com';
  return baseUrl + uri;
}

/**
 * Generic fetch function to make API calls
 * @param {string} endpoint - API endpoint URL
 * @param {number} maxProducts - Maximum number of products to return (null for all)
 * @returns {Promise<Array>} - Array of product objects
 */
export async function fetchProductData(endpoint, maxProducts = null) {
  if (!endpoint) {
    throw new Error('No endpoint provided');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`API returned non-JSON content: ${contentType}`);
    }

    const data = await response.json();

    // Handle different response formats
    let results = [];
    if (data.results && data.results.items && Array.isArray(data.results.items)) {
      // Handle API format: { results: { items: [...] } }
      results = data.results.items;
    } else if (data.results && Array.isArray(data.results)) {
      // Handle format: { results: [...] }
      results = data.results;
    } else if (Array.isArray(data)) {
      // Handle format: [...]
      results = data;
    } else {
      throw new Error('Invalid API response format');
    }

    // Only limit if maxProducts is specified
    return maxProducts ? results.slice(0, maxProducts) : results;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fetches hot products from the API
 * @param {number} maxProducts - Maximum number of products to return
 * @param {object} config - Configuration object (optional)
 * @returns {Promise<Array>} - Array of hot product objects
 */
export async function fetchHotProducts(maxProducts = null, config = {}) { // eslint-disable-line no-unused-vars
  const endpoint = await getApiEndpoint(API_URIS.FETCH_HOT_PRODUCTS);
  return fetchProductData(endpoint, maxProducts);
}

function isNotEmptyObject(obj) {
  if (!obj || typeof obj !== 'object') return false;
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return true;
    }
  }
  return false;
}

/**
 * Fetches a list of games from a specified API endpoint, with fallback options and a timeout.
 * @param {string} [endpoint] - The API endpoint to fetch the game list from.
 * @param {number} [maxProducts] - The maximum number of products to return.
 */
export async function fetchGameList(
  endpoint = 'https://publish-p165753-e1767020.adobeaemcloud.com/bin/asuscto/gameList.json?websiteCode=en',
  mode = 'GET',
  params = {},
  timeoutMs = 5000
) {

  const controller = new AbortController();
  const signal = controller.signal;

  // Set a timeout to abort the fetch
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    // eslint-disable-next-line no-console
    console.log(`Attempting to fetch from: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: mode,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      mode: 'cors',
      signal,
      body: isNotEmptyObject(params) ? JSON.stringify(params) : null,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      // eslint-disable-next-line no-console
      console.warn(`Fetch aborted (timeout after ${timeoutMs} ms)`);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Error fetching from ${endpoint}:`, error.message);
      if (error.message.includes('JSON')) {
        // eslint-disable-next-line no-console
        console.warn('Likely non-JSON response');
      }
    }

    return []; // fallback
  }
}
