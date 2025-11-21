import { moveInstrumentation, createOptimizedPicture } from '../../scripts/scripts.js';

// Default values from authoring configuration
const DEFAULT_VALUES = {
  label: 'Top picks',
  ctaLinkName: 'View configs'
};

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'top-picks-card';
    moveInstrumentation(row, li);
    
    // Create the product image wrapper
    const productImageWrapper = document.createElement('div');
    productImageWrapper.className = 'product-image-wrapper';
    
    // Create the product info section
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    // Process each cell in the row
    [...row.children].forEach((cell, index) => {
      if (index === 0 && cell.querySelector('picture')) {
        // First cell contains the image
        const picture = cell.querySelector('picture');
        if (picture) {
          const img = picture.querySelector('img');
          if (img) {
            img.className = 'product-image';
            img.alt = img.alt || 'Product image';
          }
          productImageWrapper.append(picture);
        }
      } else if (index === 1) {
        // Second cell contains category/label - apply default if empty
        const textContent = cell.textContent.trim();
        const labelText = textContent || DEFAULT_VALUES.label;
        const label = document.createElement('h3');
        label.className = 'label';
        label.textContent = labelText;
        productInfo.append(label);
      } else if (index === 2) {
        // Third cell contains title
        const textContent = cell.textContent.trim();
        if (textContent) {
          const title = document.createElement('h4');
          title.className = 'title';
          title.textContent = textContent;
          productInfo.append(title);
        }
      } else if (index === 3) {
        // Fourth cell contains the CTA link name - apply default if empty
        const ctaLinkName = cell.textContent.trim() || DEFAULT_VALUES.ctaLinkName;
        // Store the CTA link name for use in the next cell
        li.dataset.ctaLinkName = ctaLinkName;
      } else if (index === 4) {
        // Fifth cell contains the CTA link URL
        const link = cell.querySelector('a');
        if (link) {
          const ctaWrapper = document.createElement('div');
          ctaWrapper.className = 'cta-wrapper';
          
          link.className = 'cta';
          
          // Use the CTA link name from the previous cell, or fallback to existing text, or use default
          const ctaLinkName = li.dataset.ctaLinkName || link.textContent.trim() || DEFAULT_VALUES.ctaLinkName;
          link.textContent = ctaLinkName;
          
          link.setAttribute('aria-label', `${ctaLinkName} for ${productInfo.querySelector('.title')?.textContent || 'product'}`);
          
          // Add arrow icon
          const arrowIcon = document.createElement('span');
          arrowIcon.className = 'icon icon--arrow-wide-right';
          link.append(' ', arrowIcon);
          
          ctaWrapper.append(link);
          productInfo.append(ctaWrapper);
        }
        // Clean up the temporary data attribute
        delete li.dataset.ctaLinkName;
      }
    });
    
    li.append(productImageWrapper, productInfo);
    ul.append(li);
  });
  
  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '240' }]);
    const newImg = optimizedPic.querySelector('img');
    moveInstrumentation(img, newImg);
    // Preserve the className from the original img
    if (img.className) {
      newImg.className = img.className;
    }
    img.closest('picture').replaceWith(optimizedPic);
  });
  
  block.textContent = '';
  block.append(ul);
}
