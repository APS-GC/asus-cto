import './uifrontend/_footer.js';
import { moveInstrumentation, createOptimizedPictureExternal } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

// Footer configuration - calculated once for the entire module
const FooterConfig = {
  get baseUrl() {
    return window.asusCto?.baseUrl;
  },
  get shouldUseExternal() {
    return this.baseUrl && this.baseUrl !== window.location.origin;
  }
};

function parseFragmentContent(block) {
  try {
    // Enhanced selector strategy to handle both wrapped and unwrapped content structures
    let contentDivs = [];
    
    // First, try to find the root footer div
    const footerDiv = block.querySelector('.footer') || block;
    
    
    // Get all direct children of the footer
    const footerChildren = Array.from(footerDiv.children);
    
    // Extract content divs from each child, handling different wrapper structures
    footerChildren.forEach(child => {
      // Check for wrapped structure: div > p > div
      const pElement = child.querySelector('p');
      if (pElement) {
        const innerDiv = pElement.querySelector('div');
        if (innerDiv) {
          contentDivs.push(innerDiv);
        }
      } else {
        // Check for direct structure: div > div
        const directDiv = child.querySelector('div');
        if (directDiv) {
          contentDivs.push(directDiv);
        } else {
          // Fallback: use the child itself
          contentDivs.push(child);
        }
      }
      
      // Additionally, for social media sections, check if this child has both picture and URL content
      // This handles cases where EDS processes the fragment and merges content
      const hasImage = child.querySelector('picture img');
      if (hasImage) {
        // Look for URL content in the same child or adjacent siblings
        const textContent = child.textContent?.trim();
        if (textContent && !textContent.includes('<')) {
          // Extract URL text that's not part of the image
          const imageText = child.querySelector('picture').textContent || '';
          const urlText = textContent.replace(imageText, '').trim();
          if (urlText && (urlText.startsWith('http') || urlText.includes('facebook.com') || urlText.includes('youtube.com'))) {
            // Create a virtual URL div for this content
            const virtualUrlDiv = document.createElement('div');
            virtualUrlDiv.textContent = urlText;
            contentDivs.push(virtualUrlDiv);
          }
        }
      }
    });

    const parsedData = {
      newsletterLabel: '',
      newsletterPlaceholder: '',
      newsletterButtonText: '',
      socialLabel: '',
      footerColumns: [],
      legalLinks: [],
      socialLinks: [],
      globalText: '',
      globalIcon: '',
      showGlobal: ''
    };

    // Process divs according to the fragment structure:
    // 1st div: Newsletter Label
    // 2nd div: Newsletter Placeholder
    // 3rd div: Newsletter Button Text
    // 4th div: Social Label
    // 5th div: Column 1 Title (Support)
    // 6th div: Column 1 Links
    // 7th div: Column 2 Title
    // 8th div: Column 2 Links
    // 9th div: Column 3 Title
    // 10th div: Column 3 Links
    // 11th div: Legal Links
    // 12th div: show Global
    // 13th+ divs: Social Media Icons with Images and Links
    
    contentDivs.forEach((div, index) => {
      try {
        const textContent = div.textContent?.trim();

        switch (index) {
          case 0: // Newsletter Label
            parsedData.newsletterLabel = textContent;
            break;
          case 1: // Newsletter Placeholder
            parsedData.newsletterPlaceholder = textContent;
            break;
          case 2: // Newsletter Button Text
            parsedData.newsletterButtonText = textContent;
            break;
          case 3: { // Main content - Footer Columns
            const linksLists = div.querySelectorAll('ul');
            const listHeads = div.querySelectorAll('p');
            linksLists.forEach((ul, i) => {
              const column = { columnTitle: listHeads[i]?.textContent || '', links: [] };
              const links = ul.querySelectorAll('li a');
              column.links = Array.from(links).map(link => ({
                linkText: link.textContent?.trim() || '',
                linkUrl: link.getAttribute('href') || '#'
              }));
              parsedData.footerColumns.push(column);
            });
            break;
          }
          case 4: { // Privacy policy & Legal Links
            const links = div.querySelectorAll('a');
            parsedData.legalLinks = Array.from(links).map(link => {
              const href = link.getAttribute('href') || '#';
              return {
                linkText: link.textContent?.trim() || '',
                linkUrl: FooterConfig.shouldUseExternal && href !== '#' && !href.startsWith('http') ? `${FooterConfig.baseUrl}${href}` : href
              };
            });
            break;
          }
          case 5: // Follow us label
            parsedData.socialLabel = textContent;
            break;
          case 6: // Show Global
            parsedData.showGlobal = textContent.toLowerCase() === 'true' || textContent.toLowerCase() === 'yes';
            break;
          default:
            // Social icons start from index 7 and come in pairs
            if (index >= 7 && (index - 7) % 2 === 0) {
              const socialPlatforms = ['facebook', 'x', 'instagram', 'tiktok', 'youtube', 'discord', 'twitch', 'thread'];
              const platformIndex = Math.floor((index - 7) / 2);
              const platform = socialPlatforms[platformIndex] || `social${platformIndex + 1}`;

            const pictureDiv = div;
            const urlDiv = contentDivs[index + 1];
            const picture = pictureDiv.querySelector('picture img');

            let url = '#';
            if (urlDiv) {
              const urlLink = urlDiv.querySelector('a');
              const urlText = urlDiv.textContent?.trim();
              url = urlLink?.href || urlText || '#';
            }

            if (picture && url && url !== '#') {
              parsedData.socialLinks.push({
                platform: platform,
                url: url,
                icon: picture.getAttribute('src') || '',
                altText: picture.getAttribute('alt') || platform.charAt(0).toUpperCase() + platform.slice(1),
                originalElement: picture, // Store reference to original image element for moveInstrumentation
                actualDiv: pictureDiv
              });
            }
            }
            break;
        }
      } catch (error) {
        console.error(`Error processing content div at index ${index}:`, error);
        // Continue to the next iteration
      }
    });

    // Filter out empty columns
    parsedData.footerColumns = parsedData.footerColumns.filter(col => col && col.columnTitle);

    return parsedData;
    
  } catch (error) {
    console.error('Error parsing fragment content:', error);
    return null;
  }
}

