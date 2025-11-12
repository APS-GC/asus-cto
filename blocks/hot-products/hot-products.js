import { fetchHotProducts } from '../../scripts/api-service.js';
import { loadBazaarvoiceScript } from '../../scripts/scripts.js';
import { createModal } from '../modal/modal.js';
import { loadCSS } from '../../scripts/aem.js';
import decorateProductPreview from '../product-preview/product-preview.js';

function initializeTooltips(container) {
    const tooltipTriggers = container.querySelectorAll('[data-tooltip-trigger]');

    tooltipTriggers.forEach((trigger, index) => {
        const tooltipId = trigger.getAttribute('aria-describedby');
        const tooltip = document.getElementById(tooltipId);

        if (!tooltip) {
            console.warn(`Tooltip not found for ID: ${tooltipId}`);
            return;
        }

        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '99999';
        tooltip.style.display = 'none';
        tooltip.style.opacity = '0';

        const showTooltip = () => {
            tooltip.style.display = 'block';

            const triggerRect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            let top = triggerRect.bottom + 10;
            let left = triggerRect.left;

            if (left + 260 > window.innerWidth) {
                left = window.innerWidth - 270;
            }

            if (top + tooltipRect.height > window.innerHeight) {
                top = triggerRect.top - tooltipRect.height - 10;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;

            setTimeout(() => {
                tooltip.style.opacity = '1';
            }, 10);
        };

        const hideTooltip = () => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 200);
        };

        // Mouse events
        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);

        // Keyboard events
        trigger.addEventListener('focus', showTooltip);
        trigger.addEventListener('blur', hideTooltip);

        // Hide tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !tooltip.contains(e.target)) {
                hideTooltip();
            }
        });
    });
}

// Create product card HTML
function createProductCard(product, config) {
    const card = document.createElement('div');
    card.className = 'hot-products-card swiper-slide';

    // Generate badges HTML from productTags
    // Add "In Stock" badge by default if not already present
    const badges = product.productTags || [];
    const hasInStock = badges.some(badge => badge.toLowerCase() === 'in stock');
    if (!hasInStock) {
        badges.unshift('In Stock'); // Add "In Stock" at the beginning
    }
    
    const badgesHTML = badges.map(badge => {
        let badgeClass = 'hot-products-badge';
        const badgeLower = badge.toLowerCase();
        if (badgeLower === 'in stock') badgeClass += ' hot-products-badge--in-stock';
        return `<span class="${badgeClass}">${badge}</span>`;
    }).join('');

    // Generate FPS tooltip HTML from gamePriority
    let fpsTooltipHTML = '';
    if (product.gamePriority && product.gamePriority.length > 0) {
        const fpsRows = product.gamePriority.map(detail => {
            const game = detail.gameTitle || 'Unknown Game';
            const fps1080 = detail.fullHdFps || '--';
            const fps1440 = detail.quadHdFps || '--';

            return `
        <tr>
          <td>${game}</td>
          <td>${fps1080 !== '--' ? `${fps1080} FPS` : '--'}</td>
          <td>${fps1440 !== '--' ? `${fps1440} FPS` : '--'}</td>
        </tr>
      `;
        }).join('');

        fpsTooltipHTML = `
      <table class="hot-products-fps-table">
        <thead>
          <tr>
            <th>Game FPS</th>
            <th>1080P</th>
            <th>1440P</th>
          </tr>
        </thead>
        <tbody>
          ${fpsRows}
        </tbody>
      </table>
    `;
    }

    card.innerHTML = `
    <div class="hot-products-card-header">
      <div class="hot-products-badges">
        ${badgesHTML}
      </div>
    </div>

    <div class="hot-products-card-body">
      <div class="hot-products-image">
        <img src="${product.mainImage}" alt="${product.name}" width="200" height="200" loading="lazy" />
        ${product.hoverImage ? `<img class="hot-products-image hot-products-image-hover" src="${product.hoverImage}" alt="${product.name}" width="200" height="200" loading="eager" />` : ''}
        <button class="hot-products-quick-view" type="button" aria-label="${config.quickViewText} ${product.name}">
          ${config.quickViewText}
        </button>
      </div>

      <div class="hot-products-info">
        <span class="hot-products-title">
          <a href="pdp.html">${product.name}</a>
        </span>
        <p class="hot-products-model">
          <a href="pdp.html#features">${product.modelName || ''}</a>
        </p>
      </div>

      <div class="hot-products-rating-compare">
        <div class="hot-products-rating">
          <div
            data-bv-show="inline_rating"
            data-bv-product-id="${product.externalId || product.sku}"
            data-bv-redirect-url="pdp.html"
          ></div>
        </div>
        <div class="hot-products-compare">
          <input 
            type="checkbox" 
            class="hot-products-compare-checkbox" 
            id="compare-${product.sku}"
            data-id="${product.sku}"
            data-name="${product.name}"
            data-model="${product.modelName || ''}"
            data-image="${product.mainImage}"
          />
          <label for="compare-${product.sku}" class="hot-products-compare-label">${config.compareLabel}</label>
        </div>
      </div>

      ${product.gameTitle && product.fps ? `
        <div class="hot-products-fps">
          <p class="hot-products-fps-game">${product.gameTitle}</p>
          <button 
            class="hot-products-fps-badge" 
            data-tooltip-trigger 
            aria-describedby="fps-tooltip-${product.sku}"
            type="button"
          >
            FPS: ${product.fps}
          </button>
        </div>
      ` : ''}

      <ul class="hot-products-specs">
        ${(product.keySpec || []).map(spec => `<li>${spec.name || spec}</li>`).join('')}
      </ul>

      <div class="hot-products-estore">
        <span class="hot-products-estore-label">${config.estoreLabel}</span>
        <button 
          class="hot-products-estore-icon" 
          data-tooltip-trigger 
          aria-describedby="estore-tooltip-${product.sku}"
          aria-label="Information about ${config.estoreLabel}"
          type="button"
        ></button>
      </div>

      <div class="hot-products-price-block">
        <span class="hot-products-price">$${product.specialPrice || product.price}</span>
        ${product.specialPrice && product.price ? `<span class="hot-products-price-original">$${product.price}</span>` : ''}
        ${product.savedPrice ? `<span class="hot-products-discount">SAVE $${product.savedPrice}</span>` : ''}
      </div>
    </div>

    <div class="hot-products-card-footer">
      <button class="hot-products-buy-button" onclick="window.location.href='pdp.html'">${config.buyNowText}</button>
    </div>
  `;

    // Create and append tooltips to document body (not inside card)
    // FPS Tooltip
    if (product.gameTitle && product.fps && fpsTooltipHTML) {
        const fpsTooltip = document.createElement('div');
        fpsTooltip.id = `fps-tooltip-${product.sku}`;
        fpsTooltip.className = 'hot-products-tooltip';
        fpsTooltip.setAttribute('role', 'tooltip');
        fpsTooltip.innerHTML = fpsTooltipHTML;
        document.body.appendChild(fpsTooltip);
    }

    // Estore Tooltip
    const estoreTooltip = document.createElement('div');
    estoreTooltip.id = `estore-tooltip-${product.sku}`;
    estoreTooltip.className = 'hot-products-tooltip';
    estoreTooltip.setAttribute('role', 'tooltip');
    estoreTooltip.textContent = config.estoreTooltip;
    document.body.appendChild(estoreTooltip);

    return card;
}

