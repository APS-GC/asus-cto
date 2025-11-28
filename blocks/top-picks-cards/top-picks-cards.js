import { createOptimizedPicture } from '../../scripts/scripts.js';
import { getBlockConfigs, getBlockFieldOrder } from '../../scripts/configs.js';

// Default values from authoring configuration
const DEFAULT_CONFIG = {
  image: '',
  label: 'Top picks',
  title: '',
  ctaLinkName: 'View configs',
  link: ''
};

/**
 * Helper function to escape HTML special characters
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generates HTML for a single product card
 * @param {Object} cardData - The card data
 * @returns {string} - The HTML string for the card
 */
function generateCardHTML(cardData) {
  const { imageSrc, imageAlt, label, title, ctaText, ctaUrl, ctaAriaLabel } = cardData;
  
  return `
    <div class="aem-GridColumn aem-GridColumn--default--6 aem-GridColumn--phone--12">
      <div class="featured-product-card" style="height: 190px;">
        <div class="product-image-wrapper">
          <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(imageAlt)}" class="product-image">
        </div>
        <div class="product-info">
          <h3 class="label">${escapeHtml(label)}</h3>
          <h4 class="title">${escapeHtml(title)}</h4>
          <div class="cta-wrapper"><a href="${escapeHtml(ctaUrl)}" class="cta" aria-label="${escapeHtml(ctaAriaLabel)}">${escapeHtml(ctaText)} <span class="icon icon--arrow-wide-right"></span></a></div>
        </div>
      </div>
    </div>`;
}

/**
 * Parses card data from a row based on field order from block definition
 * @param {HTMLElement} row - The row element to parse
 * @param {Array<string>} fieldOrder - Array of field names in order
 * @param {Object} config - Configuration object with default values
 * @returns {Object} - Parsed card data
 */
function parseCardData(row, fieldOrder, config) {
  const cardData = {
    imageSrc: '',
    imageAlt: '',
    label: config.label,
    title: '',
    ctaText: config.ctaLinkName,
    ctaUrl: '#'
  };

  const cells = [...row.children];
  
  cells.forEach((cell, index) => {
    const fieldName = fieldOrder[index] || '';
    
    switch (fieldName) {
      case 'image':
        // First cell contains the image
        const picture = cell.querySelector('picture');
        if (picture) {
          const img = picture.querySelector('img');
          if (img) {
            cardData.imageSrc = img.src;
            cardData.imageAlt = img.alt || 'Product image';
          }
        }
        break;
        
      case 'label':
        // Second cell contains category/label
        const labelText = cell.textContent.trim();
        if (labelText) {
          cardData.label = labelText;
        }
        break;
        
      case 'title':
        // Third cell contains title
        const titleText = cell.textContent.trim();
        if (titleText) {
          cardData.title = titleText;
        }
        break;
        
      case 'ctaLinkName':
        // Fourth cell contains the CTA link name
        const ctaText = cell.textContent.trim();
        if (ctaText) {
          cardData.ctaText = ctaText;
        }
        break;
        
      case 'link':
        // Fifth cell contains the CTA link URL
        const link = cell.querySelector('a');
        if (link) {
          cardData.ctaUrl = link.href;
        }
        break;
        
      default:
        break;
    }
  });
  
  // Generate aria-label
  cardData.ctaAriaLabel = `View configurations for ${cardData.title}`;
  
  return cardData;
}

export default async function decorate(block) {
  // Get configuration using getBlockConfigs
  const config = await getBlockConfigs(block, DEFAULT_CONFIG, 'top-picks-cards');
  
  // Load field order from block definition
  const fieldOrder = await getBlockFieldOrder('top-picks-cards');
  
  // Fallback to default field order if JSON not found
  const finalFieldOrder = fieldOrder.length > 0 
    ? fieldOrder 
    : ['image', 'label', 'title', 'ctaLinkName', 'link'];
  
  // Extract data from authored content
  const cards = [];
  
  [...block.children].slice(0, 2).forEach((row) => {
    const cardData = parseCardData(row, finalFieldOrder, config);
    cards.push(cardData);
  });
  
  // Generate the HTML structure
  const gridHTML = `
    <div class="aem-Grid aem-Grid--12 aem-Grid--custom-spacing-default">
      ${cards.map(card => generateCardHTML(card)).join('\n')}
    </div>`;
  
  // Clear the block and insert the new HTML
  block.textContent = '';
  block.innerHTML = gridHTML;
  
  // Optimize images after insertion
  block.querySelectorAll('img.product-image').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '130' }]);
    const newImg = optimizedPic.querySelector('img');
    if (newImg) {
      newImg.className = 'product-image';
      img.replaceWith(newImg);
    }
  });
}