function parseFooterData(block) {
  // Initialize empty data structure - no defaults
  const data = {
    newsletterLabel: '',
    newsletterPlaceholder: '', 
    newsletterButtonText: '',
    socialLabel: '',
    socialLinks: [],
    footerColumns: [],
    globalText: '',
    globalIcon: '',
    showGlobal: '', // Default to false
    legalLinks: [],
    originalRows: [] // Store original rows for instrumentation transfer
  };

  // First try to parse from fragment content structure
  const parsedFromFragment = parseFragmentContent(block);
  if (parsedFromFragment) {
    // Use parsed fragment data directly
    data.newsletterLabel = parsedFromFragment.newsletterLabel || '';
    data.newsletterPlaceholder = parsedFromFragment.newsletterPlaceholder || '';
    data.newsletterButtonText = parsedFromFragment.newsletterButtonText || '';
    data.socialLabel = parsedFromFragment.socialLabel || '';
    data.footerColumns = parsedFromFragment.footerColumns || [];
    data.legalLinks = parsedFromFragment.legalLinks || [];
    data.socialLinks = parsedFromFragment.socialLinks || [];
    data.globalText = parsedFromFragment.globalText || 'Global/English';
    data.globalIcon = parsedFromFragment.globalIcon || '/icons/Global.svg';
    data.showGlobal = parsedFromFragment.showGlobal !== undefined ? parsedFromFragment.showGlobal : false;
  }

  // Override with Universal Editor model data if available
  if (block.dataset && (block.dataset.model || block.dataset.aueModel)) {
    const modelData = block.dataset.aueModel ? JSON.parse(block.dataset.aueModel) : {};
    
    
    // Parse newsletter fields from UE model
    if (modelData.titleSubscription) data.newsletterLabel = modelData.titleSubscription;
    if (modelData.placeholder) data.newsletterPlaceholder = modelData.placeholder;
    if (modelData.buttonText) data.newsletterButtonText = modelData.buttonText;
    if (modelData.socialTitle) data.socialLabel = modelData.socialTitle;
    
    // Parse footer columns from UE model
    const footerColumnsFromModel = [];
    
    // First column
    if (modelData.titleFirstColumn && modelData.config) {
      const firstColumnLinks = parseRichTextLinks(modelData.config);
      footerColumnsFromModel.push({
        columnTitle: modelData.titleFirstColumn,
        links: firstColumnLinks
      });
    }
    
    // Second column
    if (modelData.titleSecondColumn && modelData.configSecondColumn) {
      const secondColumnLinks = parseRichTextLinks(modelData.configSecondColumn);
      footerColumnsFromModel.push({
        columnTitle: modelData.titleSecondColumn,
        links: secondColumnLinks
      });
    }
    
    // Third column
    if (modelData.titleThirdColumn && modelData.configThirdColumn) {
      const thirdColumnLinks = parseRichTextLinks(modelData.configThirdColumn);
      footerColumnsFromModel.push({
        columnTitle: modelData.titleThirdColumn,
        links: thirdColumnLinks
      });
    }
    
    // Update footer columns if model data exists
    if (footerColumnsFromModel.length > 0) {
      data.footerColumns = footerColumnsFromModel;
    }
    
    // Parse legal links from UE model
    if (modelData.copyrightLinks) {
      const legalLinksFromModel = parseRichTextLinks(modelData.copyrightLinks);
      if (legalLinksFromModel.length > 0) {
        data.legalLinks = legalLinksFromModel;
      }
    }
    
    // Parse showGlobal from UE model
    if (modelData.showGlobal !== undefined) {
      data.showGlobal = modelData.showGlobal;
    }
    
    // Parse social icons from UE model (if available as separate items)
    // This would need to be implemented based on the actual UE model structure for social icons
    // For now, we'll keep the existing social links from fragment parsing
  }

  // Process block content for authoring data
  const rows = [...block.children];
  let footerColumnsArray = [];
  let legalLinksArray = [];
  let socialLinksArray = [];
  let currentColumn = null;
  let currentSection = '';
  
  rows.forEach((row, index) => {
    const cells = [...row.children];
    
    // Store original row for instrumentation transfer
    data.originalRows.push(row);
    
    if (cells.length >= 2) {
      const field = cells[0].textContent.trim();
      const value = cells[1].textContent.trim();
      
      // Handle simple text fields
      switch (field) {
        case 'Newsletter Label':
          data.newsletterLabel = value;
          data.newsletterLabelRow = row;
          break;
        case 'Newsletter Placeholder':
          data.newsletterPlaceholder = value;
          data.newsletterPlaceholderRow = row;
          break;
        case 'Newsletter Button Text':
          data.newsletterButtonText = value;
          data.newsletterButtonRow = row;
          break;
        case 'Social Label':
          data.socialLabel = value;
          data.socialLabelRow = row;
          break;
        case 'Global Text':
          data.globalText = value;
          data.globalTextRow = row;
          break;
        case 'Global Icon':
          data.globalIcon = value;
          data.globalIconRow = row;
          break;
        case 'Show Global':
          data.showGlobal = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
          data.showGlobalRow = row;
          break;
        default:
          // Handle complex structured data
          if (field.startsWith('Column ')) {
            // Parse footer columns - format: "Column Title" | "Links (pipe separated)"
            const columnTitle = field.replace('Column ', '');
            const links = value.split('|').map(link => {
              const [linkText, linkUrl] = link.split(' - ');
              return { 
                linkText: linkText ? linkText.trim() : link.trim(), 
                linkUrl: linkUrl ? linkUrl.trim() : '#' 
              };
            });
            footerColumnsArray.push({ 
              columnTitle, 
              links, 
              originalRow: row // Store original row for instrumentation
            });
          } else if (field.startsWith('Legal ')) {
            // Parse legal links - format: "Legal Link Name" | "URL"
            const linkText = field.replace('Legal ', '');
            legalLinksArray.push({ 
              linkText, 
              linkUrl: value, 
              originalRow: row // Store original row for instrumentation
            });
          } else if (field.startsWith('Social ')) {
            // Parse social links - format: "Social Platform" | "URL|Icon|AltText"
            const platform = field.replace('Social ', '').toLowerCase();
            const parts = value.split('|');
            const socialLink = { 
              platform, 
              url: parts[0] || '#',
              icon: parts[1] || `/icons/social/icon-${platform}.svg`,
              altText: parts[2] || platform.charAt(0).toUpperCase() + platform.slice(1),
              originalRow: row // Store original row for instrumentation
            };
            socialLinksArray.push(socialLink);
          }
          break;
      }
    } else if (cells.length === 1) {
      const singleValue = cells[0].textContent.trim();
      
      // Handle single-cell rows that might contain structured data
      if (singleValue.includes('|')) {
        // Parse pipe-separated data
        const parts = singleValue.split('|').map(p => p.trim());
        if (parts.length === 2) {
          const [key, value] = parts;
          
          if (key.startsWith('Column:')) {
            const columnTitle = key.replace('Column:', '').trim();
            const links = value.split(',').map(link => {
              const [linkText, linkUrl] = link.split(' - ');
              return { 
                linkText: linkText ? linkText.trim() : link.trim(), 
                linkUrl: linkUrl ? linkUrl.trim() : '#' 
              };
            });
            footerColumnsArray.push({ 
              columnTitle, 
              links, 
              originalRow: row // Store original row for instrumentation
            });
          } else if (key.startsWith('Legal:')) {
            const linkText = key.replace('Legal:', '').trim();
            legalLinksArray.push({ 
              linkText, 
              linkUrl: value, 
              originalRow: row // Store original row for instrumentation
            });
          }
        }
      }
    }
  });

  // Update arrays if they have content
  if (footerColumnsArray.length > 0) {
    data.footerColumns = footerColumnsArray;
  }
  if (legalLinksArray.length > 0) {
    data.legalLinks = legalLinksArray;
  }
  if (socialLinksArray.length > 0) {
    data.socialLinks = socialLinksArray;
  }

  return data;
}

