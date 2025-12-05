/**
 * Loads ASUS official Google Tag Manager container.
 * GTM Container ID: GTM-N8KDRJVJ
 */
export async function loadGTM() {
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  
  // Load GTM script
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-N8KDRJVJ';
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
 * Get page path suffix for tracking (e.g., "/home/cto/rog")
 * Always returns "/home/cto/rog" for consistent tracking
 */
function getPagePathSuffix() {
  return '/home/cto/rog';
}

/**
 * Generic Custom Data Layer Event Tracker
 * @param {Object} params - Tracking parameters
 * @param {string} params.eventName - GA4 event name (e.g., 'cta_banner_home_cto_rog')
 * @param {string} params.eventType - Type of interaction (e.g., 'cta', 'indicator', 'button')
 * @param {string} params.componentPosition - Component position (e.g., 'hero_banner_1_1', 'card_2_3')
 * @param {string} params.actionDetail - Detail about the action (e.g., button text, slide number)
 * @param {string} [params.action='clicked'] - Action type (default: 'clicked')
 * @param {string} [params.eventValue=''] - Optional event value
 */
export function trackCustomEvent({ 
  eventName, 
  eventType, 
  componentPosition, 
  actionDetail, 
  action = 'clicked',
  eventValue = '' 
}) {
  const pagePath = getPagePathSuffix();
  const category = `${eventType}/${componentPosition}${pagePath}`;
  const label = `${actionDetail}/${eventType}/${componentPosition}${pagePath}`;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'data_layer_event',
    event_name_ga4: eventName,
    event_category_DL: category,
    event_action_DL: action,
    event_label_DL: label,
    event_value_DL: eventValue
  });
}

/**
 * Convenience function: Track CTA click (any component)
 * @param {Object} params - Tracking parameters
 * @param {string} params.componentPosition - Component position (e.g., "hero_banner_1_1", "card_2_3")
 * @param {string} params.buttonText - CTA button text
 * @param {string} [params.eventName] - Custom event name (auto-generated if not provided)
 */
export function trackCTAClick({ componentPosition, buttonText, eventName }) {
  const defaultEventName = eventName || 'cta_banner_home_cto_rog';
  
  trackCustomEvent({
    eventName: defaultEventName,
    eventType: 'cta',
    componentPosition,
    actionDetail: buttonText
  });
}

/**
 * Convenience function: Track indicator/pagination click (any component)
 * @param {Object} params - Tracking parameters
 * @param {string} params.componentPosition - Component position (e.g., "hero_banner_1_1", "carousel_2_1")
 * @param {string} params.indicatorAction - Indicator action (e.g., "1", "2", "play", "pause")
 * @param {string} [params.eventName] - Custom event name (auto-generated if not provided)
 */
export function trackIndicatorClick({ componentPosition, indicatorAction, eventName }) {
  const defaultEventName = eventName || 'indicator_banner_home_cto_rog';
  
  trackCustomEvent({
    eventName: defaultEventName,
    eventType: 'indicator',
    componentPosition,
    actionDetail: indicatorAction
  });
}

/**
 * Track product card click (for top-picks, latest-creation, etc.)
 * @param {Object} params - Tracking parameters
 * @param {string} params.cardType - Type of card (e.g., 'latest_creation', 'top_picks')
 * @param {string} params.productName - Product name/title
 */
export function trackProductCardClick({ cardType, productName }) {
  const pagePath = getPagePathSuffix();
  const eventName = `${cardType}_home_cto_rog`;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'data_layer_event',
    event_name_ga4: eventName,
    event_category_DL: `${cardType}${pagePath}`,
    event_action_DL: 'clicked',
    event_label_DL: `${productName}/${cardType}${pagePath}`,
    event_value_DL: ''
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

// Legacy aliases for backward compatibility
export const trackCTABannerClick = ({ bannerPosition, buttonText, eventName }) => 
  trackCTAClick({ componentPosition: bannerPosition, buttonText, eventName });

export const trackIndicatorBannerClick = ({ bannerPosition, indicatorAction, eventName }) => 
  trackIndicatorClick({ componentPosition: bannerPosition, indicatorAction, eventName });
