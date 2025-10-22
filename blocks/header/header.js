function parseHeaderData(block) {
  // Initialize default data structure - values will come from UE authoring
  const data = {
    logos: [
      { 
        name: 'asus', 
        icon: '', 
        altText: 'ASUS Logo', 
        url: '#',
        width: '87', 
        height: '20' 
      },
      { 
        name: 'rog', 
        icon: '', 
        altText: 'ROG Logo', 
        url: '#',
        width: '135', 
        height: '26' 
      },
      { 
        name: 'gaming', 
        icon: '', 
        altText: 'Gaming PC Custom Builder Logo', 
        url: '#',
        width: '104', 
        height: '22' 
      }
    ],
    navigationItems: [
      { linkText: 'All Desktops', linkUrl: '/product-listing.html' },
      { linkText: 'Help Me Choose', linkUrl: '/help-me-choose.html' },
      { linkText: 'News & Articles', linkUrl: '/news-articles.html' }
    ],
    showSearch: true,
    showProfile: true,
    showCart: true,
    profileMenuItems: [
      { linkText: 'Login', linkUrl: '#' },
      { linkText: 'My Account', linkUrl: '#' },
      { linkText: 'Product Registration', linkUrl: '#' },
      { linkText: 'Check My Order', linkUrl: '#' },
      { linkText: 'My Wishlist', linkUrl: '#' },
      { linkText: 'Sign out', linkUrl: '#' }
    ],
    searchPlaceholder: 'Enter keywords',
    searchIcon: '',
    cartIcon: '',
    profileIcon: '',
    hamburgerIcon: '',
    closeIcon: '',
    arrowLeftIcon: '',
    arrowRightIcon: ''
  };

  // First try to parse from HTML content structure
  const parsedFromHTML = parseHTMLContent(block);
  if (parsedFromHTML) {
    // Merge parsed HTML data with defaults
    if (parsedFromHTML.logos && parsedFromHTML.logos.length > 0) {
      data.logos = parsedFromHTML.logos;
    }
    if (parsedFromHTML.navigationItems && parsedFromHTML.navigationItems.length > 0) {
      data.navigationItems = parsedFromHTML.navigationItems;
    }
    if (typeof parsedFromHTML.showSearch === 'boolean') {
      data.showSearch = parsedFromHTML.showSearch;
    }
    if (typeof parsedFromHTML.showProfile === 'boolean') {
      data.showProfile = parsedFromHTML.showProfile;
    }
    if (typeof parsedFromHTML.showCart === 'boolean') {
      data.showCart = parsedFromHTML.showCart;
    }
    if (parsedFromHTML.searchIcon) data.searchIcon = parsedFromHTML.searchIcon;
    if (parsedFromHTML.cartIcon) data.cartIcon = parsedFromHTML.cartIcon;
    if (parsedFromHTML.profileIcon) data.profileIcon = parsedFromHTML.profileIcon;
  }

  // Override with Universal Editor model data if available
  if (block.dataset && (block.dataset.model || block.dataset.aueModel)) {
    const modelData = block.dataset.aueModel ? JSON.parse(block.dataset.aueModel) : {};
    
    console.log('Universal Editor Model Data:', modelData);
    
    // Parse individual logo fields - only use UE authoring values
    if (modelData.asusLogoImage || modelData.asusLogoAltText || modelData.asusLogoUrl) {
      data.logos[0] = {
        name: 'asus',
        icon: modelData.asusLogoImage || '',
        altText: modelData.asusLogoAltText || data.logos[0].altText,
        url: modelData.asusLogoUrl || data.logos[0].url,
        width: data.logos[0].width,
        height: data.logos[0].height
      };
    }
    
    if (modelData.rogLogoImage || modelData.rogLogoAltText || modelData.rogLogoUrl) {
      data.logos[1] = {
        name: 'rog',
        icon: modelData.rogLogoImage || '',
        altText: modelData.rogLogoAltText || data.logos[1].altText,
        url: modelData.rogLogoUrl || data.logos[1].url,
        width: data.logos[1].width,
        height: data.logos[1].height
      };
    }
    
    if (modelData.gamingPcLogoImage || modelData.gamingPcLogoAltText || modelData.gamingPcLogoUrl) {
      data.logos[2] = {
        name: 'gaming',
        icon: modelData.gamingPcLogoImage || '',
        altText: modelData.gamingPcLogoAltText || data.logos[2].altText,
        url: modelData.gamingPcLogoUrl || data.logos[2].url,
        width: data.logos[2].width,
        height: data.logos[2].height
      };
    }
    
    // Parse navigation links from textarea
    if (modelData.navLinks) {
      data.navigationItems = parseNavLinks(modelData.navLinks);
    }
    
    // Parse other fields
    if (modelData.searchPlaceholder) data.searchPlaceholder = modelData.searchPlaceholder;
    if (typeof modelData.showSearch === 'boolean') data.showSearch = modelData.showSearch;
    if (typeof modelData.showProfile === 'boolean') data.showProfile = modelData.showProfile;
    if (typeof modelData.showCart === 'boolean') data.showCart = modelData.showCart;
    if (modelData.searchIcon) data.searchIcon = modelData.searchIcon;
    if (modelData.cartIcon) data.cartIcon = modelData.cartIcon;
    if (modelData.profileIcon) data.profileIcon = modelData.profileIcon;
    if (modelData.hamburgerIcon) data.hamburgerIcon = modelData.hamburgerIcon;
    if (modelData.closeIcon) data.closeIcon = modelData.closeIcon;
    if (modelData.arrowLeftIcon) data.arrowLeftIcon = modelData.arrowLeftIcon;
    if (modelData.arrowRightIcon) data.arrowRightIcon = modelData.arrowRightIcon;
    if (modelData.profileMenuItems && Array.isArray(modelData.profileMenuItems)) {
      data.profileMenuItems = modelData.profileMenuItems;
    }
  }

  console.log('Final parsed data:', data);
  return data;
}

