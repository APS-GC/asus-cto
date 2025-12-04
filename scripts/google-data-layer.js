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
 * @param {Array} promotions - Array of promotion objects with id, name, and position
 * Example: [{id: 'PROMO_1234', name: 'Summer Sale', position: 'hero_banner_1_1'}]
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
          position: promo.position
        }))
      }
    }
  });
}

/**
 * Enhanced Ecommerce: Track promotion click
 * @param {Object} promotion - Promotion object with id, name, and position
 * Example: {id: 'PROMO_1234', name: 'Summer Sale', position: 'hero_banner_1_1'}
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
          position: promotion.position
        }]
      }
    }
  });
}
