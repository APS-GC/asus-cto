import {
  transferInstrumentation,
  isAuthorEnvironment,
} from '../../scripts/utils.js';
import { loadSwiper } from '../../scripts/scripts.js';
import { getBlockConfigs, getConfigValue } from '../../scripts/configs.js';
import { trackEvent } from '../../scripts/google-data-layer.js';

// Default values from authoring configuration
const DEFAULT_CONFIG = {
  title: 'Featured News Articles',
  seeAllButtonText: 'See all News Articles',
  seeAllButtonLinkTo: '',
  openLinkInNewTab: false,
  itemCount: 7
};

const itemsStartIndex = 5;
export default async function decorate(block) {
  // Get configuration using getBlockConfigs
  const config = await getBlockConfigs(block, DEFAULT_CONFIG, 'featured-news-articles');
  
  const divs = block.children;
  const itemCount = config.itemCount || 7;
  
  const mockupContainer = document.createRange().createContextualFragment(`
        <div class="cmp-container">
          <div class="carousel panelcontainer">
            <div class="section-heading">
              <div class="section-heading__text-group">
                <h2 class="section-heading__title">${
                  config.title || 'Featured News Articles'
                }</h2>
              </div>
              <div class="section-heading__action-buttons cmp-carousel__actions">
                <button class="cmp-carousel__action cmp-carousel__action--previous">
                  <span class="sr-only">Previous Button</span>
                </button>
                <button class="cmp-carousel__action cmp-carousel__action--next">
                  <span class="sr-only">Previous Button</span>
                </button>
              </div>
            </div>

            <div class="cmp-carousel" role="group" aria-live="polite" aria-roledescription="carousel" data-cmp-is="carousel" data-cmp-delay="false" data-slides-per-view="auto" data-slides-per-view-tablet="3" data-slides-per-view-desktop="3" data-loop-slides="false">
              <div class="cmp-carousel__content cmp-carousel__content--overflow"></div>
            </div>
          </div>
        </div>
        <div class="section-actions-container">
          <a class="section-actions-btn btn btn-link" href="${config.seeAllButtonLinkTo || ''}" target="${
    config.openLinkInNewTab === true || config.openLinkInNewTab === 'true' ? '_blank' : '_self'
  }">
            ${
              config.seeAllButtonText || 'See all News Articles'
            }<img src="${`${window.hlx.codeBasePath}/icons/icon-arrow.svg`}" alt="Arrow Right">
            </a>
        </div>`);
  
  // Extract article fields from the models (featured-news-article model)
  const articleFields = ['articleTitle', 'articleSummary', 'media', 'imageAlt', 'postedDate', 'articleLinkTo', 'articleOpenInNewTab'];
  
  const cardNodes = [];
  for (let i = itemsStartIndex; i < divs.length; i++) {
    if (i-itemsStartIndex > itemCount - 1) break;
    const subDivs = divs[i].children;
    
    // Parse article data dynamically based on field order
    const articleData = {
      title: '',
      summary: '',
      image: '',
      imageAlt: '',
      postedDate: '',
      articleLink: '',
      articleOpenInNewTab: false
    };
    
    // Map cells to fields
    Array.from(subDivs).forEach((cell, index) => {
      const fieldName = articleFields[index];
      
      switch(fieldName) {
        case 'articleTitle':
          articleData.title = cell.textContent?.trim() || '';
          break;
        case 'articleSummary':
          articleData.summary = cell.textContent?.trim() || '';
          break;
        case 'media':
          articleData.image = cell.querySelector('img')?.getAttribute('src') || '';
          break;
        case 'imageAlt':
          articleData.imageAlt = cell.textContent?.trim() || '';
          break;
        case 'postedDate':
          articleData.postedDate = cell.textContent?.trim() || '';
          break;
        case 'articleLinkTo':
          articleData.articleLink = cell.textContent?.trim() || '';
          break;
        case 'articleOpenInNewTab':
          articleData.articleOpenInNewTab = cell.textContent?.trim().toLowerCase() === 'true';
          break;
      }
    });
    
    const { title, summary, image, imageAlt, postedDate, articleLink, articleOpenInNewTab } = articleData;


    const mockup = document.createRange().createContextualFragment(`
      <div class="cmp-carousel__item">
        <a class="cmp-article-card" href="${articleLink}" aria-label="Read article: ${title}" target='${
      articleOpenInNewTab ? '_blank' : '_self'
    }'>
          <div class="cmp-article-card__image cmp-image">
            <img class="cmp-image__image" src="${image}" alt="${imageAlt}" loading="lazy">
          </div>

          <div class="cmp-article-card__content">
            <p class="cmp-article-card__date">
              <time datetime='${
                postedDate ? postedDate.replaceAll('/', '-') : ''
              }' aria-label="Date">
                <span aria-hidden="true">
                  ${postedDate ? transferDate(postedDate) : ''}
                </span>
              </time>
            </p>
            <h3 class="cmp-article-card__title">${title}</h3>
            <div class="cmp-article-card__desc">${summary}</div>
          </div>
        </a>
      </div>
    `);

    //move card box attr
    if (isAuthorEnvironment()) {
      transferInstrumentation(divs[i], mockup);
    }

    cardNodes.push(mockup);
  }

  mockupContainer.querySelector('.cmp-carousel__content').append(...cardNodes);

  //move attr
  if (isAuthorEnvironment()) {
    //move title
    if (divs[0]) {
      transferInstrumentation(
        divs[0],
        mockupContainer.querySelector('.section-heading__title')
      );
    }
    //move description
    if (divs[1]) {
      transferInstrumentation(
        divs[1],
        mockupContainer.querySelector('.section-actions-container')
      );
    }
  }

  block.innerHTML = '';
  block.append(mockupContainer);

  await loadSwiper();
  await import('../../scripts/carousel.js');

  if (window.initializeSwiperOnAEMCarousel) {
    window.initializeSwiperOnAEMCarousel(block.querySelector('.cmp-container'));
  }
  const basePath = await getConfigValue('base-path') || '';
  const sectionType = 'news_card';
  
  // Track article card clicks
  block.querySelectorAll('.cmp-article-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      const articleTitle = card.querySelector('.cmp-article-card__title')?.textContent?.trim() || 'Article';
      
      trackEvent({
        eventName: 'news_card_home_cto_rog',
        category: `${sectionType}${basePath}`,
        label: `${articleTitle}/${sectionType}${basePath}`
      });
      
      // Allow default link navigation after tracking
    });
  });
  
  // Track see all button click
  const seeAllBtn = block.querySelector('.section-actions-btn');
  if (seeAllBtn) {
    seeAllBtn.addEventListener('click', () => {
      trackEvent({
        eventName: 'see_all_news_card_home_cto_rog',
        category: `${sectionType}${basePath}`,
        label: `see_all/${sectionType}${basePath}`
      });
    });
  }
}

//transfer date format
function transferDate(dateStr) {
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return formattedDate;
}