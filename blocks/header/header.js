function parseHeaderData(block) {
  // Initialize empty data structure - values will only come from actual authoring
  const data = {
    logos: [],
    navigationItems: [],
    showSearch: false,
    showProfile: false,
    showCart: false,
    profileMenuItems: [],
    profileMenuLoggedInItems: [],
    searchPlaceholder: '',
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
    // Use parsed HTML data - only populate if actual content exists
    if (parsedFromHTML.logos && parsedFromHTML.logos.length > 0) {
      data.logos = parsedFromHTML.logos;
    }
    if (parsedFromHTML.navigationItems && parsedFromHTML.navigationItems.length > 0) {
      data.navigationItems = parsedFromHTML.navigationItems;
    }
    if (parsedFromHTML.profileMenuItems && parsedFromHTML.profileMenuItems.length > 0) {
      data.profileMenuItems = parsedFromHTML.profileMenuItems;
    }
    if (parsedFromHTML.profileMenuLoggedInItems && parsedFromHTML.profileMenuLoggedInItems.length > 0) {
      data.profileMenuLoggedInItems = parsedFromHTML.profileMenuLoggedInItems;
    }
    // Set boolean flags from parsed HTML
    if (typeof parsedFromHTML.showSearch === 'boolean') {
      data.showSearch = parsedFromHTML.showSearch;
    }
    if (typeof parsedFromHTML.showProfile === 'boolean') {
      data.showProfile = parsedFromHTML.showProfile;
    }
    if (typeof parsedFromHTML.showCart === 'boolean') {
      data.showCart = parsedFromHTML.showCart;
    }
  }

  // Override with Universal Editor model data if available
  if (block.dataset && (block.dataset.model || block.dataset.aueModel)) {
    const modelData = block.dataset.aueModel ? JSON.parse(block.dataset.aueModel) : {};
    
    console.log('Universal Editor Model Data:', modelData);
    
    // Parse individual logo fields - only use UE authoring values
    // Initialize logos array if needed
    if (data.logos.length === 0) {
      data.logos = [
        { name: 'asus', icon: '', altText: 'ASUS Logo', url: '#', width: '87', height: '20' },
        { name: 'rog', icon: '', altText: 'ROG Logo', url: '#', width: '135', height: '26' },
        { name: 'gaming', icon: '', altText: 'Gaming PC Custom Builder Logo', url: '#', width: '104', height: '22' }
      ];
    }
    
    if (modelData.asusLogoImage || modelData.asusLogoAltText || modelData.asusLogoUrl) {
      if (!data.logos[0]) data.logos[0] = { name: 'asus', icon: '', altText: 'ASUS Logo', url: '#', width: '87', height: '20' };
      data.logos[0] = {
        name: 'asus',
        icon: modelData.asusLogoImage || data.logos[0].icon,
        altText: modelData.asusLogoAltText || data.logos[0].altText,
        url: modelData.asusLogoUrl || data.logos[0].url,
        width: data.logos[0].width,
        height: data.logos[0].height
      };
    }
    
    if (modelData.rogLogoImage || modelData.rogLogoAltText || modelData.rogLogoUrl) {
      if (!data.logos[1]) data.logos[1] = { name: 'rog', icon: '', altText: 'ROG Logo', url: '#', width: '135', height: '26' };
      data.logos[1] = {
        name: 'rog',
        icon: modelData.rogLogoImage || data.logos[1].icon,
        altText: modelData.rogLogoAltText || data.logos[1].altText,
        url: modelData.rogLogoUrl || data.logos[1].url,
        width: data.logos[1].width,
        height: data.logos[1].height
      };
    }
    
    if (modelData.gamingPcLogoImage || modelData.gamingPcLogoAltText || modelData.gamingPcLogoUrl) {
      if (!data.logos[2]) data.logos[2] = { name: 'gaming', icon: '', altText: 'Gaming PC Custom Builder Logo', url: '#', width: '104', height: '22' };
      data.logos[2] = {
        name: 'gaming',
        icon: modelData.gamingPcLogoImage || data.logos[2].icon,
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
    
    console.log('HTML parsing debug:', {
      blockHTML: block.innerHTML.substring(0, 500),
      contentDivsLength: contentDivs.length,
      allDivs: block.querySelectorAll('div').length,
      allPs: block.querySelectorAll('p').length
    });
    
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
      profileIcon: null,
      hamburgerIcon: null,
      closeIcon: null,
      arrowLeftIcon: null,
      arrowRightIcon: null,
      profileMenuItems: [],
      profileMenuLoggedInItems: []
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
    
    // Process divs according to the new mapping:
    // 1st div > href link for logos
    // 2nd div > ASUS Logo Alt Text
    // 3rd div > ASUS Logo Image
    // 4th div > ROG Logo Alt Text
    // 5th div > ROG Logo Image
    // 6th div > Gaming PC Logo Alt Text
    // 7th div > Gaming PC Logo Image
    // 8th div > Navigation Links
    // 9th div > profileMenuItems (always visible)
    // 10th div > profileMenuLoggedInItems (only visible when user logs in)
    
    for (let index = 0; index < contentDivs.length && index < 10; index++) {
      const div = contentDivs[index];
      const textContent = div.textContent?.trim();
      
      if (index === 0) {
        // 1st div: href link for logos
        const buttonContainer = div.querySelector('.button-container a');
        if (buttonContainer) {
          const href = buttonContainer.getAttribute('href');
          if (href) {
            // Apply the same URL to all logos
            parsedData.logos.forEach(logo => {
              logo.url = href;
            });
          }
        }
      } else if (index === 1) {
        // 2nd div: ASUS Logo Alt Text
        if (textContent) {
          parsedData.logos[0].altText = textContent;
        }
      } else if (index === 2) {
        // 3rd div: ASUS Logo Image
        const picture = div.querySelector('picture img');
        if (picture) {
          const src = picture.getAttribute('src');
          const width = picture.getAttribute('width');
          const height = picture.getAttribute('height');
          
          if (src) {
            parsedData.logos[0].icon = src;
            if (width) parsedData.logos[0].width = width;
            if (height) parsedData.logos[0].height = height;
          }
        }
      } else if (index === 3) {
        // 4th div: ROG Logo Alt Text
        if (textContent) {
          parsedData.logos[1].altText = textContent;
        }
      } else if (index === 4) {
        // 5th div: ROG Logo Image
        const picture = div.querySelector('picture img');
        if (picture) {
          const src = picture.getAttribute('src');
          const width = picture.getAttribute('width');
          const height = picture.getAttribute('height');
          
          if (src) {
            parsedData.logos[1].icon = src;
            if (width) parsedData.logos[1].width = width;
            if (height) parsedData.logos[1].height = height;
          }
        }
      } else if (index === 5) {
        // 6th div: Gaming PC Logo Alt Text
        if (textContent) {
          parsedData.logos[2].altText = textContent;
        }
      } else if (index === 6) {
        // 7th div: Gaming PC Logo Image
        const picture = div.querySelector('picture img');
        if (picture) {
          const src = picture.getAttribute('src');
          const width = picture.getAttribute('width');
          const height = picture.getAttribute('height');
          
          if (src) {
            parsedData.logos[2].icon = src;
            if (width) parsedData.logos[2].width = width;
            if (height) parsedData.logos[2].height = height;
          }
        }
      } else if (index === 7) {
        // 8th div: Navigation Links
        const navList = div.querySelector('ul');
        if (navList) {
          const navItems = navList.querySelectorAll('li a');
          parsedData.navigationItems = Array.from(navItems).map(link => ({
            linkText: link.textContent?.trim() || '',
            linkUrl: link.getAttribute('href') || '#'
          }));
        }
      } else if (index === 8) {
        // 9th div: profileMenuItems (always visible)
        const profileList = div.querySelector('ul');
        if (profileList) {
          const profileItems = profileList.querySelectorAll('li a');
          parsedData.profileMenuItems = Array.from(profileItems).map(link => ({
            linkText: link.textContent?.trim() || '',
            linkUrl: link.getAttribute('href') || '#'
          }));
        }
      } else if (index === 9) {
        // 10th div: profileMenuLoggedInItems (only visible when user logs in)
        const loggedInList = div.querySelector('ul');
        if (loggedInList) {
          const loggedInItems = loggedInList.querySelectorAll('li a');
          parsedData.profileMenuLoggedInItems = Array.from(loggedInItems).map(link => ({
            linkText: link.textContent?.trim() || '',
            linkUrl: link.getAttribute('href') || '#'
          }));
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
    return [];
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
    
    // Render logo structure even if icon source is missing
    // This ensures consistent display between published site and UE authoring
    const logoContent = iconSrc ? 
      `<img src="${iconSrc}" alt="${altText}" class="logo-default" width="${width}" height="${height}" />` :
      `<span class="logo-placeholder" aria-label="${altText}" title="${altText}">${logo.name.toUpperCase()}</span>`;
    
    return `
      <div class="logo-item logo-item--${logo.name}">
        <div class="logo-wrapper">
          <a href="${logoUrl}" aria-label="${altText}" title="${altText}">
            ${logoContent}
          </a>
        </div>
      </div>
    `;
  }).join('');

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

function buildNavigation(navigationItems, showSearch, showProfile, showCart, profileMenuItems, profileMenuLoggedInItems, icons) {
  // Check if user is logged in (same logic as in webpack implementation)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName') || 'User Name';
  
  const navItems = navigationItems.map(item => `
    <li class="cmp-sitenavigation__item">
      <a class="cmp-sitenavigation__item-link" href="${item.linkUrl}">${item.linkText}</a>
    </li>
  `).join('');

  const searchIcon = showSearch ? `
    <li class="cmp-sitenavigation__item cmp-sitenavigation__item--search">
      <a class="cmp-sitenavigation__item-link" href="/" aria-label="Search">
        <span class="icon icon--search"></span>
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
          <span class="icon icon--cart"></span>
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
            <span class="icon icon--close"></span>
          </button>
          <div class="cart-content">
            <h4 id="mini-cart-title" class="cart-summary">Your cart is empty.</h4>
            ${!isLoggedIn ? `
              <div class="cart-signin-message">
                <a href="#" class="cart-signin-link" id="cart-signin-link">Sign in</a> to see if you have any saved items
              </div>
            ` : `
              <div class="cart-empty-message">
                <p>Start shopping to add items to your cart</p>
              </div>
            `}
          </div>
        </div>
      </div>
    </li>
  ` : '';

  // Combine profile menu items: existing + logged-in items when logged in
  const currentProfileMenuItems = isLoggedIn 
    ? [...profileMenuItems, ...(profileMenuLoggedInItems || [])]
    : profileMenuItems;

  const profileMenuHTML = currentProfileMenuItems.map((item, index) => `
    <li class="profile-menu__item" data-menu-index="${index}"><a href="${item.linkUrl}">${item.linkText}</a></li>
  `).join('');

  // Add user name element when logged in
  const userNameElement = isLoggedIn ? `
    <li class="profile-menu__user-name" style="white-space: nowrap; font-weight: 600; color: var(--color-primary-950); padding: 8px 16px; border-bottom: 1px solid var(--color-primary-300); margin-bottom: 4px;">${userName}</li>
  ` : '';

  const profileIcon = showProfile ? `
    <li class="cmp-sitenavigation__item cmp-sitenavigation__item--profile">
      <div class="profile-dropdown">
        <button class="cmp-sitenavigation__item-link profile-toggle ${isLoggedIn ? 'logged-in' : ''}" aria-label="Member Account" aria-expanded="false">
          <span class="icon icon--profile"></span>
        </button>
        <ul class="profile-menu">
          <li class="profile-menu__header">
            <button class="profile-menu__close" aria-label="Close profile menu">
              <span class="icon icon--close"></span>
            </button>
          </li>
          ${userNameElement}
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
              <span class="icon icon--hamburger"></span>
              <span class="icon icon--close"></span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  `;
}

function buildMobileMenu(navigationItems, showSearch, profileMenuItems, profileMenuLoggedInItems, searchPlaceholder, icons) {
  // Check if user is logged in (same logic as in webpack implementation)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  const mobileNavItems = navigationItems.map(item => `
    <li><a href="${item.linkUrl}" class="px-6">${item.linkText}</a></li>
  `).join('');

  const mobileSearch = showSearch ? `
    <li class="px-6">
      <div class="mobile-search">
        <span class="icon icon--search"></span>
        <input type="text" placeholder="${searchPlaceholder}" title="${searchPlaceholder}"/>
      </div>
    </li>
  ` : '';

  // Combine profile menu items: existing + logged-in items when logged in (same as desktop)
  const currentMobileProfileMenuItems = isLoggedIn 
    ? [...profileMenuItems, ...(profileMenuLoggedInItems || [])]
    : profileMenuItems;

  const mobileProfileItems = currentMobileProfileMenuItems.map((item, index) => `
    <li data-mobile-menu-index="${index}"><a href="${item.linkUrl}">${item.linkText}</a></li>
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
              <span class="icon icon--profile"></span>
              <span class="profile">My Account</span>
              <span class="icon icon--arrow-right arrow-icon"></span>
            </button>
            <div class="mobile-account-submenu">
              <div class="submenu-header">
                <button class="back-button" aria-label="Back">
                  <span class="icon icon--arrow-left"></span>
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

// Mock login function
function mockLogin() {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userName', 'John Doe');
  console.log('Mock login successful');
}

// Mock logout function
function mockLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userName');
  console.log('Mock logout successful');
}

// Refresh header function to re-render with current login state
function refreshHeader(block) {
  // Use stored original data instead of re-parsing from modified DOM
  let data;
  if (block._originalHeaderData) {
    // Use stored original data as base
    data = { ...block._originalHeaderData };
    
    // Still check for Universal Editor model updates
    if (block.dataset && (block.dataset.model || block.dataset.aueModel)) {
      const modelData = block.dataset.aueModel ? JSON.parse(block.dataset.aueModel) : {};
      
      // Apply any UE model updates to the stored data
      if (modelData.asusLogoImage || modelData.asusLogoAltText || modelData.asusLogoUrl) {
        if (!data.logos[0]) data.logos[0] = { name: 'asus', icon: '', altText: 'ASUS Logo', url: '#', width: '87', height: '20' };
        data.logos[0] = {
          name: 'asus',
          icon: modelData.asusLogoImage || data.logos[0].icon,
          altText: modelData.asusLogoAltText || data.logos[0].altText,
          url: modelData.asusLogoUrl || data.logos[0].url,
          width: data.logos[0].width,
          height: data.logos[0].height
        };
      }
      
      if (modelData.rogLogoImage || modelData.rogLogoAltText || modelData.rogLogoUrl) {
        if (!data.logos[1]) data.logos[1] = { name: 'rog', icon: '', altText: 'ROG Logo', url: '#', width: '135', height: '26' };
        data.logos[1] = {
          name: 'rog',
          icon: modelData.rogLogoImage || data.logos[1].icon,
          altText: modelData.rogLogoAltText || data.logos[1].altText,
          url: modelData.rogLogoUrl || data.logos[1].url,
          width: data.logos[1].width,
          height: data.logos[1].height
        };
      }
      
      if (modelData.gamingPcLogoImage || modelData.gamingPcLogoAltText || modelData.gamingPcLogoUrl) {
        if (!data.logos[2]) data.logos[2] = { name: 'gaming', icon: '', altText: 'Gaming PC Custom Builder Logo', url: '#', width: '104', height: '22' };
        data.logos[2] = {
          name: 'gaming',
          icon: modelData.gamingPcLogoImage || data.logos[2].icon,
          altText: modelData.gamingPcLogoAltText || data.logos[2].altText,
          url: modelData.gamingPcLogoUrl || data.logos[2].url,
          width: data.logos[2].width,
          height: data.logos[2].height
        };
      }
      
      if (modelData.navLinks) {
        data.navigationItems = parseNavLinks(modelData.navLinks);
      }
      
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
  } else {
    // Fallback to parsing if no stored data (shouldn't happen in normal flow)
    data = parseHeaderData(block);
  }
  
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
            ${buildNavigation(data.navigationItems, data.showSearch, data.showProfile, data.showCart, data.profileMenuItems, data.profileMenuLoggedInItems, icons)}
          </div>
        </div>
      </header>
      ${buildMobileMenu(data.navigationItems, data.showSearch, data.profileMenuItems, data.profileMenuLoggedInItems, data.searchPlaceholder, icons)}
    </div>
  `;

  // Clear existing content and add the header structure
  block.innerHTML = headerHTML;
  
  // Re-initialize header functionality
  initializeHeader(block);
}

export default function decorate(block) {
  const data = parseHeaderData(block);

  // Store original parsed data for use in refreshHeader function
  // This prevents the need to re-parse from modified DOM during refresh
  block._originalHeaderData = { ...data };

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
            ${buildNavigation(data.navigationItems, data.showSearch, data.showProfile, data.showCart, data.profileMenuItems, data.profileMenuLoggedInItems, icons)}
          </div>
        </div>
      </header>
      ${buildMobileMenu(data.navigationItems, data.showSearch, data.profileMenuItems, data.profileMenuLoggedInItems, data.searchPlaceholder, icons)}
    </div>
  `;

  // Clear existing content and add the header structure
  block.innerHTML = headerHTML;
  block.classList.add('experiencefragment');

  // Add header functionality
  initializeHeader(block);
}

function initializeHeader(block) {
  // Get current login state and profile menu data
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Use stored original data instead of re-parsing from modified DOM
  const data = block._originalHeaderData || {};
  const profileMenuItems = data.profileMenuItems || [];
  const profileMenuLoggedInItems = data.profileMenuLoggedInItems || [];
  
  // Calculate combined menu items for logged-in state
  const combinedMenuItems = isLoggedIn 
    ? [...profileMenuItems, ...profileMenuLoggedInItems]
    : profileMenuItems;

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

  // Mock Login/Logout functionality for desktop profile menu
  const profileMenuItemElements = block.querySelectorAll('.profile-menu__item[data-menu-index]');
  
  console.log('Debug info:', {
    isLoggedIn,
    profileMenuItems: profileMenuItems.map(item => item.linkText),
    profileMenuLoggedInItems: profileMenuLoggedInItems.map(item => item.linkText),
    combinedMenuItems: combinedMenuItems.map(item => item.linkText),
    totalElements: profileMenuItemElements.length
  });
  
  profileMenuItemElements.forEach((item, index) => {
    const link = item.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        console.log('Desktop menu clicked:', { 
          index, 
          isLoggedIn, 
          combinedMenuLength: combinedMenuItems.length, 
          linkText: link.textContent,
          isFirstItem: index === 0
        });
        
        if (index === 0) {
          if (!isLoggedIn) {
            // First item when not logged in - trigger login
            console.log('Triggering login');
            mockLogin();
            refreshHeader(block);
          } else {
            // First item when logged in - trigger logout
            console.log('Triggering logout (first item when logged in)');
            mockLogout();
            refreshHeader(block);
          }
        } else {
          console.log('No action for this menu item');
        }
        // For other items, you can add actual navigation logic here
      });
    }
  });

  // Mock Login/Logout functionality for mobile profile menu
  const mobileProfileMenuItems = block.querySelectorAll('.submenu-items li[data-mobile-menu-index]');
  mobileProfileMenuItems.forEach((item, index) => {
    const link = item.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        console.log('Mobile menu clicked:', { index, isLoggedIn, combinedMenuLength: combinedMenuItems.length, linkText: link.textContent });
        
        if (index === 0) {
          if (!isLoggedIn) {
            // First item when not logged in - trigger login
            console.log('Triggering mobile login');
            mockLogin();
            refreshHeader(block);
          } else {
            // First item when logged in - trigger logout
            console.log('Triggering mobile logout (first item when logged in)');
            mockLogout();
            refreshHeader(block);
          }
        } else {
          console.log('No action for this mobile menu item');
        }
        // For other items, you can add actual navigation logic here
      });
    }
  });

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

  // Cart sign-in link functionality
  const cartSigninLink = block.querySelector('#cart-signin-link');
  if (cartSigninLink) {
    cartSigninLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Cart sign-in clicked');
      mockLogin();
      refreshHeader(block);
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
