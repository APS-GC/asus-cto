import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  
  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    
    // Create article card structure
    const articleCard = document.createElement('a');
    articleCard.className = 'article-card-link';
    
    // Enhanced LCP detection - use multiple strategies with aggressive fallback
    let isLCPCandidate = false;
    
    if (index === 0) {
      // Strategy 1: Check if this is among the first few images on the page
      const totalImages = document.querySelectorAll('img[src]').length;
      const strategy1 = totalImages < 5; // Increased threshold
      
      // Strategy 2: Check if this block is likely above the fold
      const blockRect = block.getBoundingClientRect();
      const isAboveFold = blockRect.top < (window.innerHeight * 0.9); // Increased threshold to 90%
      const strategy2 = isAboveFold;
      
      // Strategy 3: Check if no other eager images exist
      const existingEagerImages = document.querySelectorAll('img[loading="eager"]');
      const strategy3 = existingEagerImages.length === 0;
      
      // Strategy 4: Aggressive fallback - if this is the first article image globally
      const existingArticleImages = document.querySelectorAll('.article-card-image img');
      const strategy4 = existingArticleImages.length === 0;
      
      isLCPCandidate = strategy1 || strategy2 || strategy3 || strategy4;
      
      console.log('Article LCP Detection Strategies:', {
        index,
        strategy1: { condition: `totalImages < 5`, value: totalImages, result: strategy1 },
        strategy2: { condition: `blockTop < 90% viewport`, top: blockRect.top, threshold: window.innerHeight * 0.9, result: strategy2 },
        strategy3: { condition: `no eager images`, eagerCount: existingEagerImages.length, result: strategy3 },
        strategy4: { condition: `first article image`, articleImageCount: existingArticleImages.length, result: strategy4 },
        finalDecision: isLCPCandidate
      });
    }
    
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
        // Use eager loading for LCP candidate, lazy for others
        const optimizedPic = createOptimizedPicture(img.src, img.alt, isLCPCandidate, [{ width: '750' }]);
        moveInstrumentation(img, optimizedPic.querySelector('img'));
        
        // Add fetchpriority="high" for LCP candidate
        if (isLCPCandidate) {
          const lcpImg = optimizedPic.querySelector('img');
          if (lcpImg) {
            lcpImg.setAttribute('fetchpriority', 'high');
            console.log('LCP optimization applied to article image:', img.src);
          }
        }
        
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