function buildSocialIcons(socialLinks, socialLabel) {
  // Create social container
  const socialDiv = document.createElement('div');
  socialDiv.className = 'social';
  
  // Create social label
  const socialLabelElement = document.createElement('small');
  socialLabelElement.className = 'text-social';
  socialLabelElement.textContent = socialLabel;
  socialDiv.appendChild(socialLabelElement);
  
  // Create nav container
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Social media');
  
  // Create ul container
  const ul = document.createElement('ul');
  ul.className = 'social__icons p-0 m-0';
  
  // Process each social link
  socialLinks.forEach((link, index) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const img = document.createElement('img');
    
    if (link.actualDiv) {
      moveInstrumentation(link.actualDiv,li);
    }
    
    const altText = link.altText || link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
    
    // Set link attributes
    a.href = link.url;
    a.target = '_blank';
    a.setAttribute('aria-label', `Follow us on ${altText} (open a new window)`);
    
    // Set image attributes
    img.src = link.icon || '';
    img.alt = altText;
    img.width = 40;
    img.height = 40;
    img.loading = 'lazy';
    
    // Apply moveInstrumentation if original element exists
    if (link.originalElement) {
      moveInstrumentation(link.originalElement, img);
    }
    
    // Build structure
    a.appendChild(img);
    li.appendChild(a);
    ul.appendChild(li);
    
  });
  
  nav.appendChild(ul);
  socialDiv.appendChild(nav);
  
  return socialDiv.outerHTML;
}

