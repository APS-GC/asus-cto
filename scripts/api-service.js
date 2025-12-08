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

/**
 * Sort options mapping
 */
const SORT_OPTIONS = {
  'best-performance': 'best performance',
  'price-low-high': 'price low to high',
  'price-high-low': 'price high to low',
  ratings: 'ratings',
  'best-selling': 'best selling',
};

/**
 * Fetches filtered products from the API
 * @param {Object} options - Filter options
 * @param {string} options.websiteCode - Website code (default: 'us')
 * @param {Array<string>} options.itemsId - Filter item IDs
 * @param {string} options.sort - Sort option key
 * @param {number} options.pageSize - Items per page (default: 9)
 * @param {number} options.pageOffset - Pagination offset (default: 0)
 * @returns {Promise<Object>} - { total, pageOffset, pageSize, results }
 */
export async function fetchFilteredProducts(options = {}) {
  const {
    websiteCode = 'us',
    itemsId = [],
    sort = 'best-performance',
    pageSize = 6,
    pageOffset = 0,
  } = options;

  const endpoint = await getApiEndpoint(API_URIS.FILTER_PRODUCTS);

  // Build query parameters
  const params = new URLSearchParams();
  params.set('websiteCode', websiteCode);
  params.set('sort', SORT_OPTIONS[sort] || SORT_OPTIONS['best-performance']);
  params.set('pageSize', String(pageSize));
  params.set('pageOffset', String(pageOffset));

  // Add filter item IDs if provided
  if (itemsId.length > 0) {
    params.set('itemsId', itemsId.join(','));
  }

  const fullUrl = `${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(fullUrl, {
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

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`API returned non-JSON content: ${contentType}`);
    }

    const data = await response.json();

    return {
      total: data.total || 0,
      pageOffset: data.pageOffset || 0,
      pageSize: data.pageSize || pageSize,
      results: data.results || [],
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching filtered products:', error);
    return {
      total: 0,
      pageOffset: 0,
      pageSize,
      results: [],
    };
  }
}

/**
 * Fetches filter options from the API
 * @param {Object} options - Options for fetching filters
 * @param {string} options.websiteCode - Website code (default: 'us')
 * @returns {Promise<Array>} - Array of filter group objects
 */
export async function fetchFilters(options = {}) {
  const {
    websiteCode = 'us',
  } = options;

  const endpoint = await getApiEndpoint(API_URIS.FETCH_FILTERS);

  // Build query parameters
  const params = new URLSearchParams();
  params.set('websiteCode', websiteCode);

  const fullUrl = `${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(fullUrl, {
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

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`API returned non-JSON content: ${contentType}`);
    }

    const data = await response.json();

    if (data.status !== 200 || data.message !== 'OK') {
      throw new Error('Invalid API response');
    }

    // Return the filter groups from the API response
    return data.results?.chooseItem?.groups || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching filters:', error);
    return [];
  }
}

/**
 * Fetches a list of games from a specified API endpoint, with fallback options and a timeout.
 * @param {string} [endpoint] - The API endpoint to fetch the game list from.
 * @param {number} [maxProducts] - The maximum number of products to return.
 */
export async function fetchGameList(
  endpoint = 'https://publish-p165753-e1767020.adobeaemcloud.com/bin/asuscto/gameList.json?websiteCode=en',
  timeoutMs = 5000,
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
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      mode: 'cors',
      signal,
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

/**
 * Call SSO validation API
 * @param {string} type - Validation type, e.g. 'check' 'user' 'logout'
 * @param {string} aticket
 * @returns {Promise<Object>} API response data
 */
export async function callSSOValidation(type='check', aticket) {
  const domain = await getConfigValue('sso-endpoint-dev');
  const ssoEndpoint = domain+'/api/v1/web/sso-api/sso';
  const url = `${ssoEndpoint}`;
  try {
    const response = await fetch(url, {
      method:"POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body:JSON.stringify({type,ticket:aticket}),
      mode: 'cors',
      timeout: 30000,
    });
    return await response.json();
  } catch (error) {
    console.error("SSO API call error:", error.message);
    throw new Error(`SSO validation failed: ${error.message}`);
  }
}