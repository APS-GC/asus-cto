import './uifrontend/_footer.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function parseFragmentContent(block) {
  try {
    // Get all div elements that contain the structured data
    const contentDivs = block.querySelectorAll('div > div > div');

    const parsedData = {
      newsletterLabel: '',
      newsletterPlaceholder: '',
      newsletterButtonText: '',
      socialLabel: '',
      footerColumns: [],
      legalLinks: [],
      socialLinks: [],
      globalText: '',
      globalIcon: ''
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
    // 12th+ divs: Social Media Icons with Images and Links
    
    for (let index = 0; index < contentDivs.length; index++) {
      const div = contentDivs[index];
      const textContent = div.textContent?.trim();
      
      if (index === 0) {
        // 1st div: Newsletter Label
        if (textContent) {
          parsedData.newsletterLabel = textContent;
        }
      } else if (index === 1) {
        // 2nd div: Newsletter Placeholder
        if (textContent) {
          parsedData.newsletterPlaceholder = textContent;
        }
      } else if (index === 2) {
        // 3rd div: Newsletter Button Text
        if (textContent) {
          parsedData.newsletterButtonText = textContent;
        }
      } else if (index === 3) {
        // 4th div: Social Label
        if (textContent) {
          parsedData.socialLabel = textContent;
        }
      } else if (index === 4) {
        // 5th div: Column 1 Title
        if (textContent) {
          parsedData.footerColumns[0] = { columnTitle: textContent, links: [] };
        }
      } else if (index === 5) {
        // 6th div: Column 1 Links
        const linksList = div.querySelector('ul');
        if (linksList && parsedData.footerColumns[0]) {
          const links = linksList.querySelectorAll('li a');
          parsedData.footerColumns[0].links = Array.from(links).map(link => ({
            linkText: link.textContent?.trim() || '',
            linkUrl: link.getAttribute('href') || '#'
          }));
        }
      } else if (index === 6) {
        // 7th div: Column 2 Title
        if (textContent) {
          parsedData.footerColumns[1] = { columnTitle: textContent, links: [] };
        }
      } else if (index === 7) {
        // 8th div: Column 2 Links
        const linksList = div.querySelector('ul');
        if (linksList && parsedData.footerColumns[1]) {
          const links = linksList.querySelectorAll('li a');
          parsedData.footerColumns[1].links = Array.from(links).map(link => ({
            linkText: link.textContent?.trim() || '',
            linkUrl: link.getAttribute('href') || '#'
          }));
        }
      } else if (index === 8) {
        // 9th div: Column 3 Title
        if (textContent) {
          parsedData.footerColumns[2] = { columnTitle: textContent, links: [] };
        }
      } else if (index === 9) {
        // 10th div: Column 3 Links
        const linksList = div.querySelector('ul');
        if (linksList && parsedData.footerColumns[2]) {
          const links = linksList.querySelectorAll('li a');
          parsedData.footerColumns[2].links = Array.from(links).map(link => ({
            linkText: link.textContent?.trim() || '',
            linkUrl: link.getAttribute('href') || '#'
          }));
        }
      } else if (index === 10) {
        // 11th div: Legal Links
        const linksList = div.querySelector('ul');
        if (linksList) {
          const links = linksList.querySelectorAll('li a');
          parsedData.legalLinks = Array.from(links).map(link => ({
            linkText: link.textContent?.trim() || '',
            linkUrl: link.getAttribute('href') || '#'
          }));
        }
      } else if (index >= 11) {
        // 12th+ divs: Social Media Icons with Images and Links
        // Structure: <div><p><div><picture><img></picture></div><div>URL</div></p></div>
        const picture = div.querySelector('div > picture img');
        const urlDiv = div.querySelectorAll('div')[1] || div.querySelector('a'); // Second div contains the URL
        
        if (picture && urlDiv) {
          const socialPlatforms = ['facebook', 'x', 'instagram', 'tiktok', 'youtube', 'discord', 'twitch', 'thread']; // Map to known platforms
          const platformIndex = index - 11;
          const platform = socialPlatforms[platformIndex] || `social${platformIndex + 1}`;
          const url = urlDiv.textContent?.trim() || '#';
          
          parsedData.socialLinks.push({
            platform: platform,
            url: url,
            icon: picture.getAttribute('src') || '',
            altText: picture.getAttribute('alt') || platform.charAt(0).toUpperCase() + platform.slice(1),
            originalElement: picture // Store reference to original image element for moveInstrumentation
          });
        }
      }
    }

    // Filter out empty columns
    parsedData.footerColumns = parsedData.footerColumns.filter(col => col && col.columnTitle);

    console.log('Parsed data from fragment:', parsedData);
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
  socialLinks.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const img = document.createElement('img');
    
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
      //moveInstrumentation(link.originalElement, img);
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
      //moveInstrumentation(column.originalRow, titleP);
    }
    
    // Create link list items
    column.links.forEach(link => {
      const linkLi = document.createElement('li');
      const linkA = document.createElement('a');
      linkA.href = link.linkUrl;
      linkA.textContent = link.linkText;
      
      // Apply moveInstrumentation to link if original row exists
      if (column.originalRow) {
        //moveInstrumentation(column.originalRow, linkA);
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
      //moveInstrumentation(link.originalRow, a);
    }
    
    linksContainer.appendChild(a);
  });
  
  return linksContainer.innerHTML;
}

export default function decorate(block) {
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
        <span tabindex="0"><img src="${data.globalIcon}" alt="Global">${data.globalText}</span>
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
    //moveInstrumentation(data.newsletterLabelRow, newsletterLabel);
  }
  if (data.newsletterPlaceholderRow && newsletterInput) {
    //moveInstrumentation(data.newsletterPlaceholderRow, newsletterInput);
  }
  if (data.newsletterButtonRow && newsletterButton) {
    //moveInstrumentation(data.newsletterButtonRow, newsletterButton);
  }
  if (data.socialLabelRow && socialLabel) {
    //moveInstrumentation(data.socialLabelRow, socialLabel);
  }
  if (data.globalTextRow && globalText) {
    //moveInstrumentation(data.globalTextRow, globalText);
  }

  // Add newsletter form functionality
  const form = block.querySelector('.newsletter');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        // Handle newsletter signup - you can add your logic here
        console.log('Newsletter signup:', emailInput.value);
        // Show success message or redirect
        alert('Thank you for signing up for our newsletter!');
        emailInput.value = '';
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

  // Dispatch custom event to match reference
  document.dispatchEvent(new Event('asus-cto-DOMContentLoaded'));
}
