import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Create the main footer structure
  const footer = document.createElement('footer');
  footer.className = 'footer-container';
  
  // Create container div
  const container = document.createElement('div');
  container.className = 'container';
  
  // Create footer grid
  const footerGrid = document.createElement('div');
  footerGrid.className = 'footer-grid';
  
  // Get configuration from Universal Editor fields or block data attributes or use defaults
  const getFieldValue = (fieldName, defaultValue) => {
    // Try Universal Editor field first
    const fieldElement = block.querySelector(`[data-field="${fieldName}"]`);
    if (fieldElement && fieldElement.textContent.trim()) {
      return fieldElement.textContent.trim();
    }
    // Fallback to dataset attribute
    return block.dataset[fieldName] || defaultValue;
  };
  
  const config = {
    newsletterTitle: getFieldValue('newsletterTitle', 'Get the latest deals and more'),
    newsletterPlaceholder: getFieldValue('newsletterPlaceholder', 'Enter email address'),
    newsletterButtonText: getFieldValue('newsletterButtonText', 'Sign up'),
    socialTitle: getFieldValue('socialTitle', 'Follow us at:'),
    globalText: getFieldValue('globalText', 'Global / English')
  };
  
  // Process block content
  const rows = [...block.children];
  
  // Separate different types of content
  const linkColumns = [];
  const socialLinks = [];
  const bottomLinks = [];
  
  // Process rows to categorize content - Updated for Universal Editor
  rows.forEach(row => {
    const cells = [...row.children];
    cells.forEach(cell => {
      // Check if this is a social link component
      if (cell.dataset.component === 'footer-social-link' || cell.classList.contains('footer-social-link')) {
        const socialName = cell.dataset.socialName || cell.querySelector('[data-field="socialName"]')?.textContent || 'Social';
        const socialUrl = cell.dataset.socialUrl || cell.querySelector('[data-field="socialUrl"]')?.textContent || cell.querySelector('a')?.href || '#';
        const socialIcon = cell.dataset.socialIcon || cell.querySelector('[data-field="socialIcon"]')?.textContent || 'icon-facebook.svg';
        
        socialLinks.push({
          name: socialName,
          url: socialUrl,
          icon: socialIcon
        });
      }
      // Check if this is a bottom link component
      else if (cell.dataset.component === 'footer-bottom-link' || cell.classList.contains('footer-bottom-link')) {
        const linkText = cell.dataset.linkText || cell.querySelector('[data-field="linkText"]')?.textContent || cell.textContent.trim() || 'Link';
        const linkUrl = cell.dataset.link || cell.querySelector('[data-field="link"]')?.textContent || cell.querySelector('a')?.href || '#';
        const linkTitle = cell.dataset.linkTitle || cell.querySelector('[data-field="linkTitle"]')?.textContent || '';
        const openInNewWindow = cell.dataset.openInNewWindow === 'true' || cell.querySelector('[data-field="openInNewWindow"]')?.textContent === 'true';
        
        bottomLinks.push({
          text: linkText,
          url: linkUrl,
          title: linkTitle,
          openInNewWindow: openInNewWindow
        });
      }
      // Check if this is a link column component
      else if (cell.dataset.component === 'footer-link-column' || cell.classList.contains('footer-link-column')) {
        const columnTitle = cell.dataset.columnTitle || cell.querySelector('[data-field="columnTitle"]')?.textContent || cell.querySelector('h3, h4, h5, h6')?.textContent || 'Column';
        
        const columnData = {
          title: columnTitle,
          links: []
        };
        
        // Find child links - Updated for Universal Editor
        const childLinks = cell.querySelectorAll('[data-component="footer-link"], .footer-link');
        childLinks.forEach(linkEl => {
          const linkText = linkEl.dataset.linkText || linkEl.querySelector('[data-field="linkText"]')?.textContent || linkEl.textContent.trim() || 'Link';
          const linkUrl = linkEl.dataset.link || linkEl.querySelector('[data-field="link"]')?.textContent || linkEl.querySelector('a')?.href || '#';
          const linkTitle = linkEl.dataset.linkTitle || linkEl.querySelector('[data-field="linkTitle"]')?.textContent || '';
          const openInNewWindow = linkEl.dataset.openInNewWindow === 'true' || linkEl.querySelector('[data-field="openInNewWindow"]')?.textContent === 'true';
          
          columnData.links.push({
            text: linkText,
            url: linkUrl,
            title: linkTitle,
            openInNewWindow: openInNewWindow
          });
        });
        
        // Also check for direct links in the column (fallback)
        if (columnData.links.length === 0) {
          const directLinks = cell.querySelectorAll('a');
          directLinks.forEach(linkEl => {
            if (linkEl.textContent.trim() && linkEl.textContent.trim() !== columnTitle) {
              columnData.links.push({
                text: linkEl.textContent.trim(),
                url: linkEl.href || '#',
                title: linkEl.title || '',
                openInNewWindow: linkEl.target === '_blank'
              });
            }
          });
        }
        
        linkColumns.push(columnData);
      }
    });
  });
  
  // Create footer left section (newsletter and social)
  const footerLeft = document.createElement('div');
  footerLeft.className = 'footer-left';
  
  // Newsletter section
  const newsletter = document.createElement('form');
  newsletter.className = 'newsletter';
  newsletter.method = 'post';
  newsletter.setAttribute('aria-label', 'Newsletter signup');
  
  const newsletterLabel = document.createElement('label');
  newsletterLabel.setAttribute('for', 'newsletter-email');
  newsletterLabel.textContent = config.newsletterTitle;
  
  const newsletterForm = document.createElement('div');
  newsletterForm.className = 'newsletter__form mt-4';
  
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'newsletter-email';
  emailInput.name = 'email';
  emailInput.placeholder = config.newsletterPlaceholder;
  emailInput.required = true;
  
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'btn';
  submitButton.textContent = config.newsletterButtonText;
  
  newsletterForm.appendChild(emailInput);
  newsletterForm.appendChild(submitButton);
  newsletter.appendChild(newsletterLabel);
  newsletter.appendChild(newsletterForm);
  
  // Social section
  const social = document.createElement('div');
  social.className = 'social';
  
  const socialText = document.createElement('small');
  socialText.className = 'text-social';
  socialText.textContent = config.socialTitle;
  
  const socialNav = document.createElement('nav');
  socialNav.setAttribute('aria-label', 'Social media');
  
  const socialList = document.createElement('ul');
  socialList.className = 'social__icons p-0 m-0';
  
  // Use authorable social links if available, otherwise use defaults
  const defaultSocialLinks = [
    { name: 'Facebook', icon: 'icon-facebook.svg', url: '#' },
    { name: 'Twitter', icon: 'icon-x.svg', url: '#' },
    { name: 'Discord', icon: 'icon-discord.svg', url: '#' },
    { name: 'YouTube', icon: 'icon-youtube.svg', url: '#' },
    { name: 'Twitch', icon: 'icon-twitch.svg', url: '#' },
    { name: 'Instagram', icon: 'icon-instagram.svg', url: '#' },
    { name: 'TikTok', icon: 'icon-tiktok.svg', url: '#' },
    { name: 'Threads', icon: 'icon-thread.svg', url: '#' }
  ];
  
  const socialLinksToUse = socialLinks.length > 0 ? socialLinks : defaultSocialLinks;
  
  socialLinksToUse.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.url || '#';
    a.target = '_blank';
    a.setAttribute('aria-label', `Follow us on ${link.name} (open a new window)`);
    
    const img = document.createElement('img');
    img.src = `./icons/social/${link.icon}`;
    img.alt = '';
    img.width = 40;
    img.height = 40;
    
    a.appendChild(img);
    li.appendChild(a);
    socialList.appendChild(li);
  });
  
  socialNav.appendChild(socialList);
  social.appendChild(socialText);
  social.appendChild(socialNav);
  
  footerLeft.appendChild(newsletter);
  footerLeft.appendChild(social);
  
  // Create footer right section (navigation links)
  const footerRight = document.createElement('div');
  footerRight.className = 'footer-right';
  
  const footerLinks = document.createElement('nav');
  footerLinks.className = 'footer-links';
  footerLinks.setAttribute('aria-label', 'Footer Navigation');
  
  // Use authorable link columns if available, otherwise create default columns
  if (linkColumns.length > 0) {
    // Use authorable columns
    linkColumns.forEach(columnData => {
      const column = document.createElement('ul');
      column.className = 'footer-links__column pl-0';
      
      // Add column title
      const titleLi = document.createElement('li');
      const titleP = document.createElement('p');
      titleP.className = 'w-500';
      titleP.textContent = columnData.title;
      titleLi.appendChild(titleP);
      column.appendChild(titleLi);
      
      // Add links
      columnData.links.forEach(linkData => {
        const linkLi = document.createElement('li');
        const a = document.createElement('a');
        a.href = linkData.url || '#';
        a.textContent = linkData.text;
        a.target = linkData.openInNewWindow ? '_blank' : '_self';
        if (linkData.title) {
          a.title = linkData.title;
        }
        if (linkData.openInNewWindow) {
          a.setAttribute('aria-label', `${linkData.text} (open a new window)`);
        }
        linkLi.appendChild(a);
        column.appendChild(linkLi);
      });
      
      footerLinks.appendChild(column);
    });
  } else {
    // Fallback: Process rows to create navigation columns (legacy support)
    rows.forEach((row, index) => {
      if (index === 0) return; // Skip first row if it's a header
      
      const column = document.createElement('ul');
      column.className = 'footer-links__column pl-0';
      
      const cells = [...row.children];
      cells.forEach((cell, cellIndex) => {
        const li = document.createElement('li');
        
        if (cellIndex === 0) {
          // First cell is the column header
          const p = document.createElement('p');
          p.className = 'w-500';
          p.textContent = cell.textContent.trim();
          li.appendChild(p);
        } else {
          // Other cells are links
          const links = cell.querySelectorAll('a');
          if (links.length > 0) {
            links.forEach(link => {
              const linkLi = document.createElement('li');
              const a = document.createElement('a');
              a.href = link.href || '#';
              a.textContent = link.textContent.trim();
              linkLi.appendChild(a);
              column.appendChild(linkLi);
            });
          } else if (cell.textContent.trim()) {
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = cell.textContent.trim();
            li.appendChild(a);
          }
        }
        
        if (li.children.length > 0) {
          column.appendChild(li);
        }
      });
      
      if (column.children.length > 0) {
        footerLinks.appendChild(column);
      }
    });
  }
  
  footerRight.appendChild(footerLinks);
  
  // Add left and right sections to grid
  footerGrid.appendChild(footerLeft);
  footerGrid.appendChild(footerRight);
  
  // Create footer bottom section
  const footerBottom = document.createElement('div');
  footerBottom.className = 'footer-bottom';
  
  const globalSpan = document.createElement('span');
  const globalImg = document.createElement('img');
  globalImg.src = './icons/Global.svg';
  globalImg.alt = 'Global';
  globalSpan.appendChild(globalImg);
  globalSpan.appendChild(document.createTextNode(config.globalText));
  
  const bottomLinksNav = document.createElement('nav');
  bottomLinksNav.className = 'footer-bottom__links';
  bottomLinksNav.setAttribute('aria-label', 'Legal links');
  
  // Use authorable bottom links if available, otherwise use defaults
  const defaultLegalLinks = [
    { text: 'Privacy Policy', href: '#' },
    { text: 'Terms & Conditions', href: '#' },
    { text: 'Cookie Settings', href: '#' }
  ];
  
  const linksToUse = bottomLinks.length > 0 ? bottomLinks : defaultLegalLinks;
  
  linksToUse.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url || link.href || '#';
    a.target = link.openInNewWindow ? '_blank' : '_self';
    a.setAttribute('aria-label', `View ${link.text} ${link.openInNewWindow ? '(open a new window)' : ''}`);
    a.textContent = link.text;
    if (link.title) {
      a.title = link.title;
    }
    bottomLinksNav.appendChild(a);
  });
  
  footerBottom.appendChild(globalSpan);
  footerBottom.appendChild(bottomLinksNav);
  
  // Assemble the complete footer
  container.appendChild(footerGrid);
  container.appendChild(footerBottom);
  footer.appendChild(container);
  
  // Add Universal Editor instrumentation for editable areas
  
  // Make newsletter title editable
  const newsletterTitleElement = footer.querySelector('label[for="newsletter-email"]');
  if (newsletterTitleElement) {
    newsletterTitleElement.setAttribute('data-aue-prop', 'newsletterTitle');
    newsletterTitleElement.setAttribute('data-aue-type', 'text');
    newsletterTitleElement.setAttribute('data-aue-label', 'Newsletter Title');
  }
  
  // Make social title editable
  const socialTitleElement = footer.querySelector('.text-social');
  if (socialTitleElement) {
    socialTitleElement.setAttribute('data-aue-prop', 'socialTitle');
    socialTitleElement.setAttribute('data-aue-type', 'text');
    socialTitleElement.setAttribute('data-aue-label', 'Social Media Title');
  }
  
  // Make global text editable
  const globalTextElement = footer.querySelector('span');
  if (globalTextElement) {
    globalTextElement.setAttribute('data-aue-prop', 'globalText');
    globalTextElement.setAttribute('data-aue-type', 'text');
    globalTextElement.setAttribute('data-aue-label', 'Global Text');
  }
  
  // Add instrumentation for social links
  const socialLinksElements = footer.querySelectorAll('.social__icons li');
  socialLinksElements.forEach((li, index) => {
    if (index < socialLinks.length) {
      const link = socialLinks[index];
      li.setAttribute('data-aue-resource', `urn:aemconnection:${link.name.toLowerCase()}-social-link`);
      li.setAttribute('data-aue-type', 'component');
      li.setAttribute('data-aue-filter', 'footer-social-link');
      li.setAttribute('data-aue-label', `${link.name} Social Link`);
    }
  });
  
  // Add instrumentation for footer link columns
  const columnElements = footer.querySelectorAll('.footer-links__column');
  columnElements.forEach((column, index) => {
    if (index < linkColumns.length) {
      const columnData = linkColumns[index];
      column.setAttribute('data-aue-resource', `urn:aemconnection:footer-column-${index}`);
      column.setAttribute('data-aue-type', 'component');
      column.setAttribute('data-aue-filter', 'footer-link-column');
      column.setAttribute('data-aue-label', `${columnData.title} Column`);
      
      // Add instrumentation for individual links within columns
      const linkElements = column.querySelectorAll('li a');
      linkElements.forEach((linkEl, linkIndex) => {
        if (linkIndex > 0) { // Skip the title
          linkEl.parentElement.setAttribute('data-aue-resource', `urn:aemconnection:footer-link-${index}-${linkIndex}`);
          linkEl.parentElement.setAttribute('data-aue-type', 'component');
          linkEl.parentElement.setAttribute('data-aue-filter', 'footer-link');
          linkEl.parentElement.setAttribute('data-aue-label', `${linkEl.textContent} Link`);
        }
      });
    }
  });
  
  // Add instrumentation for bottom links
  const bottomLinksElements = footer.querySelectorAll('.footer-bottom__links a');
  bottomLinksElements.forEach((linkEl, index) => {
    if (index < bottomLinks.length) {
      const link = bottomLinks[index];
      linkEl.setAttribute('data-aue-resource', `urn:aemconnection:footer-bottom-link-${index}`);
      linkEl.setAttribute('data-aue-type', 'component');
      linkEl.setAttribute('data-aue-filter', 'footer-bottom-link');
      linkEl.setAttribute('data-aue-label', `${link.text} Bottom Link`);
    }
  });
  
  // Move instrumentation and replace block content
  moveInstrumentation(block, footer);
  block.textContent = '';
  block.appendChild(footer);
  
  // Add newsletter form submission handler
  const form = block.querySelector('.newsletter');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      console.log('Newsletter signup:', email);
      // Add your newsletter signup logic here
      alert('Thank you for signing up!');
    });
  }
}
