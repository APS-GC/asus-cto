/**
 * API Service
 * Provides centralized API calls for fetching data across the application
 * Similar pattern to blocks/product-card/product-card.js
 */

import { API_URIS } from '../constants/api-constants.js';

/**
 * Get full API endpoint URL
 * @param {string} uri - API URI path
 * @returns {string} - Full endpoint URL
 */
export function getApiEndpoint(uri) {
  // TODO: Replace hardcoded base URL with getConfigValue() when configs are ready
  // const baseUrl = await getConfigValue('api-base-url');
  const baseUrl = 'https://publish-p165753-e1767020.adobeaemcloud.com';
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
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
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
export async function fetchHotProducts(maxProducts = null, config = {}) {
  const endpoint = getApiEndpoint(API_URIS.FETCH_HOT_PRODUCTS, config);
  return fetchProductData(endpoint, maxProducts);
}

