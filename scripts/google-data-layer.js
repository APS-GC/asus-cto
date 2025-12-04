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