function parseHTMLContent(block) {
  try {
    // Get all div elements that contain the structured data
    const contentDivs = block.querySelectorAll('div > p > div');
    
    if (!contentDivs || contentDivs.length === 0) {
      console.log('No content divs found in HTML structure');
      return null;
    }

    const parsedData = {
      logos: [],
      navigationItems: [],
      showSearch: true,
      showProfile: true,
      showCart: true,
      searchIcon: null,
      cartIcon: null,
      profileIcon: null
    };

    const logoNames = ['asus', 'rog', 'gaming'];
    
    // Initialize logos array
    logoNames.forEach((name, index) => {
      parsedData.logos[index] = {
        name: name,
        icon: '',
        altText: `${name.toUpperCase()} Logo`,
        url: '#',
        width: index === 0 ? '87' : index === 1 ? '135' : '104',
        height: index === 0 ? '20' : index === 1 ? '26' : '22'
      };
    });
    
    // Process first 9 divs in groups of 3 for each logo (ASUS, ROG, Gaming)
    for (let logoIndex = 0; logoIndex < 3; logoIndex++) {
      const startIndex = logoIndex * 3;
      const endIndex = startIndex + 3;
      
      for (let divIndex = startIndex; divIndex < endIndex && divIndex < contentDivs.length; divIndex++) {
        const div = contentDivs[divIndex];
        const textContent = div.textContent?.trim();
        
        // Check for picture elements (logo images)
        const picture = div.querySelector('picture img');
        if (picture) {
          const src = picture.getAttribute('src');
          const width = picture.getAttribute('width');
          const height = picture.getAttribute('height');
          
          if (src) {
            parsedData.logos[logoIndex].icon = src;
            if (width) parsedData.logos[logoIndex].width = width;
            if (height) parsedData.logos[logoIndex].height = height;
          }
        }
        
        // Check for button containers with links (logo URLs)
        const buttonContainer = div.querySelector('.button-container a');
        if (buttonContainer) {
          const href = buttonContainer.getAttribute('href');
          if (href) {
            parsedData.logos[logoIndex].url = href;
          }
        }
        
        // Check for alt text content
        if (textContent && (textContent.toLowerCase().includes('logo') || textContent.toLowerCase().includes('alt'))) {
          parsedData.logos[logoIndex].altText = textContent;
        }
      }
    }
    
    // Process remaining divs for navigation and other elements
    for (let index = 9; index < contentDivs.length; index++) {
      const div = contentDivs[index];
      const textContent = div.textContent?.trim();
      
      // Check for navigation list
      const navList = div.querySelector('ul');
      if (navList) {
        const navItems = navList.querySelectorAll('li a');
        parsedData.navigationItems = Array.from(navItems).map(link => ({
          linkText: link.textContent?.trim() || '',
          linkUrl: link.getAttribute('href') || '#'
        }));
      }
      
      // Check for boolean values (show/hide flags)
      if (textContent === 'true' || textContent === 'false') {
        const boolValue = textContent === 'true';
        
        // Map boolean values to appropriate flags based on position
        if (index >= 12 && index <= 14) { // Adjusted positions after logo processing
          if (index === 12) parsedData.showSearch = boolValue;
          if (index === 13) parsedData.showProfile = boolValue;
          if (index === 14) parsedData.showCart = boolValue;
        }
      }
      
      // Check for icon images based on specific div indices
      const picture = div.querySelector('picture img');
      if (picture) {
        const src = picture.getAttribute('src');
        
        if (src) {
          // Map icons based on exact div positions
          if (index === 14) {
            parsedData.searchIcon = src;
          } else if (index === 15) {
            parsedData.cartIcon = src;
          } else if (index === 16) {
            parsedData.profileIcon = src;
          } else if (index === 17) {
            parsedData.hamburgerIcon = src;
          } else if (index === 18) {
            parsedData.closeIcon = src;
          } else if (index === 19) {
            parsedData.arrowLeftIcon = src;
          } else if (index === 20) {
            parsedData.arrowRightIcon = src;
          }
        }
      }
    }

    console.log('Parsed data from HTML:', parsedData);
    return parsedData;
    
  } catch (error) {
    console.error('Error parsing HTML content:', error);
    return null;
  }
}

