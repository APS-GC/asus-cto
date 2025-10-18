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
  
  // Get configuration from block data attributes or use defaults
  const config = {
    newsletterTitle: block.dataset.newsletterTitle || 'Get the latest deals and more',
    newsletterPlaceholder: block.dataset.newsletterPlaceholder || 'Enter email address',
    newsletterButtonText: block.dataset.newsletterButtonText || 'Sign up',
    socialTitle: block.dataset.socialTitle || 'Follow us at:',
    globalText: block.dataset.globalText || 'Global / English'
  };
  
  // Process block content
  const rows = [...block.children];
  
  // Separate different types of content
  const linkColumns = [];
  const socialLinks = [];
  const bottomLinks = [];
  
  // Process rows to categorize content
  rows.forEach(row => {
    const cells = [...row.children];
    cells.forEach(cell => {
      // Check if this is a social link component
      if (cell.dataset.component === 'footer-social-link') {
        socialLinks.push({
          name: cell.dataset.socialName || 'Social',
          url: cell.dataset.socialUrl || '#',
          icon: cell.dataset.socialIcon || 'icon-facebook.svg'
        });
      }
      // Check if this is a bottom link component
      else if (cell.dataset.component === 'footer-bottom-link') {
        bottomLinks.push({
          text: cell.dataset.linkText || 'Link',
          url: cell.dataset.link || '#',
          title: cell.dataset.linkTitle || '',
          openInNewWindow: cell.dataset.openInNewWindow === 'true'
        });
      }
      // Check if this is a link column component
      else if (cell.dataset.component === 'footer-link-column') {
        const columnData = {
          title: cell.dataset.columnTitle || 'Column',
          links: []
        };
        
        // Find child links
        const childLinks = cell.querySelectorAll('[data-component="footer-link"]');
        childLinks.forEach(linkEl => {
          columnData.links.push({
            text: linkEl.dataset.linkText || 'Link',
            url: linkEl.dataset.link || '#',
            title: linkEl.dataset.linkTitle || '',
            openInNewWindow: linkEl.dataset.openInNewWindow === 'true'
          });
        });
        
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
