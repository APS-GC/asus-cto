import { createOptimizedPictureExternal, createOptimizedPicture, moveInstrumentation } from '../../scripts/scripts.js';
import {callSSOValidation} from '../../scripts/api-service.js'
// Header configuration - calculated once for the entire module
const HeaderConfig = {
  get baseUrl() {
    return window.asusCto?.baseUrl;
  },
  get shouldUseExternal() {
    return this.baseUrl && this.baseUrl !== window.location.origin;
  },
};

function parseNavLinks(navLinksText) {
  if (!navLinksText || typeof navLinksText !== 'string') {
    return [];
  }

  // Use HeaderConfig for baseUrl and shouldUseExternal
  const { baseUrl, shouldUseExternal } = HeaderConfig;

  return navLinksText.split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [linkText, linkUrl] = line.split('|');
      const href = linkUrl?.trim() || '#';
      return {
        linkText: linkText?.trim() || '',
        linkUrl: shouldUseExternal && href !== '#' ? `${baseUrl}${href}` : href,
      };
    })
    .filter((item) => item.linkText); // Remove empty entries
}

/**
 * Parses the header data from the block's HTML content.
 * @param {HTMLElement} block The header block element.
 */
function parseHTMLContent(block) {
  try {
    // Get all div elements that contain the structured data
    const contentDivs = block.querySelectorAll('div > div > div');

    // Use HeaderConfig for baseUrl and shouldUseExternal
    const { baseUrl, shouldUseExternal } = HeaderConfig;

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
      profileMenuLoggedInItems: [],
    };

    const logoNames = ['asus', 'rog', 'gaming'];

    // Initialize logos array
    logoNames.forEach((name, index) => {
      parsedData.logos[index] = {
        name,
        icon: '',
        altText: `${name.toUpperCase()} Logo`,
        url: '#',
        width: '104', // Default width
        height: '22', // Default height
      };
      if (index === 0) {
        parsedData.logos[index].width = '87';
        parsedData.logos[index].height = '20';
      } else if (index === 1) {
        parsedData.logos[index].width = '135';
        parsedData.logos[index].height = '26';
      }
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

    for (let index = 0; index < contentDivs.length && index < 10; index += 1) {
      const div = contentDivs[index];
      const textContent = div.textContent?.trim();

      if (index === 0) {
        // 1st div: href link for logos
        const buttonContainer = div.querySelector('a');
        if (buttonContainer) {
          const href = buttonContainer.getAttribute('href');
          if (href) {
            // Apply the same URL to all logos with baseUrl transformation
            parsedData.logos.forEach((logo) => {
              logo.url = shouldUseExternal && href !== '#' ? `${baseUrl}${href}` : href;
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
          parsedData.navigationItems = Array.from(navItems).map((link) => {
            const href = link.getAttribute('href') || '#';
            return {
              linkText: link.textContent?.trim() || '',
              linkUrl: shouldUseExternal && href !== '#' ? `${baseUrl}${href}` : href,
            };
          });
        }
      } else if (index === 8) {
        // 9th div: profileMenuItems (always visible)
        const profileList = div.querySelector('ul');
        if (profileList) {
          const profileItems = profileList.querySelectorAll('li a');
          parsedData.profileMenuItems = Array.from(profileItems).map((link) => {
            const href = link.getAttribute('href') || '#';
            return {
              linkText: link.textContent?.trim() || '',
              linkUrl: shouldUseExternal && href !== '#' ? `${baseUrl}${href}` : href,
            };
          });
        }
      } else if (index === 9) {
        // 10th div: profileMenuLoggedInItems (only visible when user logs in)
        const loggedInList = div.querySelector('ul');
        if (loggedInList) {
          const loggedInItems = loggedInList.querySelectorAll('li a');
          parsedData.profileMenuLoggedInItems = Array.from(loggedInItems).map((link) => {
            const href = link.getAttribute('href') || '#';
            return {
              linkText: link.textContent?.trim() || '',
              linkUrl: shouldUseExternal && href !== '#' ? `${baseUrl}${href}` : href,
            };
          });
        }
      }
    }

    return parsedData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing HTML content:', error);
    return null;
  }
}

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
    arrowRightIcon: '',
  };

  // First try to parse from HTML content structure
  const parsedFromHTML = parseHTMLContent(block); // eslint-disable-line no-use-before-define
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
  if (block.dataset && (block.dataset.model || block.dataset.aueModel)) { // eslint-disable-line no-undef
    const modelData = block.dataset.aueModel ? JSON.parse(block.dataset.aueModel) : {}; // eslint-disable-line no-undef

    // Parse individual logo fields - only use UE authoring values
    // Initialize logos array if needed
    if (data.logos.length === 0) {
      data.logos = [
        {
          name: 'asus', icon: '', altText: 'ASUS Logo', url: '#', width: '87', height: '20',
        },
        {
          name: 'rog', icon: '', altText: 'ROG Logo', url: '#', width: '135', height: '26',
        },
        {
          name: 'gaming', icon: '', altText: 'Gaming PC Custom Builder Logo', url: '#', width: '104', height: '22',
        },
      ];
    }

    if (modelData.asusLogoImage || modelData.asusLogoAltText || modelData.asusLogoUrl) {
      if (!data.logos[0]) {
        data.logos[0] = {
          name: 'asus',
          icon: '',
          altText: 'ASUS Logo',
          url: '#',
          width: '87',
          height: '20',
        };
      }
      data.logos[0] = {
        name: 'asus',
        icon: modelData.asusLogoImage || data.logos[0].icon,
        altText: modelData.asusLogoAltText || data.logos[0].altText,
        url: modelData.asusLogoUrl || data.logos[0].url,
        width: data.logos[0].width,
        height: data.logos[0].height,
      };
    }

    if (modelData.rogLogoImage || modelData.rogLogoAltText || modelData.rogLogoUrl) {
      if (!data.logos[1]) {
        data.logos[1] = {
          name: 'rog',
          icon: '',
          altText: 'ROG Logo',
          url: '#',
          width: '135',
          height: '26',
        };
      }
      data.logos[1] = {
        name: 'rog',
        icon: modelData.rogLogoImage || data.logos[1].icon,
        altText: modelData.rogLogoAltText || data.logos[1].altText,
        url: modelData.rogLogoUrl || data.logos[1].url,
        width: data.logos[1].width,
        height: data.logos[1].height,
      };
    }

    if (modelData.gamingPcLogoImage || modelData.gamingPcLogoAltText || modelData.gamingPcLogoUrl) {
      if (!data.logos[2]) {
        data.logos[2] = {
          name: 'gaming',
          icon: '',
          altText: 'Gaming PC Custom Builder Logo',
          url: '#',
          width: '104',
          height: '22',
        };
      }
      data.logos[2] = {
        name: 'gaming',
        icon: modelData.gamingPcLogoImage || data.logos[2].icon,
        altText: modelData.gamingPcLogoAltText || data.logos[2].altText,
        url: modelData.gamingPcLogoUrl || data.logos[2].url,
        width: data.logos[2].width,
        height: data.logos[2].height,
      }; // eslint-disable-line comma-dangle
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

  return data;
}

function buildLogo(logos) {
  const logoItems = logos.map((logo) => {
    const {
      icon: iconSrc, altText, url: logoUrl, name,
    } = logo;
    let { width, height } = logo;

    // Ensure explicit dimensions to prevent CLS - use defaults if not provided
    if (!width || !height) {
      if (name === 'asus') {
        width = '87';
        height = '20';
      } else if (name === 'rog') {
        width = '135';
        height = '26';
      } else { // gaming
        width = '104';
        height = '22';
      }
    }

    // Render logo structure even if icon source is missing
    // This ensures consistent display between published site and UE authoring
    const logoContent = iconSrc
      ? `<picture>
        <img src="${iconSrc}" alt="${altText}" class="logo-default" width="${width}" height="${height}" loading="eager" />
      </picture>`
      : `<span class="logo-placeholder" aria-label="${altText}" title="${altText}">${logo.name.toUpperCase()}</span>`;

    return `
      <div class="logo-item logo-item--${name}">
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

function buildNavigation(navigationItems, showProfile, showCart, profileMenuItems, profileMenuLoggedInItems) {
  // Check if user is logged in (same logic as in webpack implementation)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName') || 'User Name';

  const navItems = navigationItems.map((item) => `
    <li class="cmp-sitenavigation__item">
      <a class="cmp-sitenavigation__item-link" href="${item.linkUrl}">${item.linkText}</a>
    </li>
  `).join('');

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
          tabindex="-1"
        >
          <button class="mini-cart__close" aria-label="Close mini cart">
            <span class="mini-cart__close-icon"></span>
          </button>
          <div id="mini-cart-title" class="cart-summary">Your cart is empty.</div>
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
    <li class="profile-menu__user-name">${userName}</li>
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

function buildMobileMenu(navigationItems, profileMenuItems, profileMenuLoggedInItems) {
  // Check if user is logged in (same logic as in webpack implementation)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const mobileNavItems = navigationItems.map((item) => `
    <li><a href="${item.linkUrl}" class="px-6">${item.linkText}</a></li>
  `).join('');

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
  // Automatically add items to cart for logged-in user
  localStorage.setItem('hasCartItems', 'true');
}

// Mock logout function
function mockLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userName');
}

// Mock cart data for testing
function getMockCartData() {
  return [
    {
      name: 'ASUS ROG Strix G15',
      image: '/blocks/images/cpuImage.png',
      price: '1299.99',
      quantity: 1,
      description: 'Gaming Laptop - AMD Ryzen 7',
    },
    {
      name: 'ASUS TUF Gaming Monitor',
      image: '/blocks/images/cpu2.png',
      price: '299.99',
      quantity: 2,
      description: '27" 144Hz Display',
    },
  ];
}

// Fetch cart products (mock implementation)
async function fetchCartProducts() {
  try {
    // Simulate API call delay
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(((resolve) => setTimeout(resolve, 100)));
    // Check if user has items in cart (mock logic)
    const hasCartItems = localStorage.getItem('hasCartItems') === 'true';

    if (hasCartItems) {
      return getMockCartData();
    }

    return [];
  } catch (err) { // eslint-disable-next-line no-console
    console.error('Error loading cart products:', err);
    return [];
  }
}

// Render individual cart items
function renderCartItem(product) {
  const {
    name, image, price, quantity, description,
  } = product;
  let descriptionHTML = '';
  if (description) {
    descriptionHTML = `<small>${description}</small>`;
  }

  return `
    <li class="cart-item flex" role="listitem" tabindex="0" aria-label="${name}">
      <div class="img-wrapper">
        <img src="${image}" alt="${name}">
      </div>
      <div class="product-info-container flex">
        <div class="product-info">
          <div class="product-name">${name}</div>
          ${descriptionHTML}
        </div>
        <div class="price-info flex">
          <strong aria-label="Quantity">x${quantity}</strong>
          <strong aria-label="Price">$ ${price}</strong>
        </div>
      </div>
    </li>
  `;
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
      block.classList.toggle('mm-open', !isExpanded);
    });
  }

  // Profile dropdown
  const profileToggle = block.querySelector('.profile-toggle');
  const profileMenu = block.querySelector('.profile-menu');

  if (profileToggle && profileMenu) {
    profileToggle.addEventListener('click', (e) => {
      e.stopPropagation();

      // Close mini cart if it's open when profile is clicked
      const miniCartToggle = block.querySelector('#mini-cart-toggle');
      const miniCartContainer = block.querySelector('#mini-cart-container');

      if (miniCartToggle && miniCartContainer) {
        const isMiniCartExpanded = miniCartToggle.getAttribute('aria-expanded') === 'true';
        if (isMiniCartExpanded) {
          miniCartToggle.setAttribute('aria-expanded', 'false');
          miniCartContainer.setAttribute('aria-hidden', 'true');
          miniCartContainer.classList.remove('show');
        }
      }

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

  profileMenuItemElements.forEach((item, index) => {
    const link = item.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        if (index === 0) {
          if (!isLoggedIn) {
            // First item when not logged in - trigger login
            mockLogin();
            refreshHeader(block);// eslint-disable-line no-use-before-define
          } else {
            // First item when logged in - trigger logout
            mockLogout();
            refreshHeader(block);// eslint-disable-line no-use-before-define
          }
        } // eslint-disable-next-line no-empty
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

        // eslint-disable-next-line no-console
        console.log('Mobile menu clicked:', {
          index, isLoggedIn, combinedMenuLength: combinedMenuItems.length, linkText: link.textContent,
        });

        if (index === 0) {
          if (!isLoggedIn) {
            // First item when not logged in - trigger login
            // eslint-disable-next-line no-console
            console.log('Triggering mobile login');
            mockLogin();
            refreshHeader(block);// eslint-disable-line no-use-before-define
          } else {
            // First item when logged in - trigger logout
            // eslint-disable-next-line no-console
            console.log('Triggering mobile logout (first item when logged in)');
            mockLogout();
            refreshHeader(block);// eslint-disable-line no-use-before-define
          }
        } else {
          // eslint-disable-next-line no-console
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
    miniCartToggle.addEventListener('click', async () => {
      const isExpanded = miniCartToggle.getAttribute('aria-expanded') === 'true';

      if (!isExpanded) {
        // Update cart content before showing
        await updateMiniCartDisplay(block);// eslint-disable-line no-use-before-define
      }

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

  // Initialize mini cart display
  updateMiniCartDisplay(block);// eslint-disable-line no-use-before-define

  // Cart sign-in link functionality
  const cartSigninLink = block.querySelector('#cart-signin-link');
  if (cartSigninLink) {
    cartSigninLink.addEventListener('click', (e) => {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log('Cart sign-in clicked');
      mockLogin();
      refreshHeader(block);// eslint-disable-line no-use-before-define
    });
  }

  // Mobile account toggle
  const mobileAccountToggle = block.querySelector('.mobile-account-toggle');
  const mobileAccountSubmenu = block.querySelector('.mobile-account-submenu');
  const backButton = block.querySelector('.back-button');
  const mobileOverlay = block.querySelector('.mobile-menu-overlay');

  if (mobileAccountToggle && mobileAccountSubmenu) {
    mobileAccountToggle.addEventListener('click', () => {
      const isExpanded = mobileAccountToggle.getAttribute('aria-expanded') === 'true';
      mobileAccountToggle.setAttribute('aria-expanded', !isExpanded);
      mobileAccountSubmenu.classList.toggle('active', !isExpanded);
      mobileOverlay.classList.toggle('submenu-active', !isExpanded);
    });
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      mobileAccountToggle.setAttribute('aria-expanded', 'false');
      mobileAccountSubmenu.classList.remove('active');
      mobileOverlay.classList.remove('submenu-active');
    });
  }

  // Close mobile menu when clicking overlay
  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', (e) => {
      if (e.target === mobileMenuOverlay) {
        hamburgerToggle.setAttribute('aria-expanded', 'false');
        mobileMenuOverlay.setAttribute('aria-hidden', 'true');
        block.classList.remove('mm-open');
      }
    });
  }


  callSSOValidation();
}

// Forward declaration for refreshHeader
let refreshHeader;

// Refresh header function to re-render with current login state
refreshHeader = (block) => {
  // Use stored original data instead of re-parsing from modified DOM
  let data;
  if (block._originalHeaderData) {
    // Use stored original data as base
    data = { ...block._originalHeaderData };

    // Still check for Universal Editor model updates
    if (block.dataset && (block.dataset.model || block.dataset.aueModel)) { // eslint-disable-line no-use-before-define
      const modelData = block.dataset.aueModel ? JSON.parse(block.dataset.aueModel) : {};

      // Apply any UE model updates to the stored data
      if (modelData.asusLogoImage || modelData.asusLogoAltText || modelData.asusLogoUrl) {
        if (!data.logos[0]) {
          data.logos[0] = {
            name: 'asus', icon: '', altText: 'ASUS Logo', url: '#', width: '87', height: '20',
          };
        }
        data.logos[0] = {
          name: 'asus',
          icon: modelData.asusLogoImage || data.logos[0].icon,
          altText: modelData.asusLogoAltText || data.logos[0].altText,
          url: modelData.asusLogoUrl || data.logos[0].url,
          width: data.logos[0].width,
          height: data.logos[0].height,
        };
      }

      if (modelData.rogLogoImage || modelData.rogLogoAltText || modelData.rogLogoUrl) {
        if (!data.logos[1]) {
          data.logos[1] = {
            name: 'rog', icon: '', altText: 'ROG Logo', url: '#', width: '135', height: '26',
          };
        }
        data.logos[1] = {
          name: 'rog',
          icon: modelData.rogLogoImage || data.logos[1].icon,
          altText: modelData.rogLogoAltText || data.logos[1].altText,
          url: modelData.rogLogoUrl || data.logos[1].url,
          width: data.logos[1].width,
          height: data.logos[1].height,
        };
      }

      if (modelData.gamingPcLogoImage || modelData.gamingPcLogoAltText || modelData.gamingPcLogoUrl) {
        if (!data.logos[2]) {
          data.logos[2] = {
            name: 'gaming', icon: '', altText: 'Gaming PC Custom Builder Logo', url: '#', width: '104', height: '22',
          };
        }
        data.logos[2] = {
          name: 'gaming',
          icon: modelData.gamingPcLogoImage || data.logos[2].icon,
          altText: modelData.gamingPcLogoAltText || data.logos[2].altText,
          url: modelData.gamingPcLogoUrl || data.logos[2].url,
          width: data.logos[2].width,
          height: data.logos[2].height,
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
    data = parseHeaderData(block); // eslint-disable-line no-use-before-define
  }

  // Create icons object for passing to build functions
  const icons = {
    searchIcon: data.searchIcon,
    cartIcon: data.cartIcon,
    profileIcon: data.profileIcon,
    hamburgerIcon: data.hamburgerIcon,
    closeIcon: data.closeIcon,
    arrowLeftIcon: data.arrowLeftIcon,
    arrowRightIcon: data.arrowRightIcon,
  };

  // Create the header structure using parsed data
  const headerHTML = `
    <div class="header-wrapper">
      <header class="experiencefragment">
          <div class="cmp-container cmp-header container">
            ${buildLogo(data.logos)}
            ${buildNavigation(data.navigationItems, data.showProfile, data.showCart, data.profileMenuItems, data.profileMenuLoggedInItems, icons)}
          </div>
      </header>
      ${buildMobileMenu(data.navigationItems, data.profileMenuItems, data.profileMenuLoggedInItems, icons)}
    </div>
  `;

  // Clear existing content and add the header structure
  block.innerHTML = headerHTML;

  // Re-initialize header functionality
  initializeHeader(block);
};

// Render mini cart content based on login status and cart items
async function renderMiniCartContent(isLoggedIn) {
  if (!isLoggedIn) {
    return `
      <p class="mini-cart__message"><a href="/">Sign in</a> to see if you have any saved items</p>
    `;
  }

  const products = await fetchCartProducts();

  if (!products.length) {
    return `
      <div class="cart-empty-message">
        <p>Start shopping to add items to your cart</p>
      </div>
    `;
  }

  const cartItemsHtml = products.map((product) => renderCartItem(product)).join('');
  const subtotal = products.reduce((sum, p) => sum + (p.quantity * parseFloat(p.price)), 0);

  return `
    <ul class="cart-items flex" role="list">
      ${cartItemsHtml}
    </ul>
    <div class="subtotal flex">
      <p>Subtotal</p>
      <p class="text-bolder subtotal-amount" aria-live="polite">$ ${subtotal.toFixed(2)}</p>
    </div>
    <div class="checkout-btn">
      <button class="btn" aria-label="View Cart and Checkout">View Cart & Checkout</button>
    </div>
  `;
}

// Update mini cart display
async function updateMiniCartDisplay(block) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const miniCartContainer = block.querySelector('#mini-cart-container');
  const cartTitle = block.querySelector('#mini-cart-title');
  const miniCartToggle = block.querySelector('#mini-cart-toggle');

  if (!miniCartContainer || !cartTitle) {
    return;
  }

  // Clear existing cart content after title
  const existingElements = miniCartContainer.querySelectorAll('.mini-cart__message, .cart-empty-message, .cart-items, .subtotal, .checkout-btn');
  existingElements.forEach((el) => el.remove());

  // Update cart title and content
  if (!isLoggedIn) {
    cartTitle.textContent = 'Your cart is empty.';
    if (miniCartToggle) {
      miniCartToggle.removeAttribute('total-items');
    }
  } else {
    const products = await fetchCartProducts();
    if (!products.length) {
      cartTitle.textContent = 'Your cart is empty.';
      if (miniCartToggle) {
        miniCartToggle.removeAttribute('total-items');
      }
    } else {
      const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
      cartTitle.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''} in cart`;
      if (miniCartToggle) {
        miniCartToggle.setAttribute('total-items', totalItems);
      }
    }
  }

  // Add new content after title
  const newContent = await renderMiniCartContent(isLoggedIn);
  miniCartContainer.insertAdjacentHTML('beforeend', newContent);

  // Re-attach cart sign-in event listener if needed
  const newCartSigninLink = miniCartContainer.querySelector('#cart-signin-link');
  if (newCartSigninLink) {
    newCartSigninLink.addEventListener('click', (e) => {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log('Cart sign-in clicked');
      mockLogin();
      refreshHeader(block);// eslint-disable-line no-use-before-define
    });
  }
}

// Mock function to add items to cart (for testing)
function mockAddToCart() {
  localStorage.setItem('hasCartItems', 'true');
}

// Mock function to clear cart (for testing)
function mockClearCart() {
  localStorage.removeItem('hasCartItems');
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.mockAddToCart = mockAddToCart;
  window.mockClearCart = mockClearCart;
  window.mockLogin = mockLogin;
  window.mockLogout = mockLogout;

  // Add function to refresh mini cart for testing
  window.refreshMiniCart = () => {
    const headerBlock = document.querySelector('.header');
    if (headerBlock) {
      updateMiniCartDisplay(headerBlock);// eslint-disable-line no-use-before-define
    }
  };
}

// Function to optimize logo images using createOptimizedPicture
function optimizeLogoImages(block) {
  // Find all logo images and optimize them
  block.querySelectorAll('.logo-wrapper picture > img').forEach((img) => {
    let optimizedPic;

    // Use HeaderConfig for baseUrl and shouldUseExternal
    const { baseUrl, shouldUseExternal } = HeaderConfig;

    if (shouldUseExternal) {
      // Use createOptimizedPictureExternal with baseUrl when baseUrl is defined and different
      optimizedPic = createOptimizedPictureExternal(
        img.src,
        img.alt,
        true, // eager loading for logos (above fold)
        [{ width: '200' }, { width: '400' }],
        baseUrl,
      );
    } else {
      // Use createOptimizedPicture from aem.js when baseUrl is not defined or equals window.location.href
      optimizedPic = createOptimizedPicture(
        img.src,
        img.alt,
        true, // eager loading for logos (above fold)
        [{ width: '200' }, { width: '400' }],
      );
    }

    // Move instrumentation from original to optimized image
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    // Replace the original picture with optimized version
    img.closest('picture').replaceWith(optimizedPic);
  });
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
    arrowRightIcon: data.arrowRightIcon,
  }; // eslint-disable-line comma-dangle

  // Create the header structure using parsed data
  const headerHTML = `
    <div class="header-wrapper">
      <header class="experiencefragment">
        <div class="cmp-experiencefragment">
          <div class="cmp-container cmp-header container">
            ${buildLogo(data.logos)}
            ${buildNavigation(data.navigationItems, data.showProfile, data.showCart, data.profileMenuItems, data.profileMenuLoggedInItems, icons)}
          </div>
        </div>
      </header>
      ${buildMobileMenu(data.navigationItems, data.profileMenuItems, data.profileMenuLoggedInItems, icons)}
    </div>
  `;

  // Clear existing content and add the header structure
  block.innerHTML = headerHTML;
  block.classList.add('experiencefragment');

  // Optimize logo images after HTML is set
  optimizeLogoImages(block);

  // Add header functionality
  initializeHeader(block); // eslint-disable-line no-use-before-define

}