function parseNavLinks(navLinksText) {
  if (!navLinksText || typeof navLinksText !== 'string') {
    return [
      { linkText: 'All Desktops', linkUrl: '/product-listing.html' },
      { linkText: 'Help Me Choose', linkUrl: '/help-me-choose.html' },
      { linkText: 'News & Articles', linkUrl: '/news-articles.html' }
    ];
  }
  
  return navLinksText.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [linkText, linkUrl] = line.split('|');
      return {
        linkText: linkText?.trim() || '',
        linkUrl: linkUrl?.trim() || '#'
      };
    })
    .filter(item => item.linkText); // Remove empty entries
}

function buildLogo(logos) {
  const logoItems = logos.map(logo => {
    const iconSrc = logo.icon || '';
    const altText = logo.altText || `${logo.name} Logo`;
    const width = logo.width || 'auto';
    const height = logo.height || 'auto';
    const logoUrl = logo.url || '#';
    
    // Only render logo if icon source is provided from UE authoring
    if (!iconSrc) {
      return '';
    }
    
    return `
      <div class="logo-item logo-item--${logo.name}">
        <div class="logo-wrapper">
          <a href="${logoUrl}" aria-label="${altText}" title="${altText}">
            <img src="${iconSrc}" alt="${altText}" class="logo-default" width="${width}" height="${height}" />
          </a>
        </div>
      </div>
    `;
  }).filter(item => item).join('');

  return `
    <div class="navigation">
      <nav class="cmp-navigation" itemscope itemtype="http://schema.org/SiteNavigationElement" aria-label="Main Navigation">
        <div class="cmp-navigation__item--logo">
          ${logoItems}
        </div>
      </nav>
    </div>
  `;
}