function buildFooterColumns(footerColumns) {
  const columnsContainer = document.createElement('div');
  
  footerColumns.forEach(column => {
    const ul = document.createElement('ul');
    ul.className = 'footer-links__column pl-0';
    
    // Create title list item
    const titleLi = document.createElement('li');
    const titleP = document.createElement('p');
    titleP.className = 'w-500';
    titleP.textContent = column.columnTitle;
    titleLi.appendChild(titleP);
    ul.appendChild(titleLi);
    
    // Apply moveInstrumentation to title if original row exists
    if (column.originalRow) {
      moveInstrumentation(column.originalRow, titleP);
    }
    
    // Create link list items
    column.links.forEach(link => {
      const linkLi = document.createElement('li');
      const linkA = document.createElement('a');
      linkA.href = link.linkUrl;
      linkA.textContent = link.linkText;
      
      // Apply moveInstrumentation to link if original row exists
      if (column.originalRow) {
        moveInstrumentation(column.originalRow, linkA);
      }
      
      linkLi.appendChild(linkA);
      ul.appendChild(linkLi);
    });
    
    columnsContainer.appendChild(ul);
  });
  
  return columnsContainer.innerHTML;
}

function buildLegalLinks(legalLinks) {
  const linksContainer = document.createElement('div');
  
  legalLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.linkUrl;
    a.target = '_blank';
    a.setAttribute('aria-label', `View ${link.linkText} (open a new window)`);
    a.textContent = link.linkText;
    
    // Apply moveInstrumentation if original row exists
    if (link.originalRow) {
      moveInstrumentation(link.originalRow, a);
    }
    
    linksContainer.appendChild(a);
  });
  
  return linksContainer.innerHTML;
}

