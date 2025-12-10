import { isAuthorEnvironment, safeText } from '../../scripts/utils.js';
import { transferInstrumentation } from '../../scripts/utils.js';
import { getBlockConfigs } from '../../scripts/configs.js';
import { trackEvent } from '../../scripts/google-data-layer.js';

const pubUrl = 'https://publish-p165753-e1767020.adobeaemcloud.com';

// Default values from authoring configuration
const DEFAULT_CONFIG = {
  title: 'Our Advantages',
  imageAutoplayDuration: 5,
  videoAutoplayDuration: 1
};

const itemsStartIndex = 3;

export default async function decorate(block) {
  // Get configuration using getBlockConfigs
  const config = await getBlockConfigs(block, DEFAULT_CONFIG, 'our-advantages');

  const title = config.title || 'Our Advantages';
  const imageAutoplayDuration = config.imageAutoplayDuration || 5;
  const videoAutoplayDuration = config.videoAutoplayDuration || 1;
  const carouselId = `carousel-${Math.random().toString(36).substr(2, 10)}`;
  const mockupContainer = document.createRange()
    .createContextualFragment(`<div class='container'>
    <div class="carousel panelcontainer">
      <div class="section-heading content-center">
        <div class="section-heading__text-group">
          <h2 class="section-heading__title">${title}</h2>
        </div>
      </div>
      <div
        id="${carouselId}"
        class="cmp-carousel"
        role="group"
        aria-live="off"
        aria-roledescription="carousel"
        data-cmp-is="our-advantages"
        data-cmp-delay="${imageAutoplayDuration * 1000}"
        data-carousel-effect="creative"
        data-prev-slide-message="Previous advantage"
        data-next-slide-message="Next advantage"
      >
        <div class="cmp-carousel__content">
        </div>

        <!-- Carousel actions - Previous/Next -->
        <div class="cmp-carousel__actions">
          <button class="cmp-carousel__action cmp-carousel__action--previous" type="button" aria-label="Previous advantage" tabindex="0">
            <span class="visually-hidden"></span>
          </button>
          <button class="cmp-carousel__action cmp-carousel__action--next" type="button" aria-label="Next advantage" tabindex="0">
            <span class="visually-hidden"></span>
          </button>
        </div>

        <!-- Pagination indicators -->
        <ol class="cmp-carousel__indicators" role="tablist" aria-label="Choose a slide to display"></ol>
      </div>
    </div>
  </div>`);
      
  const cardNodes = [];
  [...block.children].forEach((card, i) => {
    if (i < itemsStartIndex) return;
    const divs = card.querySelectorAll('div');
    const headline = safeText(divs.item(0));
    const details = safeText(divs.item(1));
    const video = safeText(divs.item(2));
    const imageAlt = safeText(divs.item(4));
    const buttonText = safeText(divs.item(5));
    const buttonTextLink = safeText(divs.item(6));
    const isTargetBlank = divs.item(7).textContent === 'true' ? 1 : 0;
    const imageUrl = card.querySelector('img').src;
    const itemId = `${carouselId}-item-${Math.random().toString(36).substr(2, 9)}`;
    const imageHtml = imageUrl?`<img src="${imageUrl}"  alt="${imageAlt}" class="cmp-advantage-card__image" loading="lazy" />`:'<div class="cmp-advantage-card__image" style="background: #efefef;color: #000;padding-top: 120px;font-size: 32px;">Please upload an image.</div>';
    const videoHtml = video ? `<video class="cmp-advantage-card__video" data-src="${pubUrl+video}" playsinline controls></video><button class="cmp-advantage-card__close-video" aria-label="Close video"></button>`:'';
    const mockup = document.createRange().createContextualFragment(`
          <div id="${itemId}-tabpanel" class="cmp-carousel__item" data-url="${buttonTextLink}" data-video="${video}" data-blank="${isTargetBlank}" data-video-duration="${videoAutoplayDuration}" role="group">
            <div class="cmp-advantage-card">
              <div class="cmp-advantage-card__overlay">
                <div class="cmp-advantage-card__content">
                  <h3 class="cmp-advantage-card__title">${headline}</h3>
                  <p class="cmp-advantage-card__desc">
                    ${details}
                  </p>
                  <button class="cmp-advantage-card__btn btn" title="Watch Now ${headline}" aria-label="Watch Now ${headline}">${buttonText} <img alt="play-icon" src="${window.hlx.codeBasePath}/icons/icon-play-filled.svg" /></button>
                </div>
              </div>
              <div class="cmp-advantage-card__image-wrapper">
                ${imageHtml}
                ${videoHtml}
              </div>
            </div>
          </div>`);

    if (isAuthorEnvironment()) {
      transferInstrumentation(card, mockup);
    }
    cardNodes.push(mockup);
  });

  mockupContainer.querySelector('.cmp-carousel__content').append(...cardNodes);

  //move attr
  if (isAuthorEnvironment()) {
    //move title
    if (block.firstElementChild) {
      transferInstrumentation(
        block.firstElementChild,
        mockupContainer.querySelector('.section-heading')
      );
    }
  }

  block.innerHTML = '';
  block.append(mockupContainer);

  // trigger block
  await import('../../scripts/carousel.js');
  await import('./uifrontend_advantage-card.js');
 
  // Add tracking for Watch Now button using event delegation
  const advantageWrapper = block.querySelector('.our-advantages-wrapper');
  if (advantageWrapper) {
    advantageWrapper.addEventListener('click', (event) => {
      const watchNowBtn = event.target.closest('.cmp-advantage-card__btn');
      if (watchNowBtn) {
        const buttonText = watchNowBtn.textContent?.trim().replace(/\s+/g, ' ') || 'Watch Now';
        trackEvent({
          eventName: 'play_advantages_home_cto_rog',
          category: 'play/advantages/home/cto/rog',
          label: `${buttonText}/play/advantages/home/cto/rog`
        });
      }
    });
  }
 
  // Add tracking for navigation arrows
  const prevButton = block.querySelector('.cmp-carousel__action--previous');
  const nextButton = block.querySelector('.cmp-carousel__action--next');
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      trackEvent({
        eventName: 'nvgt_l_advantages_home_cto_rog',
        category: 'nvgt/advantages/home/cto/rog',
        label: 'last_button/nvgt/advantages/home/cto/rog'
      });
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      trackEvent({
        eventName: 'nvgt_n_advantages_home_cto_rog',
        category: 'nvgt/advantages/home/cto/rog',
        label: 'next_button/nvgt/advantages/home/cto/rog'
      });
    });
  }

  document.addEventListener(
    'eds-lazy-event',
    () => {
      const container = block.querySelector('.container');
      if (window.initializeSwiperOnAEMCarousel && container) {
        window.initializeSwiperOnAEMCarousel(container);
        
        // Add tracking for indicators after Swiper is initialized
        const indicators = container.querySelectorAll('.cmp-carousel__indicator');
        indicators.forEach((indicator, index) => {
          indicator.addEventListener('click', () => {
            trackEvent({
              eventName: 'indicator_advantages_home_cto_rog',
              category: 'indicator/advantages/home/cto/rog',
              label: `${index + 1}/indicator/advantages/home/cto/rog`
            });
          });
        });
      }
    },
    { once: true }
  );
}