// Parse configuration from block
function parseConfig(block) {
    const config = {
        title: 'Hot Products',
        compareLabel: 'Compare',
        buyNowText: 'Buy now',
        quickViewText: 'Quick view',
        estoreLabel: 'ASUS estore price',
        estoreTooltip: 'ASUS estore price is the price of a product provided by ASUS estore. Specifications listed here may not be available on estore and are for reference only.',
        viewAllText: 'View all',
        viewAllLink: '#',
        productsToShow: 3
    };

    const rows = [...block.children];
    rows.forEach((row) => {
        const cells = [...row.children];
        if (cells.length >= 2) {
            const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
            const value = cells[1].textContent.trim();

            if (key === 'title' || key === 'sectiontitle') config.title = value;
            if (key === 'comparelabel') config.compareLabel = value;
            if (key === 'buynowtext' || key === 'buynow') config.buyNowText = value;
            if (key === 'quickviewtext' || key === 'quickview') config.quickViewText = value;
            if (key === 'estorelabel' || key === 'estorepricelabel') config.estoreLabel = value;
            if (key === 'estoretooltip' || key === 'estorepricetooltip') config.estoreTooltip = value;
            if (key === 'viewalltext') config.viewAllText = value;
            if (key === 'viewalllink') config.viewAllLink = value;
            if (key === 'productstoshow' || key === 'maxproducts' || key === 'productcount') {
                const count = parseInt(value, 10);
                if (!isNaN(count) && count > 0) {
                    config.productsToShow = count;
                }
            }
        }
    });

    return config;
}