function buildNavigation(navigationItems, showSearch, showProfile, showCart, profileMenuItems, icons) {
  const navItems = navigationItems.map(item => `
    <li class="cmp-sitenavigation__item">
      <a class="cmp-sitenavigation__item-link" href="${item.linkUrl}">${item.linkText}</a>
    </li>
  `).join('');

  const searchIcon = showSearch ? `
    <li class="cmp-sitenavigation__item cmp-sitenavigation__item--search">
      <a class="cmp-sitenavigation__item-link" href="/" aria-label="Search">
        <img src="${icons.searchIcon}" alt="Search" class="icon icon--search" />
      </a>
    </li>
  ` : '';

  const cartIcon = showCart ? `
    <li class="cmp-sitenavigation__item cmp-sitenavigation__item--cart">
      <div class="mini-cart">
        <button 
          class="cmp-sitenavigation__item-link mini-cart-toggle"
          id="mini-cart-toggle"
          aria-label="Shopping cart"
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls="mini-cart-container"
        >
          <img src="${icons.cartIcon}" alt="Cart" class="icon icon--cart" />
        </button>
        <div 
          id="mini-cart-container"
          class="mini-cart-container"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="mini-cart-title" 
          aria-hidden="true"
        >
          <button class="mini-cart__close" aria-label="Close mini cart">
            <img src="${icons.closeIcon}" alt="Close" class="icon icon--close" />
          </button>
          <h4 id="mini-cart-title" class="cart-summary"></h4>
        </div>
      </div>
    </li>
  ` : '';

  const profileMenuHTML = profileMenuItems.map(item => `
    <li class="profile-menu__item"><a href="${item.linkUrl}">${item.linkText}</a></li>
  `).join('');

  const profileIcon = showProfile ? `
    <li class="cmp-sitenavigation__item cmp-sitenavigation__item--profile">
      <div class="profile-dropdown">
        <button class="cmp-sitenavigation__item-link profile-toggle logged-in" aria-label="Member Account" aria-expanded="false">
          <img src="${icons.profileIcon}" alt="Profile" class="icon icon--profile" />
        </button>
        <ul class="profile-menu">
          <li class="profile-menu__header">
            <button class="profile-menu__close" aria-label="Close profile menu">
              <img src="${icons.closeIcon}" alt="Close" class="icon icon--close" />
            </button>
          </li>
          ${profileMenuHTML}
        </ul>
      </div>
    </li>
  ` : '';

  return `
    <div class="sitenavigation">
      <nav class="cmp-sitenavigation" aria-label="Site Navigation">
        <ul class="cmp-sitenavigation__group cmp-sitenavigation__group--main">
          ${navItems}
        </ul>
        <ul class="cmp-sitenavigation__group cmp-sitenavigation__group--icons">
          ${searchIcon}
          ${cartIcon}
          ${profileIcon}
          <li class="cmp-sitenavigation__item cmp-sitenavigation__item--menu-toggle">
            <button id="header-hamburger-menu-toggle" class="btn btn-link" aria-label="Toggle Menu">
              <img src="${icons.hamburgerIcon}" alt="Menu" class="icon icon--hamburger" />
              <img src="${icons.closeIcon}" alt="Close" class="icon icon--close" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  `;
}

function buildMobileMenu(navigationItems, showSearch, profileMenuItems, searchPlaceholder, icons) {
  const mobileNavItems = navigationItems.map(item => `
    <li><a href="${item.linkUrl}" class="px-6">${item.linkText}</a></li>
  `).join('');

  const mobileSearch = showSearch ? `
    <li class="px-6">
      <div class="mobile-search">
        <img src="${icons.searchIcon}" alt="Search" class="icon icon--search" />
        <input type="text" placeholder="${searchPlaceholder}" title="${searchPlaceholder}"/>
      </div>
    </li>
  ` : '';

  const mobileProfileItems = profileMenuItems.map(item => `
    <li><a href="${item.linkUrl}">${item.linkText}</a></li>
  `).join('');

  return `
    <div class="mobile-menu-overlay" id="mobile-menu-dialog" aria-labelledby="mobile-menu-title" aria-hidden="true" data-a11y-dialog-native>
      <div class="mobile-menu-container">
        <div id="mobile-menu-title" class="sr-only">Mobile Navigation Menu</div>
        <ul class="mobile-menu">
          ${mobileNavItems}
          ${mobileSearch}
          <li class="mobile-account-section">
            <button class="mobile-account-toggle px-6 d-flex-align mobile-account-link" aria-expanded="false">
              <img src="${icons.profileIcon}" alt="Profile" class="icon icon--profile" />
              <span class="profile">My Account</span>
              <img src="${icons.arrowRightIcon}" alt="Arrow Right" class="icon icon--arrow-right arrow-icon" />
            </button>
            <div class="mobile-account-submenu">
              <div class="submenu-header">
                <button class="back-button" aria-label="Back">
                  <img src="${icons.arrowLeftIcon}" alt="Arrow Left" class="icon icon--arrow-left" />
                  <span class="submenu-title">My Account</span>
                </button>
              </div>
              <ul class="submenu-items">
                ${mobileProfileItems}
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `;
}