// Function to optimize footer images using createOptimizedPicture
// Similar to optimizeLogoImages() from header component
function optimizeFooterImages(container) {
  // Find all images in footer and optimize them, particularly social media icons
  container.querySelectorAll('footer img, .footer img, .social img, .social__icons img').forEach((img) => {
    // Skip if already optimized or if it's not in a picture element
    if (img.closest('picture')?.hasAttribute('data-optimized')) {
      return;
    }
    
    let optimizedPic;
    
    // Use FooterConfig for baseUrl and shouldUseExternal
    const { baseUrl, shouldUseExternal } = FooterConfig;
    
    if (shouldUseExternal) {
      // Use createOptimizedPictureExternal with baseUrl when baseUrl is defined and different
      optimizedPic = createOptimizedPictureExternal(
        img.src, 
        img.alt, 
        true, // eager loading for footer images (above fold)
        [{ width: '200' }, { width: '400' }], // responsive breakpoints
        baseUrl
      );
    } else {
      // Use createOptimizedPicture from aem.js when baseUrl is not defined or equals window.location.href
      optimizedPic = createOptimizedPicture(
        img.src, 
        img.alt, 
        true, // eager loading for footer images (above fold)
        [{ width: '200' }, { width: '400' }] // responsive breakpoints
      );
    }
    
    // Move instrumentation from original to optimized image
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    
    // Mark as optimized to prevent re-processing
    optimizedPic.setAttribute('data-optimized', 'true');
    
    // Replace the original picture with optimized version
    const originalPicture = img.closest('picture');
    if (originalPicture) {
      originalPicture.replaceWith(optimizedPic);
    } else {
      // If no picture element, wrap the img and replace
      img.replaceWith(optimizedPic);
    }
  });
}

