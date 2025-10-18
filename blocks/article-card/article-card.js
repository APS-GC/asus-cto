import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    
    // Create article card structure
    const articleCard = document.createElement('a');
    articleCard.className = 'article-card-link';
    
    // Process each cell in the row
    const cells = [...row.children];
    let imageCell, dateCell, titleCell, descriptionCell, linkCell;
    
    // Map cells based on expected order: image, date, title, description, link
    if (cells.length >= 5) {
      [imageCell, dateCell, titleCell, descriptionCell, linkCell] = cells;
    } else if (cells.length === 4) {
      // If no separate date cell, use current date
      [imageCell, titleCell, descriptionCell, linkCell] = cells;
    }
    
    // Extract link URL and set up the anchor
    if (linkCell) {
      const linkElement = linkCell.querySelector('a');
      if (linkElement) {
        articleCard.href = linkElement.href;
        articleCard.setAttribute('aria-label', `Read article: ${titleCell?.textContent?.trim() || 'Article'}`);
      }
    }
    
    // Create image section
    if (imageCell && imageCell.querySelector('picture')) {
      const imageDiv = document.createElement('div');
      imageDiv.className = 'article-card-image';
      const picture = imageCell.querySelector('picture');
      imageDiv.appendChild(picture);
      articleCard.appendChild(imageDiv);
      
      // Optimize the image
      const img = picture.querySelector('img');
      if (img) {
        const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
        moveInstrumentation(img, optimizedPic.querySelector('img'));
        picture.replaceWith(optimizedPic);
      }
    }
    
    // Create content section
    const contentDiv = document.createElement('div');
    contentDiv.className = 'article-card-content';
    
    // Add date
    if (dateCell && dateCell.textContent.trim()) {
      const dateP = document.createElement('p');
      dateP.className = 'article-card-date';
      const time = document.createElement('time');
      time.textContent = dateCell.textContent.trim();
      dateP.appendChild(time);
      contentDiv.appendChild(dateP);
    }
    
    // Add title
    if (titleCell && titleCell.textContent.trim()) {
      const titleH3 = document.createElement('h3');
      titleH3.className = 'article-card-title';
      titleH3.textContent = titleCell.textContent.trim();
      contentDiv.appendChild(titleH3);
    }
    
    // Add description
    if (descriptionCell && descriptionCell.textContent.trim()) {
      const descDiv = document.createElement('div');
      descDiv.className = 'article-card-desc';
      descDiv.innerHTML = descriptionCell.innerHTML;
      contentDiv.appendChild(descDiv);
    }
    
    articleCard.appendChild(contentDiv);
    li.appendChild(articleCard);
    ul.appendChild(li);
  });
  
  block.textContent = '';
  block.append(ul);
}