export default function decorate(block) {
  const data = parseHeaderData(block);

  // Create icons object for passing to build functions
  const icons = {
    searchIcon: data.searchIcon,
    cartIcon: data.cartIcon,
    profileIcon: data.profileIcon,
    hamburgerIcon: data.hamburgerIcon,
    closeIcon: data.closeIcon,
    arrowLeftIcon: data.arrowLeftIcon,
    arrowRightIcon: data.arrowRightIcon
  };

  // Create the header structure using parsed data
  const headerHTML = `
    <div class="header-wrapper">
      <header class="experiencefragment">
        <div class="cmp-experiencefragment">
          <div class="cmp-container cmp-header container">
            ${buildLogo(data.logos)}
            ${buildNavigation(data.navigationItems, data.showSearch, data.showProfile, data.showCart, data.profileMenuItems, icons)}
          </div>
        </div>
      </header>
      ${buildMobileMenu(data.navigationItems, data.showSearch, data.profileMenuItems, data.searchPlaceholder, icons)}
    </div>
  `;

  // Clear existing content and add the header structure
  block.innerHTML = headerHTML;
  block.classList.add('experiencefragment');

  // Add header functionality
  initializeHeader(block);
}

function initializeHeader(block) {
  // Mobile menu toggle
  const hamburgerToggle = block.querySelector('#header-hamburger-menu-toggle');
  const mobileMenuOverlay = block.querySelector('#mobile-menu-dialog');
  
  if (hamburgerToggle && mobileMenuOverlay) {
    hamburgerToggle.addEventListener('click', () => {
      const isExpanded = hamburgerToggle.getAttribute('aria-expanded') === 'true';
      hamburgerToggle.setAttribute('aria-expanded', !isExpanded);
      mobileMenuOverlay.setAttribute('aria-hidden', isExpanded);
      document.body.classList.toggle('mobile-menu-open', !isExpanded);
    });
  }

  // Profile dropdown
  const profileToggle = block.querySelector('.profile-toggle');
  const profileMenu = block.querySelector('.profile-menu');
  
  if (profileToggle && profileMenu) {
    profileToggle.addEventListener('click', () => {
      const isExpanded = profileToggle.getAttribute('aria-expanded') === 'true';
      profileToggle.setAttribute('aria-expanded', !isExpanded);
      profileMenu.classList.toggle('show', !isExpanded);
    });

    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!profileToggle.contains(e.target) && !profileMenu.contains(e.target)) {
        profileToggle.setAttribute('aria-expanded', 'false');
        profileMenu.classList.remove('show');
      }
    });
  }

  // Profile menu close button
  const profileClose = block.querySelector('.profile-menu__close');
  if (profileClose) {
    profileClose.addEventListener('click', () => {
      profileToggle.setAttribute('aria-expanded', 'false');
      profileMenu.classList.remove('show');
    });
  }

  // Mini cart toggle
  const miniCartToggle = block.querySelector('#mini-cart-toggle');
  const miniCartContainer = block.querySelector('#mini-cart-container');
  
  if (miniCartToggle && miniCartContainer) {
    miniCartToggle.addEventListener('click', () => {
      const isExpanded = miniCartToggle.getAttribute('aria-expanded') === 'true';
      miniCartToggle.setAttribute('aria-expanded', !isExpanded);
      miniCartContainer.setAttribute('aria-hidden', isExpanded);
      miniCartContainer.classList.toggle('show', !isExpanded);
    });
  }

  // Mini cart close button
  const miniCartClose = block.querySelector('.mini-cart__close');
  if (miniCartClose) {
    miniCartClose.addEventListener('click', () => {
      miniCartToggle.setAttribute('aria-expanded', 'false');
      miniCartContainer.setAttribute('aria-hidden', 'true');
      miniCartContainer.classList.remove('show');
    });
  }

  // Mobile account toggle
  const mobileAccountToggle = block.querySelector('.mobile-account-toggle');
  const mobileAccountSubmenu = block.querySelector('.mobile-account-submenu');
  const backButton = block.querySelector('.back-button');
  
  if (mobileAccountToggle && mobileAccountSubmenu) {
    mobileAccountToggle.addEventListener('click', () => {
      const isExpanded = mobileAccountToggle.getAttribute('aria-expanded') === 'true';
      mobileAccountToggle.setAttribute('aria-expanded', !isExpanded);
      mobileAccountSubmenu.classList.toggle('show', !isExpanded);
    });
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      mobileAccountToggle.setAttribute('aria-expanded', 'false');
      mobileAccountSubmenu.classList.remove('show');
    });
  }

  // Close mobile menu when clicking overlay
  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', (e) => {
      if (e.target === mobileMenuOverlay) {
        hamburgerToggle.setAttribute('aria-expanded', 'false');
        mobileMenuOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mobile-menu-open');
      }
    });
  }
}
