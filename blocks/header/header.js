function parseHeaderData(block) {
  // Default data structure based on the screenshot and webpack template
  const data = {
    logoAlt: 'ASUS Logo',
    logoUrl: '/',
    logos: [
      { name: 'asus', icon: '/icons/logo-asus.svg', altText: 'ASUS Logo', width: '87', height: '20' },
      { name: 'rog', icon: '/icons/logo-rog.svg', altText: 'ROG Logo', width: '135', height: '26' },
      { name: 'gaming', icon: '/icons/gaming_pc_logo.svg', altText: 'Gaming PC Custom Builder Logo', width: '104', height: '22' }
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
    searchIcon: '/icons/search.svg',
    cartIcon: '/icons/cart.svg',
    profileIcon: '/icons/profile.svg',
    hamburgerIcon: '/icons/hamburger.svg',
    closeIcon: '/icons/close.svg',
    arrowLeftIcon: '/icons/arrow-left.svg',
    arrowRightIcon: '/icons/arrow-right.svg'
  };

  // Check if block has UE model data or fallback to table parsing
  if (block.dataset && (block.dataset.model || block.dataset.aueModel)) {
    // UE model data - will be populated by Universal Editor
    const modelData = block.dataset.aueModel ? JSON.parse(block.dataset.aueModel) : {};
    
    if (modelData.logoAlt) data.logoAlt = modelData.logoAlt;
    if (modelData.logoUrl) data.logoUrl = modelData.logoUrl;
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
    if (modelData.logos && Array.isArray(modelData.logos)) {
      data.logos = modelData.logos;
    }
    if (modelData.navigationItems && Array.isArray(modelData.navigationItems)) {
      data.navigationItems = modelData.navigationItems;
    }
    if (modelData.profileMenuItems && Array.isArray(modelData.profileMenuItems)) {
      data.profileMenuItems = modelData.profileMenuItems;
    }
  } else {
    // Fallback to table parsing for backwards compatibility
    const rows = [...block.children];
    let navigationArray = [];
    let profileMenuArray = [];
    
    rows.forEach((row, index) => {
      const cells = [...row.children];
      
      if (cells.length >= 2) {
        const field = cells[0].textContent.trim();
        const value = cells[1].textContent.trim();
        
        // Handle simple text fields
        switch (field) {
          case 'Logo Alt':
            data.logoAlt = value;
            break;
          case 'Logo URL':
            data.logoUrl = value;
            break;
          case 'Search Placeholder':
            data.searchPlaceholder = value;
            break;
          case 'Show Search':
            data.showSearch = value.toLowerCase() === 'true';
            break;
          case 'Show Profile':
            data.showProfile = value.toLowerCase() === 'true';
            break;
          case 'Show Cart':
            data.showCart = value.toLowerCase() === 'true';
            break;
          default:
            // Handle complex structured data
            if (field.startsWith('Nav ')) {
              // Parse navigation items - format: "Nav Item" | "URL"
              const linkText = field.replace('Nav ', '');
              navigationArray.push({ linkText, linkUrl: value });
            } else if (field.startsWith('Profile ')) {
              // Parse profile menu items - format: "Profile Item" | "URL"
              const linkText = field.replace('Profile ', '');
              profileMenuArray.push({ linkText, linkUrl: value });
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
            
            if (key.startsWith('Nav:')) {
              const linkText = key.replace('Nav:', '').trim();
              navigationArray.push({ linkText, linkUrl: value });
            } else if (key.startsWith('Profile:')) {
              const linkText = key.replace('Profile:', '').trim();
              profileMenuArray.push({ linkText, linkUrl: value });
            }
          }
        }
      }
    });

    // Update arrays if they have content
    if (navigationArray.length > 0) {
      data.navigationItems = navigationArray;
    }
    if (profileMenuArray.length > 0) {
      data.profileMenuItems = profileMenuArray;
    }
  }

  return data;
}

function buildLogo(logoAlt, logoUrl, logos) {
  const logoItems = logos.map(logo => {
    const iconSrc = logo.icon || `/icons/logo-${logo.name}.svg`;
    const altText = logo.altText || logoAlt;
    const width = logo.width || 'auto';
    const height = logo.height || 'auto';
    
    return `
      <div class="logo-item logo-item--${logo.name}">
        <div class="logo-wrapper">
          <img src="${iconSrc}" alt="${altText}" class="logo-default" width="${width}" height="${height}" />
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="navigation">
      <nav class="cmp-navigation" itemscope itemtype="http://schema.org/SiteNavigationElement" aria-label="Main Navigation">
        <a href="${logoUrl}" aria-label="${logoAlt}" title="${logoAlt}" class="cmp-navigation__item--logo">
          ${logoItems}
        </a>
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
            ${buildLogo(data.logoAlt, data.logoUrl, data.logos)}
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