function initializeSwiper(section, config) {
    const swiperContainer = section.querySelector('.hot-products-swiper');
    const prevButton = section.querySelector('.hot-products-button-prev');
    const nextButton = section.querySelector('.hot-products-button-next');

    if (!swiperContainer) {
        console.warn('Hot Products: Missing swiper container');
        return;
    }

    const swiper = new window.Swiper(swiperContainer, {
        slidesPerView: 1.15,
        spaceBetween: 30,
        centeredSlides: true,
        centeredSlidesBounds: true,
        simulateTouch: true,
        touchRatio: 1,
        touchAngle: 45,
        grabCursor: true,
        navigation: {
            nextEl: nextButton,
            prevEl: prevButton,
            disabledClass: 'hot-products-button-disabled',
        },
        breakpoints: {
            768: {
                slidesPerView: 2.5,
                spaceBetween: 24,
                slidesPerGroup: 1,
            },
            1024: {
                slidesPerView: config.productsToShow,
                spaceBetween: 32,
                allowTouchMove: false,
                simulateTouch: false,
            },
        },
        a11y: {
            prevSlideMessage: 'Previous slide',
            nextSlideMessage: 'Next slide',
            firstSlideMessage: 'This is the first slide',
            lastSlideMessage: 'This is the last slide',
        },
        speed: 400,
        keyboard: {
            enabled: true,
            onlyInViewport: true,
        },
    });

    return swiper;
}

// Handle quick view button click
async function handleQuickView(product) {
    console.log('Quick View clicked for:', product.name);
    
    // Load product-preview CSS
    await loadCSS(`${window.hlx.codeBasePath}/blocks/product-preview/product-preview.css`);
    
    // Create product-preview block
    const productPreviewBlock = document.createElement('div');
    productPreviewBlock.className = 'product-preview';
    productPreviewBlock.dataset.product = JSON.stringify(product);
    
    // Decorate the block
    await decorateProductPreview(productPreviewBlock);
    
    console.log('Product preview block decorated');
    
    // Create and show modal
    const { showModal } = await createModal([productPreviewBlock], false, true);
    showModal();
    
    console.log('Modal opened successfully!');
}

export default async function decorate(block) {
    const config = parseConfig(block);

    block.innerHTML = '';

    const section = document.createElement('div');
    section.className = 'hot-products-section';

    const header = document.createElement('div');
    header.className = 'hot-products-section-header';

    const title = document.createElement('h2');
    title.className = 'hot-products-section-title';
    title.textContent = config.title;
    header.appendChild(title);

    const navigation = document.createElement('div');
    navigation.className = 'hot-products-navigation';

    const navPrev = document.createElement('button');
    navPrev.className = 'hot-products-button-prev';
    navPrev.setAttribute('aria-label', 'Previous');
    navPrev.setAttribute('type', 'button');

    const navNext = document.createElement('button');
    navNext.className = 'hot-products-button-next';
    navNext.setAttribute('aria-label', 'Next');
    navNext.setAttribute('type', 'button');

    navigation.appendChild(navPrev);
    navigation.appendChild(navNext);
    header.appendChild(navigation);

    section.appendChild(header);

    const swiperContainer = document.createElement('div');
    swiperContainer.className = 'hot-products-swiper swiper';

    const wrapper = document.createElement('div');
    wrapper.className = 'hot-products-wrapper swiper-wrapper';

    wrapper.innerHTML = '<div class="hot-products-loading swiper-slide">Loading products...</div>';

    swiperContainer.appendChild(wrapper);

    section.appendChild(swiperContainer);

    const footer = document.createElement('div');
    footer.className = 'hot-products-section-footer';
    footer.innerHTML = `
    <a href="${config.viewAllLink}" class="hot-products-view-all">
      ${config.viewAllText} <span class="hot-products-arrow">›</span>
    </a>
  `;
    section.appendChild(footer);

    block.appendChild(section);

    try {
        const products = await fetchHotProducts(null, config);

        if (products && products.length > 0) {
            wrapper.innerHTML = '';

            const productsToDisplay = products.slice(0, config.productsToShow);

            productsToDisplay.forEach(product => {
                if (product.hoverImage) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'image';
                    link.href = product.hoverImage;
                    document.head.appendChild(link);
                }
            });

            productsToDisplay.forEach(product => {
                const card = createProductCard(product, config);
                wrapper.appendChild(card);
                
                // Add quick view event listener
                const quickViewBtn = card.querySelector('.hot-products-quick-view');
                if (quickViewBtn) {
                    quickViewBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickView(product);
                    });
                }
            });

            initializeTooltips(section);

            initializeSwiper(section, config);

            window.addEventListener('delayed-loaded', async () => {
                try {
                    await loadBazaarvoiceScript();
                } catch (error) {
                    console.error('Hot Products: Failed to load Bazaarvoice:', error);
                }
            }, { once: true });
        } else {
            wrapper.innerHTML = '<div class="hot-products-error">No products available</div>';
        }
    } catch (error) {
        console.error('Error loading hot products:', error);
        wrapper.innerHTML = '<div class="hot-products-error">Failed to load products. Please try again later.</div>';
    }
}