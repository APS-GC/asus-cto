  import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'featured-product-card';
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
        // Second cell contains category/label
        const textContent = cell.textContent.trim();
        if (textContent) {
          const label = document.createElement('h3');
          label.className = 'label';
          label.textContent = textContent;
          productInfo.append(label);
        }
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
        // Fourth cell contains the CTA link
        const link = cell.querySelector('a');
        if (link) {
          const ctaWrapper = document.createElement('div');
          ctaWrapper.className = 'cta-wrapper';
          
          link.className = 'cta';
          link.setAttribute('aria-label', `View configurations for ${productInfo.querySelector('.title')?.textContent || 'product'}`);
          
          // Add arrow icon
          const arrowIcon = document.createElement('span');
          arrowIcon.className = 'icon icon--arrow-wide-right';
          link.append(' ', arrowIcon);
          
          ctaWrapper.append(link);
          productInfo.append(ctaWrapper);
        }
      }
    });
    
    li.append(productImageWrapper, productInfo);
    ul.append(li);
  });
  
  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '240' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  
  block.textContent = '';
  block.append(ul);
}
