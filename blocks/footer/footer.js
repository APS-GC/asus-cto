function parseFooterData(block) {
  // Default data structure
  const data = {
    newsletterLabel: 'Get the latest deals and more',
    newsletterPlaceholder: 'Enter email address', 
    newsletterButtonText: 'Sign up',
    socialLabel: 'Follow us at:',
    socialLinks: [
      { platform: 'facebook', url: '#' },
      { platform: 'x', url: '#' },
      { platform: 'discord', url: '#' },
      { platform: 'youtube', url: '#' },
      { platform: 'twitch', url: '#' },
      { platform: 'instagram', url: '#' },
      { platform: 'tiktok', url: '#' },
      { platform: 'thread', url: '#' }
    ],
    footerColumns: [
      {
        columnTitle: 'Shop',
        links: [{ linkText: 'All Desktops', linkUrl: '#' }]
      },
      {
        columnTitle: 'Support', 
        links: [
          { linkText: 'Help Me Choose', linkUrl: '#' },
          { linkText: 'Contact Us', linkUrl: '#' },
          { linkText: 'Shopping FAQs', linkUrl: '#' }
        ]
      },
      {
        columnTitle: 'Support',
        links: [
          { linkText: 'Help Me Choose', linkUrl: '#' },
          { linkText: 'Education & Commercial Inquiries', linkUrl: '#' }
        ]
      }
    ],
    globalText: 'Global / English',
    legalLinks: [
      { linkText: 'Privacy Policy', linkUrl: '#' },
      { linkText: 'Terms & Conditions', linkUrl: '#' },
      { linkText: 'Cookie Settings', linkUrl: '#' }
    ]
  };

  // Process block content for authoring data
  const rows = [...block.children];
  let footerColumnsArray = [];
  let legalLinksArray = [];
  let socialLinksArray = [];
  let currentColumn = null;
  let currentSection = '';
  
  rows.forEach((row, index) => {
    const cells = [...row.children];
    
    if (cells.length >= 2) {
      const field = cells[0].textContent.trim();
      const value = cells[1].textContent.trim();
      
      // Handle simple text fields
      switch (field) {
        case 'Newsletter Label':
          data.newsletterLabel = value;
          break;
        case 'Newsletter Placeholder':
          data.newsletterPlaceholder = value;
          break;
        case 'Newsletter Button Text':
          data.newsletterButtonText = value;
          break;
        case 'Social Label':
          data.socialLabel = value;
          break;
        case 'Global Text':
          data.globalText = value;
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
            footerColumnsArray.push({ columnTitle, links });
          } else if (field.startsWith('Legal ')) {
            // Parse legal links - format: "Legal Link Name" | "URL"
            const linkText = field.replace('Legal ', '');
            legalLinksArray.push({ linkText, linkUrl: value });
          } else if (field.startsWith('Social ')) {
            // Parse social links - format: "Social Platform" | "URL"
            const platform = field.replace('Social ', '').toLowerCase();
            socialLinksArray.push({ platform, url: value });
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
            footerColumnsArray.push({ columnTitle, links });
          } else if (key.startsWith('Legal:')) {
            const linkText = key.replace('Legal:', '').trim();
            legalLinksArray.push({ linkText, linkUrl: value });
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
  const platformIcons = {
    facebook: 'icon-facebook.svg',
    x: 'icon-x.svg',
    discord: 'icon-discord.svg',
    youtube: 'icon-youtube.svg',
    twitch: 'icon-twitch.svg',
    instagram: 'icon-instagram.svg',
    tiktok: 'icon-tiktok.svg',
    thread: 'icon-thread.svg'
  };

  const platformLabels = {
    facebook: 'Facebook',
    x: 'Twitter',
    discord: 'Discord',
    youtube: 'YouTube',
    twitch: 'Twitch',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    thread: 'Threads'
  };

  const socialIconsHTML = socialLinks.map(link => `
    <li>
      <a href="${link.url}" target="_blank" aria-label="Follow us on ${platformLabels[link.platform]} (open a new window)">
        <img src="/icons/social/${platformIcons[link.platform]}" alt="" width="40" height="40">
      </a>
    </li>
  `).join('');

  return `
    <div class='social'>
      <small class="text-social">${socialLabel}</small>
      <nav aria-label="Social media">
        <ul class='social__icons p-0 m-0'>
          ${socialIconsHTML}
        </ul>
      </nav>
    </div>
  `;
}

function buildFooterColumns(footerColumns) {
  return footerColumns.map(column => `
    <ul class='footer-links__column pl-0'>
      <li><p class="w-500">${column.columnTitle}</p></li>
      ${column.links.map(link => `<li><a href='${link.linkUrl}'>${link.linkText}</a></li>`).join('')}
    </ul>
  `).join('');
}

function buildLegalLinks(legalLinks) {
  return legalLinks.map(link => `
    <a href='${link.linkUrl}' target="_blank" aria-label="View ${link.linkText} (open a new window)">${link.linkText}</a>
  `).join('');
}

export default function decorate(block) {
  const data = parseFooterData(block);

  // Create the footer structure using parsed data
  const footerHTML = `
    <div class='cmp-experiencefragment'>
      <div class='cmp-container container'>
        <div class="footer-grid">
          <!-- Left Column -->
          <div class="footer-left">
            <form class='newsletter' method="post" aria-label="Newsletter signup">
              <label for="newsletter-email">${data.newsletterLabel}</label>
              <div class='newsletter__form mt-4'>
                <input type='email' id="newsletter-email" name="email" placeholder='${data.newsletterPlaceholder}' required />
                <button type="submit" class="btn">${data.newsletterButtonText}</button>
              </div>
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
          <span><img src="/icons/Global.svg" alt="Global">${data.globalText}</span>
          <nav class='footer-bottom__links' aria-label="Legal links">
            ${buildLegalLinks(data.legalLinks)}
          </nav>
        </div>
      </div>
    </div>
  `;

  // Clear existing content and add the footer structure
  block.innerHTML = footerHTML;
  block.classList.add('experiencefragment');

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
}