export default function decorate(block) {
  if(block.querySelector('div.footer')?.className !== 'footer') return;

  const data = parseFooterData(block);

  // Create the footer structure using parsed data to match reference exactly
  const footerHTML = `<footer class='experiencefragment'>
  <div class='cmp-experiencefragment'>
    <div class='cmp-container container'>
      <div class="footer-grid">
        <!-- Left Column -->
        <div class="footer-left">
          <form id="frm-footer-newsletter" class='newsletter' method="post" aria-label="Newsletter signup" novalidate>
            <label for="newsletter-email">${data.newsletterLabel}</label>
            <div class='newsletter__field-wrapper mt-4'>
              <input type='email' id="newsletter-email" name="email" placeholder='${data.newsletterPlaceholder}' required />
              <button type="submit" class="btn">${data.newsletterButtonText}</button>
            </div>
            <div class="newsletter__response"></div>
          </form>

          ${buildSocialIcons(data.socialLinks, data.socialLabel)}
        </div>

        <!-- Right Column -->
        <div class="footer-right">
          <nav class='footer-links' aria-label="Footer Navigation">
            ${buildFooterColumns(data.footerColumns)}
          </nav>
        </div>
      </div>

      <div class='footer-bottom'>
        ${data.showGlobal ? `<span tabindex="0"><img src="${data.globalIcon}" alt="Global">${data.globalText}</span>` : `<span></span>`}
        <nav class='footer-bottom__links' aria-label="Legal links">
          ${buildLegalLinks(data.legalLinks)}
        </nav>
        <button class="back-to-top" id="backToTop" aria-label="Back to top">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="59" height="59" rx="29.5" fill="black" class="back-to-top__bg" />
            <rect x="0.5" y="0.5" width="59" height="59" rx="29.5" stroke="#CCCCCC"/>
            <path d="M41 34.5L30 25.5L19 34.5" stroke="white" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>                        
        </button>
      </div>
    </div>
  </div>
</footer>`;

  // Clear existing content and add the footer structure
  block.innerHTML = footerHTML;
  block.classList.add('experiencefragment');

  // Apply moveInstrumentation to newsletter form elements
  const newsletterLabel = block.querySelector('label[for="newsletter-email"]');
  const newsletterInput = block.querySelector('#newsletter-email');
  const newsletterButton = block.querySelector('.newsletter button');
  const socialLabel = block.querySelector('.text-social');
  const globalText = block.querySelector('.footer-bottom span');

  // Transfer instrumentation from original rows to form elements
  if (data.newsletterLabelRow && newsletterLabel) {
    moveInstrumentation(data.newsletterLabelRow, newsletterLabel);
  }
  if (data.newsletterPlaceholderRow && newsletterInput) {
    moveInstrumentation(data.newsletterPlaceholderRow, newsletterInput);
  }
  if (data.newsletterButtonRow && newsletterButton) {
    moveInstrumentation(data.newsletterButtonRow, newsletterButton);
  }
  if (data.socialLabelRow && socialLabel) {
    moveInstrumentation(data.socialLabelRow, socialLabel);
  }
  if (data.showGlobal && data.globalTextRow && globalText) {
    moveInstrumentation(data.globalTextRow, globalText);
  }

  // Add newsletter form functionality with triggerSubscribeForm
  const form = block.querySelector('.newsletter');
  const responseElement = form?.querySelector('.newsletter__response');
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Clear previous states
      form.classList.remove('has--error', 'has--success');
      if (responseElement) {
        responseElement.textContent = '';
      }

      // Validate form
      if (!form.checkValidity()) {
        form.classList.add('has--error');
        if (responseElement) {
          responseElement.textContent = 'Please enter a valid email address';
        }
        return;
      }

      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        const email = emailInput.value.trim();
        
        // Check if triggerSubscribeForm is available
        if (typeof window.triggerSubscribeForm === 'function') {
          try {
            window.triggerSubscribeForm(email);
          } catch (error) {
            console.error('Error triggering subscribe form:', error);
            form.classList.add('has--error');
            if (responseElement) {
              responseElement.textContent = 'An error occurred. Please try again.';
            }
          }
        } else {
          console.warn('triggerSubscribeForm function not available');
          form.classList.add('has--error');
          if (responseElement) {
            responseElement.textContent = 'Subscribe service is currently unavailable. Please try again later.';
          }
        }
      }
    });
  }

  // Add back to top functionality
  const backToTopButton = block.querySelector('.back-to-top');
  if (backToTopButton) {
    // Show/hide button based on scroll position
    const toggleBackToTop = () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', toggleBackToTop);
    
    // Scroll to top when clicked
    backToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Optimize footer images after HTML is set
  optimizeFooterImages(block);

  // Dispatch custom event to match reference
  document.dispatchEvent(new Event('asus-cto-DOMContentLoaded'));
}

// Export the optimizeFooterImages function for use by web component
export { optimizeFooterImages };