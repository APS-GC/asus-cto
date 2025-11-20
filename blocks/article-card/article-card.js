import { moveInstrumentation, createOptimizedPicture } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  
  // Global LCP tracking - ensure we optimize the very first article image processed
  if (!window.asusLCPOptimized) {
    window.asusLCPOptimized = false;
  }
  
  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    
    // Create article card structure
    const articleCard = document.createElement('a');
    articleCard.className = 'article-card-link';
    
    // AGGRESSIVE LCP optimization - apply to ALL images in first article-card block
    // AND first few article images globally to ensure we catch the LCP
    let isLCPCandidate = false;
    
    // Check if this is the first article-card block on the page
    const allArticleBlocks = document.querySelectorAll('.article-card, [class*="article-card"]');
    const isFirstArticleBlock = allArticleBlocks.length === 0 || allArticleBlocks[0] === block;
    
    // Apply LCP optimization to:
    // 1. All images in the first article-card block
    // 2. First 2 article images globally
    const globalArticleImageCount = document.querySelectorAll('.article-card-image img').length;
    
    isLCPCandidate = (
      // Strategy 1: All images in first article block
      isFirstArticleBlock ||
      
      // Strategy 2: First 2 article images globally (aggressive)
      globalArticleImageCount < 2 ||
      
      // Strategy 3: If no eager images exist yet
      document.querySelectorAll('img[loading="eager"]').length === 0 ||
      
      // Strategy 4: First image in any article block and viewport check
      (index === 0 && block.getBoundingClientRect().top < window.innerHeight) ||
      
      // Strategy 5: Global fallback - if we haven't optimized any LCP yet
      (!window.asusLCPOptimized && index === 0)
    );
    
    // Mark as optimized if we're applying LCP optimization
    if (isLCPCandidate && !window.asusLCPOptimized) {
      window.asusLCPOptimized = true;
      console.log('GLOBAL LCP OPTIMIZATION: First article image globally optimized');
    }
    
    console.log('AGGRESSIVE Article LCP Detection:', {
      index,
      isFirstArticleBlock,
      globalArticleImageCount,
      blockPosition: block.getBoundingClientRect().top,
      viewportHeight: window.innerHeight,
      eagerImagesCount: document.querySelectorAll('img[loading="eager"]').length,
      finalDecision: isLCPCandidate,
      imageSrc: imageCell?.querySelector('img')?.src
    });
    
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
        // Use eager loading and fetchpriority for LCP candidate
        const optimizedPic = createOptimizedPicture(
          img.src, 
          img.alt, 
          isLCPCandidate, 
          [{ width: '750' }],
          isLCPCandidate ? 'high' : null
        );
        moveInstrumentation(img, optimizedPic.querySelector('img'));
        
        if (isLCPCandidate) {
          const lcpImg = optimizedPic.querySelector('img');
          if (lcpImg) {
            
            // Also add preload link in head for immediate discovery
            const existingPreload = document.querySelector(`link[href="${lcpImg.src}"]`);
            if (!existingPreload) {
              const preloadLink = document.createElement('link');
              preloadLink.rel = 'preload';
              preloadLink.as = 'image';
              preloadLink.href = lcpImg.src;
              preloadLink.fetchPriority = 'high';
              document.head.appendChild(preloadLink);
              console.log('Added preload link for LCP image:', lcpImg.src);
            }
            
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
