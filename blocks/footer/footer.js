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
  
  // Social media links data
  const socialLinks = [
    { name: 'Facebook', icon: 'icon-facebook.svg' },
    { name: 'Twitter', icon: 'icon-x.svg' },
    { name: 'Discord', icon: 'icon-discord.svg' },
    { name: 'YouTube', icon: 'icon-youtube.svg' },
    { name: 'Twitch', icon: 'icon-twitch.svg' },
    { name: 'Instagram', icon: 'icon-instagram.svg' },
    { name: 'TikTok', icon: 'icon-tiktok.svg' },
    { name: 'Threads', icon: 'icon-thread.svg' }
  ];
  
  socialLinks.forEach(link => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
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
  
  // Process rows to create navigation columns
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
  
  const bottomLinks = document.createElement('nav');
  bottomLinks.className = 'footer-bottom__links';
  bottomLinks.setAttribute('aria-label', 'Legal links');
  
  const legalLinks = [
    { text: 'Privacy Policy', href: '#' },
    { text: 'Terms & Conditions', href: '#' },
    { text: 'Cookie Settings', href: '#' }
  ];
  
  legalLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    a.target = '_blank';
    a.setAttribute('aria-label', `View ${link.text} (open a new window)`);
    a.textContent = link.text;
    bottomLinks.appendChild(a);
  });
  
  footerBottom.appendChild(globalSpan);
  footerBottom.appendChild(bottomLinks);
  
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
