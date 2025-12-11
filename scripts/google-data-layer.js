import { getConfigValue } from "./configs.js";

/**
 * Loads ASUS official Google Tag Manager container.
 */
export async function loadGTM() {
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  
  // Load GTM script
  const script = document.createElement('script');
  const gtmID = await getConfigValue('GTM-ID') || '';
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmID}`;
  script.async = true;
  document.head.appendChild(script);
}

/**
 * Send basic page load event to data layer
 */
export async function sendPageLoadAttributes() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'page_view',
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
}

/**
 * Enhanced Ecommerce: Track promotion view
 * @param {Array} promotions - Array of promotion objects with id, name, position, and order
 * Example: [{id: 'PROMO_1234', name: 'Summer Sale', position: 'hero_banner_1', order: '1'}]
 */
export function trackPromotionView(promotions) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'promotionView',
    ecommerce: {
      promoView: {
        promotions: promotions.map(promo => ({
          id: promo.id || promo.imageUrl,
          name: promo.name || promo.title,
          position: `${promo.position}_${promo.order}`
        }))
      }
    }
  });
}

/**
 * Enhanced Ecommerce: Track promotion click
 * @param {Object} promotion - Promotion object with id, name, position, and order
 * Example: {id: 'PROMO_1234', name: 'Summer Sale', position: 'hero_banner_1', order: '2'}
 */
export function trackPromotionClick(promotion) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'promotionClick',
    ecommerce: {
      promoClick: {
        promotions: [{
          id: promotion.id || promotion.imageUrl,
          name: promotion.name || promotion.title,
          position: `${promotion.position}_${promotion.order}`
        }]
      }
    }
  });
}

/**
 * Generic tracking function - send any event to data layer
 * @param {Object} params - Tracking parameters
 * @param {string} params.eventName - GA4 event name (e.g., 'nvgt_l_hot_products_home_cto_rog')
 * @param {string} params.category - Event category (e.g., 'hot_products/home/cto/rog')
 * @param {string} params.label - Event label (e.g., 'last_button/hot_products/home/cto/rog')
 */
export function trackEvent({ eventName, category, label }) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'data_layer_event',
    event_name_ga4: eventName,
    event_category_DL: category,
    event_action_DL: 'clicked',
    event_label_DL: label,
    event_value_DL: ''
  });
}
