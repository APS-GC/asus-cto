import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    
    // Structure the top pick item
    [...li.children].forEach((div, index) => {
      if (index === 0 && div.querySelector('picture')) {
        div.className = 'top-pick-image';
      } else if (index === 1) {
        div.className = 'top-pick-content';
        
        // Add category label if first element is text
        const firstP = div.querySelector('p:first-child');
        if (firstP && !firstP.querySelector('picture')) {
          firstP.className = 'top-pick-category';
        }
        
        // Style the title
        const titleElement = div.querySelector('h1, h2, h3, h4, h5, h6');
        if (titleElement) {
          titleElement.className = 'top-pick-title';
        }
        
        // Style the link
        const linkElement = div.querySelector('a');
        if (linkElement) {
          linkElement.className = 'top-pick-link';
          // Add arrow icon
          linkElement.innerHTML += ' <span class="top-pick-arrow">›</span>';
        }
      }
    });
    
    ul.append(li);
  });
  
  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  
  block.textContent = '';
  block.append(ul);
}
